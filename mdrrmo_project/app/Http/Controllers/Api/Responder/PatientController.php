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
                $q->where(DB::raw("CONCAT(first_name, ' ', last_name)"), 'LIKE', "%{$query}%")
                    ->orWhere('first_name', 'LIKE', "%{$query}%")
                    ->orWhere('last_name', 'LIKE', "%{$query}%")
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

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'birthdate' => 'nullable|date',
            'age' => 'nullable|numeric',
            'gender' => 'nullable|string|in:male,female',
            'address' => 'nullable|string',
            'incident_address' => 'nullable|string',
            'contact_number' => 'nullable|string',
        ]);

        $firstName = trim($validated['first_name']);
        $lastName = trim($validated['last_name']);

        $birthdate = $validated['birthdate'] ?? null;
        if (! $birthdate && ! empty($validated['age'])) {
            $birthdate = now()->subYears((int) $validated['age'])->format('Y-01-01');
        }

        $street = $validated['address'] ?? $validated['incident_address'] ?? null;

        // Prevent duplicates: Check if patient already exists by first_name and last_name (case-insensitive)
        $existingPatient = Patient::whereRaw('LOWER(first_name) = ?', [strtolower($firstName)])
            ->whereRaw('LOWER(last_name) = ?', [strtolower($lastName)])
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
            if (empty($patient->street) && ! empty($street)) {
                $updates['street'] = $street;
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
            ]);
            $status = 201;
            $message = 'Patient created successfully';
        }

        $calculatedAge = $patient->birthdate
            ? Carbon::parse($patient->birthdate)->age
            : ($validated['age'] ?? null ? (int) $validated['age'] : null);

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
        ], $status);
    }
}
