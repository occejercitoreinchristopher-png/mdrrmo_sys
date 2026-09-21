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
            ->paginate(10);

        // Fetch active dispatches for these users
        $userIds = $users->pluck('id')->toArray();
        $activeDispatches = Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])
            ->with(['incident.incidentType', 'ambulance', 'crew'])
            ->where(function ($q) use ($userIds) {
                $q->whereIn('driver_id', $userIds)
                    ->orWhereIn('emt_id', $userIds)
                    ->orWhereHas('crew', fn ($cq) => $cq->whereIn('users.id', $userIds));
            })->get();

        // Attach active dispatch and reliever mission info to users
        $users->getCollection()->transform(function ($user) use ($activeDispatches) {
            $dispatch = $activeDispatches->first(function ($d) use ($user) {
                return $d->driver_id === $user->id 
                    || $d->emt_id === $user->id 
                    || $d->crew->contains('id', $user->id);
            });

            $rawRole = $user->responderProfile?->position ?? $user->role;
            $displayRole = match (strtolower(str_replace(['_', '-'], ' ', (string) $rawRole))) {
                'driver' => 'Driver',
                'emt' => 'EMT',
                default => ucfirst(str_replace('_', ' ', (string) $rawRole)),
            };

            $isReliever = (bool) $user->responderProfile?->is_reliever;
            $rawTeam = $user->responderProfile?->team;
            $permanentCrew = $isReliever 
                ? 'Reliever Pool' 
                : ($rawTeam ? (str_starts_with($rawTeam, 'Team ') ? $rawTeam : 'Team '.$rawTeam) : 'Unassigned');

            $temporaryMission = null;

            if ($dispatch) {
                $dispatchTeam = $dispatch->team
                    ? (str_starts_with($dispatch->team, 'Team ') ? $dispatch->team : 'Team '.$dispatch->team)
                    : null;

                $temporaryMission = [
                    'dispatch_id' => $dispatch->id,
                    'incident_id' => $dispatch->incident_id,
                    'incident_code' => $dispatch->incident?->location_code,
                    'incident_type' => $dispatch->incident?->incidentType?->name ?? 'Emergency Incident',
                    'dispatch_team' => $dispatchTeam,
                    'dispatch_status' => $dispatch->dispatch_status,
                    'is_reliever' => $isReliever,
                    'permanent_crew' => $permanentCrew,
                ];
            }

            $user->is_reliever = $isReliever;
            $user->display_role = $displayRole;
            $user->permanent_crew = $permanentCrew;
            $user->temporary_mission = $temporaryMission;
            $user->is_borrowed = $isReliever && (bool) $dispatch;
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
                    ->orWhere('emt_id', $user->id)
                    ->orWhereHas('crew', fn ($cq) => $cq->where('users.id', $user->id));
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
