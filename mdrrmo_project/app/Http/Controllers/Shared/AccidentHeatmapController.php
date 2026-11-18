<?php

namespace App\Http\Controllers\Shared;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\HeatmapManualPin;
use App\Models\HeatmapManualPinImage;
use App\Models\Incident;
use App\Models\IncidentImage;
use App\Models\IncidentType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AccidentHeatmapController extends Controller
{
    /**
     * Parse single or multi-select query parameters into a clean unique string array.
     */
    protected function parseMultiParam($raw): array
    {
        if ($raw === null || $raw === '') {
            return [];
        }
        $items = is_array($raw) ? $raw : [$raw];
        $cleaned = [];
        foreach ($items as $v) {
            if (! is_scalar($v)) {
                continue;
            }
            $s = trim((string) $v);
            if ($s !== '' && strtolower($s) !== 'all') {
                $cleaned[] = $s;
            }
        }
        return array_values(array_unique($cleaned));
    }

    /**
     * Display the Accident-Prone Area Heatmap Dashboard.
     */
    public function index(Request $request)
    {
        $period = strtolower(trim((string) $request->input('period', 'all')));
        if (! in_array($period, ['all', 'weekly', 'monthly', 'yearly'], true)) {
            $period = 'all';
        }

        $selectedYears = array_values(array_filter(
            array_map('intval', $this->parseMultiParam($request->input('years'))),
            fn($y) => $y >= 2000 && $y <= 2100
        ));
        $selectedMonths = array_values(array_filter(
            array_map('intval', $this->parseMultiParam($request->input('months'))),
            fn($m) => $m >= 1 && $m <= 12
        ));

        $selectedBarangays = $this->parseMultiParam($request->input('barangays'));
        if (empty($selectedBarangays)) {
            $selectedBarangays = $this->parseMultiParam($request->input('barangay'));
        }

        $selectedEmergencyTypes = $this->parseMultiParam($request->input('emergency_types'));
        if (empty($selectedEmergencyTypes)) {
            $legacyType = $request->input('incident_type_id');
            if (! empty($legacyType) && $legacyType !== 'all') {
                $selectedEmergencyTypes = ['type_' . (int) $legacyType];
            }
        }

        $status = $request->input('status', 'all');
        $minThreshold = max(1, (int) $request->input('min_threshold', 1));

        // Split emergency_types into DB incident_type_ids and custom manual pin type names
        $selectedTypeIds = [];
        $selectedCustomTypes = [];
        foreach ($selectedEmergencyTypes as $val) {
            if (str_starts_with($val, 'type_')) {
                $idNum = (int) substr($val, 5);
                if ($idNum > 0) {
                    $selectedTypeIds[] = $idNum;
                }
            } elseif (str_starts_with($val, 'custom_')) {
                $label = trim(substr($val, 7));
                if ($label !== '') {
                    $selectedCustomTypes[] = strtolower($label);
                }
            } elseif (ctype_digit($val)) {
                $selectedTypeIds[] = (int) $val;
            }
        }
        $selectedTypeIds = array_values(array_unique($selectedTypeIds));
        $selectedCustomTypes = array_values(array_unique($selectedCustomTypes));

        // Base query with relations (including BOTH Resident & Responder/PCR photos)
        $query = Incident::with([
            'incidentType',
            'resident.residentProfile.barangay',
            'verifiedBy',
            'images.user',
            'dispatches.ambulance',
            'dispatches.driver',
            'dispatches.crew',
            'dispatches.images.user',
            'dispatches.patientCareRecord.patient.barangay',
            'dispatches.patientCareRecord.images.user',
            'dispatches.patientCareRecords.patient.barangay',
            'dispatches.patientCareRecords.images.user',
        ]);

        // Exclude prank reports & cancelled/rejected reports from heatmap
        $query->where('is_prank', false);
        $query->whereNotIn('incident_status', ['cancelled', 'rejected']);

        if ($status !== 'all' && ! empty($status)) {
            $query->where('incident_status', $status);
        }

        // Period preset filter (Weekly / Monthly / Yearly)
        $applyTemporalFilter = function ($q) use ($period, $selectedYears, $selectedMonths) {
            if ($period === 'weekly') {
                $q->where('created_at', '>=', Carbon::now()->subDays(7)->startOfDay());
            } elseif ($period === 'monthly') {
                $q->where('created_at', '>=', Carbon::now()->subDays(30)->startOfDay());
            } elseif ($period === 'yearly') {
                $q->where('created_at', '>=', Carbon::now()->startOfYear());
            }
            if (! empty($selectedYears)) {
                $q->whereIn(\Illuminate\Support\Facades\DB::raw('YEAR(created_at)'), $selectedYears);
            }
            if (! empty($selectedMonths)) {
                $q->whereIn(\Illuminate\Support\Facades\DB::raw('MONTH(created_at)'), $selectedMonths);
            }
        };

        $applyTemporalFilter($query);

        // Apply Emergency Type filter on Incidents (if only custom pin types selected, no regular incidents match)
        $fetchRegularIncidents = true;
        if (! empty($selectedEmergencyTypes)) {
            if (! empty($selectedTypeIds)) {
                $query->whereIn('incident_type_id', $selectedTypeIds);
            } else {
                $fetchRegularIncidents = false;
            }
        }

        $rawIncidents = $fetchRegularIncidents
            ? $query->orderBy('created_at', 'desc')->get()
            : collect();

        $matchesBarangays = static function (?string $resolvedBarangay, array $targets): bool {
            if (empty($targets)) {
                return true;
            }
            if (! $resolvedBarangay) {
                return false;
            }
            $norm = preg_replace('/[\s-]/', '', strtolower($resolvedBarangay));
            foreach ($targets as $t) {
                if (preg_replace('/[\s-]/', '', strtolower($t)) === $norm) {
                    return true;
                }
            }
            return false;
        };

        // Apply multi-select barangay filter in memory using the model's intelligent barangay resolver
        $filteredIncidents = $rawIncidents->filter(
            fn($inc) => $matchesBarangays($inc->barangay, $selectedBarangays)
        )->values();

        // Map incidents for frontend heatmap and recent list
        $incidentsData = $filteredIncidents->map(function ($inc) {
            $lat = $inc->incident_latitude ? (float) $inc->incident_latitude : null;
            $lng = $inc->incident_longitude ? (float) $inc->incident_longitude : null;
            $hasCoords = $lat !== null && $lng !== null && $lat > 0 && $lng > 0;

            $purokOrLocation = $inc->incident_address ?: ($inc->place_of_incident ?: ($inc->location_code ? "Marker {$inc->location_code}" : 'Opol, Misamis Oriental'));

            $callerName = $inc->caller_name ?: ($inc->resident?->name ?? 'Anonymous / Resident');
            $callerPhone = $inc->caller_phone_number ?: ($inc->resident?->phone_number ?: ($inc->resident?->residentProfile?->contact_number ?? 'None provided'));
            $reportSource = $inc->report_source ?? ($inc->location_source === 'location_code' ? 'phone_sim' : 'resident_app');

            // Collect ALL photos (Resident incident photos + Responder dispatch/PCR scene photos), deduplicated
            $rawImages = collect();
            if ($inc->images) {
                $rawImages = $rawImages->concat($inc->images);
            }
            if ($inc->dispatches) {
                foreach ($inc->dispatches as $d) {
                    if ($d->images) {
                        $rawImages = $rawImages->concat($d->images);
                    }
                    if ($d->relationLoaded('patientCareRecords') && $d->patientCareRecords->isNotEmpty()) {
                        foreach ($d->patientCareRecords as $pcrRec) {
                            if ($pcrRec->images) {
                                $rawImages = $rawImages->concat($pcrRec->images);
                            }
                        }
                    } elseif ($d->patientCareRecord && $d->patientCareRecord->images) {
                        $rawImages = $rawImages->concat($d->patientCareRecord->images);
                    }
                }
            }

            $imagesList = $rawImages
                ->filter(fn($img) => !empty($img->image_path))
                ->unique(fn($img) => $img->id ?: $img->image_path)
                ->map(function ($img) {
                    $rawSource = strtolower((string) ($img->source ?? ''));
                    $uploaderRole = strtolower((string) ($img->user?->role ?? ''));
                    $isResponder =
                        str_contains($rawSource, 'responder') ||
                        !empty($img->dispatch_id) ||
                        !empty($img->patient_care_record_id) ||
                        $uploaderRole === 'responder';

                    return [
                        'id' => $img->id,
                        'image_path' => $img->image_path,
                        'url' => asset('storage/' . $img->image_path),
                        'source_role' => $isResponder ? 'responder' : 'resident',
                        'source_label' => $isResponder ? 'Responder Photo' : 'Resident Photo',
                        'uploaded_by' => $img->user?->name ?? null,
                        'captured_at' => $img->formatted_captured_at ?? null,
                        'is_grayscale' => (bool) ($img->is_grayscale ?? false),
                    ];
                })
                ->values()
                ->all();

            $dispatchesList = $inc->dispatches ? $inc->dispatches->map(fn($d) => [
                'id' => $d->id,
                'status' => $d->dispatch_status,
                'ambulance_unit' => $d->ambulance?->vehicle_name ?? ($d->ambulance?->plate_number ? "Plate: {$d->ambulance->plate_number}" : 'Ambulance Unit'),
                'ambulance_plate' => $d->ambulance?->plate_number ?? '',
                'driver_name' => $d->driver?->name ?? 'Unassigned Driver',
                'crew_members' => $d->crew ? $d->crew->pluck('name')->all() : [],
                'pcr_patient' => $d->patientCareRecord?->patient_name ?? null,
                'pcr_hospital' => $d->patientCareRecord?->destination_facility ?? ($d->patientCareRecord?->hospital_destination ?? null),
                'pcr_condition' => $d->patientCareRecord?->chief_complaint ?? null,
                'dispatched_at' => $d->dispatched_at ? Carbon::parse($d->dispatched_at)->format('M d, Y h:i A') : null,
                'arrived_at' => $d->arrived_at ? Carbon::parse($d->arrived_at)->format('M d, Y h:i A') : null,
                'completed_at' => $d->completed_at ? Carbon::parse($d->completed_at)->format('M d, Y h:i A') : null,
            ])->values()->all() : [];

            // Compile all patients catered to in this incident from PCRs (supports single and multi-patient incidents)
            $patientsList = [];
            if ($inc->dispatches) {
                foreach ($inc->dispatches as $d) {
                    $records = $d->relationLoaded('patientCareRecords') && $d->patientCareRecords->isNotEmpty()
                        ? $d->patientCareRecords
                        : ($d->patientCareRecord ? collect([$d->patientCareRecord]) : collect());

                    foreach ($records as $pcr) {
                        $patient = $pcr->patient;
                        $age = null;
                        if ($patient?->birthdate) {
                            try {
                                $age = Carbon::parse($patient->birthdate)->age;
                            } catch (\Exception $e) {
                                $age = null;
                            }
                        }

                        $dispositionText = '';
                        if (is_array($pcr->disposition)) {
                            $dispositionText = implode(', ', $pcr->disposition);
                        } elseif (!empty($pcr->disposition)) {
                            $dispositionText = (string) $pcr->disposition;
                        }

                        $rawName = $patient ? $patient->full_name : ($pcr->patient_name ?: 'Unknown Patient');
                        $cleanName = ucwords(mb_strtolower(trim(preg_replace('/\s+/', ' ', (string) $rawName))));
                        $gender = ucfirst(mb_strtolower((string) ($patient?->gender ?? ($pcr->patient_gender ?? 'Unspecified'))));

                        $pcrPayload = $pcr->toArray();
                        $pcrPayload['patient'] = $patient ? $patient->toArray() : ($pcrPayload['patient'] ?? null);
                        $pcrPayload['dispatch'] = [
                            'id' => $d->id,
                            'dispatch_status' => $d->dispatch_status,
                            'assigned_at' => $d->assigned_at?->toISOString(),
                            'accepted_at' => $d->accepted_at?->toISOString(),
                            'en_route_at' => $d->en_route_at?->toISOString(),
                            'arrived_at' => $d->arrived_at?->toISOString(),
                            'completed_at' => $d->completed_at?->toISOString(),
                            'ambulance' => $d->ambulance ? $d->ambulance->toArray() : null,
                            'driver' => $d->driver ? ['id' => $d->driver->id, 'name' => $d->driver->name] : null,
                            'crew' => $d->crew ? $d->crew->map(fn($m) => ['id' => $m->id, 'name' => $m->name])->values()->all() : [],
                            'incident' => [
                                'id' => $inc->id,
                                'incident_number' => $inc->incident_number,
                                'incident_address' => $inc->incident_address,
                                'place_of_incident' => $purokOrLocation,
                                'barangay' => $inc->barangay,
                                'caller_name' => $callerName,
                                'caller_phone_number' => $inc->caller_phone_number ?: ($inc->resident?->phone_number ?: ($inc->resident?->residentProfile?->contact_number ?? null)),
                                'chief_complaint' => $inc->chief_complaint,
                                'created_at' => $inc->created_at?->toISOString(),
                                'reported_at' => $inc->reported_at?->toISOString(),
                                'resident' => $inc->resident ? [
                                    'id' => $inc->resident->id,
                                    'name' => $inc->resident->name,
                                    'phone_number' => $inc->resident->phone_number,
                                    'resident_profile' => $inc->resident->residentProfile ? [
                                        'contact_number' => $inc->resident->residentProfile->contact_number,
                                    ] : null,
                                ] : null,
                                'incident_type' => $inc->incidentType ? [
                                    'id' => $inc->incidentType->id,
                                    'incident_type_name' => $inc->incidentType->incident_type_name,
                                ] : null,
                            ],
                        ];

                        $patientsList[] = [
                            'id' => $pcr->id,
                            'pcr_id' => $pcr->id,
                            'patient_id' => $patient?->id,
                            'name' => !empty($cleanName) ? $cleanName : 'Unknown Patient',
                            'gender' => $gender,
                            'birthdate' => $patient?->birthdate ? Carbon::parse($patient->birthdate)->format('M d, Y') : null,
                            'age' => $age,
                            'address' => $patient?->address ?? ($patient?->barangay?->name ? "Brgy. {$patient->barangay->name}" : 'Not specified'),
                            'is_unidentified' => (bool) ($patient?->is_unidentified ?? false),
                            'chief_complaint' => $pcr->chief_complaint ?: ($pcr->clinical_chief_complaint ?: 'Medical care catered'),
                            'destination_hospital' => $pcr->destination_facility ?: ($pcr->hospital_destination ?: null),
                            'disposition' => $dispositionText ?: 'Treated on scene',
                            'ambulance_unit' => $d->ambulance?->vehicle_name ?? ($d->ambulance?->plate_number ? "Plate: {$d->ambulance->plate_number}" : null),
                            'responders' => $pcr->responders ?: ($d->driver?->name ? "Driver: {$d->driver->name}" : null),
                            'pcr_record' => $pcrPayload,
                        ];
                    }
                }
            }

            return [
                'id' => $inc->id,
                'incident_id' => $inc->id,
                'incident_number' => $inc->incident_number ?: ('INC-' . str_pad($inc->id, 4, '0', STR_PAD_LEFT)),
                'incident_type' => $inc->incidentType?->incident_type_name ?? $inc->incidentType?->name ?? 'Emergency',
                'incident_type_id' => $inc->incident_type_id,
                'status' => $inc->incident_status,
                'priority' => $inc->priority ?? 'Moderate',
                'address' => $purokOrLocation,
                'purok_or_location' => $purokOrLocation,
                'barangay' => $inc->barangay ?? 'Opol',
                'description' => $inc->incident_description ?? '',
                'chief_complaint' => $inc->chief_complaint ?? $inc->incidentType?->incident_type_name ?? 'Emergency',
                'latitude' => $lat,
                'longitude' => $lng,
                'has_coords' => $hasCoords,
                'caller_name' => $callerName,
                'caller_phone' => $callerPhone,
                'report_source' => $reportSource,
                'verified_by' => $inc->verifiedBy?->name,
                'verification_remarks' => $inc->verification_remarks ?? '',
                'reported_at' => $inc->reported_at ? Carbon::parse($inc->reported_at)->format('M d, Y h:i A') : ($inc->created_at ? $inc->created_at->format('M d, Y h:i A') : ''),
                'verified_at' => $inc->verified_at ? Carbon::parse($inc->verified_at)->format('M d, Y h:i A') : null,
                'resolved_at' => $inc->resolved_at ? Carbon::parse($inc->resolved_at)->format('M d, Y h:i A') : null,
                'images' => $imagesList,
                'dispatches' => $dispatchesList,
                'patients' => $patientsList,
                'created_at' => $inc->created_at ? $inc->created_at->toISOString() : null,
                'formatted_date' => $inc->created_at ? $inc->created_at->format('M d, Y h:i A') : '',
                'incident_date' => $inc->created_at ? $inc->created_at->format('M d, Y') : '',
                'incident_time' => $inc->created_at ? $inc->created_at->format('h:i A') : '',
                'time_ago' => $inc->created_at ? $inc->created_at->diffForHumans() : '',
                'is_manual_pin' => false,
                'manual_pin_id' => null,
                'type_filter_key' => $inc->incident_type_id ? ('type_' . $inc->incident_type_id) : null,
            ];
        });

        // Query Manual Heatmap Pins (3NF tables: heatmap_manual_pins + heatmap_manual_pin_images) using the EXACT SAME active filters
        $manualPinsQuery = HeatmapManualPin::with(['incidentType', 'barangay', 'creator', 'images']);
        $applyTemporalFilter($manualPinsQuery);

        if (! empty($selectedEmergencyTypes)) {
            $manualPinsQuery->where(function ($sub) use ($selectedTypeIds, $selectedCustomTypes) {
                if (! empty($selectedTypeIds)) {
                    $sub->whereIn('incident_type_id', $selectedTypeIds);
                }
                if (! empty($selectedCustomTypes)) {
                    $sub->orWhere(function ($customSub) use ($selectedCustomTypes) {
                        $customSub->whereNull('incident_type_id')
                            ->whereIn(\Illuminate\Support\Facades\DB::raw('LOWER(custom_pin_type)'), $selectedCustomTypes);
                    });
                }
            });
        }

        $rawManualPins = $manualPinsQuery->orderBy('created_at', 'desc')->get();

        $manualPinsData = $rawManualPins
            ->filter(function ($pin) use ($matchesBarangays, $selectedBarangays) {
                $brgyName = $pin->barangay?->barangay_name;
                if (! $brgyName && ! empty($pin->pin_address)) {
                    foreach (Incident::OPOL_BARANGAYS as $b) {
                        if (stripos($pin->pin_address, $b) !== false) {
                            $brgyName = $b;
                            break;
                        }
                    }
                }
                return $matchesBarangays($brgyName, $selectedBarangays);
            })
            ->map(function ($pin) {
                $resolvedTypeName = $pin->incidentType?->incident_type_name
                    ?: ($pin->custom_pin_type ?: 'Custom Hazard Pin');
                $resolvedBarangay = $pin->barangay?->barangay_name;
                if (! $resolvedBarangay && ! empty($pin->pin_address)) {
                    foreach (Incident::OPOL_BARANGAYS as $b) {
                        if (stripos($pin->pin_address, $b) !== false) {
                            $resolvedBarangay = $b;
                            break;
                        }
                    }
                }
                $resolvedBarangay = $resolvedBarangay ?: 'Opol';

                $typeFilterKey = $pin->incident_type_id
                    ? ('type_' . $pin->incident_type_id)
                    : ('custom_' . trim((string) $resolvedTypeName));

                $manualImagesList = $pin->images
                    ? $pin->images->map(fn($img) => [
                        'id' => $img->id,
                        'image_path' => $img->pin_image_path,
                        'url' => asset('storage/' . $img->pin_image_path),
                        'source_role' => 'responder',
                        'source_label' => 'Manual Pin Photo',
                        'uploaded_by' => $pin->creator?->name ?? 'MDRRMO Personnel',
                        'captured_at' => $img->created_at ? $img->created_at->format('F j, Y, g:i A') : null,
                        'is_grayscale' => (bool) ($img->is_grayscale ?? false),
                        'is_manual_pin_image' => true,
                    ])->values()->all()
                    : [];

                return [
                    'id' => -1 * (int) $pin->id,
                    'incident_id' => -1 * (int) $pin->id,
                    'manual_pin_id' => (int) $pin->id,
                    'is_manual_pin' => true,
                    'incident_number' => 'PIN-' . str_pad($pin->id, 4, '0', STR_PAD_LEFT),
                    'incident_type' => $resolvedTypeName,
                    'incident_type_id' => $pin->incident_type_id,
                    'type_filter_key' => $typeFilterKey,
                    'status' => 'manual_pin',
                    'priority' => 'Manual Pin',
                    'address' => $pin->pin_address,
                    'purok_or_location' => $pin->pin_address,
                    'barangay' => $resolvedBarangay,
                    'description' => $pin->pin_description ?? '',
                    'chief_complaint' => $pin->pin_description ?: $resolvedTypeName,
                    'latitude' => (float) $pin->pin_latitude,
                    'longitude' => (float) $pin->pin_longitude,
                    'has_coords' => true,
                    'caller_name' => $pin->creator?->name ?? 'MDRRMO Personnel',
                    'caller_phone' => null,
                    'report_source' => 'manual_pin',
                    'verified_by' => $pin->creator?->name ?? null,
                    'verification_remarks' => '',
                    'reported_at' => $pin->created_at ? $pin->created_at->format('M d, Y h:i A') : '',
                    'verified_at' => null,
                    'resolved_at' => null,
                    'images' => $manualImagesList,
                    'dispatches' => [],
                    'patients' => [],
                    'created_at' => $pin->created_at ? $pin->created_at->toISOString() : null,
                    'formatted_date' => $pin->created_at ? $pin->created_at->format('M d, Y h:i A') : '',
                    'incident_date' => $pin->created_at ? $pin->created_at->format('M d, Y') : '',
                    'incident_time' => $pin->created_at ? $pin->created_at->format('h:i A') : '',
                    'time_ago' => $pin->created_at ? $pin->created_at->diffForHumans() : '',
                ];
            })
            ->values();

        // Merge real incidents + manual pins so real incidents falling inside a manual pin's 20m circle auto-combine seamlessly
        $combinedRecords = $incidentsData
            ->concat($manualPinsData)
            ->sortByDesc(fn($item) => $item['created_at'] ?? '')
            ->values();

        // 1. Calculate Ranked Hotspots (Option A non-overlapping 20m circles)
        //    Rule: 1 specific Emergency Type selected => 1-2 Low / 3 Mod / 4+ High;
        //          All OR 2+ Emergency Types selected => 1-4 Low / 5-8 Mod / 9+ High.
        $isSpecificSingleType = count($selectedEmergencyTypes) === 1;
        $hotspots = $this->calculateClusters20m($combinedRecords, $minThreshold, $isSpecificSingleType);

        // 2. Calculate Analytics Data
        $analytics = $this->calculateAnalytics($combinedRecords, $filteredIncidents);

        // 3. Load Opol Barangays GeoJSON boundary
        $geojsonPath = resource_path('data/opol_barangays.json');
        $barangayGeojson = file_exists($geojsonPath) ? json_decode(file_get_contents($geojsonPath), true) : null;

        // 4. Lookups for Filters (including distinct years & custom hazard pin types)
        $incidentTypes = IncidentType::all(['id', 'incident_type_name']);
        $opolBarangays = Incident::OPOL_BARANGAYS;

        $customPinTypes = HeatmapManualPin::whereNull('incident_type_id')
            ->whereNotNull('custom_pin_type')
            ->where('custom_pin_type', '!=', '')
            ->distinct()
            ->orderBy('custom_pin_type')
            ->pluck('custom_pin_type')
            ->values()
            ->all();

        $incidentYears = Incident::where('is_prank', false)
            ->whereNotIn('incident_status', ['cancelled', 'rejected'])
            ->selectRaw('DISTINCT YEAR(created_at) as yr')
            ->pluck('yr')
            ->filter()
            ->map(fn($y) => (int) $y);
        $manualYears = HeatmapManualPin::selectRaw('DISTINCT YEAR(created_at) as yr')
            ->pluck('yr')
            ->filter()
            ->map(fn($y) => (int) $y);
        $availableYears = $incidentYears
            ->concat($manualYears)
            ->push((int) Carbon::now()->year)
            ->unique()
            ->sortDesc()
            ->values()
            ->all();

        $userRole = auth()->user()?->role ?? 'dispatcher';

        return Inertia::render('shared/AccidentHeatmapView', [
            'incidents' => $combinedRecords,
            'hotspots' => $hotspots,
            'analytics' => $analytics,
            'barangayGeojson' => $barangayGeojson,
            'incidentTypes' => $incidentTypes,
            'customPinTypes' => $customPinTypes,
            'availableYears' => $availableYears,
            'opolBarangays' => $opolBarangays,
            'filters' => [
                'period' => $period,
                'years' => array_map('strval', $selectedYears),
                'months' => array_map('strval', $selectedMonths),
                'barangays' => $selectedBarangays,
                'emergency_types' => $selectedEmergencyTypes,
                'status' => $status,
                'min_threshold' => $minThreshold,
            ],
            'totalIncidentsCount' => $combinedRecords->count(),
            'validCoordinatesCount' => $combinedRecords->where('has_coords', true)->count(),
            'missingCoordinatesCount' => $combinedRecords->where('has_coords', false)->count(),
            'userRole' => $userRole,
        ]);
    }

    /**
     * Store a new Manual Heatmap Pin in strict 3NF (heatmap_manual_pins table).
     */
    public function storeManualPin(Request $request)
    {
        $validated = $request->validate([
            'incident_type_id' => ['nullable', 'integer', 'exists:incident_types,id'],
            'custom_pin_type' => ['nullable', 'string', 'max:100'],
            'pin_address' => ['required', 'string', 'max:255'],
            'pin_latitude' => ['required', 'numeric', 'between:-90,90'],
            'pin_longitude' => ['required', 'numeric', 'between:-180,180'],
            'pin_description' => ['nullable', 'string', 'max:255'],
            'barangay_name' => ['nullable', 'string', 'max:100'],
            'pin_images' => ['nullable', 'array', 'max:5'],
            'pin_images.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $incidentTypeId = $validated['incident_type_id'] ?? null;
        $customPinType = trim((string) ($validated['custom_pin_type'] ?? ''));

        if (empty($incidentTypeId) && $customPinType === '') {
            return response()->json([
                'message' => 'Please select an Emergency Type or enter a custom type (e.g. Landslide Area).',
                'errors' => ['custom_pin_type' => ['Please select an Emergency Type or enter a custom type.']],
            ], 422);
        }

        // Strict 3NF: store either incident_type_id OR custom_pin_type (never duplicate both)
        if (! empty($incidentTypeId)) {
            $customPinType = null;
        }

        // Strict 3NF: resolve barangay_id FK from barangays table
        $barangayName = trim((string) ($validated['barangay_name'] ?? ''));
        if ($barangayName === '') {
            foreach (Incident::OPOL_BARANGAYS as $b) {
                if (stripos($validated['pin_address'], $b) !== false) {
                    $barangayName = $b;
                    break;
                }
            }
        }

        $barangayId = null;
        if ($barangayName !== '') {
            $cleanBrgy = preg_replace('/^brgy\.?\s*|^barangay\s*/i', '', $barangayName);
            $matchedBarangay = Barangay::whereRaw('LOWER(barangay_name) = ?', [strtolower(trim($cleanBrgy))])->first();
            $barangayId = $matchedBarangay?->id;
        }

        $pin = HeatmapManualPin::create([
            'incident_type_id' => $incidentTypeId,
            'custom_pin_type' => $customPinType,
            'barangay_id' => $barangayId,
            'pin_address' => mb_substr(trim($validated['pin_address']), 0, 255),
            'pin_latitude' => (float) $validated['pin_latitude'],
            'pin_longitude' => (float) $validated['pin_longitude'],
            'pin_description' => isset($validated['pin_description']) && trim($validated['pin_description']) !== ''
                ? mb_substr(trim($validated['pin_description']), 0, 255)
                : null,
            'created_by' => auth()->id(),
        ]);

        // Store optional uploaded photos in strict 3NF child table (heatmap_manual_pin_images)
        if ($request->hasFile('pin_images')) {
            foreach ($request->file('pin_images') as $file) {
                if ($file && $file->isValid()) {
                    $path = $file->store('heatmap-manual-pins', 'public');
                    HeatmapManualPinImage::create([
                        'heatmap_manual_pin_id' => $pin->id,
                        'pin_image_path' => mb_substr($path, 0, 255),
                        'is_grayscale' => false,
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Manual heatmap pin added successfully.',
            'pin' => $pin->load(['incidentType', 'barangay', 'creator', 'images']),
        ], 201);
    }

    /**
     * Delete a Manual Heatmap Pin and its stored photo files.
     */
    public function destroyManualPin(HeatmapManualPin $manualPin)
    {
        $manualPin->load('images');
        foreach ($manualPin->images as $img) {
            if (! empty($img->pin_image_path) && Storage::disk('public')->exists($img->pin_image_path)) {
                Storage::disk('public')->delete($img->pin_image_path);
            }
        }
        $manualPin->delete();

        return response()->json([
            'message' => 'Manual heatmap pin removed successfully.',
        ]);
    }

    /**
     * Toggle and persist Black & White (grayscale) preference for a single manual pin photo.
     */
    public function toggleManualPinImageGrayscale(Request $request, HeatmapManualPinImage $manualPinImage)
    {
        $nextValue = $request->has('is_grayscale')
            ? $request->boolean('is_grayscale')
            : ! (bool) $manualPinImage->is_grayscale;

        $manualPinImage->is_grayscale = $nextValue;
        $manualPinImage->save();

        return response()->json([
            'id' => $manualPinImage->id,
            'is_grayscale' => (bool) $manualPinImage->is_grayscale,
        ]);
    }

    /**
     * Toggle and persist the Black & White (grayscale) display preference for a single incident photo.
     */
    public function toggleImageGrayscale(Request $request, IncidentImage $incidentImage)
    {
        $nextValue = $request->has('is_grayscale')
            ? $request->boolean('is_grayscale')
            : ! (bool) $incidentImage->is_grayscale;

        $incidentImage->is_grayscale = $nextValue;
        $incidentImage->save();

        return response()->json([
            'id' => $incidentImage->id,
            'is_grayscale' => (bool) $incidentImage->is_grayscale,
        ]);
    }

    /**
     * Calculate great-circle distance between two geographic coordinates in meters using the Haversine formula.
     */
    protected function haversineDistanceMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // Earth radius in meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Dynamically group incidents into clean, non-overlapping 20-meter radius hotspot circles
     * using Option A (Nearest Cluster assignment via Haversine distance).
     *
     * Rules:
     * - Filter-aware:
     *   - When "All Emergency Types" is active, ALL matching incidents are clustered together
     *     regardless of emergency type so circles never stack/overlap on the same spot.
     *   - When a specific Emergency Type is filtered (e.g., Fire Emergency), only incidents
     *     of that type are passed in and clustered — isolated ones stay solo, nearby ones combine.
     * - Anti-Overlap (Circle Radius = 20m, Non-Overlap Threshold = 40m = 2 × 20m):
     *   - If an incident falls inside a cluster's 20m circle (<= 20m) OR near its edge where
     *     spawning a separate 20m circle would overlap (<= 40m), it joins ONLY the CLOSEST cluster
     *     and updates that cluster's center (midpoint/centroid).
     *   - If an incident is farther than 40m from all existing clusters, its 20m circle will NOT
     *     overlap any neighbor — so it stays as a solo pin & solo circle at its exact GPS coordinates.
     * - Every incident belongs to exactly ONE displayed cluster (no duplicate counting).
     * - Heatmap Color Classification:
     *   - When "All Emergency Types" is selected:
     *     - YELLOW (Low): 1–4 incidents
     *     - ORANGE (Moderate): 5–8 incidents
     *     - RED (High): 9+ incidents
     *   - When a specific Emergency Type is filtered:
     *     - YELLOW (Low): 1–2 incidents
     *     - ORANGE (Moderate): 3 incidents
     *     - RED (High): 4+ incidents
     */
    protected function calculateClusters20m($incidents, int $minThreshold = 1, bool $isSpecificType = false): array
    {
        $circleRadiusMeters = 20.0;
        $nonOverlapMeters = $circleRadiusMeters * 2.0; // 40m: prevents two 20m-radius circles from overlapping

        // 1. Filter incidents with valid geographical coordinates
        $validIncidents = [];
        foreach ($incidents as $inc) {
            if (!empty($inc['has_coords']) && $inc['latitude'] !== null && $inc['longitude'] !== null) {
                $validIncidents[] = $inc;
            }
        }

        // 2. Sort deterministically by incident ID ascending so clusters remain stable across refreshes
        usort($validIncidents, fn($a, $b) => $a['id'] <=> $b['id']);

        // 3. Option A (Nearest Cluster, Non-Overlapping 20m Circles):
        //    Already scoped to whatever Emergency Type / Barangay / Date filters the dispatcher selected.
        $clusters = [];
        $clusterCounter = 1;

        foreach ($validIncidents as $inc) {
            $lat = (float) $inc['latitude'];
            $lng = (float) $inc['longitude'];

            $closestIdx = null;
            $closestDist = $nonOverlapMeters + 0.0001;
            $closestCount = -1;

            foreach ($clusters as $idx => $cluster) {
                $dist = $this->haversineDistanceMeters($lat, $lng, $cluster['latitude'], $cluster['longitude']);
                if ($dist > $nonOverlapMeters) {
                    continue;
                }

                // Pick strictly nearest cluster (tie-breaker: larger cluster, then earlier cluster)
                $isCloser = $dist < ($closestDist - 0.0001);
                $isTieLarger = abs($dist - $closestDist) <= 0.0001 && $cluster['incident_count'] > $closestCount;

                if ($isCloser || $isTieLarger) {
                    $closestDist = $dist;
                    $closestIdx = $idx;
                    $closestCount = $cluster['incident_count'];
                }
            }

            if ($closestIdx !== null) {
                $c = &$clusters[$closestIdx];
                $c['incidents'][] = $inc;
                $c['incident_ids'][] = $inc['id'];
                $c['incident_types'][] = $inc['incident_type'];
                $c['incident_count'] = count($c['incidents']);

                // Recalculate exact geographic midpoint (centroid)
                $totalLat = array_sum(array_column($c['incidents'], 'latitude'));
                $totalLng = array_sum(array_column($c['incidents'], 'longitude'));
                $c['latitude'] = $totalLat / $c['incident_count'];
                $c['longitude'] = $totalLng / $c['incident_count'];

                if (!empty($inc['barangay']) && strcasecmp($inc['barangay'], 'Opol') !== 0 && strcasecmp($c['barangay'], 'Opol') === 0) {
                    $c['barangay'] = $inc['barangay'];
                }

                $candidateLoc = trim((string) ($inc['purok_or_location'] ?? ($inc['address'] ?? '')));
                if (
                    !empty($candidateLoc) &&
                    strlen($candidateLoc) > strlen($c['location_name']) &&
                    !str_starts_with($candidateLoc, 'Opol')
                ) {
                    $c['location_name'] = $candidateLoc;
                }
                unset($c);
            } else {
                $clusterKey = "cluster_20m_{$clusterCounter}_{$inc['id']}";
                $clusterCounter++;

                $clusters[] = [
                    'cluster_key' => $clusterKey,
                    'cluster_id' => $clusterKey,
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'seed_latitude' => $lat,
                    'seed_longitude' => $lng,
                    'location_name' => $inc['purok_or_location'] ?? ($inc['address'] ?? 'Opol, Misamis Oriental'),
                    'barangay' => $inc['barangay'] ?? 'Opol',
                    'incident_type_id' => $inc['incident_type_id'] ?? null,
                    'incident_type' => $inc['incident_type'] ?? 'General Emergency',
                    'incident_count' => 1,
                    'incident_ids' => [$inc['id']],
                    'incident_types' => [$inc['incident_type']],
                    'incidents' => [$inc],
                ];
            }
        }

        // 4. Process clusters into color classification & dominant type metadata:
        // - RED (High Concentration): 4 or more recorded incidents within the cluster
        // - ORANGE (Moderate Concentration): Exactly 3 recorded incidents within the cluster
        // - YELLOW (Low Concentration): 1–2 recorded incidents within the cluster
        $processed = [];
        foreach ($clusters as $c) {
            // Sort contained incidents newest-first for UI inspection
            usort($c['incidents'], fn($a, $b) => $b['id'] <=> $a['id']);
            $c['incident_ids'] = array_column($c['incidents'], 'id');

            $count = $c['incident_count'];
            $highMin = $isSpecificType ? 4 : 9;
            $modMin = $isSpecificType ? 3 : 5;

            if ($count >= $highMin) {
                $color = '#EF4444'; // Red
                $classification = 'High Incident Concentration';
                $intensity = 'Critical';
                $intensityClass = 'critical';
                $badgeText = $isSpecificType ? 'High (4+)' : 'High (9+)';
            } elseif ($count >= $modMin) {
                $color = '#F97316'; // Orange
                $classification = 'Moderate Incident Concentration';
                $intensity = 'High';
                $intensityClass = 'high';
                $badgeText = $isSpecificType ? 'Moderate (3)' : 'Moderate (5-8)';
            } else {
                $color = '#EAB308'; // Yellow
                $classification = 'Low Incident Concentration';
                $intensity = 'Moderate';
                $intensityClass = 'moderate';
                $badgeText = $isSpecificType ? 'Low (1-2)' : 'Low (1-4)';
            }

            // Compute dominant emergency type & unique type list for mixed clusters
            $typeCounts = array_count_values($c['incident_types']);
            arsort($typeCounts);
            $mostCommonType = !empty($typeCounts) ? array_key_first($typeCounts) : 'General Emergency';

            $c['color'] = $color;
            $c['classification'] = $classification;
            $c['intensity'] = $intensity;
            $c['intensity_class'] = $intensityClass;
            $c['badge_text'] = $badgeText;
            $c['incident_type'] = $mostCommonType;
            $c['most_common_type'] = $mostCommonType;
            $c['unique_types'] = array_keys($typeCounts);
            $c['radius_meters'] = 20;
            $c['meets_threshold'] = $count >= $minThreshold;

            // Formatted recent incidents for quick list preview
            $c['recent_incidents'] = array_slice(array_map(fn($item) => [
                'id' => $item['id'],
                'type' => $item['incident_type'],
                'date' => $item['formatted_date'] ?? ($item['incident_date'] ?? ''),
                'status' => $item['status'] ?? '',
            ], $c['incidents']), 0, 5);

            if ($c['meets_threshold']) {
                $processed[] = $c;
            }
        }

        // 4. Sort descending by incident count (largest clusters first)
        usort($processed, fn($a, $b) => $b['incident_count'] <=> $a['incident_count']);

        // 5. Assign numerical rank
        $ranked = [];
        $currentRank = 1;
        foreach ($processed as $item) {
            $item['rank'] = $currentRank++;
            $ranked[] = $item;
        }

        return $ranked;
    }

    /**
     * Compute aggregations for the 3 analytics charts:
     * 1. Incidents by Barangay
     * 2. Incident-Type Distribution
     * 3. Monthly Incident Trends
     */
    protected function calculateAnalytics($incidentsData, $rawCollection): array
    {
        // 1. Incidents by Barangay
        $barangayCounts = [];
        foreach (Incident::OPOL_BARANGAYS as $bName) {
            $barangayCounts[$bName] = 0;
        }
        foreach ($incidentsData as $inc) {
            $b = $inc['barangay'];
            if ($b && isset($barangayCounts[$b])) {
                $barangayCounts[$b]++;
            } elseif ($b) {
                $barangayCounts[$b] = ($barangayCounts[$b] ?? 0) + 1;
            }
        }
        arsort($barangayCounts);

        $barangayChart = [
            'labels' => array_keys($barangayCounts),
            'series' => array_values($barangayCounts),
        ];

        // 2. Incident Type Distribution
        $typeCounts = [];
        foreach ($incidentsData as $inc) {
            $t = $inc['incident_type'];
            $typeCounts[$t] = ($typeCounts[$t] ?? 0) + 1;
        }
        arsort($typeCounts);

        $typeChart = [
            'labels' => array_keys($typeCounts),
            'series' => array_values($typeCounts),
        ];

        // 3. Monthly Incident Trends (Last 6 - 12 months)
        $monthlyCounts = [];
        // Generate last 6 months buckets
        for ($i = 5; $i >= 0; $i--) {
            $monthKey = Carbon::now()->subMonths($i)->format('Y-m');
            $monthLabel = Carbon::now()->subMonths($i)->format('M Y');
            $monthlyCounts[$monthKey] = [
                'label' => $monthLabel,
                'count' => 0,
            ];
        }

        foreach ($rawCollection as $inc) {
            if ($inc->created_at) {
                $key = $inc->created_at->format('Y-m');
                if (isset($monthlyCounts[$key])) {
                    $monthlyCounts[$key]['count']++;
                } else {
                    $monthlyCounts[$key] = [
                        'label' => $inc->created_at->format('M Y'),
                        'count' => 1,
                    ];
                }
            }
        }

        // Sort chronologically
        ksort($monthlyCounts);

        $trendChart = [
            'categories' => array_map(fn($item) => $item['label'], array_values($monthlyCounts)),
            'series' => array_map(fn($item) => $item['count'], array_values($monthlyCounts)),
        ];

        return [
            'by_barangay' => $barangayChart,
            'by_type' => $typeChart,
            'monthly_trend' => $trendChart,
        ];
    }
}
