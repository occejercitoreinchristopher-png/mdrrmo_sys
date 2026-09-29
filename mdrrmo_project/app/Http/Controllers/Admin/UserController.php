<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\TemporaryPasswordMail;
use App\Models\Dispatch;
use App\Models\ResponderProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::withTrashed()
            ->where('role', '!=', 'resident')
            ->with(['responderProfile'])
            ->latest()
            ->paginate(50) // Increased so archived users fit better
            ->withQueryString();

        return Inertia::render('admin/Users', [
            'users' => $users->items(),
            'pagination' => [
                'currentPage' => $users->currentPage(),
                'lastPage' => $users->lastPage(),
                'perPage' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function restore($id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->restore();

        if ($user->responderProfile) {
            $user->responderProfile->update(['availability' => 'available']);
        }

        return back()->with('success', 'User account restored successfully.');
    }

    public function residents(Request $request)
    {
        $users = User::where('role', 'resident')
            ->with(['residentProfile.barangay'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/Residents', [
            'users' => $users->items(),
            'pagination' => [
                'currentPage' => $users->currentPage(),
                'lastPage' => $users->lastPage(),
                'perPage' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function showResident(User $resident)
    {
        if ($resident->role !== 'resident') {
            abort(404, 'Resident not found.');
        }

        $resident->load(['residentProfile.barangay']);
        $resident->loadCount('reportedIncidents');

        $incidents = $resident->reportedIncidents()
            ->with([
                'resident',
                'incidentType',
                'images',
                'dispatches' => function ($q) {
                    $q->with(['ambulance', 'driver', 'emt', 'teamLeader', 'patientCareRecord']);
                },
            ])
            ->latest('reported_at')
            ->get();

        return Inertia::render('dispatcher/ResidentDetails', [
            'resident' => $resident,
            'incidents' => $incidents,
        ]);
    }

    public function store(Request $request)
    {
        $isDispatcher = auth()->user()?->role === 'dispatcher';
        $allowedRoles = $isDispatcher ? ['responder'] : ['dispatcher', 'responder'];

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')],
            'phone_number' => ['required', 'string', 'max:255', Rule::unique('users')],
            'birthdate' => ['nullable', 'date', 'before:today'],
            'birthday' => ['nullable', 'date', 'before:today'],
            'age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'role' => ['required', Rule::in($allowedRoles)],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'suspended'])],
            'position' => ['nullable', Rule::in(['driver', 'emt'])],
            'team' => 'nullable|string|max:255',
            'is_reliever' => 'nullable|boolean',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $isReliever = $request->boolean('is_reliever');
        if ($request->role === 'responder') {
            if (! $isReliever && empty($request->team)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'team' => 'Team is required for permanent responders.',
                ]);
            }
            if (! $isReliever) {
                $this->validateTeamLimits($request->team, $request->position, false);
            }
        }

        $validatedUser = collect($validated)->except(['position', 'team', 'is_reliever', 'password', 'password_confirmation', 'birthday'])->toArray();

        $birthdate = $request->birthdate ?? $request->birthday;
        $age = $request->filled('age') ? (int) $request->age : null;
        if ($birthdate && empty($age)) {
            $age = Carbon::parse($birthdate)->age;
        }

        $validatedUser['birthdate'] = $birthdate;
        $validatedUser['age'] = $age;
        $validatedUser['status'] = $validated['status'] ?? 'active';

        $sentTempPassword = false;
        $tempPassword = null;
        if ($request->filled('password')) {
            $validatedUser['password'] = Hash::make($request->password);
            $validatedUser['password_change_required'] = false;
        } else {
            $tempPassword = Str::password(12, true, true, false, false);
            $validatedUser['password'] = Hash::make($tempPassword);
            $validatedUser['password_change_required'] = true;
            $validatedUser['temporary_password_expires_at'] = now()->addHours(24);
            $sentTempPassword = true;
        }

        $user = User::create($validatedUser);
        $user->email_verified_at = now();
        $user->save();

        if ($user->role === 'responder') {
            ResponderProfile::create([
                'user_id' => $user->id,
                'badge_number' => 'RSP-'.strtoupper(substr(uniqid(), -6)), // Auto-generate simple badge
                'is_reliever' => $isReliever,
                'team' => $isReliever ? null : ($request->team ?? 'Alpha'),
                'position' => $request->position ?? 'emt',
                'availability' => 'available',
            ]);
        }

        if ($sentTempPassword && $tempPassword) {
            Mail::to($user->email)->send(new TemporaryPasswordMail($user, $tempPassword, false));
        }

        $message = $sentTempPassword
            ? "User account created successfully. A temporary password has been sent to the user's email address. The user must change their password on their first login."
            : "User account created successfully.";

        return back()->with('success', $message);
    }

    public function resetPassword(Request $request, User $user)
    {
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        $tempPassword = Str::password(12, true, true, false, false);

        $user->update([
            'password' => Hash::make($tempPassword),
            'password_change_required' => true,
            'temporary_password_expires_at' => now()->addHours(24),
        ]);

        Mail::to($user->email)->send(new TemporaryPasswordMail($user, $tempPassword, true));

        return back()->with('success', "Password reset successfully. A temporary password has been sent to the user's registered email address. The user must change their password after logging in.");
    }

    public function update(Request $request, User $user)
    {
        // Admin cannot modify themselves from this interface, or maybe they can?
        // Let's just allow it for now, but prevent changing roles to resident or admin.
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone_number' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'birthdate' => ['nullable', 'date', 'before:today'],
            'birthday' => ['nullable', 'date', 'before:today'],
            'age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'role' => ['required', Rule::in(['dispatcher', 'responder', 'admin', 'resident'])], // Allow resident if they are already one
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => 'nullable|string|min:8|confirmed',
            'position' => ['required_if:role,responder', 'nullable', Rule::in(['driver', 'emt'])],
            'team' => 'nullable|string|max:255',
            'is_reliever' => 'nullable|boolean',
        ]);

        // Prevent manually assigning the resident role to a non-resident
        if ($validated['role'] === 'resident' && $user->role !== 'resident') {
            abort(403, 'Cannot assign resident role manually to a non-resident.');
        }

        // Prevent changing a resident to another role from here
        if ($user->role === 'resident' && $validated['role'] !== 'resident') {
            abort(403, 'Cannot change a resident to another role.');
        }

        $isReliever = $request->boolean('is_reliever');
        if ($validated['role'] === 'responder') {
            if (! $isReliever && empty($request->team)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'team' => 'Team is required for permanent responders.',
                ]);
            }
            if (! $isReliever) {
                $this->validateTeamLimits($request->team, $request->position, false, $user->id);
            }
        }

        $validatedUser = collect($validated)->except(['position', 'team', 'is_reliever', 'birthday'])->toArray();

        $birthdate = $request->birthdate ?? $request->birthday;
        $age = $request->filled('age') ? (int) $request->age : null;
        if ($birthdate && empty($age)) {
            $age = Carbon::parse($birthdate)->age;
        }

        $validatedUser['birthdate'] = $birthdate;
        $validatedUser['age'] = $age;

        if (! empty($validatedUser['password'])) {
            $validatedUser['password'] = Hash::make($validatedUser['password']);
        } else {
            unset($validatedUser['password']);
        }

        $user->update($validatedUser);

        if ($user->role === 'responder') {
            $profile = ResponderProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'badge_number' => 'RSP-'.strtoupper(substr(uniqid(), -6)),
                    'is_reliever' => $isReliever,
                    'team' => $isReliever ? null : ($request->team ?? 'Alpha'),
                    'position' => $request->position ?? 'emt',
                    'availability' => 'available',
                ]
            );
            $profile->update([
                'is_reliever' => $isReliever,
                'position' => $request->position,
                'team' => $isReliever ? null : ($request->team ?? 'Alpha'),
            ]);
        } else {
            if ($user->responderProfile) {
                $user->responderProfile->delete();
            }
        }

        return back()->with('success', 'User updated successfully.');
    }

    protected function validateTeamLimits(?string $team, ?string $position, bool $isReliever, ?int $ignoreUserId = null): void
    {
        if ($isReliever || empty($team) || empty($position)) {
            return;
        }

        $baseQuery = fn () => ResponderProfile::where('team', $team)
            ->where('is_reliever', false)
            ->whereHas('user', function ($uq) use ($ignoreUserId) {
                $uq->whereNull('deleted_at')
                    ->where('role', 'responder')
                    ->when($ignoreUserId, fn ($q) => $q->where('id', '!=', $ignoreUserId));
            });

        if ($position === 'driver') {
            $existingDrivers = $baseQuery()
                ->where('position', 'driver')
                ->count();

            if ($existingDrivers >= 1) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'team' => "Team {$team} already has a permanent Driver (maximum 1 allowed).",
                ]);
            }
        } elseif ($position === 'emt') {
            $existingEmts = $baseQuery()
                ->where('position', 'emt')
                ->count();

            if ($existingEmts >= 3) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'team' => "Team {$team} already has 3 permanent EMTs (maximum 3 allowed).",
                ]);
            }
        }

        $totalPermanent = $baseQuery()->count();

        if ($totalPermanent >= 4) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'team' => "Team {$team} already has the maximum of 4 permanent members (1 Driver and 3 EMTs).",
            ]);
        }
    }

    public function destroy(User $user)
    {
        $activeDispatches = Dispatch::where(function ($q) use ($user) {
            $q->where('driver_id', $user->id)
                ->orWhere('emt_id', $user->id)
                ->orWhereHas('crew', fn ($cq) => $cq->where('users.id', $user->id));
        })
            ->whereIn('dispatch_status', ['assigned', 'accepted', 'en_route', 'arrived_on_scene'])
            ->exists();

        if ($activeDispatches) {
            return back()->with('error', 'Cannot delete responder while they are assigned to an active emergency dispatch. Please reassign or cancel the dispatch first.');
        }

        if ($user->responderProfile) {
            $user->responderProfile->update(['availability' => 'off_duty']);
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}
