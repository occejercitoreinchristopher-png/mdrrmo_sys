<?php

namespace App\Http\Controllers\Dispatcher;

use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\ResponderProfile;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'pending_incidents' => Incident::where('incident_status', 'pending')->count(),
            'active_dispatches' => Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])->count(),
            'available_ambulances' => Ambulance::where('status', 'available')->count(),
            'available_responders' => ResponderProfile::where('availability', 'available')->count(),
            'completed_dispatches_today' => Dispatch::where('dispatch_status', 'completed')->whereDate('completed_at', today())->count(),
            'pending_leave_requests' => 0, // Placeholder
        ];

        // Charts data (mocked or basic aggregation)
        $charts = [
            'monthly_incidents' => [
                'categories' => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                'data' => [12, 19, 15, 22, 30, 25],
            ],
            'dispatch_status' => [
                'labels' => ['Assigned', 'En Route', 'On Scene', 'Completed'],
                'data' => [
                    Dispatch::where('dispatch_status', 'assigned')->count(),
                    Dispatch::where('dispatch_status', 'en_route')->count(),
                    Dispatch::where('dispatch_status', 'arrived_on_scene')->count(),
                    Dispatch::where('dispatch_status', 'completed')->count(),
                ],
            ],
        ];

        $recentIncidents = Incident::with(['resident', 'incidentType'])->latest()->take(5)->get();
        $recentDispatches = Dispatch::with(['ambulance', 'incident'])->latest()->take(5)->get();

        return Inertia::render('dispatcher/Dashboard', [
            'stats' => $stats,
            'charts' => $charts,
            'recentIncidents' => $recentIncidents,
            'recentDispatches' => $recentDispatches,
        ]);
    }
}
