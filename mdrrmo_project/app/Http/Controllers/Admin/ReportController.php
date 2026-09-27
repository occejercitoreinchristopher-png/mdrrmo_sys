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
        $incidents = Incident::with(['incidentType', 'resident'])->latest()->get();

        $stats = [
            'total_users' => User::count(),
            'total_incidents' => Incident::count(),
            'active_incidents' => Incident::whereIn('incident_status', ['pending', 'verified', 'assigned', 'responding'])->count(),
            'resolved_today' => Incident::where('incident_status', 'resolved')->whereDate('resolved_at', today())->count(),
            'pending_dispatch' => Incident::whereIn('incident_status', ['verified', 'assigned'])->count(),
            'resolved_incidents' => Incident::where('incident_status', 'resolved')->count(),
            'available_ambulances' => Ambulance::where('status', 'available')->count(),
            'total_dispatches' => Dispatch::count(),
        ];

        return Inertia::render('admin/Reports', [
            'stats' => $stats,
            'incidents' => $incidents,
        ]);
    }
}
