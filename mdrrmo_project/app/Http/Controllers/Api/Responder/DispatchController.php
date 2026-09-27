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
    public function availableIncidents()
    {
        $incidents = Incident::where('incident_status', 'verified')
            ->with(['incidentType', 'resident.residentProfile.barangay'])
            ->latest('verified_at')
            ->take(15)
            ->get()
            ->map(function ($inc) {
                $barangay = $inc->resident?->residentProfile?->barangay?->barangay_name ?? null;
                return [
                    'id' => $inc->id,
                    'incident_code' => 'INC-' . str_pad($inc->id, 5, '0', STR_PAD_LEFT),
                    'type' => $inc->incidentType?->name ?? 'Emergency',
                    'priority' => $inc->priority ?? 'Moderate',
                    'location' => $inc->place_of_incident ?: $inc->incident_address ?: ($barangay ? "Barangay {$barangay}" : 'Opol, Misamis Oriental'),
                    'barangay' => $barangay,
                    'description' => $inc->incident_description,
                    'verified_at' => $inc->verified_at ? $inc->verified_at->toIso8601String() : $inc->created_at->toIso8601String(),
                    'report_source' => $inc->report_source,
                    'status' => $inc->incident_status,
                ];
            });

        return response()->json(['data' => $incidents]);
    }

    public function index()
    {
        // Get active dispatches assigned to this responder's crew/ambulance
        $user = Auth::user();

        $dispatches = Dispatch::where(function ($query) use ($user) {
            $query->where('driver_id', $user->id)
                ->orWhere('emt_id', $user->id)
                ->orWhereHas('crew', function ($cq) use ($user) {
                    $cq->where('users.id', $user->id);
                });
        })
            ->whereNotIn('dispatch_status', ['completed', 'cancelled'])
            ->latest('id')
            ->with([
                'incident',
                'incident.incidentType',
                'incident.resident',
                'incident.resident.residentProfile',
                'incident.resident.residentProfile.barangay',
                'ambulance',
                'driver',
                'emt',
                'teamLeader',
                'patientCareRecord',
                'patientCareRecord.patient',
                'patientCareRecord.images'
            ])
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
            'place_of_incident' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        $user = Auth::user();

        // Check if user has an active duty profile
        if (! $user->responderProfile || $user->responderProfile->availability !== 'available') {
            return response()->json(['message' => 'You must be available/on duty to create a walk-in.'], 403);
        }

        // Check if user already has an active emergency mission
        $hasActiveMission = Dispatch::where(function ($query) use ($user) {
            $query->where('driver_id', $user->id)
                ->orWhere('emt_id', $user->id)
                ->orWhereHas('crew', function ($cq) use ($user) {
                    $cq->where('users.id', $user->id);
                });
        })
            ->whereIn('dispatch_status', ['assigned', 'accepted', 'en_route', 'arrived_on_scene'])
            ->exists();

        if ($hasActiveMission) {
            return response()->json([
                'message' => 'You already have an active emergency mission. Please complete or update your current mission before creating a walk-in.',
            ], 422);
        }

        $incidentType = IncidentType::firstOrCreate(
            ['incident_type_name' => 'Medical Emergency'],
            ['type_description' => 'General Medical Emergency']
        );

        $ambulance = Ambulance::withTrashed()->where('plate_number', 'WALK-IN')->first();
        if ($ambulance) {
            if ($ambulance->trashed()) {
                $ambulance->restore();
            }
            $ambulance->update([
                'ambulance_code' => 'STATION-WALK-IN',
                'vehicle_name' => 'MDRRMO Station / Walk-in Clinic',
                'vehicle_type' => 'Station',
                'status' => 'available',
            ]);
        } else {
            $ambulance = Ambulance::create([
                'plate_number' => 'WALK-IN',
                'ambulance_code' => 'STATION-WALK-IN',
                'vehicle_name' => 'MDRRMO Station / Walk-in Clinic',
                'vehicle_type' => 'Station',
                'status' => 'available',
            ]);
        }

        $incidentTypeId = $incidentType->id;
        $ambulanceId = $ambulance->id;

        $lat = $validated['latitude'] ?? 0;
        $lng = $validated['longitude'] ?? 0;

        $placeOfIncident = $request->input('place_of_incident') ?: ($request->input('address') ?: 'Direct Scene Response (Citizen Request)');

        $incident = Incident::create([
            'resident_id' => $user->id, // Responder self-reporting
            'incident_type_id' => $incidentTypeId,
            'description' => 'Walk-In / Direct Citizen Emergency Request',
            'incident_address' => $placeOfIncident,
            'incident_latitude' => $lat,
            'incident_longitude' => $lng,
            'reporter_latitude' => $lat,
            'reporter_longitude' => $lng,
            'incident_status' => 'responding',
            'priority' => 'Moderate',
            'reported_at' => Carbon::now(),
            'report_source' => 'walk_in',
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

        if ($user->responderProfile) {
            $user->responderProfile->update(['availability' => 'busy']);
        }

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
            'patientCareRecord.images',
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
                    'incident_status' => $validated['status'] === 'completed' ? 'resolved' : 'verified',
                    'resolved_at' => $validated['status'] === 'completed' ? now() : null,
                ]);
            }
            if ($dispatch->ambulance_id) {
                Ambulance::where('id', $dispatch->ambulance_id)->update(['status' => 'available']);
            }
            $crewUserIds = $dispatch->crew()->pluck('users.id')->toArray();
            $assignedUserIds = array_unique(array_filter(array_merge($crewUserIds, [
                $dispatch->driver_id,
                $dispatch->emt_id,
            ])));
            if (! empty($assignedUserIds)) {
                ResponderProfile::whereIn('user_id', $assignedUserIds)->update(['availability' => 'available']);
            }
        }

        try {
            $dispatch->load(['incident', 'incident.resident', 'ambulance']);
            broadcast(new DispatchStatusUpdated($dispatch));
            if ($validated['status'] === 'en_route') {
                \App\Services\PushNotificationService::notifyResponderEnRoute($dispatch);
            }
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
        ])) || $dispatch->crew()->where('users.id', $user->id)->exists();

        if (! $isAssigned && ! in_array($user->role, ['admin', 'dispatcher', 'responder'])) {
            return response()->json([
                'message' => 'Unauthorized to update location for this dispatch.',
            ], 403);
        }

        // 2.1 Driver Priority Logic: The main tracking source is the Driver.
        // If an assigned driver exists and this user is not the driver,
        // we prioritize the driver's updates if active within the last 45 seconds.
        $isDriver = ($dispatch->driver_id && $user->id == $dispatch->driver_id)
            || ($user->responderProfile && strtolower($user->responderProfile->position) === 'driver');

        if (! $isDriver && $dispatch->driver_id && $dispatch->last_location_updated_at) {
            $secondsSinceLastUpdate = now()->diffInSeconds($dispatch->last_location_updated_at);
            if ($secondsSinceLastUpdate < 45) {
                return response()->json([
                    'message' => 'Driver is actively transmitting primary vehicle location.',
                    'status' => 'driver_priority',
                ], 200);
            }
        }

        // 3. Validate coordinates
        if ($request->has('heading') && $request->heading !== null && (float) $request->heading < 0) {
            $request->merge(['heading' => null]);
        }

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

    public function reportUnfounded(Request $request, Dispatch $dispatch)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
            'category' => 'required|in:false_alarm,prank',
        ]);

        $user = Auth::user();

        \Illuminate\Support\Facades\DB::transaction(function () use ($dispatch, $validated, $user) {
            $dispatch->update([
                'dispatch_status' => 'cancelled',
                'completed_at' => now(),
            ]);

            if ($dispatch->incident) {
                $isPrank = ($validated['category'] === 'prank');
                $dispatch->incident->update([
                    'incident_status' => 'rejected',
                    'is_prank' => $isPrank,
                    'rejection_category' => $validated['category'],
                    'rejection_reason' => '[Reported on Scene by Responders] '.$validated['reason'],
                    'resolved_at' => now(),
                    'verified_by' => $user->id,
                ]);
            }

            if ($dispatch->ambulance_id) {
                Ambulance::where('id', $dispatch->ambulance_id)->update(['status' => 'available']);
            }

            $crewUserIds = $dispatch->crew()->pluck('users.id')->toArray();
            $assignedUserIds = array_unique(array_filter(array_merge($crewUserIds, [
                $dispatch->driver_id,
                $dispatch->emt_id,
            ])));
            if (! empty($assignedUserIds)) {
                ResponderProfile::whereIn('user_id', $assignedUserIds)->update(['availability' => 'available']);
            }

            $dispatch->load(['incident', 'incident.resident', 'ambulance']);
            try {
                broadcast(new DispatchStatusUpdated($dispatch));
                if ($dispatch->incident) {
                    event(new \App\Events\IncidentRejected($dispatch->incident));
                    \App\Services\PushNotificationService::notifyIncidentRejected($dispatch->incident);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('reportUnfounded broadcast notice: '.$e->getMessage());
            }
        });

        return response()->json([
            'message' => 'Negative result / false alarm reported successfully. Units released.',
            'data' => $dispatch,
        ]);
    }
}
