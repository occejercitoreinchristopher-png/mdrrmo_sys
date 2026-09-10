<?php

namespace App\Http\Controllers\Dispatcher;

use App\Http\Controllers\Controller;
use App\Models\Dispatch;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResponderController extends Controller
{
    public function index(Request $request)
    {
        // Only fetch users with responder roles
        $users = User::whereIn('role', ['responder', 'team_leader', 'emt', 'driver'])
            ->with(['responderProfile'])
            ->orderBy('id', 'asc')
            ->paginate(15);

        // Fetch active dispatches for these users
        $userIds = $users->pluck('id')->toArray();
        $activeDispatches = Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])
            ->with(['incident.incidentType', 'ambulance'])
            ->where(function ($q) use ($userIds) {
                $q->whereIn('driver_id', $userIds)
                    ->orWhereIn('team_leader_id', $userIds)
                    ->orWhereIn('emt_id', $userIds);
            })->get();

        // Attach active dispatch and borrowed mission info to users
        $users->getCollection()->transform(function ($user) use ($activeDispatches) {
            $dispatch = $activeDispatches->first(function ($d) use ($user) {
                return $d->driver_id === $user->id || $d->team_leader_id === $user->id || $d->emt_id === $user->id;
            });

            $rawRole = $user->responderProfile?->position ?? $user->role;
            $displayRole = match (strtolower(str_replace(['_', '-'], ' ', (string) $rawRole))) {
                'driver' => 'Driver',
                'emt' => 'EMT',
                'team leader' => 'Team Leader',
                default => ucfirst(str_replace('_', ' ', (string) $rawRole)),
            };

            $rawTeam = $user->responderProfile?->team ?? 'Unassigned';
            $permanentCrew = str_starts_with($rawTeam, 'Team ') ? $rawTeam : 'Team '.$rawTeam;

            $temporaryMission = null;
            $isBorrowed = false;

            if ($dispatch) {
                $dispatchTeam = $dispatch->team
                    ? (str_starts_with($dispatch->team, 'Team ') ? $dispatch->team : 'Team '.$dispatch->team)
                    : null;

                $borrowedTo = null;

                // If responder's permanent team differs from the dispatch's team, they are borrowed
                if ($dispatchTeam && $permanentCrew && strcasecmp($permanentCrew, $dispatchTeam) !== 0) {
                    $isBorrowed = true;
                    $borrowedTo = $dispatchTeam;
                }

                // Also check explicit borrowed_crew array
                if (is_array($dispatch->borrowed_crew)) {
                    foreach ($dispatch->borrowed_crew as $b) {
                        if (($b['user_id'] ?? null) == $user->id) {
                            $isBorrowed = true;
                            $borrowedTo = $b['borrowed_to'] ?? $dispatchTeam;
                            if ($borrowedTo && ! str_starts_with($borrowedTo, 'Team ')) {
                                $borrowedTo = 'Team '.$borrowedTo;
                            }
                        }
                    }
                }

                $temporaryMission = [
                    'dispatch_id' => $dispatch->id,
                    'incident_id' => $dispatch->incident_id,
                    'incident_code' => $dispatch->incident?->location_code,
                    'incident_type' => $dispatch->incident?->incidentType?->name ?? 'Emergency Incident',
                    'dispatch_team' => $dispatchTeam,
                    'dispatch_status' => $dispatch->dispatch_status,
                    'is_borrowed' => $isBorrowed,
                    'borrowed_to' => $borrowedTo,
                    'permanent_crew' => $permanentCrew,
                ];
            }

            $user->display_role = $displayRole;
            $user->permanent_crew = $permanentCrew;
            $user->temporary_mission = $temporaryMission;
            $user->is_borrowed = $isBorrowed;
            $user->current_status = $dispatch ? 'assigned' : ($user->responderProfile?->availability ?? 'offline');
            $user->dispatches = $dispatch ? [$dispatch] : [];

            return $user;
        });

        return Inertia::render('dispatcher/Responders', [
            'users' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function updateStatus(Request $request, User $user)
    {
        $validated = $request->validate([
            'availability' => 'required|string|in:available,off_duty,on_leave,sick',
        ]);

        // Check if user is currently assigned to an active mission
        $hasActiveDispatch = Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])
            ->where(function ($q) use ($user) {
                $q->where('driver_id', $user->id)
                    ->orWhere('team_leader_id', $user->id)
                    ->orWhere('emt_id', $user->id);
            })->first();

        if ($hasActiveDispatch) {
            return back()->withErrors([
                'availability' => "Cannot change status while {$user->first_name} is actively deployed on Incident #{$hasActiveDispatch->incident_id}. The mission must be completed first.",
            ]);
        }

        if ($user->responderProfile) {
            $user->responderProfile->update(['availability' => $validated['availability']]);
        }

        $statusLabel = match ($validated['availability']) {
            'available' => 'Available (Returned)',
            'off_duty' => 'Off Duty',
            'on_leave' => 'On Leave',
            'sick' => 'Sick',
            default => ucfirst($validated['availability']),
        };

        return back()->with('success', "{$user->first_name} {$user->last_name} marked as {$statusLabel}.");
    }
}
