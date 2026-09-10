<?php

namespace App\Http\Controllers\Api\Responder;

use App\Events\DispatchCompleted;
use App\Events\PatientCareRecordSubmitted;
use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\ResponderProfile;
use Illuminate\Http\Request;

class PatientCareRecordController extends Controller
{
    public function update(Request $request, Dispatch $dispatch)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'contact_number' => 'nullable|string',
            'gender' => 'nullable|string|in:male,female',
            'age' => 'nullable|numeric',
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

        $pcrData = collect($validated)->except(['age', 'incident_address'])->all();

        $pcr = $dispatch->patientCareRecord()->updateOrCreate(
            ['dispatch_id' => $dispatch->id],
            $pcrData
        );

        // Keep master Patient record synchronized with latest known demographics
        $patient = \App\Models\Patient::find($validated['patient_id']);
        if ($patient) {
            $patientUpdates = [];
            if (! empty($validated['gender']) && empty($patient->gender) && in_array($validated['gender'], ['male', 'female'])) {
                $patientUpdates['gender'] = $validated['gender'];
            }
            if (! empty($validated['incident_address']) && empty($patient->street)) {
                $patientUpdates['street'] = $validated['incident_address'];
            }
            if (! empty($validated['age']) && empty($patient->birthdate)) {
                $patientUpdates['birthdate'] = now()->subYears((int) $validated['age'])->format('Y-01-01');
            }
            if (! empty($patientUpdates)) {
                $patient->update($patientUpdates);
            }
        }

        // Broadcast to other crew members on the same dispatch
        // broadcast(new PatientCareRecordUpdatedEvent($pcr))->toOthers();

        return response()->json(['message' => 'PCR updated', 'data' => $pcr]);
    }

    public function submit(Request $request, Dispatch $dispatch)
    {
        $pcr = $dispatch->patientCareRecord;
        if (! $pcr) {
            return response()->json(['message' => 'No PCR found'], 404);
        }

        if (! in_array($dispatch->dispatch_status, ['arrived_on_scene', 'completed'])) {
            return response()->json(['message' => 'You must arrive on scene before submitting the PCR.'], 403);
        }

        // Mark the dispatch as completed
        $dispatch->update([
            'dispatch_status' => 'completed',
            'completed_at' => $dispatch->completed_at ?? now(),
        ]);

        // Mark the overall incident as resolved
        if ($dispatch->incident) {
            $dispatch->incident->update([
                'incident_status' => 'resolved',
                'resolved_at' => $dispatch->incident->resolved_at ?? now(),
            ]);
        }

        Ambulance::where('id', $dispatch->ambulance_id)->update(['status' => 'available']);
        ResponderProfile::whereIn('user_id', array_filter([$dispatch->driver_id, $dispatch->emt_id, $dispatch->team_leader_id]))->update(['availability' => 'available']);

        // Broadcast to Dispatcher in real-time
        try {
            broadcast(new PatientCareRecordSubmitted($pcr));
            broadcast(new DispatchCompleted($dispatch));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Websocket broadcast notice during PCR submission: '.$e->getMessage());
        }

        return response()->json(['message' => 'PCR Submitted and Dispatch Completed']);
    }
}
