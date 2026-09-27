<?php

namespace App\Http\Controllers\Dispatcher;

use App\Constants\EmergencyComplaints;
use App\Events\DispatchCompleted;
use App\Events\IncidentCreated;
use App\Events\IncidentRejected;
use App\Events\IncidentVerified;
use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\LocationCode;
use App\Models\LocationMarker;
use App\Models\PatientCareRecord;
use App\Models\ResponderProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class IncidentController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'active');

        $query = Incident::with([
            'resident.residentProfile.barangay', 
            'incidentType', 
            'images', 
            'dispatches.patientCareRecord',
            'dispatches.ambulance',
            'dispatches.driver',
            'dispatches.crew'
        ])->latest();

        $allHistoryIncidents = [];
        $pcrChiefComplaints = [];
        $barangayGeojson = null;

        if ($status === 'history') {
            $query->whereIn('incident_status', ['resolved', 'rejected']);

            if ($request->filled('is_prank')) {
                $query->where('is_prank', $request->boolean('is_prank'));
            }

            if ($request->filled('rejection_category')) {
                $query->where('rejection_category', $request->query('rejection_category'));
            }

            $allHistoryIncidents = (clone $query)->get();

            $pcrChiefComplaints = PatientCareRecord::whereNotNull('clinical_chief_complaint')
                ->where('clinical_chief_complaint', '!=', '')
                ->distinct()
                ->pluck('clinical_chief_complaint')
                ->sort()
                ->values()
                ->all();

            $geojsonPath = resource_path('data/opol_barangays.json');
            if (file_exists($geojsonPath)) {
                $barangayGeojson = json_decode(file_get_contents($geojsonPath), true);
            }
        } else {
            // Default to active
            $query->whereIn('incident_status', ['pending', 'verified', 'assigned', 'responding']);
        }

        $incidents = $query->paginate(15);

        // Compute prank counts in batch without N+1 queries
        $residentPranks = Incident::where('is_prank', true)
            ->whereNotNull('resident_id')
            ->select('resident_id', DB::raw('count(*) as prank_count'))
            ->groupBy('resident_id')
            ->pluck('prank_count', 'resident_id');

        $phonePranks = Incident::where('is_prank', true)
            ->whereNotNull('caller_phone_number')
            ->select('caller_phone_number', DB::raw('count(*) as prank_count'))
            ->groupBy('caller_phone_number')
            ->pluck('prank_count', 'caller_phone_number');

        $incidents->getCollection()->transform(function ($inc) use ($residentPranks, $phonePranks) {
            $count = 0;
            if ($inc->resident_id && isset($residentPranks[$inc->resident_id])) {
                $count = max($count, (int) $residentPranks[$inc->resident_id]);
            }
            if ($inc->caller_phone_number && isset($phonePranks[$inc->caller_phone_number])) {
                $count = max($count, (int) $phonePranks[$inc->caller_phone_number]);
            }
            $inc->reporter_prank_count = $count;
            return $inc;
        });

        // Fetch real emergency ambulances (exclude station walk-in placeholder)
        $ambulances = Ambulance::where('plate_number', '!=', 'WALK-IN')
            ->where('vehicle_type', '!=', 'Station')
            ->get();

        $responders = User::where('role', 'responder')
            ->with('responderProfile')
            ->get();

        return Inertia::render('dispatcher/Incidents', [
            'incidents' => $incidents->items(),
            'allHistoryIncidents' => $allHistoryIncidents,
            'incidentTypes' => IncidentType::all(),
            'chiefComplaints' => EmergencyComplaints::ALL,
            'pcrChiefComplaints' => $pcrChiefComplaints,
            'opolBarangays' => Incident::OPOL_BARANGAYS,
            'barangayGeojson' => $barangayGeojson,
            'statusFilter' => $status,
            'ambulances' => $ambulances,
            'responders' => $responders,
            'pagination' => [
                'current_page' => $incidents->currentPage(),
                'last_page' => $incidents->lastPage(),
                'per_page' => $incidents->perPage(),
                'total' => $incidents->total(),
            ],
        ]);
    }

    public function map(Request $request)
    {
        $incidents = Incident::with([
            'resident.residentProfile.barangay', 
            'incidentType', 
            'images', 
            'dispatches.patientCareRecord',
            'dispatches.ambulance',
            'dispatches.driver',
            'dispatches.crew'
        ])
            ->whereIn('incident_status', ['resolved', 'rejected'])
            ->get();

        $pcrChiefComplaints = PatientCareRecord::whereNotNull('clinical_chief_complaint')
            ->where('clinical_chief_complaint', '!=', '')
            ->distinct()
            ->pluck('clinical_chief_complaint')
            ->sort()
            ->values()
            ->all();

        $geojsonPath = resource_path('data/opol_barangays.json');
        $barangayGeojson = file_exists($geojsonPath) ? json_decode(file_get_contents($geojsonPath), true) : null;

        return Inertia::render('dispatcher/IncidentHistoryMapView', [
            'incidents' => $incidents,
            'selectedIncidentId' => $request->query('incident_id'),
            'opolBarangays' => Incident::OPOL_BARANGAYS,
            'pcrChiefComplaints' => $pcrChiefComplaints,
            'barangayGeojson' => $barangayGeojson,
        ]);
    }

    public function verify(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'priority' => 'nullable|in:Critical,High,Moderate',
        ]);

        if ($incident->incident_status !== 'pending') {
            abort(403, 'Only pending incidents can be verified.');
        }

        $priority = $validated['priority'] ?? $request->input('priority') ?? $incident->priority ?? 'Moderate';

        $incident->update([
            'incident_status' => 'verified',
            'priority' => $priority,
            'verified_at' => now(),
            'verified_by' => $request->user()?->id,
        ]);

        $incident->loadMissing(['incidentType', 'resident']);

        try {
            event(new IncidentVerified($incident));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to broadcast IncidentVerified: ' . $e->getMessage());
        }

        try {
            \App\Services\PushNotificationService::notifyIncidentVerified($incident);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to push notification for IncidentVerified: ' . $e->getMessage());
        }

        return redirect()->route('dispatcher.dispatches', ['incident_id' => $incident->id]);
    }

    public function reject(Request $request, Incident $incident)
    {
        if (! in_array($incident->incident_status, ['pending', 'verified', 'assigned', 'responding'])) {
            abort(403, 'This incident cannot be rejected in its current status.');
        }

        $request->validate([
            'rejection_reason' => 'required|string|max:500',
            'rejection_category' => 'nullable|string|in:prank,false_alarm,duplicate,out_of_jurisdiction,test_drill,other',
        ]);

        $category = $request->input('rejection_category', 'other');
        $isPrank = ($category === 'prank');

        DB::transaction(function () use ($incident, $request, $category, $isPrank) {
            // Cancel any active dispatches and release responders/ambulances
            foreach ($incident->dispatches()->whereNotIn('dispatch_status', ['completed', 'cancelled'])->get() as $dispatch) {
                $dispatch->update([
                    'dispatch_status' => 'cancelled',
                    'completed_at' => now(),
                ]);

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

                $dispatch->load(['incident', 'ambulance']);
                try {
                    broadcast(new DispatchStatusUpdated($dispatch));
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to broadcast DispatchStatusUpdated: '.$e->getMessage());
                }
            }

            $incident->update([
                'incident_status' => 'rejected',
                'resolved_at' => now(),
                'rejection_reason' => $request->rejection_reason,
                'rejection_category' => $category,
                'is_prank' => $isPrank,
                'verified_by' => $request->user()->id,
            ]);
        });

        event(new IncidentRejected($incident));
        \App\Services\PushNotificationService::notifyIncidentRejected($incident);

        return back()->with('success', 'Incident rejected and any active dispatches cancelled.');
    }

    public function resolve(Request $request, Incident $incident)
    {
        $returnNotes = [];

        DB::transaction(function () use ($incident, &$returnNotes) {
            $incident->update([
                'incident_status' => 'resolved',
                'resolved_at' => now(),
            ]);

            foreach ($incident->dispatches()->whereNotIn('dispatch_status', ['completed', 'cancelled'])->get() as $dispatch) {
                $dispatch->update([
                    'dispatch_status' => 'completed',
                    'completed_at' => now(),
                ]);

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
                    $returnNotes[] = "Reliever {$reliever->first_name} {$reliever->last_name} has returned to the Reliever Pool.";
                }

                broadcast(new DispatchCompleted($dispatch));
            }
        });

        $message = 'Incident marked as resolved.';
        if (! empty($returnNotes)) {
            $message = 'Mission completed. '.implode(' ', $returnNotes);
        }

        return back()->with('success', $message);
    }

    public function lookupLocationMarker(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $code = trim(strtoupper($request->query('code')));

        // 1. Check primary location_codes table
        $loc = LocationCode::with('barangay')->where('location_code', $code)->first();

        if ($loc) {
            return response()->json([
                'data' => [
                    'id' => $loc->id,
                    'code' => $loc->location_code,
                    'location_code' => $loc->location_code,
                    'marker_name' => $loc->location_name,
                    'location_name' => $loc->location_name,
                    'location_type' => $loc->location_type,
                    'barangay' => $loc->barangay?->barangay_name ?? '',
                    'latitude' => (float) $loc->latitude,
                    'longitude' => (float) $loc->longitude,
                    'description' => $loc->description,
                ],
            ]);
        }

        // 2. Fallback to location_markers for legacy data / tests
        $marker = LocationMarker::where('code', $code)
            ->where('is_active', true)
            ->first();

        if ($marker) {
            return response()->json([
                'data' => [
                    'id' => $marker->id,
                    'code' => $marker->code,
                    'location_code' => $marker->code,
                    'marker_name' => $marker->marker_name,
                    'location_name' => $marker->marker_name,
                    'location_type' => 'Landmark',
                    'barangay' => $marker->barangay,
                    'latitude' => (float) $marker->latitude,
                    'longitude' => (float) $marker->longitude,
                    'description' => $marker->description,
                ],
            ]);
        }

        return response()->json([
            'message' => 'Location code not found. Please verify the code with the caller.',
        ], 404);
    }

    /**
     * Search location codes across code, name, type, and barangay.
     */
    public function searchLocationCodes(Request $request)
    {
        $q = trim($request->query('q', ''));
        $barangay = trim($request->query('barangay', ''));

        $query = LocationCode::with('barangay');

        if ($barangay !== '') {
            $query->whereHas('barangay', function ($b) use ($barangay) {
                $b->where('barangay_name', 'like', "%{$barangay}%");
            });
        }

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('location_code', 'like', "%{$q}%")
                    ->orWhere('location_name', 'like', "%{$q}%")
                    ->orWhere('location_type', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhereHas('barangay', function ($b) use ($q) {
                        $b->where('barangay_name', 'like', "%{$q}%");
                    });
            });
        }

        $records = $query->get()->map(function ($loc) {
            return [
                'id' => $loc->id,
                'location_code' => $loc->location_code,
                'code' => $loc->location_code,
                'location_type' => $loc->location_type,
                'location_name' => $loc->location_name,
                'marker_name' => $loc->location_name,
                'barangay' => $loc->barangay?->barangay_name ?? '',
                'description' => $loc->description,
                'latitude' => (float) $loc->latitude,
                'longitude' => (float) $loc->longitude,
            ];
        });

        // If a specific query was entered, rank exact matches or starts-with matches higher
        if ($q !== '') {
            $upperQ = strtoupper($q);
            $records = $records->sortByDesc(function ($item) use ($upperQ) {
                if (strtoupper($item['location_code']) === $upperQ) {
                    return 100;
                }
                if (str_starts_with(strtoupper($item['location_code']), $upperQ)) {
                    return 80;
                }
                if (str_contains(strtoupper($item['location_name']), $upperQ)) {
                    return 60;
                }
                return 10;
            })->values();
        }

        return response()->json([
            'data' => $records->take(30),
        ]);
    }

    public function lookupCaller(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
        ]);

        $normalizedPhone = $this->normalizePhilippinePhoneNumber($request->query('phone'));
        if (! $normalizedPhone) {
            return response()->json([
                'recognized' => false,
                'message' => 'Invalid Philippine mobile number format.',
            ], 422);
        }

        // 1. Check if caller matches a registered resident
        $resident = User::where('role', 'resident')
            ->with(['residentProfile.barangay'])
            ->where(function ($q) use ($normalizedPhone) {
                $q->where('phone_number', $normalizedPhone)
                    ->orWhere('phone_number', '0'.substr($normalizedPhone, 3));
            })
            ->first();

        // 2. Find any previous incident(s) from this phone number or resident
        $previousIncident = Incident::where(function ($q) use ($normalizedPhone, $resident) {
            $q->where('caller_phone_number', $normalizedPhone);
            if ($resident) {
                $q->orWhere('resident_id', $resident->id);
            }
        })
            ->latest('id')
            ->first();

        $totalCalls = Incident::where(function ($q) use ($normalizedPhone, $resident) {
            $q->where('caller_phone_number', $normalizedPhone);
            if ($resident) {
                $q->orWhere('resident_id', $resident->id);
            }
        })
            ->count();

        $prankHistory = Incident::getPrankHistoryForReporter($resident?->id, $normalizedPhone);

        if (! $resident && ! $previousIncident && ! $prankHistory['has_prank_history']) {
            return response()->json([
                'recognized' => false,
                'data' => null,
            ]);
        }

        // 3. Build resident address if available
        $residentAddress = null;
        if ($resident?->residentProfile) {
            $rp = $resident->residentProfile;
            $parts = array_filter([
                $rp->house_no,
                $rp->street,
                $rp->barangay ? "Barangay {$rp->barangay->barangay_name}" : null,
            ]);
            $residentAddress = ! empty($parts) ? implode(', ', $parts) : null;
        }

        // 4. Build previous location suggestion
        $previousLocation = null;
        if ($previousIncident?->location_code_id || $previousIncident?->location_code) {
            $loc = $previousIncident->locationCode ?: LocationCode::with('barangay')->find($previousIncident->location_code_id);
            $locCodeString = $loc?->location_code ?? $previousIncident->location_code;
            $marker = $loc ? null : ($locCodeString ? LocationMarker::where('code', $locCodeString)->where('is_active', true)->first() : null);

            $previousLocation = [
                'code' => $locCodeString,
                'marker_name' => $loc?->location_name ?? $marker?->marker_name ?? $previousIncident->place_of_incident,
                'barangay' => $loc?->barangay?->barangay_name ?? $marker?->barangay,
                'description' => $loc?->description ?? $marker?->description,
                'latitude' => $loc?->latitude ?? $marker?->latitude ?? (float) $previousIncident->incident_latitude,
                'longitude' => $loc?->longitude ?? $marker?->longitude ?? (float) $previousIncident->incident_longitude,
                'last_reported_at' => $previousIncident->reported_at?->diffForHumans() ?? $previousIncident->created_at?->diffForHumans(),
            ];
        }

        return response()->json([
            'recognized' => true,
            'data' => [
                'phone_number' => $normalizedPhone,
                'caller_name' => $resident ? trim("{$resident->first_name} {$resident->last_name}") : null,
                'is_registered_resident' => (bool) $resident,
                'resident_address' => $residentAddress,
                'resident_barangay' => $resident?->residentProfile?->barangay?->barangay_name,
                'total_calls' => $totalCalls,
                'previous_incident_id' => $previousIncident?->id,
                'previous_location' => $previousLocation,
                'has_prank_history' => $prankHistory['has_prank_history'],
                'prank_count' => $prankHistory['prank_count'],
                'latest_prank' => $prankHistory['latest_prank'],
            ],
        ]);
    }

    public function searchCallerPhoneNumbers(Request $request)
    {
        $query = trim($request->query('q', ''));
        if (strlen($query) < 2) {
            return response()->json(['data' => []]);
        }

        $digits = preg_replace('/\D/', '', $query);
        $coreDigits = $digits;
        if (str_starts_with($coreDigits, '63')) {
            $coreDigits = substr($coreDigits, 2);
        } elseif (str_starts_with($coreDigits, '0')) {
            $coreDigits = substr($coreDigits, 1);
        }

        $results = collect();

        // 1. Search registered residents by phone number or name
        $residents = User::where('role', 'resident')
            ->whereNotNull('phone_number')
            ->where(function ($q) use ($digits, $coreDigits, $query) {
                if (! empty($coreDigits)) {
                    $q->where('phone_number', 'LIKE', "%{$coreDigits}%");
                }
                if (! empty($digits)) {
                    $q->orWhere('phone_number', 'LIKE', "%{$digits}%");
                }
                $q->orWhere('first_name', 'LIKE', "%{$query}%")
                    ->orWhere('last_name', 'LIKE', "%{$query}%");
            })
            ->with(['residentProfile.barangay'])
            ->take(6)
            ->get();

        $residentIds = $residents->pluck('id')->toArray();
        $residentPrankCounts = Incident::where('is_prank', true)
            ->whereIn('resident_id', $residentIds)
            ->select('resident_id', DB::raw('count(*) as prank_count'))
            ->groupBy('resident_id')
            ->pluck('prank_count', 'resident_id');

        foreach ($residents as $resident) {
            $normalized = $this->normalizePhilippinePhoneNumber($resident->phone_number) ?? $resident->phone_number;
            $results->put($normalized, [
                'phone_number' => $resident->phone_number,
                'normalized_phone' => $normalized,
                'caller_name' => trim("{$resident->first_name} {$resident->last_name}"),
                'is_registered_resident' => true,
                'barangay' => $resident->residentProfile?->barangay?->barangay_name,
                'total_calls' => 0,
                'prank_count' => (int) ($residentPrankCounts[$resident->id] ?? 0),
                'previous_location_code' => null,
            ]);
        }

        // 2. Search recent incidents with phone numbers
        $incidentsQuery = Incident::whereNotNull('caller_phone_number');
        if (! empty($coreDigits)) {
            $incidentsQuery->where('caller_phone_number', 'LIKE', "%{$coreDigits}%");
        } elseif (! empty($digits)) {
            $incidentsQuery->where('caller_phone_number', 'LIKE', "%{$digits}%");
        }

        $recentPhoneIncidents = $incidentsQuery
            ->with('locationCode')
            ->select('id', 'caller_phone_number', 'location_code_id', 'incident_address')
            ->latest('id')
            ->take(15)
            ->get();

        $phoneNumbers = $recentPhoneIncidents->pluck('caller_phone_number')->unique()->toArray();
        $phonePrankCounts = Incident::where('is_prank', true)
            ->whereIn('caller_phone_number', $phoneNumbers)
            ->select('caller_phone_number', DB::raw('count(*) as prank_count'))
            ->groupBy('caller_phone_number')
            ->pluck('prank_count', 'caller_phone_number');

        foreach ($recentPhoneIncidents as $inc) {
            $normalized = $inc->caller_phone_number;
            if ($results->has($normalized)) {
                $item = $results->get($normalized);
                $item['total_calls'] = ($item['total_calls'] ?? 0) + 1;
                if (empty($item['previous_location_code']) && ! empty($inc->location_code)) {
                    $item['previous_location_code'] = $inc->location_code;
                }
                $results->put($normalized, $item);
            } else {
                $results->put($normalized, [
                    'phone_number' => $normalized,
                    'normalized_phone' => $normalized,
                    'caller_name' => null,
                    'is_registered_resident' => false,
                    'barangay' => null,
                    'total_calls' => 1,
                    'prank_count' => (int) ($phonePrankCounts[$normalized] ?? 0),
                    'previous_location_code' => $inc->location_code,
                ]);
            }
        }

        return response()->json([
            'data' => $results->values()->take(8),
        ]);
    }

    public function storePhoneCall(Request $request)
    {
        if ($request->input('location_method') === 'code') {
            $request->merge(['location_method' => 'location_code']);
        }

        $request->validate([
            'caller_name' => 'nullable|string|max:255',
            'caller_phone_number' => 'required|string',
            'incident_type_id' => 'required|exists:incident_types,id',
            'chief_complaint' => 'nullable|string',
            'location_method' => 'nullable|string',
            'location_code' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'place_of_incident' => 'nullable|string',
            'location_confirmed' => 'required|boolean',
            'description' => 'nullable|string|max:2000',
            'dispatch_log_id' => 'nullable|exists:dispatch_logs,id',
        ]);

        if (! $request->boolean('location_confirmed')) {
            throw ValidationException::withMessages([
                'location_confirmed' => 'Please confirm the incident location before creating the incident.',
            ]);
        }

        $normalizedPhone = $this->normalizePhilippinePhoneNumber($request->caller_phone_number);
        if (! $normalizedPhone) {
            throw ValidationException::withMessages([
                'caller_phone_number' => 'Please enter a valid Philippine mobile number.',
            ]);
        }

        $locationMethod = $request->input('location_method', 'location_code');
        if ($locationMethod === 'code') {
            $locationMethod = 'location_code';
        }

        if ($locationMethod === 'pinpoint' || ($request->filled('latitude') && $request->filled('longitude') && ! $request->filled('location_code'))) {
            if (! $request->filled('latitude') || ! $request->filled('longitude')) {
                throw ValidationException::withMessages([
                    'location_pinpoint' => 'Please select and pinpoint an incident location on the map.',
                ]);
            }

            $latitude = (float) $request->latitude;
            $longitude = (float) $request->longitude;
            $code = $request->filled('location_code') ? trim(strtoupper($request->location_code)) : null;
            $placeOfIncident = $request->place_of_incident ?: "Pinpointed Location ({$latitude}, {$longitude})";
            $locationSource = 'search_pinpoint';
        } else {
            if (! $request->filled('location_code')) {
                throw ValidationException::withMessages([
                    'location_code' => 'Please enter a location code.',
                ]);
            }

            $code = trim(strtoupper($request->location_code));
            $loc = LocationCode::with('barangay')
                ->where('location_code', $code)
                ->orWhere('location_code', strtoupper($code))
                ->orWhere('location_code', strtolower($code))
                ->first();

            if ($loc) {
                $locationCodeId = $loc->id;
                $bName = $loc->barangay?->barangay_name ?? '';
                $placeOfIncident = "{$loc->location_name}, Barangay {$bName}";
                if ($loc->description) {
                    $placeOfIncident .= " ({$loc->description})";
                }
                $latitude = (float) $loc->latitude;
                $longitude = (float) $loc->longitude;
                $locationSource = 'location_code';
            } else {
                $marker = LocationMarker::where('code', $code)
                    ->where('is_active', true)
                    ->first();

                if ($marker) {
                    $locFromMarker = LocationCode::where('location_code', $marker->code)->first();
                    $locationCodeId = $locFromMarker?->id;
                    $placeOfIncident = "{$marker->marker_name}, Barangay {$marker->barangay}";
                    if ($marker->description) {
                        $placeOfIncident .= " ({$marker->description})";
                    }
                    $latitude = (float) $marker->latitude;
                    $longitude = (float) $marker->longitude;
                    $locationSource = 'location_code';
                } elseif ($request->filled('latitude') && $request->filled('longitude')) {
                    $latitude = (float) $request->latitude;
                    $longitude = (float) $request->longitude;
                    $placeOfIncident = $request->place_of_incident ?: "Location Code {$code}";
                    $locationSource = 'location_code';
                } else {
                    throw ValidationException::withMessages([
                        'location_code' => 'Location code not found. Please verify the code with the caller.',
                    ]);
                }
            }
        }

        // Check if there is an existing resident account with this phone number
        $resident = User::where('role', 'resident')
            ->with(['residentProfile.barangay'])
            ->where(function ($q) use ($normalizedPhone) {
                $q->where('phone_number', $normalizedPhone)
                    ->orWhere('phone_number', '0'.substr($normalizedPhone, 3));
            })
            ->first();

        $residentId = $resident?->id;
        $incidentAddress = null;
        if ($resident?->residentProfile) {
            $rp = $resident->residentProfile;
            $parts = array_filter([
                $rp->house_no,
                $rp->street,
                $rp->barangay ? "Barangay {$rp->barangay->barangay_name}" : null,
            ]);
            $incidentAddress = ! empty($parts) ? implode(', ', $parts) : null;
        }

        $callerName = $request->filled('caller_name')
            ? trim($request->caller_name)
            : ($resident ? trim($resident->first_name.' '.$resident->last_name) : null);

        $incident = Incident::create([
            'resident_id' => $residentId,
            'caller_phone_number' => $normalizedPhone,
            'caller_name' => $callerName,
            'incident_type_id' => $request->incident_type_id,
            'location_code_id' => $locationCodeId ?? null,
            'incident_address' => ($placeOfIncident && $incidentAddress && $placeOfIncident !== $incidentAddress)
                ? "{$placeOfIncident}, {$incidentAddress}"
                : ($incidentAddress ?: $placeOfIncident),
            'incident_latitude' => $latitude,
            'incident_longitude' => $longitude,
            'reporter_latitude' => $latitude,
            'reporter_longitude' => $longitude,
            'location_source' => $locationSource,
            'incident_description' => ($request->chief_complaint || $request->reported_chief_complaint)
                ? (($request->description || $request->incident_description)
                    ? "[".($request->chief_complaint ?? $request->reported_chief_complaint)."] ".($request->description ?? $request->incident_description)
                    : "[".($request->chief_complaint ?? $request->reported_chief_complaint)."]")
                : ($request->incident_description ?? $request->description ?: "Reported via Phone/SIM Call from ".($callerName ? "{$callerName} ({$normalizedPhone})" : $normalizedPhone)." at {$placeOfIncident}"),
            'incident_status' => 'verified',
            'priority' => 'Moderate',
            'reported_at' => now(),
            'verified_at' => now(),
            'verified_by' => $request->user()?->id,
            'report_source' => 'phone_sim',
        ]);

        $incident->load(['incidentType', 'resident.residentProfile.barangay']);
        $incident->reporter_prank_history = Incident::getPrankHistoryForReporter($residentId, $normalizedPhone);

        // Dispatch Log -> Incident Linkage Workflow
        if ($request->filled('dispatch_log_id')) {
            $originatingDispatchLog = \App\Models\DispatchLog::find($request->dispatch_log_id);
            if ($originatingDispatchLog) {
                $originatingDispatchLog->update([
                    'incident_id' => $incident->id,
                    'call_status' => 'answered',
                ]);
            }
        }

        // Record in Admin Dispatch Logs
        try {
            $action = \App\Models\DispatchLogAction::firstOrCreate(
                ['name' => 'Phone/SIM Incident Created'],
                ['is_system_action' => false]
            );
            \App\Models\DispatchLog::create([
                'incident_id' => $incident->id,
                'user_id' => $request->user()?->id,
                'action_id' => $action->id,
                'previous_status' => null,
                'new_status' => 'verified',
                'remarks' => 'Phone/SIM emergency call received and automatically verified by Dispatcher. Ready for dispatch.',
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to record dispatch log for Phone/SIM incident: ' . $e->getMessage());
        }

        // Broadcast IncidentVerified to Dispatcher Web and Responders (do NOT broadcast IncidentCreated to prevent incoming alarm)
        try {
            broadcast(new IncidentVerified($incident));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to broadcast IncidentVerified: ' . $e->getMessage());
        }

        // Send light push notification to available Responders mobile app
        try {
            \App\Services\PushNotificationService::notifyRespondersNewVerifiedIncident($incident);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to send push notification to responders: ' . $e->getMessage());
        }

        return back()->with('success', 'Phone/SIM emergency call incident created and automatically verified.');
    }

    protected function normalizePhilippinePhoneNumber(string $phone): ?string
    {
        $cleaned = preg_replace('/[\s\-\(\)]+/', '', $phone);

        if (preg_match('/^\+639\d{9}$/', $cleaned)) {
            return $cleaned;
        }

        if (preg_match('/^639\d{9}$/', $cleaned)) {
            return '+'.$cleaned;
        }

        if (preg_match('/^09\d{9}$/', $cleaned)) {
            return '+63'.substr($cleaned, 1);
        }

        return null;
    }
}
