<?php

namespace App\Http\Controllers\Api\Responder;

use App\Http\Controllers\Controller;
use App\Models\Dispatch;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HistoryController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Dispatch::with([
            'incident',
            'incident.incidentType',
            'incident.resident.residentProfile.barangay',
            'patientCareRecord',
            'patientCareRecord.patient',
        ])
            ->where(function ($q) use ($user) {
                $q->where('driver_id', $user->id)
                    ->orWhere('emt_id', $user->id)
                    ->orWhere('dispatcher_id', $user->id); // if self dispatched
            })
            ->whereIn('dispatch_status', ['completed', 'cancelled']);

        // Type Filter (e.g. 1, 2)
        if ($request->filled('type') && $request->type !== 'all') {
            $type = $request->type;
            $query->whereHas('incident', function ($q) use ($type) {
                $q->where('incident_type_id', $type);
            });
        }

        // Date Filter
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $dispatches = $query->orderBy('created_at', 'desc')->paginate(10);

        // Transform for mobile consumption
        $dispatches->getCollection()->transform(function ($dispatch) {
            $pcr = $dispatch->patientCareRecord;
            $patient = $pcr ? $pcr->patient : null;
            $incident = $dispatch->incident;
            $reporter = $incident ? $incident->resident : null;

            $locationName = $incident?->place_of_incident 
                ?: $incident?->incident_address 
                ?: ($incident?->location_code ? "Marker {$incident->location_code}" : null);

            $barangay = $incident?->barangay 
                ?: $incident?->resident?->residentProfile?->barangay?->barangay_name;

            $isGeneric = empty($locationName) 
                || in_array(strtolower(trim($locationName)), [
                    'opol, misamis oriental',
                    'opol',
                    'incident scene, opol, misamis oriental',
                    'incident scene',
                ])
                || preg_match('/^-?\d+\.\d+/', trim($locationName ?? ''));

            if ($isGeneric && !empty($barangay)) {
                $locationName = "Brgy. {$barangay}, Opol, Misamis Oriental";
            } elseif ($isGeneric && $incident && $incident->incident_latitude && $incident->incident_longitude) {
                $resolvedBrgy = Incident::resolveBarangayFromCoordinates($incident->incident_latitude, $incident->incident_longitude);
                if ($resolvedBrgy) {
                    $locationName = "Brgy. {$resolvedBrgy}, Opol, Misamis Oriental";
                } else {
                    $locationName = "Opol, Misamis Oriental";
                }
            } elseif (empty($locationName)) {
                $locationName = !empty($barangay) ? "Brgy. {$barangay}, Opol, Misamis Oriental" : "Opol, Misamis Oriental";
            }

            return [
                'id' => 'DSP-'.str_pad($dispatch->id, 3, '0', STR_PAD_LEFT),
                'status' => ucfirst($dispatch->dispatch_status),
                'type' => optional(optional($incident)->incidentType)->name ?? 'Unknown',
                'location' => $locationName,
                'barangay' => $barangay,
                'latitude' => $incident?->incident_latitude ? (float) $incident->incident_latitude : null,
                'longitude' => $incident?->incident_longitude ? (float) $incident->incident_longitude : null,
                'description' => $incident ? $incident->description : 'No description',
                'date' => $dispatch->created_at->format('M d, Y'),
                'time' => $dispatch->created_at->format('H:i'),
                'patient_name' => $patient ? trim("{$patient->first_name} {$patient->last_name}") : 'Unknown / Not Logged',
                'reporter_name' => $reporter ? trim("{$reporter->first_name} {$reporter->last_name}") : 'Walk-In / Dispatch',
            ];
        });

        return response()->json($dispatches);
    }
}
