<?php

namespace App\Http\Controllers\Dispatcher;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResidentController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', 'resident')
            ->with(['residentProfile.barangay'])
            ->withCount('reportedIncidents');

        // Search query (partial, case-insensitive)
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhereHas('residentProfile.barangay', function ($bq) use ($search) {
                        $bq->where('barangay_name', 'like', "%{$search}%");
                    });
            });
        }

        // Barangay filter
        if ($request->filled('barangay')) {
            $barangay = $request->barangay;
            $query->whereHas('residentProfile', function ($rq) use ($barangay) {
                if (is_numeric($barangay)) {
                    $rq->where('barangay_id', $barangay);
                } else {
                    $rq->whereHas('barangay', function ($bq) use ($barangay) {
                        $bq->where('barangay_name', $barangay);
                    });
                }
            });
        }

        // Sorting
        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');
        if (! in_array(strtolower($direction), ['asc', 'desc'])) {
            $direction = 'desc';
        }

        if ($sort === 'name') {
            $query->orderBy('first_name', $direction)->orderBy('last_name', $direction);
        } elseif ($sort === 'reported_incidents_count' || $sort === 'incidents_count') {
            $query->orderBy('reported_incidents_count', $direction);
        } elseif (in_array($sort, ['email', 'phone_number', 'status', 'created_at'])) {
            $query->orderBy($sort, $direction);
        } else {
            $query->latest('created_at');
        }

        $residents = $query->paginate(15)->withQueryString();
        $barangays = Barangay::orderBy('barangay_name')->get(['id', 'barangay_name']);

        return Inertia::render('dispatcher/Residents', [
            'residents' => $residents,
            'barangays' => $barangays,
            'filters' => [
                'search' => $request->search ?? '',
                'barangay' => $request->barangay ?? '',
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    public function show(User $resident)
    {
        if ($resident->role !== 'resident') {
            abort(404, 'Resident not found.');
        }

        $resident->load(['residentProfile.barangay']);
        $resident->loadCount('reportedIncidents');

        // Strictly fetch incidents associated with this resident
        $incidents = $resident->reportedIncidents()
            ->with([
                'resident',
                'incidentType',
                'images',
                'dispatches' => function ($q) {
                    $q->with(['ambulance', 'driver', 'emt', 'teamLeader', 'patientCareRecord']);
                },
            ])
            ->latest('reported_at')
            ->get();

        return Inertia::render('dispatcher/ResidentDetails', [
            'resident' => $resident,
            'incidents' => $incidents,
        ]);
    }
}
