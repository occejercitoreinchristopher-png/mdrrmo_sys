<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dispatch;
use App\Models\Incident;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $incidents = Incident::with('incidentType')->latest()->get();

        $stats = [
            'total_incidents' => Incident::count(),
            'active_incidents' => Incident::whereIn('incident_status', ['pending', 'verified', 'assigned', 'responding'])->count(),
            'resolved_incidents' => Incident::where('incident_status', 'resolved')->count(),
            'total_dispatches' => Dispatch::count(),
        ];

        return Inertia::render('admin/Reports', [
            'stats' => $stats,
            'incidents' => $incidents,
        ]);
    }
}
