<?php

namespace App\Http\Controllers\Dispatcher;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $query = Patient::with([
            'barangay',
            'latestCareRecord',
            'registeredUser.residentProfile.barangay',
        ])->withCount('careRecords');

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where(DB::raw("CONCAT(first_name, ' ', last_name)"), 'LIKE', "%{$search}%")
                    ->orWhere('first_name', 'LIKE', "%{$search}%")
                    ->orWhere('last_name', 'LIKE', "%{$search}%")
                    ->orWhere('street', 'LIKE', "%{$search}%")
                    ->orWhere('house_no', 'LIKE', "%{$search}%")
                    ->orWhereHas('barangay', function ($b) use ($search) {
                        $b->where('barangay_name', 'LIKE', "%{$search}%");
                    })
                    ->orWhereHas('careRecords', function ($cr) use ($search) {
                        $cr->where('contact_number', 'LIKE', "%{$search}%")
                            ->orWhere('caller_no', 'LIKE', "%{$search}%");
                    })
                    ->orWhereHas('registeredUser', function ($u) use ($search) {
                        $u->where('phone_number', 'LIKE', "%{$search}%");
                    });
            });
        }

        $patients = $query->latest()->paginate(15)->withQueryString();

        $transformedPatients = collect($patients->items())->map(function ($patient) {
            $latestPcr = $patient->latestCareRecord;
            $residentProfile = $patient->registeredUser?->residentProfile;

            $gender = $patient->gender ?? $residentProfile?->gender ?? $latestPcr?->gender ?? null;
            $birthdate = $patient->birthdate ?? $residentProfile?->birthdate ?? null;
            $age = null;
            if ($birthdate) {
                $age = Carbon::parse($birthdate)->age;
            }

            $barangayName = $patient->barangay?->barangay_name ?? $residentProfile?->barangay?->barangay_name ?? null;

            $addressParts = array_filter([
                $patient->house_no ?? $residentProfile?->house_no,
                $patient->street ?? $residentProfile?->street,
                $barangayName,
            ]);
            $address = ! empty($addressParts) ? implode(', ', $addressParts) : null;

            $contactNumber = $patient->registeredUser?->phone_number
                ?? $latestPcr?->contact_number
                ?? $latestPcr?->caller_no
                ?? null;

            return [
                'id' => $patient->id,
                'first_name' => $patient->first_name,
                'middle_name' => $patient->middle_name,
                'last_name' => $patient->last_name,
                'full_name' => trim("{$patient->first_name} {$patient->middle_name} {$patient->last_name}"),
                'birthdate' => $birthdate,
                'age' => $age,
                'gender' => $gender,
                'contact_number' => $contactNumber,
                'barangay' => $barangayName,
                'house_no' => $patient->house_no ?? $residentProfile?->house_no,
                'street' => $patient->street ?? $residentProfile?->street,
                'address' => $address,
                'care_records_count' => $patient->care_records_count,
                'created_at' => $patient->created_at?->toISOString(),
            ];
        });

        return Inertia::render('dispatcher/Patients', [
            'patients' => $transformedPatients,
            'pagination' => [
                'current_page' => $patients->currentPage(),
                'last_page' => $patients->lastPage(),
                'per_page' => $patients->perPage(),
                'total' => $patients->total(),
            ],
            'filters' => [
                'search' => $request->search ?? '',
            ],
        ]);
    }

    public function search(Request $request)
    {
        $search = trim($request->query('query', $request->query('search', '')));

        $query = Patient::with([
            'barangay',
            'latestCareRecord',
            'registeredUser.residentProfile.barangay',
        ])->withCount('careRecords');

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where(DB::raw("CONCAT(first_name, ' ', last_name)"), 'LIKE', "%{$search}%")
                    ->orWhere('first_name', 'LIKE', "%{$search}%")
                    ->orWhere('last_name', 'LIKE', "%{$search}%")
                    ->orWhere('street', 'LIKE', "%{$search}%")
                    ->orWhere('house_no', 'LIKE', "%{$search}%")
                    ->orWhereHas('barangay', function ($b) use ($search) {
                        $b->where('barangay_name', 'LIKE', "%{$search}%");
                    })
                    ->orWhereHas('careRecords', function ($cr) use ($search) {
                        $cr->where('contact_number', 'LIKE', "%{$search}%")
                            ->orWhere('caller_no', 'LIKE', "%{$search}%");
                    })
                    ->orWhereHas('registeredUser', function ($u) use ($search) {
                        $u->where('phone_number', 'LIKE', "%{$search}%");
                    });
            });
        }

        $patients = $query->latest()->limit(50)->get();

        $data = $patients->map(function ($patient) {
            $latestPcr = $patient->latestCareRecord;
            $residentProfile = $patient->registeredUser?->residentProfile;

            $gender = $patient->gender ?? $residentProfile?->gender ?? $latestPcr?->gender ?? null;
            $birthdate = $patient->birthdate ?? $residentProfile?->birthdate ?? null;
            $age = null;
            if ($birthdate) {
                $age = Carbon::parse($birthdate)->age;
            }

            $barangayName = $patient->barangay?->barangay_name ?? $residentProfile?->barangay?->barangay_name ?? null;

            $addressParts = array_filter([
                $patient->house_no ?? $residentProfile?->house_no,
                $patient->street ?? $residentProfile?->street,
                $barangayName,
            ]);
            $address = ! empty($addressParts) ? implode(', ', $addressParts) : null;

            $contactNumber = $patient->registeredUser?->phone_number
                ?? $latestPcr?->contact_number
                ?? $latestPcr?->caller_no
                ?? null;

            return [
                'id' => $patient->id,
                'first_name' => $patient->first_name,
                'middle_name' => $patient->middle_name,
                'last_name' => $patient->last_name,
                'full_name' => trim("{$patient->first_name} {$patient->middle_name} {$patient->last_name}"),
                'birthdate' => $birthdate,
                'age' => $age,
                'gender' => $gender,
                'contact_number' => $contactNumber,
                'barangay' => $barangayName,
                'house_no' => $patient->house_no ?? $residentProfile?->house_no,
                'street' => $patient->street ?? $residentProfile?->street,
                'address' => $address,
                'care_records_count' => $patient->care_records_count,
                'created_at' => $patient->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'patients' => $data,
            'total' => $data->count(),
        ]);
    }

    public function show(Patient $patient)
    {
        $patient->load([
            'barangay',
            'registeredUser.residentProfile.barangay',
            'careRecords' => function ($q) {
                $q->with([
                    'dispatch.incident.incidentType',
                    'dispatch.ambulance',
                    'dispatch.teamLeader',
                    'dispatch.driver',
                    'dispatch.emt',
                ])->orderByDesc('created_at');
            },
        ]);

        $latestPcr = $patient->careRecords->first();
        $residentProfile = $patient->registeredUser?->residentProfile;

        $gender = $patient->gender ?? $residentProfile?->gender ?? $latestPcr?->gender ?? null;
        $birthdate = $patient->birthdate ?? $residentProfile?->birthdate ?? null;
        $age = null;
        if ($birthdate) {
            $age = Carbon::parse($birthdate)->age;
        }

        $barangayName = $patient->barangay?->barangay_name ?? $residentProfile?->barangay?->barangay_name ?? null;

        $addressParts = array_filter([
            $patient->house_no ?? $residentProfile?->house_no,
            $patient->street ?? $residentProfile?->street,
            $barangayName,
        ]);
        $address = ! empty($addressParts) ? implode(', ', $addressParts) : null;

        $contactNumber = $patient->registeredUser?->phone_number
            ?? $latestPcr?->contact_number
            ?? $latestPcr?->caller_no
            ?? null;

        $patientData = [
            'id' => $patient->id,
            'first_name' => $patient->first_name,
            'middle_name' => $patient->middle_name,
            'last_name' => $patient->last_name,
            'full_name' => trim("{$patient->first_name} {$patient->middle_name} {$patient->last_name}"),
            'birthdate' => $birthdate,
            'age' => $age,
            'gender' => $gender,
            'contact_number' => $contactNumber,
            'barangay' => $barangayName,
            'house_no' => $patient->house_no ?? $residentProfile?->house_no,
            'street' => $patient->street ?? $residentProfile?->street,
            'address' => $address,
            'care_records_count' => $patient->careRecords->count(),
            'created_at' => $patient->created_at?->toISOString(),
            'updated_at' => $patient->updated_at?->toISOString(),
            'registered_user' => $patient->registeredUser ? [
                'id' => $patient->registeredUser->id,
                'name' => "{$patient->registeredUser->first_name} {$patient->registeredUser->last_name}",
                'email' => $patient->registeredUser->email,
                'phone_number' => $patient->registeredUser->phone_number,
            ] : null,
        ];

        $careRecords = $patient->careRecords->map(function ($pcr) use ($patientData) {
            $dispatch = $pcr->dispatch;
            $incident = $dispatch?->incident;

            return [
                'id' => $pcr->id,
                'patient' => $patientData,
                'dispatch_id' => $pcr->dispatch_id,
                'incident_id' => $incident?->id,
                'incident_type' => $incident?->incidentType?->name ?? 'Medical Emergency',
                'record_date' => $pcr->record_date ?? $pcr->created_at?->format('Y-m-d'),
                'created_at' => $pcr->created_at?->toISOString(),
                'caller_no' => $pcr->caller_no,
                'contact_number' => $pcr->contact_number,
                'gender' => $pcr->gender,
                'civil_status' => $pcr->civil_status,
                'place_of_incident' => $pcr->place_of_incident ?? $incident?->incident_address ?? $incident?->location,
                'chief_complaint' => $pcr->chief_complaint ?? $incident?->chief_complaint,
                'nature_of_call' => $pcr->nature_of_call ?? $incident?->nature_of_call,
                'dispatch_time' => $pcr->dispatch_time,
                'en_route_time' => $pcr->en_route_time,
                'on_scene_time' => $pcr->on_scene_time,
                'transport_time' => $pcr->transport_time,
                'arrived_hf_time' => $pcr->arrived_hf_time,
                'departed_hf_time' => $pcr->departed_hf_time,
                'assessment' => $pcr->assessment ?? [],
                'assessment_markers' => $pcr->assessment_markers ?? [],
                'vital_signs' => $pcr->vital_signs ?? [],
                'glasgow_coma_scale' => $pcr->glasgow_coma_scale ?? null,
                'special_instructions' => $pcr->special_instructions,
                'disposition' => is_array($pcr->disposition) ? $pcr->disposition : ($pcr->disposition ? [$pcr->disposition] : []),
                'responders' => $pcr->responders,
                'transported' => (bool) $pcr->transported,
                'transported_to' => $pcr->transported_to,
                'received_by' => $pcr->received_by,
                'waiver_signed' => (bool) $pcr->waiver_signed,
                'witness_name' => $pcr->witness_name,
                'patient_signature' => $pcr->patient_signature,
                'witness_signature' => $pcr->witness_signature,
                'waiver_signature' => $pcr->waiver_signature,
                'dispatch' => $dispatch ? [
                    'id' => $dispatch->id,
                    'dispatch_status' => $dispatch->dispatch_status,
                    'created_at' => $dispatch->created_at?->toISOString(),
                    'completed_at' => $dispatch->completed_at?->toISOString(),
                    'ambulance' => $dispatch->ambulance ? [
                        'id' => $dispatch->ambulance->id,
                        'plate_number' => $dispatch->ambulance->plate_number,
                        'vehicle_name' => $dispatch->ambulance->vehicle_name ?? "Ambulance {$dispatch->ambulance->plate_number}",
                    ] : null,
                    'team_leader' => $dispatch->teamLeader ? [
                        'id' => $dispatch->teamLeader->id,
                        'name' => "{$dispatch->teamLeader->first_name} {$dispatch->teamLeader->last_name}",
                    ] : null,
                    'driver' => $dispatch->driver ? [
                        'id' => $dispatch->driver->id,
                        'name' => "{$dispatch->driver->first_name} {$dispatch->driver->last_name}",
                    ] : null,
                    'emt' => $dispatch->emt ? [
                        'id' => $dispatch->emt->id,
                        'name' => "{$dispatch->emt->first_name} {$dispatch->emt->last_name}",
                    ] : null,
                ] : null,
            ];
        });

        return Inertia::render('dispatcher/PatientDetails', [
            'patient' => $patientData,
            'care_records' => $careRecords,
        ]);
    }
}
