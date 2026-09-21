<?php

namespace App\Http\Controllers\Dispatcher;

use App\Http\Controllers\Controller;
use App\Models\PatientCareRecord;
use Inertia\Inertia;

class PatientCareRecordController extends Controller
{
    public function index()
    {
        $records = PatientCareRecord::with([
            'patient.barangay',
            'dispatch.incident.incidentType',
            'dispatch.ambulance',
            'dispatch.teamLeader',
            'dispatch.driver',
            'dispatch.emt',
            'images',
        ])
            ->latest()
            ->paginate(15);

        return Inertia::render('dispatcher/PatientCareRecords', [
            'records' => $records->items(),
            'pagination' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    public function show(PatientCareRecord $record)
    {
        $record->load([
            'patient.barangay',
            'patient.registeredUser.residentProfile.barangay',
            'dispatch.incident.incidentType',
            'dispatch.ambulance',
            'dispatch.teamLeader',
            'dispatch.driver',
            'dispatch.emt',
            'images',
            'dispatch.images',
        ]);

        return response()->json([
            'data' => $record,
        ]);
    }
}
