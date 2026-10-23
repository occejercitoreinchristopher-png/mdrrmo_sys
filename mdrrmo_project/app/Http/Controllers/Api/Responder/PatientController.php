<?php

namespace App\Http\Controllers\Api\Responder;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PatientController extends Controller
{
    public function search(Request $request)
    {
        $query = trim($request->query('q', ''));
        if (empty($query)) {
            return response()->json([]);
        }

        $patients = Patient::with(['barangay', 'latestCareRecord', 'registeredUser.residentProfile.barangay'])
            ->where(function ($q) use ($query) {
                $q->where(DB::raw("CONCAT(patient_first_name, ' ', patient_last_name)"), 'LIKE', "%{$query}%")
                    ->orWhere('patient_first_name', 'LIKE', "%{$query}%")
                    ->orWhere('patient_last_name', 'LIKE', "%{$query}%")
                    ->orWhereHas('careRecords', function ($cr) use ($query) {
                        $cr->where('contact_number', 'LIKE', "%{$query}%")
                            ->orWhere('caller_no', 'LIKE', "%{$query}%");
                    })
                    ->orWhereHas('registeredUser', function ($u) use ($query) {
                        $u->where('phone_number', 'LIKE', "%{$query}%");
                    });
            })
            ->limit(15)
            ->get()
            ->map(function ($patient) {
                $fullName = trim("{$patient->first_name} {$patient->middle_name} {$patient->last_name}");
                $latestPcr = $patient->latestCareRecord;
                $residentProfile = $patient->registeredUser?->residentProfile;

                // Gender: check patient -> resident profile -> latest PCR
                $gender = $patient->gender ?? $residentProfile?->gender ?? $latestPcr?->gender ?? null;

                // Birthdate / Age: check patient -> resident profile
                $birthdate = $patient->birthdate ?? $residentProfile?->birthdate ?? null;
                $age = null;
                if ($birthdate) {
                    $age = Carbon::parse($birthdate)->age;
                }

                // Address: check patient -> resident profile
                $addressParts = array_filter([
                    $patient->house_no ?? $residentProfile?->house_no,
                    $patient->street ?? $residentProfile?->street,
                    $patient->barangay?->barangay_name ?? $patient->barangay?->name ?? $residentProfile?->barangay?->barangay_name,
                ]);
                $address = implode(', ', $addressParts);

                // Contact number: check registered user -> latest PCR
                $contact = $patient->registeredUser?->phone_number ?? $latestPcr?->contact_number ?? $latestPcr?->caller_no ?? null;

                // Civil status: check latest PCR
                $civilStatus = $latestPcr?->civil_status ?? null;

                return [
                    'id' => $patient->id,
                    'patient_id' => $patient->id,
                    'full_name' => $fullName,
                    'first_name' => $patient->first_name,
                    'last_name' => $patient->last_name,
                    'birthdate' => $birthdate,
                    'age' => $age,
                    'gender' => $gender,
                    'address' => $address,
                    'incident_address' => $address,
                    'street' => $patient->street ?? $residentProfile?->street,
                    'barangay' => $patient->barangay?->barangay_name ?? $patient->barangay?->name ?? $residentProfile?->barangay?->barangay_name,
                    'contact_number' => $contact,
                    'civil_status' => $civilStatus,
                    'is_unidentified' => (bool) $patient->is_unidentified,
                ];
            });

        return response()->json($patients);
    }

    public function store(Request $request)
    {
        // Sanitize empty strings to null
        $inputs = array_map(function ($value) {
            return is_string($value) && trim($value) === '' ? null : $value;
        }, $request->all());
        $request->merge($inputs);

        if ($request->has('gender') && is_string($request->gender)) {
            $request->merge(['gender' => strtolower(trim($request->gender))]);
        }
        if ($request->has('age') && is_numeric($request->age)) {
            $request->merge(['age' => (string) $request->age]);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'birthdate' => 'nullable|date',
            'age' => 'nullable|string|max:20',
            'gender' => 'nullable|string|in:male,female',
            'address' => 'nullable|string',
            'incident_address' => 'nullable|string',
            'contact_number' => 'nullable|string',
        ]);

        $firstName = trim($validated['first_name']);
        $lastName = trim($validated['last_name']);

        $birthdate = $validated['birthdate'] ?? null;
        if (! $birthdate && ! empty($validated['age'])) {
            $rawAge = trim((string) $validated['age']);
            if (str_contains($rawAge, '-')) {
                $parts = explode('-', $rawAge);
                $midAge = (int) round(((int) ($parts[0] ?? 25) + (int) ($parts[1] ?? 30)) / 2);
            } else {
                $midAge = (int) $rawAge;
            }
            if ($midAge > 0 && $midAge <= 120) {
                $birthdate = now()->subYears($midAge)->format('Y-01-01');
            }
        }

