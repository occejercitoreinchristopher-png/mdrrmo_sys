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
    public function index(Request $request)
    {
        return Inertia::render('admin/DispatchLogs/Index', [
            'barangays' => \App\Models\Incident::OPOL_BARANGAYS,
            'initialStatus' => $request->query('status', ''),
        ]);
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
            $statusVal = strtolower(trim($request->input('status')));
            if ($statusVal === 'canceled') {
                $statusVal = 'cancelled';
            }
            $query->where('incident_status', $statusVal);
        }

        if ($request->filled('priority')) {
            $priority = $request->input('priority');
            $query->whereRaw('LOWER(priority) = ?', [strtolower($priority)]);
        }

        if ($request->filled('barangay')) {
            $barangay = trim($request->input('barangay'));
            $cleanBarangay = preg_replace('/^brgy\.?\s+/i', '', $barangay);
            $query->where(function ($bq) use ($barangay, $cleanBarangay) {
                $bq->where('incident_address', 'like', "%{$cleanBarangay}%")
                   ->orWhere('incident_address', 'like', "%{$barangay}%")
                   ->orWhereHas('resident.residentProfile.barangay', function ($rq) use ($cleanBarangay) {
                       $rq->where('barangay_name', 'like', "%{$cleanBarangay}%");
                   })
                   ->orWhereHas('locationCode.barangay', function ($lq) use ($cleanBarangay) {
                       $lq->where('barangay_name', 'like', "%{$cleanBarangay}%");
                   });
            });
        }

        if ($request->filled('report_source')) {
            $source = $request->input('report_source');
            if ($source === 'mobile_app') {
                $query->where(function ($sq) {
                    $sq->where('report_source', 'resident_app')
                       ->orWhere('report_source', 'mobile_app')
                       ->orWhere('report_source', 'like', '%app%');
                });
            } elseif ($source === 'phone_call') {
                $query->where(function ($sq) {
                    $sq->where('report_source', 'phone_call')
                       ->orWhere('report_source', 'hotline')
                       ->orWhere('report_source', 'like', '%call%');
                });
            } elseif ($source === 'walk_in') {
                $query->where(function ($sq) {
                    $sq->where('report_source', 'walk_in')
                       ->orWhere('report_source', 'like', '%walk%');
                });
            } else {
                $query->where('report_source', $source);
            }
        }

        if ($request->filled('has_dispatches')) {
            $hasDispatches = $request->input('has_dispatches');
            if ($hasDispatches === 'yes') {
                $query->has('dispatches');
            } elseif ($hasDispatches === 'no') {
                $query->doesntHave('dispatches');
            }
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                \Carbon\Carbon::parse($request->input('start_date'))->startOfDay(),
                \Carbon\Carbon::parse($request->input('end_date'))->endOfDay(),
            ]);
        } elseif ($request->filled('start_date')) {
            $query->where('created_at', '>=', \Carbon\Carbon::parse($request->input('start_date'))->startOfDay());
        } elseif ($request->filled('end_date')) {
            $query->where('created_at', '<=', \Carbon\Carbon::parse($request->input('end_date'))->endOfDay());
        }

        if ($request->filled('date')) {
            $date = $request->input('date');
            if ($date === 'today') {
                $query->whereDate('created_at', \Carbon\Carbon::today());
            } elseif ($date === 'yesterday') {
                $query->whereDate('created_at', \Carbon\Carbon::yesterday());
            } elseif ($date === 'this_week') {
                $query->whereBetween('created_at', [\Carbon\Carbon::now()->startOfWeek(), \Carbon\Carbon::now()->endOfWeek()]);
            } elseif ($date === 'this_month') {
                $query->whereMonth('created_at', \Carbon\Carbon::now()->month)
                      ->whereYear('created_at', \Carbon\Carbon::now()->year);
            } elseif ($date === 'this_year') {
                $query->whereYear('created_at', \Carbon\Carbon::now()->year);
            }
        }

        $perPage = $request->input('per_page', 15);
        $incidents = $query->latest('created_at')->paginate($perPage);

        return response()->json($incidents);
    }

    public function show(\App\Models\Incident $incident, Request $request)
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
            'incident' => $incident,
            'fromStatus' => $request->query('status', $request->query('from_status', '')),
        ]);
    }
}
