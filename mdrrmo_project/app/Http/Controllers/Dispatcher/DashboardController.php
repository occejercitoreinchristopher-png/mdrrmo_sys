<?php

namespace App\Http\Controllers\Dispatcher;

use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\Patient;
use App\Models\PatientCareRecord;
use App\Models\ResponderProfile;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $now = Carbon::now();
        $startOfThisMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // Core Incident Metrics
        $totalIncidents = Incident::count();
        $activeIncidents = Incident::whereIn('incident_status', ['pending', 'verified', 'assigned', 'responding'])->count();
        $pendingDispatch = Incident::whereIn('incident_status', ['pending', 'verified'])->count();
        $resolvedIncidents = Incident::where('incident_status', 'resolved')->count();
        $resolvedToday = Incident::where('incident_status', 'resolved')
            ->where(function ($q) {
                $q->whereDate('resolved_at', today())
                    ->orWhere(function ($sub) {
                        $sub->whereNull('resolved_at')->whereDate('updated_at', today());
                    });
            })
            ->count();
        $resolutionRate = $totalIncidents > 0 ? round(($resolvedIncidents / $totalIncidents) * 100) : 0;

        $incidentsThisMonth = Incident::where('created_at', '>=', $startOfThisMonth)->count();
        $incidentsLastMonth = Incident::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();
        $incidentsTrend = $incidentsLastMonth > 0
            ? round((($incidentsThisMonth - $incidentsLastMonth) / $incidentsLastMonth) * 100)
            : ($incidentsThisMonth > 0 ? 100 : 0);

        // Resident User Metrics
        $totalResidents = User::where('role', 'resident')->count();
        $verifiedResidents = User::where('role', 'resident')->where('verification_status', 'Verified')->count();
        $pendingResidents = max(0, $totalResidents - $verifiedResidents);
        $activeResidentReporters = User::where('role', 'resident')->has('reportedIncidents')->count();

        $residentsThisMonth = User::where('role', 'resident')->where('created_at', '>=', $startOfThisMonth)->count();
        $residentsLastMonth = User::where('role', 'resident')->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();
        $residentsTrend = $residentsLastMonth > 0
            ? round((($residentsThisMonth - $residentsLastMonth) / $residentsLastMonth) * 100)
            : ($residentsThisMonth > 0 ? 100 : 0);

        // Fleet, Dispatch, Responder & Patient Metrics (exclude station walk-in placeholder from vehicle fleet counts)
        $fleetQuery = fn () => Ambulance::where('plate_number', '!=', 'WALK-IN')
            ->where(function ($q) {
                $q->whereNull('vehicle_type')
                    ->orWhere('vehicle_type', '!=', 'Station');
            })
            ->where(function ($q) {
                $q->whereNull('ambulance_code')
                    ->orWhere(function ($sub) {
                        $sub->where('ambulance_code', 'not like', '%STATION%')
                            ->where('ambulance_code', 'not like', '%WALK%');
                    });
            });

        $totalAmbulances = $fleetQuery()->count();
        $availableAmbulances = $fleetQuery()->where('status', 'available')->count();
        $totalDispatches = Dispatch::count();
        $activeDispatches = Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])->count();
        $completedDispatches = Dispatch::where('dispatch_status', 'completed')->count();
        $completedDispatchesToday = Dispatch::where('dispatch_status', 'completed')
            ->whereDate('completed_at', today())
            ->count();
        $totalResponders = User::whereIn('role', ['responder', 'team_leader', 'emt', 'driver'])->count();
        $availableResponders = ResponderProfile::where('availability', 'available')->count();
        $totalPatients = Patient::count();
        $totalPcrs = PatientCareRecord::count();
        $simCallerReports = Incident::where('report_source', 'phone_sim')->count();

        // Top Resident Reporters (ranked by resolved reports, then total reports)
        $topResidents = User::where('role', 'resident')
            ->with(['residentProfile.barangay'])
            ->withCount([
                'reportedIncidents as total_reports',
                'reportedIncidents as resolved_reports' => fn ($q) => $q->where('incident_status', 'resolved'),
                'reportedIncidents as active_reports' => fn ($q) => $q->whereIn('incident_status', ['pending', 'verified', 'assigned', 'responding']),
            ])
            ->having('total_reports', '>', 0)
            ->orderByDesc('resolved_reports')
            ->orderByDesc('total_reports')
            ->take(10)
            ->get()
            ->map(function (User $res) {
                $total = (int) $res->total_reports;
                $resolved = (int) $res->resolved_reports;
                $active = (int) $res->active_reports;

                return [
                    'id' => $res->id,
                    'first_name' => $res->first_name,
                    'last_name' => $res->last_name,
                    'name' => trim("{$res->first_name} {$res->last_name}"),
                    'initials' => strtoupper(($res->first_name[0] ?? 'R') . ($res->last_name[0] ?? '')),
                    'profile_photo_url' => $res->profile_photo_url,
                    'barangay' => $res->residentProfile?->barangay?->barangay_name ?? 'Unassigned',
                    'is_verified' => ($res->verification_status ?? 'Pending') === 'Verified',
                    'total_reports' => $total,
                    'resolved_reports' => $resolved,
                    'active_reports' => $active,
                    'resolution_rate' => $total > 0 ? round(($resolved / $total) * 100) : 0,
                ];
            })
            ->values()
            ->toArray();

        $topResolvedResident = $topResidents[0] ?? null;

        $stats = [
            'total_incidents' => $totalIncidents,
            'active_incidents' => $activeIncidents,
            'pending_incidents' => Incident::where('incident_status', 'pending')->count(),
            'verified_incidents' => Incident::where('incident_status', 'verified')->count(),
            'assigned_incidents' => Incident::where('incident_status', 'assigned')->count(),
            'responding_incidents' => Incident::where('incident_status', 'responding')->count(),
            'cancelled_incidents' => Incident::where('incident_status', 'cancelled')->count(),
            'rejected_incidents' => Incident::where('incident_status', 'rejected')->count(),
            'pending_dispatch' => $pendingDispatch,
            'resolved_incidents' => $resolvedIncidents,
            'resolved_today' => $resolvedToday,
            'resolution_rate' => $resolutionRate,
            'incidents_trend' => $incidentsTrend,
            'total_residents' => $totalResidents,
            'verified_residents' => $verifiedResidents,
            'pending_residents' => $pendingResidents,
            'active_resident_reporters' => $activeResidentReporters,
            'residents_trend' => $residentsTrend,
            'total_ambulances' => $totalAmbulances,
            'available_ambulances' => $availableAmbulances,
            'total_dispatches' => $totalDispatches,
            'active_dispatches' => $activeDispatches,
            'completed_dispatches' => $completedDispatches,
            'completed_dispatches_today' => $completedDispatchesToday,
            'total_responders' => $totalResponders,
            'available_responders' => $availableResponders,
            'total_patients' => $totalPatients,
            'total_pcrs' => $totalPcrs,
            'sim_caller_reports' => $simCallerReports,
            'top_resolved_resident' => $topResolvedResident,
        ];

        // 6-Month Aggregated Incident, Resolved & Dispatch Trend
        $monthlyCategories = [];
        $monthlyIncidentData = [];
        $monthlyResolvedData = [];
        $monthlyDispatchData = [];

        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $monthlyCategories[] = $month->format('M Y');

            $monthlyIncidentData[] = Incident::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->count();

            $monthlyResolvedData[] = Incident::where('incident_status', 'resolved')
                ->where(function ($q) use ($month) {
                    $q->where(function ($r) use ($month) {
                        $r->whereNotNull('resolved_at')
                            ->whereYear('resolved_at', $month->year)
                            ->whereMonth('resolved_at', $month->month);
                    })->orWhere(function ($u) use ($month) {
                        $u->whereNull('resolved_at')
                            ->whereYear('updated_at', $month->year)
                            ->whereMonth('updated_at', $month->month);
                    });
                })
                ->count();

            $monthlyDispatchData[] = Dispatch::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->count();
        }

        // Real Incident Types Distribution (Resolved Cases Only)
        $incidentTypes = IncidentType::withCount([
            'incidents' => fn ($q) => $q->where('incident_status', 'resolved'),
        ])
            ->orderByDesc('incidents_count')
            ->get()
            ->map(fn ($type) => [
                'id' => $type->id,
                'name' => $type->name ?? $type->incident_type_name,
                'count' => (int) $type->incidents_count,
            ])
            ->values()
            ->toArray();

        // Top Barangays by Incident Count
        $barangayCounts = [];
        $allIncidents = Incident::with(['resident.residentProfile.barangay'])->get();
        foreach ($allIncidents as $inc) {
            $b = $inc->barangay;
            if (empty($b) || strtolower($b) === 'unknown') {
                $b = 'Unassigned';
            }
            $barangayCounts[$b] = ($barangayCounts[$b] ?? 0) + 1;
        }
        arsort($barangayCounts);
        $topBarangays = [];
        foreach (array_slice($barangayCounts, 0, 6, true) as $name => $count) {
            $topBarangays[] = ['name' => $name, 'count' => $count];
        }

        // Report Sources Breakdown
        $residentAppReports = Incident::where('report_source', 'resident_app')->count();
        $phoneSimReports = $simCallerReports;
        $dispatcherWalkInReports = Incident::whereIn('report_source', ['dispatcher', 'walk_in'])->count();
        $otherReports = max(0, $totalIncidents - ($residentAppReports + $phoneSimReports + $dispatcherWalkInReports));

        $charts = [
            'monthly_incidents' => [
                'categories' => $monthlyCategories,
                'data' => $monthlyIncidentData,
            ],
            'monthly_resolved' => [
                'categories' => $monthlyCategories,
                'data' => $monthlyResolvedData,
            ],
            'monthly_dispatches' => [
                'categories' => $monthlyCategories,
                'data' => $monthlyDispatchData,
            ],
            'incident_types' => $incidentTypes,
            'dispatch_status' => [
                'labels' => ['Completed', 'On Scene', 'En Route', 'Assigned'],
                'data' => [
                    $completedDispatches,
                    Dispatch::where('dispatch_status', 'arrived_on_scene')->count(),
                    Dispatch::where('dispatch_status', 'en_route')->count(),
                    Dispatch::where('dispatch_status', 'assigned')->count(),
                ],
            ],
            'report_sources' => [
                ['name' => 'Resident App', 'count' => $residentAppReports],
                ['name' => 'Phone / SIM Call', 'count' => $phoneSimReports],
                ['name' => 'Dispatcher / Walk-In', 'count' => $dispatcherWalkInReports + $otherReports],
            ],
            'top_barangays' => $topBarangays,
        ];

        $community = [
            'top_residents' => $topResidents,
            'total_residents' => $totalResidents,
            'verified_residents' => $verifiedResidents,
            'pending_residents' => $pendingResidents,
            'active_reporters' => $activeResidentReporters,
            'sim_caller_reports' => $simCallerReports,
            'verification_rate' => $totalResidents > 0 ? round(($verifiedResidents / $totalResidents) * 100) : 0,
        ];

        $recentIncidents = Incident::with(['resident', 'incidentType'])->latest()->take(5)->get();
        $recentDispatches = Dispatch::with(['ambulance', 'incident', 'driver', 'teamLeader'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function (Dispatch $d) {
                return [
                    'id' => $d->id,
                    'status' => $d->dispatch_status ?? 'assigned',
                    'dispatched_at' => $d->assigned_at ?? $d->created_at,
                    'ambulance' => $d->ambulance ? [
                        'id' => $d->ambulance->id,
                        'plate_number' => $d->ambulance->plate_number,
                        'vehicle_name' => $d->ambulance->vehicle_name,
                    ] : null,
                    'responder' => $d->teamLeader ?? $d->driver,
                ];
            });

        $statusOverview = Incident::select('incident_status', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('incident_status')
            ->pluck('count', 'incident_status')
            ->toArray();

        $extraData = [
            'status_overview' => $statusOverview,
        ];

        $operationalSummary = (new \App\Services\OperationalSummaryService())->getSummary(false);

        return Inertia::render('dispatcher/Dashboard', [
            'stats' => $stats,
            'charts' => $charts,
            'community' => $community,
            'recentIncidents' => $recentIncidents,
            'recentDispatches' => $recentDispatches,
            'extraData' => $extraData,
            'aiSummary' => $operationalSummary,
        ]);
    }

    /**
     * API endpoint to get or refresh the AI-powered operational summary.
     */
    public function operationalAiSummary(\Illuminate\Http\Request $request)
    {
        $forceRefresh = $request->has('refresh') ? $request->boolean('refresh') : true;
        $service = new \App\Services\OperationalSummaryService();
        $summary = $service->getSummary($forceRefresh);

        return response()->json($summary);
    }
}
