<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DispatchLog;
use App\Models\DispatchLogAction;
use App\Models\Barangay;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DispatchLogController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/DispatchLogs/Index');
    }

    public function fetchLogs(Request $request)
    {
        $query = \App\Models\Incident::with([
            'resident.residentProfile.barangay',
            'incidentType',
            'verifiedBy',
            'locationCode',
            'dispatches.ambulance',
            'dispatches.driver',
            'dispatches.crew.responderProfile',
            'dispatchLogs' => function($q) {
                $q->latest()->with(['user', 'action']);
            }
        ]);

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $cleanId = ltrim($search, '#');

            $query->where(function ($q) use ($search, $cleanId) {
                if (is_numeric($cleanId)) {
                    $q->where('id', $cleanId);
                }

                $q->orWhere('caller_name', 'like', "%{$search}%")
                  ->orWhere('caller_phone_number', 'like', "%{$search}%")
                  ->orWhere('incident_address', 'like', "%{$search}%")
                  ->orWhere('incident_description', 'like', "%{$search}%")
                  ->orWhereHas('resident', function ($rq) use ($search) {
                      $rq->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%")
                         ->orWhere('phone_number', 'like', "%{$search}%");
                  })
                  ->orWhereHas('verifiedBy', function ($vq) use ($search) {
                      $vq->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('incidentType', function ($tq) use ($search) {
                      $tq->where('incident_type_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('incident_status', $request->input('status'));
        }

        $perPage = $request->input('per_page', 15);
        $incidents = $query->latest('created_at')->paginate($perPage);

        return response()->json($incidents);
    }

    public function show(\App\Models\Incident $incident)
    {
        $incident->load([
            'resident.residentProfile.barangay',
            'incidentType',
            'verifiedBy',
            'locationCode',
            'images',
            'dispatches.ambulance',
            'dispatches.driver',
            'dispatches.dispatcher',
            'dispatches.crew.responderProfile',
            'dispatches.patientCareRecord.patient',
            'dispatchLogs' => function($q) {
                $q->oldest()->with(['user', 'action']);
            }
        ]);

        return Inertia::render('admin/DispatchLogs/Show', [
            'incident' => $incident
        ]);
    }
}