        $street = $validated['address'] ?? $validated['incident_address'] ?? null;

        $isUnidentified = $request->boolean('is_unidentified', false);

        // If explicitly creating an unidentified patient or not found by name
        if ($isUnidentified) {
            $patient = Patient::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'birthdate' => $birthdate,
                'gender' => in_array($validated['gender'] ?? '', ['male', 'female']) ? $validated['gender'] : null,
                'street' => $street,
                'is_unidentified' => true,
            ]);
            $status = 201;
            $message = 'Unidentified patient profile created';
        } else {
            // Prevent duplicates: Check if patient already exists by first_name and last_name (case-insensitive)
            $existingPatient = Patient::whereRaw('LOWER(patient_first_name) = ?', [strtolower($firstName)])
                ->whereRaw('LOWER(patient_last_name) = ?', [strtolower($lastName)])
                ->first();

            if ($existingPatient) {
                $patient = $existingPatient;
                $updates = [];
                if (empty($patient->birthdate) && $birthdate) {
                    $updates['birthdate'] = $birthdate;
                }
                if (empty($patient->gender) && in_array($validated['gender'] ?? '', ['male', 'female'])) {
                    $updates['gender'] = $validated['gender'];
                }
                if (! empty($street)) {
                    $newStreet = trim($street);
                    $oldStreet = trim($patient->street ?? '');
                    if (empty($oldStreet) || $newStreet !== $oldStreet) {
                        $updates['street'] = $newStreet;
                    }
                }
                if (! empty($updates)) {
                    $patient->update($updates);
                }
                $status = 200;
                $message = 'Existing patient profile loaded';
            } else {
                $patient = Patient::create([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'birthdate' => $birthdate,
                    'gender' => in_array($validated['gender'] ?? '', ['male', 'female']) ? $validated['gender'] : null,
                    'street' => $street,
                    'is_unidentified' => false,
                ]);
                $status = 201;
                $message = 'Patient created successfully';
            }
        }

        $calculatedAge = ($patient->is_unidentified && ! empty($validated['age']))
            ? (string) $validated['age']
            : ($patient->birthdate
                ? Carbon::parse($patient->birthdate)->age
                : ($validated['age'] ?? null ? (int) $validated['age'] : null));

        return response()->json([
            'message' => $message,
            'patient_id' => $patient->id,
            'id' => $patient->id,
            'first_name' => $patient->first_name,
            'last_name' => $patient->last_name,
            'birthdate' => $patient->birthdate,
            'age' => $calculatedAge,
            'gender' => $patient->gender,
            'address' => $patient->street ?? $street,
            'incident_address' => $patient->street ?? $street,
            'contact_number' => $validated['contact_number'] ?? null,
            'is_unidentified' => (bool) $patient->is_unidentified,
        ], $status);
    }

    public function updateIdentification(Request $request, Patient $patient)
    {
        // Only unidentified patients can be edited
        if (! $patient->is_unidentified) {
            return response()->json([
                'message' => 'This patient has already been identified and cannot be edited.',
            ], 422);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'birthdate' => 'nullable|date',
            'age' => 'nullable|numeric',
            'gender' => 'nullable|string|in:male,female',
            'street' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:50',
        ]);

        $birthdate = $validated['birthdate'] ?? null;
        if (! $birthdate && ! empty($validated['age'])) {
            $birthdate = now()->subYears((int) $validated['age'])->format('Y-01-01');
        }

        $address = $validated['street'] ?? $validated['address'] ?? null;

        $patient->update([
            'patient_first_name' => trim($validated['first_name']),
            'patient_middle_name' => ! empty($validated['middle_name']) ? trim($validated['middle_name']) : null,
            'patient_last_name' => trim($validated['last_name']),
            'patient_birthdate' => $birthdate,
            'patient_gender' => $validated['gender'] ?? null,
            'street' => $address,
            'is_unidentified' => false,
            'identified_at' => now(),
            'identified_by_role' => 'responder',
        ]);

        $calculatedAge = $patient->birthdate ? Carbon::parse($patient->birthdate)->age : null;

        return response()->json([
            'message' => 'Patient identification completed successfully',
            'patient' => [
                'id' => $patient->id,
                'patient_id' => $patient->id,
                'first_name' => $patient->first_name,
                'middle_name' => $patient->middle_name,
                'last_name' => $patient->last_name,
                'full_name' => $patient->full_name,
                'birthdate' => $patient->birthdate,
                'age' => $calculatedAge,
                'gender' => $patient->gender,
                'address' => $patient->street,
                'street' => $patient->street,
                'is_unidentified' => false,
                'identified_at' => $patient->identified_at?->toISOString(),
                'identified_by_role' => 'responder',
            ],
        ]);
    }
}
