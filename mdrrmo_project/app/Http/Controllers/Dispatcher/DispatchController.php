<?php

namespace App\Http\Controllers\Dispatcher;

use App\Events\DispatchCompleted;
use App\Events\DispatchCreated;
use App\Events\DispatchStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\ResponderProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DispatchController extends Controller
{
    public function index(Request $request)
    {
        // Load all active dispatches.
        // We load all active responders/missions so every unit can be displayed simultaneously as live markers.
        $dispatches = Dispatch::with(['incident.incidentType', 'incident.resident', 'ambulance', 'driver', 'teamLeader', 'emt', 'dispatcher'])
            ->whereNotIn('dispatch_status', ['completed', 'cancelled'])
            ->latest()
            ->get();

        // Fetch pending assignments (verified incidents)
        $verifiedIncidents = Incident::where('incident_status', 'verified')
            ->with(['incidentType', 'resident'])
            ->latest()
            ->get();

        // Fetch all emergency ambulances (exclude station walk-in placeholder)
        $ambulances = Ambulance::where('plate_number', '!=', 'WALK-IN')
            ->where('vehicle_type', '!=', 'Station')
            ->get();

        // Fetch available responders
        $responders = User::whereIn('role', ['responder', 'team_leader', 'emt', 'driver'])
            ->whereHas('responderProfile', function ($q) {
                $q->where('availability', 'available');
            })
            ->with('responderProfile')
            ->get();

        return Inertia::render('dispatcher/Dispatches', [
            'dispatches' => $dispatches,
            'verifiedIncidents' => $verifiedIncidents,
            'ambulances' => $ambulances,
            'responders' => $responders,
            'pagination' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $dispatches->count(),
                'total' => $dispatches->count(),
            ],
            'selectedIncidentId' => $request->query('incident_id'), // For auto-opening
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'incident_id' => 'required|exists:incidents,id',
            'ambulance_id' => 'required|exists:ambulances,id',
            'team' => 'required|string',
            'driver_id' => 'nullable|exists:users,id',
            'team_leader_id' => 'nullable|exists:users,id',
            'emt_id' => 'nullable|exists:users,id',
            'borrowed_crew' => 'nullable|array',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $incident = Incident::findOrFail($validated['incident_id']);
            $ambulance = Ambulance::findOrFail($validated['ambulance_id']);

            // Find available responders for the selected team
            $availableResponders = User::whereHas('responderProfile', function ($q) use ($validated) {
                $q->where('team', $validated['team'])
                    ->where('availability', 'available');
            })->with('responderProfile')->get();

            // Load explicitly assigned members or fallback to available team members
            $driver = ! empty($validated['driver_id'])
                ? User::with('responderProfile')->find($validated['driver_id'])
                : ($availableResponders->first(fn ($u) => $u->responderProfile?->position === 'driver') ?? $availableResponders->first());

            $teamLeader = ! empty($validated['team_leader_id'])
                ? User::with('responderProfile')->find($validated['team_leader_id'])
                : $availableResponders->first(fn ($u) => $u->responderProfile?->position === 'team_leader' && $u->id !== $driver?->id);

            $emt = ! empty($validated['emt_id'])
                ? User::with('responderProfile')->find($validated['emt_id'])
                : ($availableResponders->first(fn ($u) => $u->responderProfile?->position === 'emt' && $u->id !== $driver?->id && $u->id !== $teamLeader?->id)
                   ?? $availableResponders->first(fn ($u) => $u->id !== $driver?->id && $u->id !== $teamLeader?->id));

            if (! $driver && ! $emt && ! $teamLeader) {
                abort(422, 'The selected team has no available responders on duty.');
            }

            // Safeguard: Ensure none of the assigned members are already busy on another active mission
            $assignedCrewIds = array_values(array_filter([$driver?->id, $teamLeader?->id, $emt?->id]));
            $alreadyActive = Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])
                ->where(function ($q) use ($assignedCrewIds) {
                    $q->whereIn('driver_id', $assignedCrewIds)
                        ->orWhereIn('team_leader_id', $assignedCrewIds)
                        ->orWhereIn('emt_id', $assignedCrewIds);
                })->exists();

            if ($alreadyActive) {
                abort(422, 'One or more assigned crew members are already deployed to an active mission.');
            }

            // Strict Incomplete Rule: Borrowing is ONLY permitted when the requesting team lacks an available member for that position
            if ($driver && $driver->responderProfile?->team && strcasecmp($driver->responderProfile->team, $validated['team']) !== 0) {
                $teamHasDriver = $availableResponders->contains(fn ($u) => in_array($u->responderProfile?->position, ['driver']));
                if ($teamHasDriver) {
                    abort(422, "Cannot borrow a driver because Team {$validated['team']} already has an available on-duty driver.");
                }
            }

            if ($emt && $emt->responderProfile?->team && strcasecmp($emt->responderProfile->team, $validated['team']) !== 0) {
                $teamHasEmt = $availableResponders->contains(fn ($u) => in_array($u->responderProfile?->position, ['emt']) && $u->id !== $driver?->id);
                if ($teamHasEmt) {
                    abort(422, "Cannot borrow an EMT because Team {$validated['team']} already has an available on-duty EMT.");
                }
            }

            // Detect and structure borrowed crew members (Permanent Crew != Requesting Team)
            $borrowedCrew = is_array($request->borrowed_crew) ? $request->borrowed_crew : [];
            $crewMap = [
                'driver' => $driver,
                'team_leader' => $teamLeader,
                'emt' => $emt,
            ];

            foreach ($crewMap as $role => $member) {
                if ($member && $member->responderProfile?->team) {
                    $permTeam = $member->responderProfile->team;
                    if (strcasecmp($permTeam, $validated['team']) !== 0) {
                        $alreadyListed = collect($borrowedCrew)->firstWhere('user_id', $member->id);
                        if (! $alreadyListed) {
                            $borrowedCrew[] = [
                                'user_id' => $member->id,
                                'name' => $member->first_name.' '.$member->last_name,
                                'role' => match ($role) {
                                    'driver' => 'Driver',
                                    'team_leader' => 'Team Leader',
                                    'emt' => 'EMT',
                                    default => ucfirst($role)
                                },
                                'permanent_team' => str_starts_with($permTeam, 'Team ') ? $permTeam : 'Team '.$permTeam,
                                'borrowed_to' => str_starts_with($validated['team'], 'Team ') ? $validated['team'] : 'Team '.$validated['team'],
                                'incident_id' => $incident->id,
                            ];
                        }
                    }
                }
            }

            $crewSnapshot = [
                'team' => $validated['team'],
                'driver' => $driver ? $driver->first_name.' '.$driver->last_name : null,
                'team_leader' => $teamLeader ? $teamLeader->first_name.' '.$teamLeader->last_name : null,
                'emt' => $emt ? $emt->first_name.' '.$emt->last_name : null,
                'borrowed_crew' => $borrowedCrew,
            ];

            $dispatch = Dispatch::create([
                'incident_id' => $incident->id,
                'dispatcher_id' => $request->user()->id,
                'ambulance_id' => $ambulance->id,
                'team' => $validated['team'],
                'driver_id' => $driver?->id,
                'team_leader_id' => $teamLeader?->id,
                'emt_id' => $emt?->id,
                'borrowed_crew' => ! empty($borrowedCrew) ? $borrowedCrew : null,
                'crew_snapshot' => $crewSnapshot,
                'dispatch_status' => 'assigned',
                'assigned_at' => now(),
            ]);

            // Update statuses
            $incident->update(['incident_status' => 'assigned']);
            $ambulance->update(['status' => 'dispatched']);

            if (! empty($assignedCrewIds)) {
                ResponderProfile::whereIn('user_id', $assignedCrewIds)
                    ->update(['availability' => 'busy']);
            }

            event(new DispatchCreated($dispatch));
        });

        return back()->with('success', 'Dispatch created successfully and crew notified.');
    }

    public function resolve(Request $request, Dispatch $dispatch)
    {
        $returnNotes = [];

        DB::transaction(function () use ($dispatch, &$returnNotes) {
            $dispatch->update([
                'dispatch_status' => 'completed',
                'completed_at' => now(),
            ]);

            if ($dispatch->incident) {
                $dispatch->incident->update([
                    'incident_status' => 'resolved',
                    'resolved_at' => now(),
                ]);
            }

            if ($dispatch->ambulance_id) {
                Ambulance::where('id', $dispatch->ambulance_id)->update(['status' => 'available']);
            }

            $crewUserIds = array_filter([$dispatch->driver_id, $dispatch->emt_id, $dispatch->team_leader_id]);
            if (! empty($crewUserIds)) {
                ResponderProfile::whereIn('user_id', $crewUserIds)->update(['availability' => 'available']);
            }

            // Collect confirmation note for borrowed crew returning to permanent crew
            if (is_array($dispatch->borrowed_crew) && count($dispatch->borrowed_crew) > 0) {
                foreach ($dispatch->borrowed_crew as $b) {
                    $name = $b['name'] ?? null;
                    if (! $name && ! empty($b['user_id'])) {
                        $u = User::find($b['user_id']);
                        $name = $u ? $u->first_name : 'Crew member';
                    }
                    $permTeam = $b['permanent_team'] ?? 'their permanent crew';
                    if ($name) {
                        $returnNotes[] = "{$name} has been returned to {$permTeam}.";
                    }
                }
            }

            broadcast(new DispatchStatusUpdated($dispatch));
            broadcast(new DispatchCompleted($dispatch));
        });

        $message = 'Emergency mission marked as resolved.';
        if (! empty($returnNotes)) {
            $message = 'Mission completed. '.implode(' ', $returnNotes);
        }

        return back()->with('success', $message);
    }

    public function cancel(Request $request, Dispatch $dispatch)
    {
        $revertIncident = $request->boolean('revert_incident', true);
        $returnNotes = [];

        DB::transaction(function () use ($dispatch, $revertIncident, &$returnNotes) {
            $dispatch->update([
                'dispatch_status' => 'cancelled',
                'completed_at' => now(),
            ]);

            if ($dispatch->incident) {
                $dispatch->incident->update([
                    'incident_status' => $revertIncident ? 'verified' : 'cancelled',
                    'resolved_at' => $revertIncident ? null : now(),
                ]);
            }

            if ($dispatch->ambulance_id) {
                Ambulance::where('id', $dispatch->ambulance_id)->update(['status' => 'available']);
            }

            $crewUserIds = array_filter([$dispatch->driver_id, $dispatch->emt_id, $dispatch->team_leader_id]);
            if (! empty($crewUserIds)) {
                ResponderProfile::whereIn('user_id', $crewUserIds)->update(['availability' => 'available']);
            }

            if (is_array($dispatch->borrowed_crew) && count($dispatch->borrowed_crew) > 0) {
                foreach ($dispatch->borrowed_crew as $b) {
                    $name = $b['name'] ?? null;
                    if (! $name && ! empty($b['user_id'])) {
                        $u = User::find($b['user_id']);
                        $name = $u ? $u->first_name : 'Crew member';
                    }
                    $permTeam = $b['permanent_team'] ?? 'their permanent crew';
                    if ($name) {
                        $returnNotes[] = "{$name} has been returned to {$permTeam}.";
                    }
                }
            }

            $dispatch->load(['incident', 'ambulance']);
            broadcast(new DispatchStatusUpdated($dispatch));
        });

        $baseMsg = $revertIncident
            ? 'Dispatch cancelled. Incident returned to verified queue for reassignment.'
            : 'Dispatch and incident cancelled.';

        if (! empty($returnNotes)) {
            $baseMsg .= ' '.implode(' ', $returnNotes);
        }

        return back()->with('success', $baseMsg);
    }
}
