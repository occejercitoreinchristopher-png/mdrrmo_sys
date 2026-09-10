<?php

namespace App\Http\Controllers\Api\Responder;

use App\Events\AmbulanceLocationUpdated;
use App\Events\DispatchAccepted;
use App\Events\DispatchCompleted;
use App\Events\DispatchCreated;
use App\Events\DispatchStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\ResponderProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DispatchController extends Controller
{
    public function index()
    {
        // Get active dispatches assigned to this responder's crew/ambulance
        $user = Auth::user();

        $dispatches = Dispatch::where(function ($query) use ($user) {
            $query->where('driver_id', $user->id)
                ->orWhere('emt_id', $user->id);
        })
            ->whereIn('dispatch_status', ['assigned', 'accepted', 'en_route', 'arrived_on_scene'])
            ->with(['incident', 'incident.incidentType', 'incident.resident', 'incident.resident.residentProfile', 'ambulance', 'driver', 'emt', 'teamLeader', 'patientCareRecord', 'patientCareRecord.patient'])
            ->get();

        return response()->json(['data' => $dispatches]);
    }

    public function accept(Dispatch $dispatch)
    {
        $dispatch->update([
            'dispatch_status' => 'accepted',
            'accepted_at' => $dispatch->accepted_at ?? now(),
        ]);
        $dispatch->incident()->update(['incident_status' => 'responding']);
        
        try {
            broadcast(new DispatchAccepted($dispatch));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('DispatchAccepted broadcast notice: '.$e->getMessage());
        }

        return response()->json(['message' => 'Dispatch accepted', 'data' => $dispatch]);
    }

    public function walkIn(Request $request)
    {
        $validated = $request->validate([
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $user = Auth::user();

        // Check if user has an active duty profile
        if (! $user->responderProfile || $user->responderProfile->availability !== 'available') {
            return response()->json(['message' => 'You must be available/on duty to create a walk-in.'], 403);
        }

        $incidentType = IncidentType::firstOrCreate(
            ['name' => 'Medical Emergency'],
            ['description' => 'General Medical Emergency']
        );

        $ambulance = Ambulance::firstOrCreate(
            ['plate_number' => 'WALK-IN'],
            [
                'ambulance_code' => 'STATION-WALK-IN',
                'vehicle_name' => 'MDRRMO Station / Walk-in Clinic',
                'vehicle_type' => 'Station',
                'status' => 'available',
            ]
        );

        $incidentTypeId = $incidentType->id;
        $ambulanceId = $ambulance->id;

        $lat = $validated['latitude'] ?? 0;
        $lng = $validated['longitude'] ?? 0;

        $incident = Incident::create([
            'resident_id' => $user->id, // Responder self-reporting
            'incident_type_id' => $incidentTypeId,
            'description' => 'Walk-In / Station Assistance',
            'place_of_incident' => 'MDRRMO Station (Walk-In)',
            'incident_latitude' => $lat,
            'incident_longitude' => $lng,
            'reporter_latitude' => $lat,
            'reporter_longitude' => $lng,
            'incident_status' => 'responding',
            'priority' => 'Moderate',
            'reported_at' => Carbon::now(),
        ]);

        $dispatch = Dispatch::create([
            'incident_id' => $incident->id,
            'dispatcher_id' => $user->id,
            'driver_id' => $user->id,
            'emt_id' => $user->id,
            'ambulance_id' => $ambulanceId,
            'team' => $user->responderProfile?->team ?? 'Station',
            'dispatch_status' => 'arrived_on_scene', // Already there
            'assigned_at' => Carbon::now(),
            'accepted_at' => Carbon::now(),
            'en_route_at' => Carbon::now(),
            'arrived_at' => Carbon::now(),
        ]);

        // Eager load for frontend
        $dispatch->load([
            'incident',
            'incident.incidentType',
            'incident.resident',
            'ambulance',
            'driver',
            'emt',
            'teamLeader',
            'patientCareRecord',
            'patientCareRecord.patient',
        ]);

        broadcast(new DispatchCreated($dispatch));

        return response()->json([
            'message' => 'Walk-in dispatch created successfully',
            'data' => $dispatch,
        ]);
    }

    public function updateStatus(Request $request, Dispatch $dispatch)
    {
        $validated = $request->validate([
            'status' => 'required|in:en_route,arrived_on_scene,completed,cancelled',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $updates = ['dispatch_status' => $validated['status']];
        if ($validated['status'] === 'en_route') {
            $updates['en_route_at'] = $dispatch->en_route_at ?? now();
        } elseif ($validated['status'] === 'arrived_on_scene') {
            $updates['arrived_at'] = $dispatch->arrived_at ?? now();
        } elseif ($validated['status'] === 'completed') {
            $updates['completed_at'] = $dispatch->completed_at ?? now();
        }

        $dispatch->update($updates);

        // If en_route or arrived, we update the parent incident status to responding
        if (in_array($validated['status'], ['en_route', 'arrived_on_scene'])) {
            $dispatch->incident()->update(['incident_status' => 'responding']);
        }

        // If completed or cancelled, free responders and ambulance
        if (in_array($validated['status'], ['completed', 'cancelled'])) {
            if ($dispatch->incident) {
                $dispatch->incident->update([
                    'incident_status' => $validated['status'] === 'completed' ? 'resolved' : 'cancelled',
                    'resolved_at' => now(),
                ]);
            }
            Ambulance::where('id', $dispatch->ambulance_id)->update(['status' => 'available']);
            ResponderProfile::whereIn('user_id', array_filter([$dispatch->driver_id, $dispatch->emt_id, $dispatch->team_leader_id]))->update(['availability' => 'available']);
        }

        try {
            $dispatch->load(['incident', 'ambulance']);
            broadcast(new DispatchStatusUpdated($dispatch));
            if ($validated['status'] === 'completed') {
                broadcast(new DispatchCompleted($dispatch));
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('DispatchStatusUpdated broadcast notice: '.$e->getMessage());
        }

        return response()->json([
            'message' => 'Status updated automatically',
            'data' => $dispatch,
        ]);
    }

    public function updateLocation(Request $request, Dispatch $dispatch)
    {
        // 1. Check if dispatch is an active mission
        if (! in_array($dispatch->dispatch_status, ['assigned', 'accepted', 'en_route', 'arrived_on_scene'])) {
            return response()->json([
                'message' => 'Cannot update location for an inactive or completed mission.',
            ], 422);
        }

        $user = Auth::user();

        // 2. Check if user belongs to this dispatch (or has responder/dispatcher/admin role)
        $isAssigned = in_array($user->id, array_filter([
            $dispatch->driver_id,
            $dispatch->emt_id,
            $dispatch->team_leader_id,
        ]));

        if (! $isAssigned && ! in_array($user->role, ['admin', 'dispatcher', 'responder'])) {
            return response()->json([
                'message' => 'Unauthorized to update location for this dispatch.',
            ], 403);
        }

        // 3. Validate coordinates
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'heading' => 'nullable|numeric|between:0,360',
            'accuracy' => 'nullable|numeric',
            'timestamp' => 'nullable|string',
        ]);

        $lat = (float) $validated['latitude'];
        $lng = (float) $validated['longitude'];
        $heading = isset($validated['heading']) ? (float) $validated['heading'] : null;
        $accuracy = isset($validated['accuracy']) ? (float) $validated['accuracy'] : null;
        $timestamp = $validated['timestamp'] ?? now()->toIso8601String();

        // 4. Update the dispatch record
        $dispatch->update([
            'last_latitude' => $lat,
            'last_longitude' => $lng,
            'last_heading' => $heading,
            'last_accuracy' => $accuracy,
            'last_location_updated_at' => now(),
        ]);

        $responderName = $user->first_name && $user->last_name
            ? "{$user->first_name} {$user->last_name}"
            : ($user->name ?? 'Responder');

        // 5. Broadcast live location update on private dispatcher channel
        broadcast(new AmbulanceLocationUpdated(
            ambulance: [
                'id' => $dispatch->ambulance_id,
                'plate_number' => $dispatch->ambulance?->plate_number,
                'vehicle_name' => $dispatch->ambulance?->vehicle_name,
                'latitude' => $lat,
                'longitude' => $lng,
            ],
            dispatch_id: $dispatch->id,
            responder_id: $user->id,
            responder_name: $responderName,
            latitude: $lat,
            longitude: $lng,
            heading: $heading,
            accuracy: $accuracy,
            timestamp: $timestamp,
            dispatch_status: $dispatch->dispatch_status
        ));

        return response()->json([
            'message' => 'Location updated successfully',
            'data' => [
                'dispatch_id' => $dispatch->id,
                'latitude' => $lat,
                'longitude' => $lng,
                'heading' => $heading,
                'accuracy' => $accuracy,
                'timestamp' => $timestamp,
            ],
        ]);
    }
}
