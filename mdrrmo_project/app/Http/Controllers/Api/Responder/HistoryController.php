<?php

namespace App\Http\Controllers\Api\Responder;

use App\Http\Controllers\Controller;
use App\Models\Dispatch;
use App\Models\Incident;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HistoryController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Dispatch::with([
            'incident.incidentType',
            'incident.resident.residentProfile.barangay',
            'incident.images',
            'patientCareRecord.patient.barangay',
            'ambulance',
            'driver.responderProfile',
            'emt.responderProfile',
            'crew.responderProfile',
        ])
            ->where(function ($q) use ($user) {
                $q->where('driver_id', $user->id)
                    ->orWhere('emt_id', $user->id)
                    ->orWhere('dispatcher_id', $user->id)
                    ->orWhereHas('crew', function ($cq) use ($user) {
                        $cq->where('users.id', $user->id);
                    });
            })
            ->whereIn('dispatch_status', ['completed', 'cancelled']);

        // Type Filter (e.g. 1, 2)
        if ($request->filled('type') && $request->type !== 'all') {
            $type = $request->type;
            $query->whereHas('incident', function ($q) use ($type) {
                $q->where('incident_type_id', $type);
            });
        }

        // Date Filter
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $dispatches = $query->orderBy('created_at', 'desc')->paginate(10);

        // Transform for mobile consumption
        $dispatches->getCollection()->transform(function ($dispatch) {
            return $this->formatDispatchForMobile($dispatch);
        });

        return response()->json($dispatches);
    }

    public function show(Dispatch $dispatch)
    {
        $dispatch->loadMissing([
            'incident.incidentType',
            'incident.resident.residentProfile.barangay',
            'incident.images',
            'patientCareRecord.patient.barangay',
            'ambulance',
            'driver.responderProfile',
            'emt.responderProfile',
            'crew.responderProfile',
        ]);

        return response()->json([
            'data' => $this->formatDispatchForMobile($dispatch),
        ]);
    }

    private function formatDispatchForMobile(Dispatch $dispatch): array
    {
        $pcr = $dispatch->patientCareRecord;
        $patient = $pcr ? $pcr->patient : null;
        $incident = $dispatch->incident;
        $reporter = $incident ? $incident->resident : null;

        $locationName = $incident?->place_of_incident 
            ?: $incident?->incident_address 
            ?: ($incident?->location_code ? "Marker {$incident->location_code}" : null);

        $barangay = $incident?->barangay 
            ?: $incident?->resident?->residentProfile?->barangay?->barangay_name;

        $isGeneric = empty($locationName) 
            || in_array(strtolower(trim($locationName)), [
                'opol, misamis oriental',
                'opol',
                'incident scene, opol, misamis oriental',
                'incident scene',
            ])
            || preg_match('/^-?\d+\.\d+/', trim($locationName ?? ''));

        if ($isGeneric && !empty($barangay)) {
            $locationName = "Brgy. {$barangay}, Opol, Misamis Oriental";
        } elseif ($isGeneric && $incident && $incident->incident_latitude && $incident->incident_longitude) {
            $resolvedBrgy = Incident::resolveBarangayFromCoordinates($incident->incident_latitude, $incident->incident_longitude);
            if ($resolvedBrgy) {
                $locationName = "Brgy. {$resolvedBrgy}, Opol, Misamis Oriental";
            } else {
                $locationName = "Opol, Misamis Oriental";
            }
        } elseif (empty($locationName)) {
            $locationName = !empty($barangay) ? "Brgy. {$barangay}, Opol, Misamis Oriental" : "Opol, Misamis Oriental";
        }

        // Format crew members
        $crewList = [];
        if ($dispatch->driver) {
            $badge = $dispatch->driver->responderProfile?->badge_number ?: sprintf('RSP-%04d', $dispatch->driver->id);
            $crewList[] = [
                'id' => $dispatch->driver->id,
                'name' => trim("{$dispatch->driver->first_name} {$dispatch->driver->last_name}"),
                'role' => 'Ambulance Driver',
                'badge_number' => $badge,
            ];
        }
        if ($dispatch->emt) {
            $badge = $dispatch->emt->responderProfile?->badge_number ?: sprintf('RSP-%04d', $dispatch->emt->id);
            $crewList[] = [
                'id' => $dispatch->emt->id,
                'name' => trim("{$dispatch->emt->first_name} {$dispatch->emt->last_name}"),
                'role' => 'Lead EMT / Team Leader',
                'badge_number' => $badge,
            ];
        }
        if ($dispatch->relationLoaded('crew') && $dispatch->crew) {
            foreach ($dispatch->crew as $c) {
                if ($c->id === $dispatch->driver_id || $c->id === $dispatch->emt_id) {
                    continue;
                }
                $badge = $c->responderProfile?->badge_number ?: sprintf('RSP-%04d', $c->id);
                $crewList[] = [
                    'id' => $c->id,
                    'name' => trim("{$c->first_name} {$c->last_name}"),
                    'role' => $c->pivot?->role ?: 'Responder Crew',
                    'badge_number' => $badge,
                ];
            }
        }

        // Format patient(s) / PCRs handled
        $patientsList = [];
        if ($pcr) {
            $pName = $patient ? trim("{$patient->first_name} {$patient->last_name}") : ($pcr->patient_name ?? 'Unidentified / Not Named');
            $pBarangay = $patient?->barangay?->barangay_name ?? null;
            $pAddress = $patient?->address ?: ($patient?->home_address ?: ($pBarangay ? "Brgy. {$pBarangay}, Opol" : $pcr->place_of_incident));

            // Format vital signs if stored
            $vitals = $pcr->vital_signs;
            if (is_string($vitals)) {
                $vitals = json_decode($vitals, true);
            }

            // Format GCS if stored
            $gcs = $pcr->glasgow_coma_scale;
            if (is_string($gcs)) {
                $gcs = json_decode($gcs, true);
            }

            // Format assessment if stored
            $assessment = $pcr->assessment;
            if (is_string($assessment)) {
                $assessment = json_decode($assessment, true);
            }

            // Compute patient age
            $patientAge = $pcr->age;
            if (empty($patientAge) && $patient?->patient_birthdate) {
                try {
                    $patientAge = Carbon::parse($patient->patient_birthdate)->age . ' yrs old';
                } catch (\Throwable $e) {}
            }

            $patientsList[] = [
                'id' => $patient?->id,
                'pcr_id' => $pcr->id,
                'name' => $pName,
                'first_name' => $patient?->first_name ?? $pName,
                'last_name' => $patient?->last_name ?? '',
                'gender' => $patient?->gender ?? $patient?->patient_gender ?? $pcr->gender,
                'age' => $patientAge ?: 'Not specified',
                'civil_status' => $pcr->civil_status,
                'contact_number' => $pcr->contact_number ?: $patient?->contact_number,
                'address' => $pAddress,
                'place_of_incident' => $pcr->place_of_incident,
                'chief_complaint' => $pcr->clinical_chief_complaint ?: $pcr->chief_complaint ?: 'Not stated',
                'nature_of_call' => $pcr->nature_of_call,
                'vital_signs' => $vitals,
                'glasgow_coma_scale' => $gcs,
                'assessment' => $assessment,
                'assessment_markers' => $pcr->assessment_markers,
                'special_instructions' => $pcr->special_instructions,
                'transported' => (bool) $pcr->transported,
                'transported_to' => $pcr->transported_to,
                'received_by' => $pcr->received_by,
                'waiver_signed' => (bool) $pcr->waiver_signed,
                'witness_name' => $pcr->witness_name,
                'transport_time' => $pcr->transport_time,
                'arrived_hf_time' => $pcr->arrived_hf_time,
                'departed_hf_time' => $pcr->departed_hf_time,
                'record_date' => $pcr->record_date ? Carbon::parse($pcr->record_date)->format('M d, Y') : null,
                'raw_pcr' => $pcr->toArray(),
            ];
        }

        // Incident images
        $imagesList = [];
        if ($incident && $incident->relationLoaded('images') && $incident->images) {
            foreach ($incident->images as $img) {
                $imagesList[] = [
                    'id' => $img->id,
                    'url' => asset('storage/' . $img->image_path),
                    'location_name' => $img->location_name,
                ];
            }
        }

        return [
            'id' => 'DSP-'.str_pad($dispatch->id, 3, '0', STR_PAD_LEFT),
            'raw_id' => $dispatch->id,
            'incident_id' => $incident?->id,
            'incident_number' => $incident?->incident_number ?: ($incident ? 'INC-'.str_pad($incident->id, 4, '0', STR_PAD_LEFT) : null),
            'status' => ucfirst($dispatch->dispatch_status),
            'raw_status' => $dispatch->dispatch_status,
            'type' => optional(optional($incident)->incidentType)->name ?? 'General Emergency',
            'priority' => $incident?->priority ?? 'Moderate',
            'location' => $locationName,
            'barangay' => $barangay,
            'latitude' => $incident?->incident_latitude ? (float) $incident->incident_latitude : null,
            'longitude' => $incident?->incident_longitude ? (float) $incident->incident_longitude : null,
            'description' => $incident?->description ?: 'No additional description provided.',
            'date' => $dispatch->created_at->format('M d, Y'),
            'time' => $dispatch->created_at->format('h:i A'),
            'patient_name' => $patient ? trim("{$patient->first_name} {$patient->last_name}") : ($pcr ? 'Handled (See Details)' : 'No Patient Logged'),
            'reporter_name' => $reporter ? trim("{$reporter->first_name} {$reporter->last_name}") : 'Walk-In / Dispatch Office',
            'reporter_phone' => $reporter?->phone_number ?: $incident?->caller_phone_number,
            'timeline' => [
                'assigned_at' => $dispatch->assigned_at ? $dispatch->assigned_at->format('M d, Y h:i A') : null,
                'accepted_at' => $dispatch->accepted_at ? $dispatch->accepted_at->format('M d, Y h:i A') : null,
                'en_route_at' => $dispatch->en_route_at ? $dispatch->en_route_at->format('M d, Y h:i A') : null,
                'arrived_at' => ($dispatch->arrived_at ?: $dispatch->arrived_on_scene_at) ? ($dispatch->arrived_at ?: $dispatch->arrived_on_scene_at)->format('M d, Y h:i A') : null,
                'completed_at' => $dispatch->completed_at ? $dispatch->completed_at->format('M d, Y h:i A') : null,
            ],
            'ambulance' => $dispatch->ambulance ? [
                'id' => $dispatch->ambulance->id,
                'plate_number' => $dispatch->ambulance->plate_number,
                'vehicle_type' => $dispatch->ambulance->vehicle_type,
                'name' => $dispatch->ambulance->name ?? $dispatch->ambulance->plate_number,
            ] : null,
            'crew' => $crewList,
            'patients' => $patientsList,
            'images' => $imagesList,
            'raw_dispatch' => $dispatch->toArray(),
        ];
    }
}
