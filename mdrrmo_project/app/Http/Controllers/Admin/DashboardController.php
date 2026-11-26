<?php

namespace App\Http\Controllers\Admin;

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
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $now = Carbon::now();
        $startOfThisMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // Core Incident Metrics
        $totalIncidents = Incident::count();
        $pendingCount = Incident::where('incident_status', 'pending')->count();
        $verifiedCount = Incident::where('incident_status', 'verified')->count();
        $assignedCount = Incident::where('incident_status', 'assigned')->count();
        $respondingCount = Incident::where('incident_status', 'responding')->count();
        $cancelledCount = Incident::where('incident_status', 'cancelled')->count();
        $rejectedCount = Incident::where('incident_status', 'rejected')->count();
        $activeIncidents = $pendingCount + $verifiedCount + $assignedCount + $respondingCount;
        $pendingDispatch = $pendingCount + $verifiedCount;
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

        // User & Resident Metrics
        $totalUsers = User::count();
        $totalResidents = User::where('role', 'resident')->count();
        $verifiedResidents = User::where('role', 'resident')->where('verification_status', 'Verified')->count();
        $pendingResidents = max(0, $totalResidents - $verifiedResidents);
        $activeResidentReporters = User::where('role', 'resident')->has('reportedIncidents')->count();

        $usersThisMonth = User::where('created_at', '>=', $startOfThisMonth)->count();
        $usersLastMonth = User::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();
        $usersTrend = $usersLastMonth > 0
            ? round((($usersThisMonth - $usersLastMonth) / $usersLastMonth) * 100)
            : ($usersThisMonth > 0 ? 100 : 0);

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
        $dispatchedAmbulances = $fleetQuery()->whereIn('status', ['dispatched', 'in_mission', 'en_route', 'on_scene'])->count();
        $maintenanceAmbulances = $fleetQuery()->where('status', 'maintenance')->count();
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
            'total_users' => $totalUsers,
            'users_trend' => $usersTrend,
            'total_incidents' => $totalIncidents,
            'active_incidents' => $activeIncidents,
            'pending_incidents' => $pendingCount,
            'verified_incidents' => $verifiedCount,
            'assigned_incidents' => $assignedCount,
            'responding_incidents' => $respondingCount,
            'cancelled_incidents' => $cancelledCount,
            'rejected_incidents' => $rejectedCount,
            'pending_dispatch' => $pendingDispatch,
            'resolved_incidents' => $resolvedIncidents,
            'resolved_today' => $resolvedToday,
            'resolution_rate' => $resolutionRate,
            'incidents_trend' => $incidentsTrend,
            'total_residents' => $totalResidents,
            'verified_residents' => $verifiedResidents,
            'pending_residents' => $pendingResidents,
            'active_resident_reporters' => $activeResidentReporters,
            'total_ambulances' => $totalAmbulances,
            'available_ambulances' => $availableAmbulances,
            'dispatched_ambulances' => $dispatchedAmbulances,
            'maintenance_ambulances' => $maintenanceAmbulances,
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

        // 6-Month Aggregated Trend
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
                'name' => $type->incident_type_name ?? $type->name ?? 'Unknown',
                'count' => (int) $type->incidents_count,
            ])
            ->values()
            ->toArray();

        // Top Barangays with rich operational breakdown
        $barangayGroups = [];
        $allIncidents = Incident::with(['resident.residentProfile.barangay', 'incidentType'])->get();
        foreach ($allIncidents as $inc) {
            $b = $inc->barangay;
            if (empty($b) || strtolower($b) === 'unknown') {
                $b = 'Unassigned';
            }
            if (!isset($barangayGroups[$b])) {
                $barangayGroups[$b] = [
                    'name' => $b,
                    'count' => 0,
                    'resolved' => 0,
                    'active' => 0,
                    'types' => [],
                ];
            }
            $barangayGroups[$b]['count']++;
            if ($inc->incident_status === 'resolved') {
                $barangayGroups[$b]['resolved']++;
            } elseif (in_array($inc->incident_status, ['pending', 'verified', 'assigned', 'responding'])) {
                $barangayGroups[$b]['active']++;
            }
            $typeName = $inc->incidentType?->incident_type_name ?? $inc->incidentType?->name ?? 'General Emergency';
            $barangayGroups[$b]['types'][$typeName] = ($barangayGroups[$b]['types'][$typeName] ?? 0) + 1;
        }

        // Sort by total incident count DESC; if tied, break tie by resolved count DESC
        uasort($barangayGroups, function ($a, $b) {
            if ($b['count'] !== $a['count']) {
                return $b['count'] <=> $a['count'];
            }
            return $b['resolved'] <=> $a['resolved'];
        });

        $topBarangays = [];
        foreach (array_slice($barangayGroups, 0, 5, true) as $name => $data) {
            arsort($data['types']);
            $topType = key($data['types']) ?? 'General';
            $topTypeCount = current($data['types']) ?: 0;
            $topBarangays[] = [
                'name' => $name,
                'count' => $data['count'],
                'resolved' => $data['resolved'],
                'active' => $data['active'],
                'top_type' => $topType,
                'top_type_count' => $topTypeCount,
                'percentage' => $totalIncidents > 0 ? round(($data['count'] / $totalIncidents) * 100) : 0,
            ];
        }

        // Report Sources Breakdown
        $residentAppReports = Incident::where('report_source', 'resident_app')->count();
        $phoneSimReports = $simCallerReports;
        $dispatcherWalkInReports = Incident::whereIn('report_source', ['dispatcher', 'walk_in'])->count();
        $otherReports = max(0, $totalIncidents - ($residentAppReports + $phoneSimReports + $dispatcherWalkInReports));

        // Monthly trend for top active incident types
        $incidentTypesTrend = [];
        $topTypes = array_slice($incidentTypes, 0, 6);
        foreach ($topTypes as $typeItem) {
            $tData = [];
            for ($i = 5; $i >= 0; $i--) {
                $m = $now->copy()->subMonths($i);
                $tData[] = Incident::where('incident_type_id', $typeItem['id'])
                    ->whereYear('created_at', $m->year)
                    ->whereMonth('created_at', $m->month)
                    ->count();
            }
            $incidentTypesTrend[] = [
                'name' => $typeItem['name'],
                'data' => $tData,
            ];
        }

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
            'incident_types_trend' => $incidentTypesTrend,
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

        // Recent 5 incidents
        $recentIncidents = Incident::with(['resident', 'incidentType'])
            ->latest()
            ->take(5)
            ->get();

        // Recent 5 dispatches
        $recentDispatches = Dispatch::with(['ambulance', 'incident', 'driver', 'teamLeader'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($d) {
                return [
                    'id' => $d->id,
                    'status' => $d->dispatch_status ?? 'assigned',
                    'dispatched_at' => $d->assigned_at ?? $d->created_at,
                    'ambulance' => $d->ambulance ? [
                        'id' => $d->ambulance->id,
                        'plate_number' => $d->ambulance->plate_number,
                        'vehicle_name' => $d->ambulance->vehicle_name ?? $d->ambulance->ambulance_code,
                    ] : null,
                    'responder' => $d->teamLeader ?? $d->driver,
                ];
            });

        // Incident Status Overview
        $statusOverview = Incident::select('incident_status', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('incident_status')
            ->pluck('count', 'incident_status')
            ->toArray();

        // Ambulance Status (exclude station walk-in placeholder)
        $ambulanceStatuses = $fleetQuery()
            ->select('status', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $extraData = [
            'status_overview' => $statusOverview,
            'incidents_by_barangay' => $topBarangays,
            'ambulance_status' => $ambulanceStatuses,
        ];

        $operationalSummary = (new \App\Services\OperationalSummaryService())->getSummary(false);

        return Inertia::render('admin/Dashboard', [
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
    public function operationalAiSummary(Request $request)
    {
        // Default to live fresh summary so dashboard auto-sync never serves stale metrics
        $forceRefresh = $request->has('refresh') ? $request->boolean('refresh') : true;
        $service = new \App\Services\OperationalSummaryService();
        $summary = $service->getSummary($forceRefresh);

        return response()->json($summary);
    }
}
