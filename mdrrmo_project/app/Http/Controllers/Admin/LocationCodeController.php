<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\LocationCode;
use Illuminate\Http\Request;

class LocationCodeController extends Controller
{
    /**
     * Get paginated location codes for a specific barangay with search and filtering.
     */
    public function index(Request $request, Barangay $barangay)
    {
        $search = trim($request->input('search', ''));
        $type = trim($request->input('type', ''));
        $perPage = max(5, min(100, (int) $request->input('per_page', 15)));

        $query = $barangay->locationCodes();

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('location_code', 'like', "%{$search}%")
                    ->orWhere('location_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($type)) {
            $query->where('location_type', $type);
        }

        $paginator = $query->orderBy('location_code', 'asc')->paginate($perPage);

        $transformedData = collect($paginator->items())->map(function ($lc) use ($barangay) {
            return [
                'id' => $lc->id,
                'barangay_id' => $lc->barangay_id,
                'barangay_name' => $barangay->barangay_name,
                'location_code' => $lc->location_code,
                'location_type' => $lc->location_type,
                'location_name' => $lc->location_name,
                'description' => $lc->description,
                'latitude' => (float) $lc->latitude,
                'longitude' => (float) $lc->longitude,
                'created_at' => $lc->created_at?->toISOString(),
                'updated_at' => $lc->updated_at?->toISOString(),
            ];
        });

        return response()->json([
            'barangay' => [
                'id' => $barangay->id,
                'name' => $barangay->barangay_name,
            ],
            'data' => $transformedData,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem() ?? 0,
            'to' => $paginator->lastItem() ?? 0,
        ]);
    }

    /**
     * Store a newly created location code under the specified barangay.
     */
    public function store(Request $request, Barangay $barangay)
    {
        $request->merge([
            'location_code' => trim(strtoupper($request->input('location_code', ''))),
            'location_name' => trim($request->input('location_name', '')),
        ]);

        $validated = $request->validate([
            'location_code' => [
                'required',
                'string',
                'max:100',
                'unique:location_codes,location_code',
            ],
            'location_type' => ['required', 'string', 'max:100'],
            'location_name' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'description' => ['nullable', 'string', 'max:1000'],
        ], [
            'location_code.required' => 'The location code is required.',
            'location_code.unique' => 'This location code already exists. Please enter a unique location code.',
            'location_type.required' => 'Please select a location type.',
            'location_name.required' => 'The location name is required.',
            'latitude.required' => 'Latitude is required. Please specify coordinates or pick on map.',
            'latitude.numeric' => 'Latitude must be a valid numeric coordinate.',
            'longitude.required' => 'Longitude is required. Please specify coordinates or pick on map.',
            'longitude.numeric' => 'Longitude must be a valid numeric coordinate.',
        ]);

        $locationCode = $barangay->locationCodes()->create([
            'location_code' => $validated['location_code'],
            'location_type' => $validated['location_type'],
            'location_name' => $validated['location_name'],
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', "Location code {$locationCode->location_code} added successfully.");
    }

    /**
     * Update an existing location code.
     */
    public function update(Request $request, LocationCode $locationCode)
    {
        $request->merge([
            'location_code' => trim(strtoupper($request->input('location_code', ''))),
            'location_name' => trim($request->input('location_name', '')),
        ]);

        $validated = $request->validate([
            'location_code' => [
                'required',
                'string',
                'max:100',
                'unique:location_codes,location_code,' . $locationCode->id,
            ],
            'location_type' => ['required', 'string', 'max:100'],
            'location_name' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'description' => ['nullable', 'string', 'max:1000'],
            'barangay_id' => ['nullable', 'exists:barangays,id'],
        ], [
            'location_code.required' => 'The location code is required.',
            'location_code.unique' => 'This location code already exists. Please enter a unique location code.',
            'location_type.required' => 'Please select a location type.',
            'location_name.required' => 'The location name is required.',
            'latitude.required' => 'Latitude is required. Please specify coordinates or pick on map.',
            'latitude.numeric' => 'Latitude must be a valid numeric coordinate.',
            'longitude.required' => 'Longitude is required. Please specify coordinates or pick on map.',
            'longitude.numeric' => 'Longitude must be a valid numeric coordinate.',
        ]);

        $updateData = [
            'location_code' => $validated['location_code'],
            'location_type' => $validated['location_type'],
            'location_name' => $validated['location_name'],
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'description' => $validated['description'] ?? null,
        ];

        if (! empty($validated['barangay_id'])) {
            $updateData['barangay_id'] = $validated['barangay_id'];
        }

        $locationCode->update($updateData);

        return back()->with('success', "Location code {$locationCode->location_code} updated successfully.");
    }

    /**
     * Delete a location code (does not delete the barangay).
     */
    public function destroy(LocationCode $locationCode)
    {
        $code = $locationCode->location_code;
        $locationCode->delete();

        return back()->with('success', "Location code {$code} deleted successfully.");
    }
}
