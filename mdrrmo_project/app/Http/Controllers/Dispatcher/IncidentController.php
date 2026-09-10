<?php

namespace App\Http\Controllers\Dispatcher;

use App\Constants\EmergencyComplaints;
use App\Events\DispatchCompleted;
use App\Events\IncidentCreated;
use App\Events\IncidentVerified;
use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\LocationMarker;
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

        $query = Incident::with(['resident', 'incidentType', 'images'])->latest();

        if ($status === 'history') {
            $query->whereIn('incident_status', ['resolved', 'rejected']);
        } else {
            // Default to active
            $query->whereIn('incident_status', ['pending', 'verified', 'assigned', 'responding']);
        }

        $incidents = $query->paginate(15);

        // Fetch real emergency ambulances (exclude station walk-in placeholder)
        $ambulances = Ambulance::where('plate_number', '!=', 'WALK-IN')
            ->where('vehicle_type', '!=', 'Station')
            ->get();

        $responders = User::whereIn('role', ['responder', 'team_leader', 'emt', 'driver'])
            ->whereHas('responderProfile', function ($q) {
                $q->where('availability', 'available');
            })
            ->with('responderProfile')
            ->get();

        return Inertia::render('dispatcher/Incidents', [
            'incidents' => $incidents->items(),
            'incidentTypes' => IncidentType::all(),
            'chiefComplaints' => EmergencyComplaints::ALL,
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
        $incidents = Incident::with(['incidentType', 'images'])
            ->whereIn('incident_status', ['resolved', 'rejected'])
            ->get();

        return Inertia::render('dispatcher/IncidentHistoryMapView', [
            'incidents' => $incidents,
            'selectedIncidentId' => $request->query('incident_id'),
        ]);
    }

    public function verify(Request $request, Incident $incident)
    {
        $request->validate([
            'priority' => 'required|in:Critical,High,Moderate',
        ]);

        if ($incident->incident_status !== 'pending') {
            abort(403, 'Only pending incidents can be verified.');
        }

        $incident->update([
            'incident_status' => 'verified',
            'priority' => $request->priority,
            'verified_at' => now(),
            'verified_by' => $request->user()->id,
        ]);

        event(new IncidentVerified($incident));

        return redirect()->route('dispatcher.dispatches', ['incident_id' => $incident->id]);
    }

    public function reject(Request $request, Incident $incident)
    {
        if (! in_array($incident->incident_status, ['pending', 'verified'])) {
            abort(403, 'Only pending or verified incidents can be rejected.');
        }

        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $incident->update([
            'incident_status' => 'rejected',
            'resolved_at' => now(),
            'rejection_reason' => $request->rejection_reason,
            'verified_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Incident rejected successfully.');
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

        $marker = LocationMarker::where('code', $code)
            ->where('is_active', true)
            ->first();

        if (! $marker) {
            return response()->json([
                'message' => 'Location code not found. Please verify the code with the caller.',
            ], 404);
        }

        return response()->json([
            'data' => $marker,
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

        if (! $resident && ! $previousIncident) {
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
        if ($previousIncident?->location_code) {
            $marker = LocationMarker::where('code', $previousIncident->location_code)
                ->where('is_active', true)
                ->first();

            $previousLocation = [
                'code' => $previousIncident->location_code,
                'marker_name' => $marker?->marker_name ?? $previousIncident->place_of_incident,
                'barangay' => $marker?->barangay,
                'description' => $marker?->description,
                'latitude' => $marker?->latitude ?? (float) $previousIncident->incident_latitude,
                'longitude' => $marker?->longitude ?? (float) $previousIncident->incident_longitude,
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

        foreach ($residents as $resident) {
            $normalized = $this->normalizePhilippinePhoneNumber($resident->phone_number) ?? $resident->phone_number;
            $results->put($normalized, [
                'phone_number' => $resident->phone_number,
                'normalized_phone' => $normalized,
                'caller_name' => trim("{$resident->first_name} {$resident->last_name}"),
                'is_registered_resident' => true,
                'barangay' => $resident->residentProfile?->barangay?->barangay_name,
                'total_calls' => 0,
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
            ->select('caller_phone_number', 'location_code', 'place_of_incident')
            ->latest('id')
            ->take(15)
            ->get();

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
        $request->validate([
            'caller_phone_number' => 'required|string',
            'incident_type_id' => 'required|exists:incident_types,id',
            'chief_complaint' => 'nullable|string|max:255',
            'location_method' => 'nullable|string|in:location_code,pinpoint',
            'location_code' => 'nullable|string',
            'place_of_incident' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'location_confirmed' => 'required|boolean',
            'description' => 'nullable|string|max:2000',
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
            $marker = LocationMarker::where('code', $code)
                ->where('is_active', true)
                ->first();

            if (! $marker) {
                throw ValidationException::withMessages([
                    'location_code' => 'Location code not found. Please verify the code with the caller.',
                ]);
            }

            $placeOfIncident = "{$marker->marker_name}, Barangay {$marker->barangay}";
            if ($marker->description) {
                $placeOfIncident .= " ({$marker->description})";
            }
            $latitude = (float) $marker->latitude;
            $longitude = (float) $marker->longitude;
            $locationSource = 'location_code';
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

        $incident = Incident::create([
            'resident_id' => $residentId,
            'caller_phone_number' => $normalizedPhone,
            'incident_type_id' => $request->incident_type_id,
            'chief_complaint' => $request->chief_complaint,
            'location_code' => $code,
            'place_of_incident' => $placeOfIncident,
            'incident_address' => $incidentAddress,
            'incident_latitude' => $latitude,
            'incident_longitude' => $longitude,
            'reporter_latitude' => $latitude,
            'reporter_longitude' => $longitude,
            'location_source' => $locationSource,
            'description' => $request->description ?: "Reported via Phone/SIM Call from {$normalizedPhone} at {$placeOfIncident}",
            'incident_status' => 'pending',
            'priority' => 'Moderate',
            'reported_at' => now(),
            'report_source' => 'dispatcher',
        ]);

        $incident->load(['incidentType', 'resident']);

        broadcast(new IncidentCreated($incident));

        return back()->with('success', 'Phone/SIM emergency call incident created successfully.');
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
