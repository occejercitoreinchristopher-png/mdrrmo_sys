<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dispatch;
use App\Models\ResponderProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/Users', [
            'users' => User::where('role', '!=', 'resident')->get(),
            'pagination' => null, // Add pagination later if needed
        ]);
    }

    public function residents()
    {
        return Inertia::render('admin/Residents', [
            'users' => User::where('role', 'resident')->get(),
            'pagination' => null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->whereNull('deleted_at')],
            'phone_number' => ['required', 'string', 'max:255', Rule::unique('users')->whereNull('deleted_at')],
            'password' => 'required|string|min:8|confirmed',
            'role' => ['required', Rule::in(['dispatcher', 'responder'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'position' => ['required_if:role,responder', Rule::in(['driver', 'emt'])],
            'team' => 'required_if:role,responder|nullable|string|max:255',
        ]);

        $validatedUser = collect($validated)->except(['position', 'team'])->toArray();
        $validatedUser['password'] = Hash::make($validatedUser['password']);

        $user = User::create($validatedUser);

        if ($user->role === 'responder') {
            ResponderProfile::create([
                'user_id' => $user->id,
                'badge_number' => 'RSP-'.strtoupper(substr(uniqid(), -6)), // Auto-generate simple badge
                'team' => $request->team ?? 'Alpha',
                'position' => $request->position,
                'availability' => 'available',
            ]);
        }

        return back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user)
    {
        // Admin cannot modify themselves from this interface, or maybe they can?
        // Let's just allow it for now, but prevent changing roles to resident or admin.
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)->whereNull('deleted_at')],
            'phone_number' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)->whereNull('deleted_at')],
            'role' => ['required', Rule::in(['dispatcher', 'responder', 'admin', 'resident'])], // Allow resident if they are already one
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => 'nullable|string|min:8|confirmed',
            'position' => ['required_if:role,responder', Rule::in(['driver', 'emt'])],
            'team' => 'required_if:role,responder|nullable|string|max:255',
        ]);

        // Prevent manually assigning the resident role to a non-resident
        if ($validated['role'] === 'resident' && $user->role !== 'resident') {
            abort(403, 'Cannot assign resident role manually to a non-resident.');
        }

        // Prevent changing a resident to another role from here
        if ($user->role === 'resident' && $validated['role'] !== 'resident') {
            abort(403, 'Cannot change a resident to another role.');
        }

        $validatedUser = collect($validated)->except(['position', 'team'])->toArray();

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
                    'team' => 'Alpha',
                    'availability' => 'available',
                ]
            );
            $profile->update([
                'position' => $request->position,
                'team' => $request->team ?? 'Alpha',
            ]);
        }

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        $activeDispatches = Dispatch::where(function ($q) use ($user) {
            $q->where('driver_id', $user->id)
                ->orWhere('emt_id', $user->id)
                ->orWhere('team_leader_id', $user->id);
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
