<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
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

        // User stats and trend
        $totalUsers = User::count();
        $usersThisMonth = User::where('created_at', '>=', $startOfThisMonth)->count();
        $usersLastMonth = User::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();
        $usersTrend = $usersLastMonth > 0 ? round((($usersThisMonth - $usersLastMonth) / $usersLastMonth) * 100) : 0;

        // Incident stats and trend
        $activeIncidents = Incident::whereIn('incident_status', ['pending', 'verified', 'assigned', 'responding'])->count();
        $incidentsThisMonth = Incident::where('created_at', '>=', $startOfThisMonth)->count();
        $incidentsLastMonth = Incident::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();
        $incidentsTrend = $incidentsLastMonth > 0 ? round((($incidentsThisMonth - $incidentsLastMonth) / $incidentsLastMonth) * 100) : 0;

        // Other key metrics
        $resolvedToday = Incident::where('incident_status', 'resolved')
            ->whereDate('resolved_at', Carbon::today())
            ->count();

        $pendingDispatch = Incident::whereIn('incident_status', ['verified', 'pending'])->count();
        $availableAmbulances = Ambulance::where('status', 'available')->count();
        $totalDispatches = Dispatch::count();

        $stats = [
            'total_users' => $totalUsers,
            'users_trend' => $usersTrend,
            'active_incidents' => $activeIncidents,
            'incidents_trend' => $incidentsTrend,
            'resolved_today' => $resolvedToday,
            'pending_dispatch' => $pendingDispatch,
            'available_ambulances' => $availableAmbulances,
            'total_dispatches' => $totalDispatches,
        ];

        // Current Year Monthly Trend (Jan - Dec) via single SQL aggregations
        $currentYear = $now->year;
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        $incidentsByMonth = Incident::whereYear('created_at', $currentYear)
            ->selectRaw('MONTH(created_at) as month_num, count(*) as total')
            ->groupBy('month_num')
            ->pluck('total', 'month_num');

        $resolvedByMonth = Incident::where('incident_status', 'resolved')
            ->whereYear('resolved_at', $currentYear)
            ->selectRaw('MONTH(resolved_at) as month_num, count(*) as total')
            ->groupBy('month_num')
            ->pluck('total', 'month_num');

        $monthlyIncidents = [];
        $monthlyResolved = [];

        for ($m = 1; $m <= 12; $m++) {
            $monthlyIncidents[] = (int) ($incidentsByMonth->get($m) ?? 0);
            $monthlyResolved[] = (int) ($resolvedByMonth->get($m) ?? 0);
        }

        // Incident types distribution via single SQL withCount
        $incidentTypes = IncidentType::withCount('incidents')
            ->get()
            ->map(fn($type) => [
                'name' => $type->name ?? $type->incident_type_name,
                'count' => (int) $type->incidents_count,
            ])
            ->values()
            ->toArray();

        // If no incident types yet, provide graceful default structure
        if (empty($incidentTypes)) {
            $incidentTypes = [
                ['name' => 'Medical', 'count' => 0],
                ['name' => 'Trauma', 'count' => 0],
                ['name' => 'Vehicular', 'count' => 0],
                ['name' => 'Fire', 'count' => 0],
                ['name' => 'Other', 'count' => 0],
            ];
        }

        $charts = [
            'months' => $months,
            'monthly_incidents' => $monthlyIncidents,
            'monthly_resolved' => $monthlyResolved,
            'incident_types' => $incidentTypes,
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
                    'dispatched_at' => $d->dispatched_at ?? $d->created_at,
                    'ambulance' => $d->ambulance ? [
                        'id' => $d->ambulance->id,
                        'plate_number' => $d->ambulance->plate_number,
                        'ambulance_code' => $d->ambulance->ambulance_code,
                    ] : null,
                    'responder' => $d->teamLeader ?? $d->driver,
                ];
            });

        // Incident Status Overview
        $statusOverview = Incident::select('incident_status', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('incident_status')
            ->pluck('count', 'incident_status')
            ->toArray();

        // Incidents by Barangay
        $allIncidentsForBarangay = Incident::with(['resident.residentProfile.barangay'])->get();
        $barangayCounts = [];
        foreach ($allIncidentsForBarangay as $inc) {
            $b = $inc->barangay ?? 'Unknown';
            if (!isset($barangayCounts[$b])) $barangayCounts[$b] = 0;
            $barangayCounts[$b]++;
        }
        arsort($barangayCounts);
        
        $incidentsByBarangay = [];
        foreach ($barangayCounts as $name => $count) {
            $incidentsByBarangay[] = ['name' => $name, 'count' => $count];
        }

        // Ambulance Status
        $ambulanceStatuses = Ambulance::select('status', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $extraData = [
            'status_overview' => $statusOverview,
            'incidents_by_barangay' => $incidentsByBarangay,
            'ambulance_status' => $ambulanceStatuses,
        ];

        return Inertia::render('admin/Dashboard', [
            'stats' => $stats,
            'charts' => $charts,
            'recentIncidents' => $recentIncidents,
            'recentDispatches' => $recentDispatches,
            'extraData' => $extraData,
        ]);
    }
}
