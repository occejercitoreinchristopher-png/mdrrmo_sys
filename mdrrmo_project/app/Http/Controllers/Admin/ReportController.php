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
        ]);

        // Date Range Filter
        if ($request->filled('date_from')) {
            $query->whereDate('reported_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('reported_at', '<=', $request->date_to);
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
                   ->orWhere('incident_address', 'LIKE', "%{$barangay}%")
                   ->orWhere('place_of_incident', 'LIKE', "%{$barangay}%");
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

                if ($dispatch->patientCareRecord) {
                    $patientsAttended++;
                    $disp = $dispatch->patientCareRecord->disposition ?? [];
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

                    $cc = $dispatch->patientCareRecord->clinical_chief_complaint;
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
            'avg_dispatch_time' => count($dispatchTimes) > 0 ? array_sum($dispatchTimes) / count($dispatchTimes) : 0,
            'avg_response_time' => count($responseTimes) > 0 ? array_sum($responseTimes) / count($responseTimes) : 0,
            'avg_mission_duration' => count($missionDurations) > 0 ? array_sum($missionDurations) / count($missionDurations) : 0,
            'patients_attended' => $patientsAttended,
            'patients_transported' => $patientsTransported,
            'patients_not_transported' => $patientsNotTransported,
            'chief_complaints' => array_slice($chiefComplaints, 0, 10),
        ];

        // Lookup Tables for Filters
        $lookups = [
            'barangays' => collect(Incident::OPOL_BARANGAYS)->map(fn($b) => ['id' => $b, 'name' => $b]),
            'incident_types' => \App\Models\IncidentType::all(['id', 'incident_type_name']),
            'ambulances' => Ambulance::all(['id', 'plate_number', 'vehicle_type']),
            'responders' => User::where('role', 'responder')->get(['id', 'first_name', 'last_name']),
        ];

        $geojsonPath = resource_path('data/opol_barangays.json');
        $barangayGeojson = file_exists($geojsonPath) ? json_decode(file_get_contents($geojsonPath), true) : null;

        return Inertia::render('admin/Reports', [
            'stats' => $stats,
            'incidents' => $incidents->values(),
            'lookups' => $lookups,
            'barangayGeojson' => $barangayGeojson,
            'filters' => $request->only(['date_from', 'date_to', 'barangay', 'incident_type_id', 'status', 'responder_id', 'ambulance_id']),
        ]);
    }
}
