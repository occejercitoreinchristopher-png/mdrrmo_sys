<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $query = Incident::with([
            'incidentType',
            'resident.residentProfile.barangay',
            'locationCode.barangay',
            'dispatches.ambulance',
            'dispatches.crew',
            'dispatches.patientCareRecord',
            'dispatches.patientCareRecords',
        ]);

        // Period & Year Filters
        $period = $request->input('period', 'all');
        $selectedYear = $request->input('year');

        if ($selectedYear && is_numeric($selectedYear)) {
            $query->whereYear('reported_at', (int) $selectedYear);
        } elseif ($period === 'today') {
            $query->whereDate('reported_at', now()->toDateString());
        } elseif ($period === 'this_week') {
            $query->whereBetween('reported_at', [
                now()->startOfWeek()->startOfDay()->toDateTimeString(),
                now()->endOfWeek()->endOfDay()->toDateTimeString(),
            ]);
        } elseif ($period === 'this_month') {
            $query->whereBetween('reported_at', [
                now()->startOfMonth()->startOfDay()->toDateTimeString(),
                now()->endOfMonth()->endOfDay()->toDateTimeString(),
            ]);
        } elseif ($period === 'this_year') {
            $query->whereYear('reported_at', (int) now()->format('Y'));
        } else {
            // Custom Date Range Filter
            if ($request->filled('date_from')) {
                $query->whereDate('reported_at', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate('reported_at', '<=', $request->date_to);
            }
        }

        // Search Filter
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($sq) use ($search) {
                if (is_numeric(ltrim($search, '#'))) {
                    $sq->orWhere('id', (int) ltrim($search, '#'));
                }
                $sq->orWhere('incident_address', 'LIKE', "%{$search}%")
                   ->orWhere('incident_description', 'LIKE', "%{$search}%")
                   ->orWhereHas('incidentType', fn($tq) => $tq->where('incident_type_name', 'LIKE', "%{$search}%"))
                   ->orWhereHas('resident', fn($rq) => $rq->where('first_name', 'LIKE', "%{$search}%")->orWhere('last_name', 'LIKE', "%{$search}%"));
            });
        }

        // Priority Filter
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Incident Type Filter
        if ($request->filled('incident_type_id')) {
            $query->where('incident_type_id', $request->incident_type_id);
        }

        // Status Filter
        if ($request->filled('status')) {
            $query->where('incident_status', $request->status);
        }

        // Barangay Filter directly in SQL
        if ($request->filled('barangay')) {
            $barangay = $request->barangay;
            $query->where(function ($bq) use ($barangay) {
                $bq->whereHas('resident.residentProfile.barangay', fn($q) => $q->where('barangay_name', $barangay))
                   ->orWhereHas('locationCode.barangay', fn($q) => $q->where('barangay_name', $barangay))
                   ->orWhere('incident_address', 'LIKE', "%{$barangay}%");
            });
        }

        // Responder Filter directly in SQL
        if ($request->filled('responder_id')) {
            $responderId = (int) $request->responder_id;
            $query->whereHas('dispatches', function ($dq) use ($responderId) {
                $dq->where('driver_id', $responderId)
                   ->orWhere('emt_id', $responderId)
                   ->orWhereHas('crew', fn($cq) => $cq->where('users.id', $responderId));
            });
        }

        // Ambulance Filter directly in SQL
        if ($request->filled('ambulance_id')) {
            $ambulanceId = (int) $request->ambulance_id;
            $query->whereHas('dispatches', fn($dq) => $dq->where('ambulance_id', $ambulanceId));
        }

        // Retrieve filtered incidents from SQL
        $incidents = $query->latest('reported_at')->get();

        // Calculate Overview Stats
        $totalIncidents = $incidents->count();
        $verifiedCount = $incidents->whereNotIn('incident_status', ['pending', 'rejected'])->count();
        $resolvedCount = $incidents->where('incident_status', 'resolved')->count();
        $rejectedCount = $incidents->where('incident_status', 'rejected')->count();

        $dispatchTimes = [];
        $responseTimes = [];
        $missionDurations = [];
        $patientsAttended = 0;
        $patientsTransported = 0;
        $patientsNotTransported = 0;
        $chiefComplaints = [];

        foreach ($incidents as $incident) {
            foreach ($incident->dispatches as $dispatch) {
                if ($incident->verified_at && $dispatch->assigned_at) {
                    $dispatchTimes[] = $incident->verified_at->diffInSeconds($dispatch->assigned_at);
                }
                if ($dispatch->en_route_at && $dispatch->arrived_at) {
                    $responseTimes[] = $dispatch->en_route_at->diffInSeconds($dispatch->arrived_at);
                }
                if ($dispatch->en_route_at && $dispatch->completed_at) {
                    $missionDurations[] = $dispatch->en_route_at->diffInSeconds($dispatch->completed_at);
                }

                $pcrs = $dispatch->relationLoaded('patientCareRecords') && $dispatch->patientCareRecords->isNotEmpty()
                    ? $dispatch->patientCareRecords
                    : ($dispatch->patientCareRecord ? collect([$dispatch->patientCareRecord]) : collect());

                foreach ($pcrs as $pcrItem) {
                    $patientsAttended++;
                    $disp = $pcrItem->disposition ?? [];
                    if (is_string($disp)) {
                        $disp = json_decode($disp, true) ?? [];
                    }
                    if (!empty($disp['transport_decision'])) {
                        if ($disp['transport_decision'] === 'Transported') {
                            $patientsTransported++;
                        } else {
                            $patientsNotTransported++;
                        }
                    }

                    $cc = $pcrItem->clinical_chief_complaint;
                    if ($cc) {
                        $chiefComplaints[$cc] = ($chiefComplaints[$cc] ?? 0) + 1;
                    }
                }
            }
        }

        arsort($chiefComplaints);

        $stats = [
            'total_incidents' => $totalIncidents,
            'verified_count' => $verifiedCount,
            'resolved_count' => $resolvedCount,
            'rejected_count' => $rejectedCount,
            'total_dispatches' => $incidents->sum(fn($i) => $i->dispatches->count()),
            'avg_dispatch_time' => count($dispatchTimes) > 0 ? array_sum($dispatchTimes) / count($dispatchTimes) : 0,
            'avg_response_time' => count($responseTimes) > 0 ? array_sum($responseTimes) / count($responseTimes) : 0,
            'avg_mission_duration' => count($missionDurations) > 0 ? array_sum($missionDurations) / count($missionDurations) : 0,
            'patients_attended' => $patientsAttended,
            'patients_transported' => $patientsTransported,
            'patients_not_transported' => $patientsNotTransported,
            'chief_complaints' => array_slice($chiefComplaints, 0, 10),
        ];

        // Lookup Tables for Filters
        $currentYearNum = (int) now()->format('Y');
        $yearsInDb = Incident::whereNotNull('reported_at')->selectRaw('YEAR(reported_at) as year')->distinct()->pluck('year')->filter()->map(fn($y) => (int) $y)->toArray();
        if (!in_array($currentYearNum, $yearsInDb)) {
            $yearsInDb[] = $currentYearNum;
        }
        for ($y = $currentYearNum; $y >= $currentYearNum - 4; $y--) {
            if (!in_array($y, $yearsInDb)) {
                $yearsInDb[] = $y;
            }
        }
        rsort($yearsInDb);

        $lookups = [
            'barangays' => collect(Incident::OPOL_BARANGAYS)->map(fn($b) => ['id' => $b, 'name' => $b]),
            'incident_types' => \App\Models\IncidentType::all(['id', 'incident_type_name']),
            'ambulances' => Ambulance::all(['id', 'plate_number', 'vehicle_type']),
            'responders' => User::where('role', 'responder')->get(['id', 'first_name', 'last_name']),
            'available_years' => array_values($yearsInDb),
        ];

        $geojsonPath = resource_path('data/opol_barangays.json');
        $barangayGeojson = file_exists($geojsonPath) ? json_decode(file_get_contents($geojsonPath), true) : null;

        $monthlyReportService = new \App\Services\MonthlyReportService();
        $currentYear = (int) ($request->input('year') ?: now()->format('Y'));
        $monthlyReportData = $monthlyReportService->getFullYearReport($currentYear);

        return Inertia::render('admin/Reports', [
            'stats' => $stats,
            'incidents' => $incidents->values(),
            'lookups' => $lookups,
            'barangayGeojson' => $barangayGeojson,
            'filters' => $request->only(['period', 'year', 'date_from', 'date_to', 'barangay', 'incident_type_id', 'status', 'responder_id', 'ambulance_id', 'priority', 'search']),
            'monthlyReportData' => $monthlyReportData,
        ]);
    }

    public function monthlySummary(Request $request, \App\Services\MonthlyReportService $service)
    {
        $customCategories = [];
        if ($request->filled('custom_categories')) {
            $raw = $request->input('custom_categories');
            $customCategories = is_string($raw) ? json_decode($raw, true) : (array) $raw;
        }

        $customIncidents = [];
        if ($request->filled('custom_incidents')) {
            $raw = $request->input('custom_incidents');
            $customIncidents = is_string($raw) ? json_decode($raw, true) : (array) $raw;
        }

        $params = [
            'period' => $request->query('period', 'yearly'),
            'year' => (int) ($request->query('year') ?: now()->format('Y')),
            'month' => (int) ($request->query('month') ?: now()->format('n')),
            'date' => $request->query('date', now()->format('Y-m-d')),
            'custom_categories' => $customCategories ?: [],
            'custom_incidents' => $customIncidents ?: [],
        ];

        $data = $service->getFilteredReport($params);

        return response()->json($data);
    }
}
