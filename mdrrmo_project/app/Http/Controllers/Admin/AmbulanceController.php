<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Dispatch;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AmbulanceController extends Controller
{
    public function index(Request $request)
    {
        $ambulances = Ambulance::latest()->paginate(10)->withQueryString();

        return Inertia::render('admin/Ambulances', [
            'ambulances' => $ambulances->items(),
            'pagination' => [
                'currentPage' => $ambulances->currentPage(),
                'lastPage' => $ambulances->lastPage(),
                'perPage' => $ambulances->perPage(),
                'total' => $ambulances->total(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ambulance_code' => ['required', 'string', 'max:255', Rule::unique('ambulances')->whereNull('deleted_at')],
            'plate_number' => ['required', 'string', 'max:255', Rule::unique('ambulances')->whereNull('deleted_at')],
            'vehicle_name' => 'required|string|max:255',
            'vehicle_type' => 'required|string|max:255',
            'status' => ['required', Rule::in(['available', 'dispatched', 'maintenance'])],
        ]);

        Ambulance::create($validated);

        return back()->with('success', 'Ambulance created successfully.');
    }

    public function update(Request $request, Ambulance $ambulance)
    {
        $validated = $request->validate([
            'ambulance_code' => ['required', 'string', 'max:255', Rule::unique('ambulances')->ignore($ambulance->id)->whereNull('deleted_at')],
            'plate_number' => ['required', 'string', 'max:255', Rule::unique('ambulances')->ignore($ambulance->id)->whereNull('deleted_at')],
            'vehicle_name' => 'required|string|max:255',
            'vehicle_type' => 'required|string|max:255',
            'status' => ['required', Rule::in(['available', 'dispatched', 'maintenance'])],
        ]);

        if ($request->status !== $ambulance->status) {
            $activeDispatches = Dispatch::where('ambulance_id', $ambulance->id)
                ->whereIn('dispatch_status', ['assigned', 'accepted', 'en_route', 'arrived_on_scene'])
                ->exists();

            if ($activeDispatches) {
                return back()->with('error', 'Cannot change ambulance status while it is assigned to an active emergency dispatch. Please resolve or cancel the dispatch first.');
            }
        }

        $ambulance->update($validated);

        return back()->with('success', 'Ambulance updated successfully.');
    }

    public function destroy(Ambulance $ambulance)
    {
        $activeDispatches = Dispatch::where('ambulance_id', $ambulance->id)
            ->whereIn('dispatch_status', ['assigned', 'accepted', 'en_route', 'arrived_on_scene'])
            ->exists();

        if ($activeDispatches) {
            return back()->with('error', 'Cannot delete ambulance while it is assigned to an active emergency dispatch. Please resolve or cancel the dispatch first.');
        }

        $ambulance->delete();

        return back()->with('success', 'Ambulance deleted successfully.');
    }
}
