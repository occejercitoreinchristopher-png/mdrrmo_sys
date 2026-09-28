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

        // Fetch available responders (both permanent team members and relievers)
        $responders = User::where('role', 'responder')
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
            'emt_ids' => 'nullable|array',
            'emt_ids.*' => 'exists:users,id',
            'reliever_ids' => 'nullable|array',
            'reliever_ids.*' => 'exists:users,id',
        ]);

        $driverId = ! empty($validated['driver_id']) ? $validated['driver_id'] : null;
        $emtIds = ! empty($validated['emt_ids']) ? (array) $validated['emt_ids'] : [];

        if (! $driverId && empty($emtIds)) {
            abort(422, 'Please select at least one crew member (Driver or EMT) to deploy.');
        }

        DB::transaction(function () use ($validated, $request, $driverId, $emtIds) {
            $incident = Incident::findOrFail($validated['incident_id']);
            $ambulance = Ambulance::findOrFail($validated['ambulance_id']);

            // Load driver and verify position if provided
            $driver = null;
            if ($driverId) {
                $driver = User::with('responderProfile')->findOrFail($driverId);
                $driverPos = $driver->responderProfile?->position;
                if (! in_array($driverPos, ['driver', 'team_leader'])) {
                    abort(422, "User {$driver->first_name} {$driver->last_name} is not registered as a Driver.");
                }
            }

            // Load EMTs and verify positions if provided
            $emtUsers = collect();
            if (! empty($emtIds)) {
                $emtUsers = User::with('responderProfile')->whereIn('id', $emtIds)->get();
                if ($emtUsers->count() !== count($emtIds)) {
                    abort(422, 'One or more selected EMTs could not be found.');
                }

                foreach ($emtUsers as $emtUser) {
                    $pos = $emtUser->responderProfile?->position;
                    if (! in_array($pos, ['emt', 'team_leader'])) {
                        abort(422, "User {$emtUser->first_name} {$emtUser->last_name} is not registered as an EMT or Team Leader.");
                    }
                }
            }

            // Collect all assigned crew IDs
            $assignedCrewIds = array_values(array_unique(array_merge(
                $driver ? [$driver->id] : [],
                $emtUsers->pluck('id')->toArray()
            )));

            if (empty($assignedCrewIds)) {
                abort(422, 'Please select at least one crew member to deploy.');
            }

            // Safeguard: Ensure none of the assigned members are already busy on another active mission
            $alreadyActive = Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])
                ->where(function ($q) use ($assignedCrewIds) {
                    $q->whereIn('driver_id', $assignedCrewIds)
                        ->orWhereIn('emt_id', $assignedCrewIds)
                        ->orWhereHas('crew', fn ($cq) => $cq->whereIn('users.id', $assignedCrewIds));
                })->exists();

            if ($alreadyActive) {
                abort(422, 'One or more assigned crew members are already deployed to an active mission.');
            }

            // Snapshot structure
            $crewSnapshot = [
                'team' => $validated['team'],
                'driver' => $driver ? [
                    'id' => $driver->id,
                    'name' => $driver->first_name.' '.$driver->last_name,
                    'is_reliever' => (bool) $driver->responderProfile?->is_reliever,
                    'position' => $driver->responderProfile?->position === 'team_leader' ? 'Team Leader' : 'Driver',
                ] : null,
                'emts' => $emtUsers->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->first_name.' '.$u->last_name,
                    'is_reliever' => (bool) $u->responderProfile?->is_reliever,
                    'position' => $u->responderProfile?->position === 'team_leader' ? 'Team Leader' : 'EMT',
                ])->toArray(),
            ];

            $teamLeaderUser = $emtUsers->first(fn ($u) => $u->responderProfile?->position === 'team_leader')
                ?? ($driver?->responderProfile?->position === 'team_leader' ? $driver : null);

            $primaryEmt = $emtUsers->first(fn ($u) => $u->responderProfile?->position === 'emt') ?? $emtUsers->first();

            $dispatch = Dispatch::create([
                'incident_id' => $incident->id,
                'dispatcher_id' => $request->user()->id,
                'ambulance_id' => $ambulance->id,
                'team' => $validated['team'],
                'driver_id' => $driver?->id,
                'emt_id' => $primaryEmt?->id,
                'crew_snapshot' => $crewSnapshot,
                'dispatch_status' => 'assigned',
                'assigned_at' => now(),
            ]);

            // Attach all crew members to dispatch_crews
            if ($driver) {
                $dispatch->crew()->attach($driver->id, [
                    'role' => $driver->responderProfile?->position === 'team_leader' ? 'team_leader' : 'driver',
                    'is_reliever_assignment' => (bool) $driver->responderProfile?->is_reliever,
                ]);
            }

            foreach ($emtUsers as $emtUser) {
                $dispatch->crew()->attach($emtUser->id, [
                    'role' => $emtUser->responderProfile?->position === 'team_leader' ? 'team_leader' : 'emt',
                    'is_reliever_assignment' => (bool) $emtUser->responderProfile?->is_reliever,
                ]);
            }

            // Update statuses
            $incident->update(['incident_status' => 'assigned']);
            $ambulance->update(['status' => 'dispatched']);

            ResponderProfile::whereIn('user_id', $assignedCrewIds)
                ->update(['availability' => 'busy']);

            return $dispatch;
        });

        event(new DispatchCreated($dispatch));

        return back()->with('success', 'Dispatch created successfully and mission crew notified.');
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

            $crewUserIds = $dispatch->crew()->pluck('users.id')->toArray();
            if (empty($crewUserIds)) {
                $crewUserIds = array_filter([$dispatch->driver_id, $dispatch->emt_id]);
            }
            if (! empty($crewUserIds)) {
                ResponderProfile::whereIn('user_id', $crewUserIds)->update(['availability' => 'available']);
            }

            // Note relievers returning to pool
            $relievers = $dispatch->crew()->wherePivot('is_reliever_assignment', true)->get();
            foreach ($relievers as $reliever) {
                $returnNotes[] = "Reliever {$reliever->first_name} {$reliever->last_name} returned to Reliever Pool.";
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

            $crewUserIds = $dispatch->crew()->pluck('users.id')->toArray();
            if (empty($crewUserIds)) {
                $crewUserIds = array_filter([$dispatch->driver_id, $dispatch->emt_id]);
            }
            if (! empty($crewUserIds)) {
                ResponderProfile::whereIn('user_id', $crewUserIds)->update(['availability' => 'available']);
            }

            $relievers = $dispatch->crew()->wherePivot('is_reliever_assignment', true)->get();
            foreach ($relievers as $reliever) {
                $returnNotes[] = "Reliever {$reliever->first_name} {$reliever->last_name} returned to Reliever Pool.";
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
