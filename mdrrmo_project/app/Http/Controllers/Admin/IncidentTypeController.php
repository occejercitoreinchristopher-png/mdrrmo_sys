<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IncidentType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class IncidentTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = IncidentType::query()->withCount('incidents');

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('incident_type_name', 'like', "%{$search}%")
                    ->orWhere('type_description', 'like', "%{$search}%");
            });
        }

        $incidentTypes = $query->orderBy('id', 'asc')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('admin/IncidentTypes', [
            'incidentTypes' => $incidentTypes->items(),
            'pagination' => [
                'currentPage' => $incidentTypes->currentPage(),
                'lastPage' => $incidentTypes->lastPage(),
                'perPage' => $incidentTypes->perPage(),
                'total' => $incidentTypes->total(),
            ],
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'incident_type_name' => ['required', 'string', 'max:100', 'unique:incident_types,incident_type_name'],
            'type_description' => ['nullable', 'string', 'max:255'],
        ]);

        $type = IncidentType::create([
            'incident_type_name' => trim($validated['incident_type_name']),
            'type_description' => isset($validated['type_description']) ? trim($validated['type_description']) : null,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Emergency incident type created successfully.',
                'incident_type' => $type,
            ]);
        }

        return back()->with('success', 'Emergency incident type created successfully.');
    }

    public function update(Request $request, IncidentType $incidentType)
    {
        $validated = $request->validate([
            'incident_type_name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('incident_types', 'incident_type_name')->ignore($incidentType->id),
            ],
            'type_description' => ['nullable', 'string', 'max:255'],
        ]);

        $incidentType->update([
            'incident_type_name' => trim($validated['incident_type_name']),
            'type_description' => isset($validated['type_description']) ? trim($validated['type_description']) : null,
        ]);

        return back()->with('success', 'Emergency incident type updated successfully.');
    }

    public function destroy(IncidentType $incidentType)
    {
        $incidentCount = $incidentType->incidents()->count();

        if ($incidentCount > 0) {
            return back()->with('error', "Cannot delete \"{$incidentType->incident_type_name}\" because it is linked to {$incidentCount} incident record(s).");
        }

        $incidentType->delete();

        return back()->with('success', 'Emergency incident type deleted successfully.');
    }
}

