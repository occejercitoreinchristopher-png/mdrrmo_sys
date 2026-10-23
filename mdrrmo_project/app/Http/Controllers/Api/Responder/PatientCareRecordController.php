<?php

namespace App\Http\Controllers\Api\Responder;

use App\Events\DispatchCompleted;
use App\Events\PatientCareRecordSubmitted;
use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\ResponderProfile;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PatientCareRecordController extends Controller
{
    public function update(Request $request, Dispatch $dispatch)
    {
        $user = $request->user();
        if (! $this->isUserAssignedToDispatch($user, $dispatch)) {
            return response()->json(['message' => 'Unauthorized to update PCR for this dispatch.'], 403);
        }

        $timeFields = ['dispatch_time', 'en_route_time', 'on_scene_time', 'transport_time', 'arrived_hf_time', 'departed_hf_time'];
        foreach ($timeFields as $field) {
            if ($request->has($field)) {
                $raw = $request->input($field);
                if (empty($raw) || trim($raw) === '') {
                    $request->merge([$field => null]);
                } else {
                    try {
                        $parsed = Carbon::parse(trim($raw))->format('H:i');
                        $request->merge([$field => $parsed]);
                    } catch (\Throwable $e) {
                        // Keep raw if unparseable so validation rules handle it
                    }
                }
            }
        }

        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'contact_number' => 'nullable|string',
            'gender' => 'nullable|string|in:male,female',
            'age' => 'nullable|string|max:20',
            'incident_address' => 'nullable|string',

            // Step 2: Incident Details
            'nature_of_call' => 'nullable|string',
            'chief_complaint' => 'nullable|string',
            'place_of_incident' => 'nullable|string',
            'civil_status' => 'nullable|string',

            // Step 3: Vital Signs (JSON)
            'vital_signs' => 'nullable|array',

            // Step 4: Assessment
            'assessment' => 'nullable|array',
            'assessment_markers' => 'nullable|array',
            'glasgow_coma_scale' => 'nullable|array',

            // Step 5: Times
            'dispatch_time' => 'nullable|date_format:H:i',
            'en_route_time' => 'nullable|date_format:H:i',
            'on_scene_time' => 'nullable|date_format:H:i',
            'transport_time' => 'nullable|date_format:H:i',
            'arrived_hf_time' => 'nullable|date_format:H:i',
            'departed_hf_time' => 'nullable|date_format:H:i',

            // Step 6: Transport
            'transported' => 'nullable|boolean',
            'transported_to' => 'nullable|string',
            'received_by' => 'nullable|string',

            // Step 7: Disposition
            'disposition' => 'nullable|array',
            'special_instructions' => 'nullable|string',

            // Step 8: Signatures
            'patient_signature' => 'nullable|string',
            'witness_name' => 'nullable|string',
            'witness_signature' => 'nullable|string',
            'waiver_signature' => 'nullable|string',
        ]);

        $pcrData = collect($validated)->except([
            'age', 
            'incident_address', 
            'gender',
            'dispatch_time',
            'en_route_time',
            'on_scene_time',
        ])->all();

        // Cross-sync patient_signature and waiver_signature if either is populated
        if (!empty($validated['waiver_signature']) && empty($pcrData['patient_signature'])) {
            $pcrData['patient_signature'] = $validated['waiver_signature'];
        }
        if (!empty($validated['patient_signature']) && empty($pcrData['waiver_signature'])) {
            $pcrData['waiver_signature'] = $validated['patient_signature'];
        }

        if (isset($pcrData['waiver_signature']) || isset($pcrData['patient_signature'])) {
            $sig = $pcrData['waiver_signature'] ?? $pcrData['patient_signature'] ?? '';
            $pcrData['waiver_signed'] = !empty($sig) && $sig !== 'UNABLE_TO_SIGN';
        }

        $pcr = $dispatch->patientCareRecord()->updateOrCreate(
            ['dispatch_id' => $dispatch->id],
            $pcrData
        );

        // Keep master Patient record synchronized with latest known demographics
        $patient = \App\Models\Patient::find($validated['patient_id']);
        if ($patient) {
            $patientUpdates = [];
            if (! empty($validated['gender']) && in_array($validated['gender'], ['male', 'female'])) {
                $patientUpdates['gender'] = $validated['gender'];
                // If patient is unidentified, keep their label in sync with their gender (Unknown Male / Unknown Female)
                if ($patient->is_unidentified && in_array($patient->patient_first_name, ['Unknown', 'Unidentified'])) {
                    $patientUpdates['patient_last_name'] = $validated['gender'] === 'male' ? 'Male' : 'Female';
                }
            }
            if (! empty($validated['incident_address'])) {
                $newAddress = trim($validated['incident_address']);
                $currentAddress = trim($patient->street ?? '');
                if (empty($currentAddress) || $newAddress !== $currentAddress) {
                    $patientUpdates['street'] = $newAddress;
                }
            }
            if (! empty($validated['age']) && empty($patient->birthdate)) {
                $rawAge = trim((string) $validated['age']);
                if (str_contains($rawAge, '-')) {
                    $parts = explode('-', $rawAge);
                    $minAge = (int) ($parts[0] ?? 25);
                    $maxAge = (int) ($parts[1] ?? 30);
                    $midAge = (int) round(($minAge + $maxAge) / 2);
                } else {
                    $midAge = (int) $rawAge;
                }
                if ($midAge > 0 && $midAge <= 120) {
                    $patientUpdates['birthdate'] = now()->subYears($midAge)->format('Y-01-01');
                }
            }
            if (! empty($patientUpdates)) {
                $patient->update($patientUpdates);
            }
        }

        // Broadcast to other crew members on the same dispatch
        // broadcast(new PatientCareRecordUpdatedEvent($pcr))->toOthers();

        return response()->json(['message' => 'PCR updated', 'data' => $pcr->load('patient')]);
    }

    public function submit(Request $request, Dispatch $dispatch)
    {
        $user = $request->user();
        if (! $this->isUserAssignedToDispatch($user, $dispatch)) {
            return response()->json(['message' => 'Unauthorized to submit PCR for this dispatch.'], 403);
        }

        $pcr = $dispatch->patientCareRecord;
        if (! $pcr) {
            return response()->json(['message' => 'No PCR found'], 404);
        }

        // Idempotency check: If already completed, return successful response
        if ($dispatch->dispatch_status === 'completed') {
            return response()->json([
                'message' => 'PCR Submitted and Dispatch Completed',
                'data' => $pcr,
                'already_processed' => true,
            ]);
        }

        if (! in_array($dispatch->dispatch_status, ['arrived_on_scene', 'completed'])) {
            return response()->json(['message' => 'You must arrive on scene before submitting the PCR.'], 403);
        }

        $completedAt = now();
        $rawTime = $request->input('completed_at') ?: $request->input('timestamp');
        if (!empty($rawTime)) {
            try {
                $completedAt = is_numeric($rawTime) ? Carbon::createFromTimestampMs((int)$rawTime) : Carbon::parse($rawTime);
            } catch (\Throwable $e) {}
        }

        // Mark the dispatch as completed
        $dispatch->update([
            'dispatch_status' => 'completed',
            'completed_at' => $dispatch->completed_at ?? $completedAt,
            'last_location_updated_at' => now(),
        ]);

        // Mark the overall incident as resolved
        if ($dispatch->incident) {
            $dispatch->incident->update([
                'incident_status' => 'resolved',
                'resolved_at' => $dispatch->incident->resolved_at ?? now(),
            ]);
        }

        // Optional photo(s) attached during submission
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('pcr_photos', 'public');
            \App\Models\IncidentImage::create([
                'incident_id' => $dispatch->incident_id,
                'dispatch_id' => $dispatch->id,
                'patient_care_record_id' => $pcr->id,
                'user_id' => $request->user()->id,
                'image_path' => $path,
                'capture_method' => 'camera',
                'latitude' => $request->filled('latitude') ? (float) $request->latitude : null,
                'longitude' => $request->filled('longitude') ? (float) $request->longitude : null,
                'location_name' => $request->filled('location_name') ? $request->location_name : null,
                'captured_at' => $request->filled('captured_at') ? \Carbon\Carbon::parse($request->captured_at) : now(),
                'source' => 'responder_pcr',
            ]);
        }

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photoFile) {
                $path = $photoFile->store('pcr_photos', 'public');
                \App\Models\IncidentImage::create([
                    'incident_id' => $dispatch->incident_id,
                    'dispatch_id' => $dispatch->id,
                    'patient_care_record_id' => $pcr->id,
                    'user_id' => $request->user()->id,
                    'image_path' => $path,
                    'capture_method' => 'camera',
                    'latitude' => $request->filled('latitude') ? (float) $request->latitude : null,
                    'longitude' => $request->filled('longitude') ? (float) $request->longitude : null,
                    'location_name' => $request->filled('location_name') ? $request->location_name : null,
                    'captured_at' => $request->filled('captured_at') ? \Carbon\Carbon::parse($request->captured_at) : now(),
                    'source' => 'responder_pcr',
                ]);
            }
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

        // Broadcast to Dispatcher in real-time
        try {
            broadcast(new PatientCareRecordSubmitted($pcr));
            broadcast(new DispatchCompleted($dispatch));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Websocket broadcast notice during PCR submission: '.$e->getMessage());
        }

        return response()->json(['message' => 'PCR Submitted and Dispatch Completed']);
    }

    public function uploadPhoto(Request $request, Dispatch $dispatch)
    {
        $user = $request->user();
        if (! $this->isUserAssignedToDispatch($user, $dispatch)) {
            return response()->json(['message' => 'Unauthorized to upload photo for this dispatch.'], 403);
        }

        $request->validate([
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'photos' => 'nullable|array',
            'photos.*' => 'image|mimes:jpeg,png,jpg,webp|max:10240',
            'latitude' => 'nullable|numeric',
            'photo_latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'photo_longitude' => 'nullable|numeric',
            'location_name' => 'nullable|string',
            'photo_location_name' => 'nullable|string',
            'captured_at' => 'nullable',
            'photo_captured_at' => 'nullable',
        ]);

        $lat = $request->input('photo_latitude') ?? $request->input('latitude');
        $lng = $request->input('photo_longitude') ?? $request->input('longitude');
        $locationName = $request->input('photo_location_name') ?? $request->input('location_name');
        $capturedAtRaw = $request->input('photo_captured_at') ?? $request->input('captured_at');
        $capturedAt = $capturedAtRaw ? \Carbon\Carbon::parse($capturedAtRaw) : now();

        $pcr = $dispatch->patientCareRecord;
        $createdImages = [];

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('pcr_photos', 'public');
            $createdImages[] = \App\Models\IncidentImage::create([
                'incident_id' => $dispatch->incident_id,
                'dispatch_id' => $dispatch->id,
                'patient_care_record_id' => $pcr?->id,
                'user_id' => $request->user()->id,
                'image_path' => $path,
                'capture_method' => 'camera',
                'latitude' => $lat !== null ? (float) $lat : null,
                'longitude' => $lng !== null ? (float) $lng : null,
                'location_name' => $locationName,
                'captured_at' => $capturedAt,
                'source' => 'responder_pcr',
            ]);
        }

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photoFile) {
                $path = $photoFile->store('pcr_photos', 'public');
                $createdImages[] = \App\Models\IncidentImage::create([
                    'incident_id' => $dispatch->incident_id,
                    'dispatch_id' => $dispatch->id,
                    'patient_care_record_id' => $pcr?->id,
                    'user_id' => $request->user()->id,
                    'image_path' => $path,
                    'capture_method' => 'camera',
                    'latitude' => $lat !== null ? (float) $lat : null,
                    'longitude' => $lng !== null ? (float) $lng : null,
                    'location_name' => $locationName,
                    'captured_at' => $capturedAt,
                    'source' => 'responder_pcr',
                ]);
            }
        }

        return response()->json([
            'message' => 'PCR photo(s) uploaded successfully',
            'data' => count($createdImages) === 1 ? $createdImages[0] : $createdImages,
        ], 201);
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
