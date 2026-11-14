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
            ->get();

        // Also check if any registered resident (User with role=resident) matches who doesn't have a linked patient yet
        $existingLinkedUserIds = $patients->pluck('registered_user_id')->filter()->all();
        $matchingUsers = \App\Models\User::where('role', 'resident')
            ->whereNotIn('id', $existingLinkedUserIds)
            ->where(function ($q) use ($query) {
                $q->where(DB::raw("CONCAT(first_name, ' ', last_name)"), 'LIKE', "%{$query}%")
                    ->orWhere('first_name', 'LIKE', "%{$query}%")
                    ->orWhere('last_name', 'LIKE', "%{$query}%")
                    ->orWhere('phone_number', 'LIKE', "%{$query}%");
            })
            ->with(['residentProfile.barangay'])
            ->limit(5)
            ->get();

        foreach ($matchingUsers as $user) {
            $patient = Patient::whereRaw('LOWER(TRIM(patient_first_name)) = ?', [strtolower(trim($user->first_name))])
                ->whereRaw('LOWER(TRIM(patient_last_name)) = ?', [strtolower(trim($user->last_name))])
                ->first();

            if ($patient) {
                if (empty($patient->registered_user_id)) {
                    $patient->registered_user_id = $user->id;
                    $patient->save();
                }
                if (! $patients->contains('id', $patient->id)) {
                    $patient->load(['barangay', 'latestCareRecord', 'registeredUser.residentProfile.barangay']);
                    $patients->push($patient);
                }
            } else {
                $newPatient = Patient::create([
                    'patient_first_name' => $user->first_name,
                    'patient_last_name' => $user->last_name,
                    'patient_middle_name' => $user->middle_name,
                    'patient_birthdate' => $user->birthdate,
                    'patient_gender' => $user->gender,
                    'home_address' => $user->address,
                    'barangay_id' => $user->residentProfile?->barangay_id,
                    'registered_user_id' => $user->id,
                    'is_unidentified' => false,
                ]);
                $newPatient->load(['barangay', 'latestCareRecord', 'registeredUser.residentProfile.barangay']);
                $patients->push($newPatient);
            }
        }

        $formatted = $patients->map(function ($patient) {
            $fullName = trim("{$patient->first_name} {$patient->middle_name} {$patient->last_name}");
            $latestPcr = $patient->latestCareRecord;
            $user = $patient->registeredUser;
            $residentProfile = $user?->residentProfile;

            // Gender: check patient -> registered user -> latest PCR
            $gender = $patient->gender ?? $user?->gender ?? $latestPcr?->gender ?? null;

            // Birthdate / Age: check patient -> registered user
            $birthdate = $patient->birthdate ?? $user?->birthdate ?? null;
            $age = null;
            if ($birthdate) {
                try {
                    $age = Carbon::parse($birthdate)->age;
                } catch (\Throwable $e) {
                    $age = null;
                }
            }
            if ($age === null && $user?->age) {
                $age = (int) $user->age;
            }
            if ($age === null && $latestPcr?->patient_age) {
                $age = (int) $latestPcr->patient_age;
            }

            // Address: check patient -> resident profile / user address
            $barangayName = $patient->barangay?->barangay_name ?? $patient->barangay?->name ?? $residentProfile?->barangay?->barangay_name;
            $addressParts = array_filter([
                $patient->home_address ?? $user?->address,
                $barangayName ? "Barangay {$barangayName}" : null,
                'Opol',
            ]);
            $address = ! empty($addressParts) ? implode(', ', $addressParts) : ($barangayName ? "Barangay {$barangayName}, Opol" : null);

            // Contact number: check registered user -> latest PCR
            $contact = $user?->phone_number ?? $latestPcr?->contact_number ?? $latestPcr?->caller_no ?? null;

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
                'barangay' => $barangayName,
                'contact_number' => $contact,
                'civil_status' => $civilStatus,
                'is_unidentified' => (bool) $patient->is_unidentified,
            ];
        });

        return response()->json($formatted);
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

        $firstName = mb_substr(trim($validated['first_name']), 0, 100);
        $lastName = mb_substr(trim($validated['last_name']), 0, 100);

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

        $rawHomeAddress = $validated['address'] ?? $validated['incident_address'] ?? null;
        $homeAddress = $rawHomeAddress ? mb_substr(trim($rawHomeAddress), 0, 255) : null;
        $addressCol = Patient::addressColumn();

        $isUnidentified = $request->boolean('is_unidentified', false);

        // If explicitly creating an unidentified patient or not found by name
        if ($isUnidentified) {
            $createData = [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'birthdate' => $birthdate,
                'gender' => in_array($validated['gender'] ?? '', ['male', 'female']) ? $validated['gender'] : null,
                'is_unidentified' => true,
            ];
            if ($addressCol) {
                $createData[$addressCol] = $homeAddress;
            }
            $patient = Patient::create($createData);
            $status = 201;
            $message = 'Unidentified patient profile created';
        } else {
            // Find existing non-unidentified patients with same first and last name
            $candidateQuery = Patient::where('is_unidentified', false)
                ->whereRaw('LOWER(TRIM(patient_first_name)) = ?', [strtolower(trim($firstName))])
                ->whereRaw('LOWER(TRIM(patient_last_name)) = ?', [strtolower(trim($lastName))]);

            $candidates = $candidateQuery->get();
            $existingPatient = null;

            if ($candidates->isNotEmpty()) {
                // 1. Exact birthdate match
                if (! empty($birthdate)) {
                    $existingPatient = $candidates->first(function ($p) use ($birthdate) {
                        return $p->patient_birthdate === $birthdate;
                    });
                }

                // 2. Estimated birthdate range (within ±3 years) or candidate had empty/synthetic birthdate (-01-01)
                if (! $existingPatient && ! empty($birthdate)) {
                    $targetYear = (int) substr($birthdate, 0, 4);
                    $existingPatient = $candidates->first(function ($p) use ($targetYear) {
                        if (empty($p->patient_birthdate)) {
                            return true;
                        }
                        $candYear = (int) substr($p->patient_birthdate, 0, 4);
                        return abs($candYear - $targetYear) <= 3;
                    });
                }

                // 3. Match by contact number / registered user phone
                if (! $existingPatient && ! empty($validated['contact_number'])) {
                    $cleanPhone = preg_replace('/[^0-9]/', '', $validated['contact_number']);
                    if (strlen($cleanPhone) >= 7) {
                        $existingPatient = $candidates->first(function ($p) use ($cleanPhone) {
                            $uPhone = preg_replace('/[^0-9]/', '', $p->registeredUser?->phone_number ?? '');
                            return ! empty($uPhone) && (str_contains($uPhone, $cleanPhone) || str_contains($cleanPhone, $uPhone));
                        });
                    }
                }

                // 4. Match by address
                if (! $existingPatient && ! empty($homeAddress) && $addressCol) {
                    $existingPatient = $candidates->first(function ($p) use ($addressCol, $homeAddress) {
                        $pAddr = trim((string) ($p->{$addressCol} ?? ''));
                        return ! empty($pAddr) && (stripos($pAddr, $homeAddress) !== false || stripos($homeAddress, $pAddr) !== false);
                    });
                }

                // 5. Always reuse the best existing candidate with this name instead of creating a duplicate
                if (! $existingPatient) {
                    $existingPatient = $candidates->sortByDesc(function ($p) {
                        $score = 0;
                        if ($p->registered_user_id) $score += 25;
                        $score += \App\Models\PatientCareRecord::where('patient_id', $p->id)->count() * 10;
                        if ($p->barangay_id) $score += 5;
                        if (!empty($p->patient_birthdate)) $score += 3;
                        return $score;
                    })->first();
                }
            }

            if ($existingPatient) {
                $patient = $existingPatient;
                $updates = [];
                // Update birthdate if existing is empty OR if existing was synthetic (-01-01) and new is exact (not -01-01)
                $isCandSynthetic = ! empty($patient->patient_birthdate) && str_ends_with($patient->patient_birthdate, '-01-01');
                if ($birthdate && (empty($patient->patient_birthdate) || $isCandSynthetic)) {
                    $updates['birthdate'] = $birthdate;
                }
                if (empty($patient->gender) && in_array($validated['gender'] ?? '', ['male', 'female'])) {
                    $updates['gender'] = $validated['gender'];
                }
                if (! empty($homeAddress) && $addressCol) {
                    $newAddress = trim($homeAddress);
                    $oldAddress = trim($patient->{$addressCol} ?? $patient->home_address ?? '');
                    if (empty($oldAddress) || $newAddress !== $oldAddress) {
                        $updates[$addressCol] = $newAddress;
                    }
                }
                if (! empty($updates)) {
                    $patient->update($updates);
                }
                $status = 200;
                $message = 'Existing patient profile loaded';
            } else {
                // Check if this patient corresponds to a registered resident user
                $matchingUser = \App\Models\User::where('role', 'resident')
                    ->whereRaw('LOWER(TRIM(first_name)) = ?', [strtolower(trim($firstName))])
                    ->whereRaw('LOWER(TRIM(last_name)) = ?', [strtolower(trim($lastName))])
                    ->first();

                $createData = [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'birthdate' => $birthdate ?? $matchingUser?->birthdate,
                    'gender' => in_array($validated['gender'] ?? '', ['male', 'female']) ? $validated['gender'] : ($matchingUser?->gender ?? null),
                    'registered_user_id' => $matchingUser?->id,
                    'barangay_id' => $matchingUser?->residentProfile?->barangay_id,
                    'is_unidentified' => false,
                ];
                if ($addressCol) {
                    $createData[$addressCol] = $homeAddress ?? $matchingUser?->address;
                }
                $patient = Patient::create($createData);
                $status = 201;
                $message = 'Patient created successfully';
            }
        }

        $calculatedAge = ($patient->is_unidentified && ! empty($validated['age']))
            ? (string) $validated['age']
            : ($patient->birthdate
                ? Carbon::parse($patient->birthdate)->age
                : ($patient->registeredUser?->age ?? ($validated['age'] ?? null ? (int) $validated['age'] : null)));

        return response()->json([
            'message' => $message,
            'patient_id' => $patient->id,
            'id' => $patient->id,
            'first_name' => $patient->first_name,
            'last_name' => $patient->last_name,
            'birthdate' => $patient->birthdate,
            'age' => $calculatedAge,
            'gender' => $patient->gender,
            'address' => $patient->home_address ?? $homeAddress,
            'incident_address' => $patient->home_address ?? $homeAddress,
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
            'address' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:50',
        ]);

        $birthdate = $validated['birthdate'] ?? null;
        if (! $birthdate && ! empty($validated['age'])) {
            $birthdate = now()->subYears((int) $validated['age'])->format('Y-01-01');
        }

        $address = $validated['address'] ?? null;

        $updateData = [
            'patient_first_name' => trim($validated['first_name']),
            'patient_middle_name' => ! empty($validated['middle_name']) ? trim($validated['middle_name']) : null,
            'patient_last_name' => trim($validated['last_name']),
            'patient_birthdate' => $birthdate,
            'patient_gender' => $validated['gender'] ?? null,
            'is_unidentified' => false,
            'identified_at' => now(),
            'identified_by_role' => 'responder',
        ];
        if ($addressCol = Patient::addressColumn()) {
            $updateData[$addressCol] = $address ? mb_substr(trim($address), 0, 255) : null;
        }
        $patient->update($updateData);

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
                'address' => $patient->home_address,
                'is_unidentified' => false,
                'identified_at' => $patient->identified_at?->toISOString(),
                'identified_by_role' => 'responder',
            ],
        ]);
    }
}
