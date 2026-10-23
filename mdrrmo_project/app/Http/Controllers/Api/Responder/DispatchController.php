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

        $today = Carbon::today();

        $userDispatchesQuery = fn () => Dispatch::where(function ($query) use ($user) {
            $query->where('driver_id', $user->id)
                ->orWhere('emt_id', $user->id)
                ->orWhere('dispatcher_id', $user->id)
                ->orWhereHas('crew', function ($cq) use ($user) {
                    $cq->where('users.id', $user->id);
                });
        });

        $todayCompletedCount = $userDispatchesQuery()
            ->where('dispatch_status', 'completed')
            ->where(function ($q) use ($today) {
                $q->whereDate('completed_at', $today)
                    ->orWhere(function ($sq) use ($today) {
                        $sq->whereNull('completed_at')->whereDate('updated_at', $today);
                    });
            })
            ->count();

        $todayPatientsCount = $userDispatchesQuery()
            ->where('dispatch_status', 'completed')
            ->where(function ($q) use ($today) {
                $q->whereDate('completed_at', $today)
                    ->orWhere(function ($sq) use ($today) {
                        $sq->whereNull('completed_at')->whereDate('updated_at', $today);
                    });
            })
            ->whereHas('patientCareRecord')
            ->count();

        return response()->json([
            'data' => $dispatches,
            'today_stats' => [
                'completed_missions' => $todayCompletedCount,
                'patients_assisted' => $todayPatientsCount,
            ],
        ]);
    }

    public function accept(Request $request, Dispatch $dispatch)
    {
        $user = Auth::user();

        if (! $this->isUserAssignedToDispatch($user, $dispatch)) {
            return response()->json([
                'message' => 'Unauthorized to accept this dispatch.',
            ], 403);
        }

        // Idempotent: If already accepted or advanced beyond, return current record
        if (in_array($dispatch->dispatch_status, ['accepted', 'en_route', 'arrived_on_scene', 'completed'])) {
            return response()->json([
                'message' => 'Dispatch already accepted.',
                'data' => $dispatch,
                'already_processed' => true,
            ]);
        }

        $acceptedAt = now();
        if ($request->filled('accepted_at') || $request->filled('timestamp')) {
            try {
                $raw = $request->input('accepted_at') ?: $request->input('timestamp');
                $acceptedAt = is_numeric($raw) ? Carbon::createFromTimestampMs((int)$raw) : Carbon::parse($raw);
            } catch (\Throwable $e) {}
        }

        $dispatch->update([
            'dispatch_status' => 'accepted',
            'accepted_at' => $dispatch->accepted_at ?? $acceptedAt,
            'last_location_updated_at' => now(),
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

        // 1. Check if user is a responder
        if (! $user->responderProfile) {
            return response()->json(['message' => 'No responder profile found for this account.'], 403);
        }

        // 2. Check if user is strictly off-duty or on leave
        $avail = strtolower($user->responderProfile->availability ?? '');
        if ($avail === 'off_duty' || $avail === 'on_leave' || $avail === 'offline') {
            return response()->json(['message' => 'You are currently off-duty or offline. Please switch to Available on duty first.'], 403);
        }

        // 3. Check if user already has an active emergency mission
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

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $request, $user) {
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

                $lat = is_numeric($validated['latitude'] ?? null) && (float)$validated['latitude'] != 0 
                    ? (float)$validated['latitude'] 
                    : 8.5170;
                $lng = is_numeric($validated['longitude'] ?? null) && (float)$validated['longitude'] != 0 
                    ? (float)$validated['longitude'] 
                    : 124.5710;

                $rawPlace = $request->input('place_of_incident') ?: ($request->input('address') ?: 'Direct Scene Response (Citizen Request)');
                $placeOfIncident = mb_substr($rawPlace, 0, 95);

                $incident = Incident::create([
                    'resident_id' => $user->id,
                    'incident_type_id' => $incidentType->id,
                    'incident_description' => 'Walk-In / Direct Citizen Emergency Request',
                    'description' => 'Walk-In / Direct Citizen Emergency Request',
                    'place_of_incident' => $placeOfIncident,
                    'incident_address' => mb_substr($rawPlace, 0, 145),
                    'incident_latitude' => $lat,
                    'incident_longitude' => $lng,
                    'reporter_latitude' => $lat,
                    'reporter_longitude' => $lng,
                    'incident_status' => 'responding',
                    'priority' => 'Moderate',
                    'reported_at' => Carbon::now(),
                    'report_source' => 'walk_in',
                ]);

                $driverId = ($user->responderProfile?->position === 'driver') ? $user->id : null;
                $emtId = ($user->responderProfile?->position === 'emt') ? $user->id : null;
                if (! $driverId && ! $emtId) {
                    $driverId = $user->id;
                }

                $dispatch = Dispatch::create([
                    'incident_id' => $incident->id,
                    'dispatcher_id' => $user->id,
                    'driver_id' => $driverId ?? $user->id,
                    'emt_id' => $emtId ?? $user->id,
                    'ambulance_id' => $ambulance->id,
                    'team' => $user->responderProfile?->team ?? 'Station',
                    'dispatch_status' => 'arrived_on_scene',
                    'assigned_at' => Carbon::now(),
                    'accepted_at' => Carbon::now(),
                    'en_route_at' => Carbon::now(),
                    'arrived_at' => Carbon::now(),
                ]);

                // Ensure user is attached to crew
                try {
                    $dispatch->crew()->syncWithoutDetaching([$user->id]);
                } catch (\Throwable $e) {}

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

                try {
                    broadcast(new DispatchCreated($dispatch));
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('DispatchCreated walk-in broadcast error: '.$e->getMessage());
                }

                return response()->json([
                    'message' => 'Walk-in dispatch created successfully',
                    'data' => $dispatch,
                ]);
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Walk-in creation error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to create walk-in: '.$e->getMessage(),
            ], 500);
        }
    }

    public function updateStatus(Request $request, Dispatch $dispatch)
    {
        $user = Auth::user();

        if (! $this->isUserAssignedToDispatch($user, $dispatch)) {
            return response()->json([
                'message' => 'Unauthorized to update status for this dispatch.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:en_route,arrived_on_scene,completed,cancelled',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'timestamp' => 'nullable',
            'event_time' => 'nullable',
        ]);

        // 1. Idempotency Check: Already at requested status
        if ($dispatch->dispatch_status === $validated['status']) {
            return response()->json([
                'message' => 'Status is already up to date.',
                'data' => $dispatch,
                'already_processed' => true,
            ]);
        }

        // 2. Conflict Protection: Never let an offline device revert a mission that was already completed or cancelled on server
        if (in_array($dispatch->dispatch_status, ['completed', 'cancelled']) && in_array($validated['status'], ['en_route', 'arrived_on_scene'])) {
            return response()->json([
                'message' => 'Mission has already been marked as ' . $dispatch->dispatch_status . ' on the server.',
                'data' => $dispatch,
                'is_conflict' => true,
            ], 200);
        }

        // Parse offline event timestamp if provided
        $eventTime = now();
        $rawTime = $request->input('timestamp') ?: $request->input('event_time');
        if (!empty($rawTime)) {
            try {
                $eventTime = is_numeric($rawTime) ? Carbon::createFromTimestampMs((int)$rawTime) : Carbon::parse($rawTime);
            } catch (\Throwable $e) {}
        }

        $updates = [
            'dispatch_status' => $validated['status'],
            'last_location_updated_at' => now(),
        ];

        if (!empty($validated['latitude']) && !empty($validated['longitude'])) {
            $updates['last_latitude'] = (float)$validated['latitude'];
            $updates['last_longitude'] = (float)$validated['longitude'];
        }

        if ($validated['status'] === 'en_route') {
            $updates['en_route_at'] = $dispatch->en_route_at ?? $eventTime;
        } elseif ($validated['status'] === 'arrived_on_scene') {
            $updates['arrived_at'] = $dispatch->arrived_at ?? $eventTime;
        } elseif ($validated['status'] === 'completed') {
            $updates['completed_at'] = $dispatch->completed_at ?? $eventTime;
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
                    'resolved_at' => $validated['status'] === 'completed' ? ($dispatch->completed_at ?? now()) : null,
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
            'message' => 'Status updated successfully',
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

        // 2. Check if user belongs to this dispatch (or is admin/dispatcher)
        if (! $this->isUserAssignedToDispatch($user, $dispatch)) {
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

        if (! $this->isUserAssignedToDispatch($user, $dispatch)) {
            return response()->json([
                'message' => 'Unauthorized to report for this dispatch.',
            ], 403);
        }

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

    public function syncBatch(Request $request)
    {
        $user = Auth::user();
        $operations = $request->input('operations', []);

        if (! is_array($operations) || empty($operations)) {
            return response()->json([
                'success' => true,
                'message' => 'No operations to sync',
                'processed' => 0,
                'results' => [],
            ]);
        }

        $results = [];
        $idMappings = []; // temp_id -> real_id

        foreach ($operations as $op) {
            $opId = $op['operation_id'] ?? $op['id'] ?? null;
            $action = $op['action'] ?? $op['type'] ?? '';
            $dispatchId = $op['dispatch_id'] ?? $op['dispatchId'] ?? null;
            $payload = $op['payload'] ?? $op['data'] ?? [];

            try {
                $dispatch = $dispatchId ? Dispatch::find($dispatchId) : null;

                switch ($action) {
                    case 'ACCEPT_DISPATCH':
                        if ($dispatch && $this->isUserAssignedToDispatch($user, $dispatch)) {
                            if (! in_array($dispatch->dispatch_status, ['accepted', 'en_route', 'arrived_on_scene', 'completed'])) {
                                $acceptedAt = !empty($op['timestamp']) ? (is_numeric($op['timestamp']) ? Carbon::createFromTimestampMs((int)$op['timestamp']) : Carbon::parse($op['timestamp'])) : now();
                                $dispatch->update([
                                    'dispatch_status' => 'accepted',
                                    'accepted_at' => $dispatch->accepted_at ?? $acceptedAt,
                                    'last_location_updated_at' => now(),
                                ]);
                                $dispatch->incident()?->update(['incident_status' => 'responding']);
                                try { broadcast(new DispatchAccepted($dispatch)); } catch (\Throwable $e) {}
                            }
                            $results[] = ['operation_id' => $opId, 'status' => 'success', 'action' => $action];
                        } else {
                            $results[] = ['operation_id' => $opId, 'status' => 'skipped', 'message' => 'Dispatch not found or unauthorized'];
                        }
                        break;

                    case 'UPDATE_STATUS':
                        if ($dispatch && $this->isUserAssignedToDispatch($user, $dispatch)) {
                            $status = $payload['status'] ?? null;
                            if ($status && in_array($status, ['en_route', 'arrived_on_scene', 'completed', 'cancelled'])) {
                                if (in_array($dispatch->dispatch_status, ['completed', 'cancelled']) && in_array($status, ['en_route', 'arrived_on_scene'])) {
                                    $results[] = ['operation_id' => $opId, 'status' => 'conflict', 'current_status' => $dispatch->dispatch_status];
                                    break;
                                }

                                $eventTime = !empty($op['timestamp']) ? (is_numeric($op['timestamp']) ? Carbon::createFromTimestampMs((int)$op['timestamp']) : Carbon::parse($op['timestamp'])) : now();
                                $updates = ['dispatch_status' => $status, 'last_location_updated_at' => now()];

                                if (!empty($payload['latitude']) && !empty($payload['longitude'])) {
                                    $updates['last_latitude'] = (float)$payload['latitude'];
                                    $updates['last_longitude'] = (float)$payload['longitude'];
                                }

                                if ($status === 'en_route') {
                                    $updates['en_route_at'] = $dispatch->en_route_at ?? $eventTime;
                                } elseif ($status === 'arrived_on_scene') {
                                    $updates['arrived_at'] = $dispatch->arrived_at ?? $eventTime;
                                } elseif ($status === 'completed') {
                                    $updates['completed_at'] = $dispatch->completed_at ?? $eventTime;
                                }

                                $dispatch->update($updates);

                                if (in_array($status, ['en_route', 'arrived_on_scene'])) {
                                    $dispatch->incident()?->update(['incident_status' => 'responding']);
                                } elseif (in_array($status, ['completed', 'cancelled'])) {
                                    $dispatch->incident()?->update([
                                        'incident_status' => $status === 'completed' ? 'resolved' : 'verified',
                                        'resolved_at' => $status === 'completed' ? ($dispatch->completed_at ?? now()) : null,
                                    ]);
                                    if ($dispatch->ambulance_id) {
                                        Ambulance::where('id', $dispatch->ambulance_id)->update(['status' => 'available']);
                                    }
                                }

                                try {
                                    broadcast(new DispatchStatusUpdated($dispatch));
                                } catch (\Throwable $e) {}

                                $results[] = ['operation_id' => $opId, 'status' => 'success', 'action' => $action];
                            }
                        }
                        break;

                    case 'CREATE_PATIENT':
                        $tempId = $payload['temp_id'] ?? $payload['tempId'] ?? null;
                        $patientCtrl = app(PatientController::class);
                        $patientReq = new Request($payload);
                        $patientReq->setUserResolver(fn () => $user);
                        $resp = $patientCtrl->store($patientReq);
                        $data = json_decode($resp->getContent(), true);
                        $realId = $data['data']['id'] ?? $data['patient_id'] ?? null;
                        if ($tempId && $realId) {
                            $idMappings[$tempId] = $realId;
                        }
                        $results[] = ['operation_id' => $opId, 'status' => 'success', 'temp_id' => $tempId, 'real_id' => $realId];
                        break;

                    case 'UPDATE_PCR':
                        if ($dispatch && $this->isUserAssignedToDispatch($user, $dispatch)) {
                            if (!empty($payload['patient_id']) && isset($idMappings[$payload['patient_id']])) {
                                $payload['patient_id'] = $idMappings[$payload['patient_id']];
                            }
                            $pcrCtrl = app(PatientCareRecordController::class);
                            $pcrReq = new Request($payload);
                            $pcrReq->setUserResolver(fn () => $user);
                            $resp = $pcrCtrl->update($pcrReq, $dispatch);
                            $results[] = ['operation_id' => $opId, 'status' => 'success', 'action' => $action];
                        }
                        break;

                    case 'SUBMIT_PCR':
                        if ($dispatch && $this->isUserAssignedToDispatch($user, $dispatch)) {
                            $pcrCtrl = app(PatientCareRecordController::class);
                            $pcrReq = new Request($payload);
                            $pcrReq->setUserResolver(fn () => $user);
                            $resp = $pcrCtrl->submit($pcrReq, $dispatch);
                            $results[] = ['operation_id' => $opId, 'status' => 'success', 'action' => $action];
                        }
                        break;

                    case 'LOCATION_BREADCRUMBS':
                        if ($dispatch && !empty($payload['locations']) && is_array($payload['locations'])) {
                            $lastLoc = end($payload['locations']);
                            if ($lastLoc && !empty($lastLoc['latitude']) && !empty($lastLoc['longitude'])) {
                                $dispatch->update([
                                    'last_latitude' => (float)$lastLoc['latitude'],
                                    'last_longitude' => (float)$lastLoc['longitude'],
                                    'last_heading' => isset($lastLoc['heading']) ? (float)$lastLoc['heading'] : null,
                                    'last_accuracy' => isset($lastLoc['accuracy']) ? (float)$lastLoc['accuracy'] : null,
                                    'last_location_updated_at' => now(),
                                ]);
                            }
                            $results[] = ['operation_id' => $opId, 'status' => 'success', 'action' => $action, 'count' => count($payload['locations'])];
                        }
                        break;

                    default:
                        $results[] = ['operation_id' => $opId, 'status' => 'skipped', 'message' => "Unknown action: {$action}"];
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("[syncBatch] Operation {$opId} ({$action}) failed: " . $e->getMessage());
                $results[] = ['operation_id' => $opId, 'status' => 'error', 'error' => $e->getMessage()];
            }
        }

        return response()->json([
            'success' => true,
            'processed' => count($results),
            'synced_count' => count(array_filter($results, fn($r) => ($r['status'] ?? '') === 'success')),
            'results' => $results,
            'id_mappings' => $idMappings,
        ]);
    }

    protected function isUserAssignedToDispatch($user, Dispatch $dispatch): bool
    {
        if (! $user) {
            return false;
        }

        if (in_array($user->role, ['admin', 'dispatcher'])) {
            return true;
        }

        if ((int) $dispatch->driver_id === (int) $user->id || (int) $dispatch->emt_id === (int) $user->id) {
            return true;
        }

        return $dispatch->crew()->where('users.id', $user->id)->exists();
    }
}
