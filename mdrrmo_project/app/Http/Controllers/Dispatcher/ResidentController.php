<?php

namespace App\Http\Controllers\Dispatcher;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\Incident;
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

        // Fetch anonymous SIM/phone callers grouped by phone number with call count
        $simSearch = $request->filled('sim_search') ? trim($request->sim_search) : null;

        $simCallersRaw = Incident::whereNull('resident_id')
            ->where('report_source', 'phone_sim')
            ->whereNotNull('caller_phone_number')
            ->when($simSearch, function ($q) use ($simSearch) {
                $q->where(function ($inner) use ($simSearch) {
                    $inner->where('caller_phone_number', 'like', "%{$simSearch}%")
                          ->orWhere('caller_name', 'like', "%{$simSearch}%");
                });
            })
            ->selectRaw('
                caller_phone_number,
                MAX(caller_name) as caller_name,
                COUNT(*) as total_calls,
                MAX(reported_at) as last_called_at,
                MAX(id) as latest_incident_id
            ')
            ->groupBy('caller_phone_number')
            ->orderByDesc('total_calls')
            ->orderByDesc('last_called_at')
            ->paginate(15, ['*'], 'sim_page')
            ->withQueryString();

        // Attach latest incident type for each grouped caller
        $latestIncidentIds = $simCallersRaw->pluck('latest_incident_id')->filter()->values();
        $latestIncidents = Incident::whereIn('id', $latestIncidentIds)
            ->with('incidentType')
            ->get()
            ->keyBy('id');

        $simCallers = $simCallersRaw->through(function ($row) use ($latestIncidents) {
            $latest = $latestIncidents->get($row->latest_incident_id);
            $row->incident_type = $latest?->incidentType;
            $row->place_of_incident = $latest?->place_of_incident;
            $row->incident_address = $latest?->incident_address;
            $row->incident_status = $latest?->incident_status ?? 'verified';
            return $row;
        });

        return Inertia::render('dispatcher/Residents', [
            'residents' => $residents,
            'barangays' => $barangays,
            'filters' => [
                'search' => $request->search ?? '',
                'barangay' => $request->barangay ?? '',
                'sort' => $sort,
                'direction' => $direction,
                'sim_search' => $request->sim_search ?? '',
            ],
            'simCallers' => $simCallers,
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
