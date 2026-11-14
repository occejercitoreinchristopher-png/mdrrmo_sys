<?php

namespace App\Http\Controllers\Shared;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\IncidentType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccidentHeatmapController extends Controller
{
    /**
     * Display the Accident-Prone Area Heatmap Dashboard.
     */
    public function index(Request $request)
    {
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $barangay = $request->input('barangay');
        $incidentTypeId = $request->input('incident_type_id');
        $status = $request->input('status', 'all');
        $minThreshold = (int) $request->input('min_threshold', 1);

        // Base query with relations
        $query = Incident::with([
            'incidentType',
            'resident.residentProfile.barangay',
            'verifiedBy',
            'images',
            'dispatches.ambulance',
            'dispatches.driver',
            'dispatches.crew',
            'dispatches.patientCareRecord.patient.barangay',
            'dispatches.patientCareRecords.patient.barangay',
        ]);

        // Exclude prank reports
        $query->where('is_prank', false);

        // Exclude cancelled and rejected reports from heatmap
        $query->whereNotIn('incident_status', ['cancelled', 'rejected']);

        // Status filter
        if ($status !== 'all' && !empty($status)) {
            $query->where('incident_status', $status);
        }

        // Date range filter
        if (!empty($dateFrom)) {
            $query->whereDate('created_at', '>=', Carbon::parse($dateFrom)->startOfDay());
        }
        if (!empty($dateTo)) {
            $query->whereDate('created_at', '<=', Carbon::parse($dateTo)->endOfDay());
        }

        // Incident Type filter
        if (!empty($incidentTypeId) && $incidentTypeId !== 'all') {
            $query->where('incident_type_id', (int) $incidentTypeId);
        }

        // Fetch all matching incidents
        $rawIncidents = $query->orderBy('created_at', 'desc')->get();

        // Apply barangay filter in memory using the model's intelligent barangay resolver
        $filteredIncidents = $rawIncidents->filter(function ($inc) use ($barangay) {
            if (empty($barangay) || $barangay === 'all') {
                return true;
            }
            $resolvedBarangay = $inc->barangay;
            if (!$resolvedBarangay) {
                return false;
            }
            return strcasecmp(
                preg_replace('/[\s-]/', '', $resolvedBarangay),
                preg_replace('/[\s-]/', '', $barangay)
            ) === 0;
        })->values();

        // Map incidents for frontend heatmap and recent list
        $incidentsData = $filteredIncidents->map(function ($inc) {
            $lat = $inc->incident_latitude ? (float) $inc->incident_latitude : null;
            $lng = $inc->incident_longitude ? (float) $inc->incident_longitude : null;
            $hasCoords = $lat !== null && $lng !== null && $lat > 0 && $lng > 0;

            $purokOrLocation = $inc->incident_address ?: ($inc->place_of_incident ?: ($inc->location_code ? "Marker {$inc->location_code}" : 'Opol, Misamis Oriental'));

            $callerName = $inc->caller_name ?: ($inc->resident?->name ?? 'Anonymous / Resident');
            $callerPhone = $inc->caller_phone_number ?: ($inc->resident?->phone_number ?: ($inc->resident?->residentProfile?->contact_number ?? 'None provided'));
            $reportSource = $inc->report_source ?? ($inc->location_source === 'location_code' ? 'phone_sim' : 'resident_app');

            $imagesList = $inc->images ? $inc->images->map(fn($img) => [
                'id' => $img->id,
                'image_path' => $img->image_path,
                'url' => asset('storage/' . $img->image_path),
            ])->values()->all() : [];

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
            ];
        });

        // 1. Calculate Ranked Hotspots (Clustered strictly by 20-meter radius using Haversine distance)
        $hotspots = $this->calculateClusters20m($incidentsData, $minThreshold);

        // 2. Calculate Analytics Data
        $analytics = $this->calculateAnalytics($incidentsData, $filteredIncidents);

        // 3. Load Opol Barangays GeoJSON boundary
        $geojsonPath = resource_path('data/opol_barangays.json');
        $barangayGeojson = file_exists($geojsonPath) ? json_decode(file_get_contents($geojsonPath), true) : null;

        // 4. Lookups for Filters
        $incidentTypes = IncidentType::all(['id', 'incident_type_name']);
        $opolBarangays = Incident::OPOL_BARANGAYS;

        $userRole = auth()->user()?->role ?? 'dispatcher';

        return Inertia::render('shared/AccidentHeatmapView', [
            'incidents' => $incidentsData,
            'hotspots' => $hotspots,
            'analytics' => $analytics,
            'barangayGeojson' => $barangayGeojson,
            'incidentTypes' => $incidentTypes,
            'opolBarangays' => $opolBarangays,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'barangay' => $barangay ?? 'all',
                'incident_type_id' => $incidentTypeId ?? 'all',
                'status' => $status,
                'min_threshold' => $minThreshold,
            ],
            'totalIncidentsCount' => $incidentsData->count(),
            'validCoordinatesCount' => $incidentsData->where('has_coords', true)->count(),
            'missingCoordinatesCount' => $incidentsData->where('has_coords', false)->count(),
            'userRole' => $userRole,
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
     * Dynamically group incidents that occur within a strict 20-meter radius of one another.
     * Uses Haversine geographic distance calculation.
     *
     * Rules:
     * - Every incident belongs to exactly ONE displayed cluster (no duplicate counting).
     * - If within 20m of multiple clusters, consistently assigns to the closest cluster.
     * - Heatmap Color Classification:
     *   - RED (High Concentration): 4 or more recorded incidents within the 20-meter cluster.
     *   - ORANGE (Moderate Concentration): Exactly 3 recorded incidents within the 20-meter cluster.
     *   - YELLOW (Low Concentration): 1–2 recorded incidents within the 20-meter cluster.
     */
    protected function calculateClusters20m($incidents, int $minThreshold = 1): array
    {
        // 1. Filter incidents with valid geographical coordinates
        $validIncidents = [];
        foreach ($incidents as $inc) {
            if (!empty($inc['has_coords']) && $inc['latitude'] !== null && $inc['longitude'] !== null) {
                $validIncidents[] = $inc;
            }
        }

        // 2. Sort deterministically by incident ID ascending so clusters remain stable across refreshes
        usort($validIncidents, fn($a, $b) => $a['id'] <=> $b['id']);

        $clusters = [];
        $clusterCounter = 1;

        foreach ($validIncidents as $inc) {
            $lat = (float) $inc['latitude'];
            $lng = (float) $inc['longitude'];

            // Find whether an existing cluster exists within a 20-meter radius
            $closestClusterIdx = null;
            $minDist = 20.0001; // 20-meter radius threshold

            foreach ($clusters as $idx => $cluster) {
                $dist = $this->haversineDistanceMeters($lat, $lng, $cluster['latitude'], $cluster['longitude']);
                if ($dist <= 20.0 && $dist < $minDist) {
                    $minDist = $dist;
                    $closestClusterIdx = $idx;
                }
            }

            if ($closestClusterIdx !== null) {
                // Include the new incident in this closest 20m group
                $c = &$clusters[$closestClusterIdx];
                $c['incidents'][] = $inc;
                $c['incident_ids'][] = $inc['id'];
                $c['incident_types'][] = $inc['incident_type'];
                $c['incident_count'] = count($c['incidents']);

                // Recalculate cluster centroid (running center of mass of cluster)
                $count = $c['incident_count'];
                $c['latitude'] = (($c['latitude'] * ($count - 1)) + $lat) / $count;
                $c['longitude'] = (($c['longitude'] * ($count - 1)) + $lng) / $count;

                // Update location name if new one is more descriptive
                if (!empty($inc['purok_or_location']) && strlen($inc['purok_or_location']) > strlen($c['location_name']) && !str_starts_with($inc['purok_or_location'], 'Opol')) {
                    $c['location_name'] = $inc['purok_or_location'];
                }
                unset($c);
            } else {
                // If no existing group matches, create a new incident group
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
                    'incident_count' => 1,
                    'incident_ids' => [$inc['id']],
                    'incident_types' => [$inc['incident_type']],
                    'incidents' => [$inc],
                ];
            }
        }

        // 2.5 Combine closely adjacent clusters (within touching envelope <= 25m) when they share the same emergency incident type
        $merged = true;
        while ($merged) {
            $merged = false;
            $clusterTotal = count($clusters);
            for ($i = 0; $i < $clusterTotal; $i++) {
                if (!isset($clusters[$i])) continue;
                for ($j = $i + 1; $j < $clusterTotal; $j++) {
                    if (!isset($clusters[$j])) continue;

                    $cA = &$clusters[$i];
                    $cB = &$clusters[$j];

                    $dist = $this->haversineDistanceMeters($cA['latitude'], $cA['longitude'], $cB['latitude'], $cB['longitude']);

                    // Determine dominant incident type for each cluster
                    $typeCountsA = array_count_values($cA['incident_types']);
                    arsort($typeCountsA);
                    $dominantTypeA = array_key_first($typeCountsA);

                    $typeCountsB = array_count_values($cB['incident_types']);
                    arsort($typeCountsB);
                    $dominantTypeB = array_key_first($typeCountsB);

                    // If adjacent/touching (<= 25m) and sharing the same emergency type, combine into one cluster!
                    if ($dist <= 25.0 && $dominantTypeA === $dominantTypeB) {
                        foreach ($cB['incidents'] as $mergedInc) {
                            $cA['incidents'][] = $mergedInc;
                            $cA['incident_ids'][] = $mergedInc['id'];
                            $cA['incident_types'][] = $mergedInc['incident_type'];
                        }
                        $cA['incident_count'] = count($cA['incidents']);

                        // Recalculate combined center of mass
                        $totalLat = array_sum(array_column($cA['incidents'], 'latitude'));
                        $totalLng = array_sum(array_column($cA['incidents'], 'longitude'));
                        $cA['latitude'] = $totalLat / $cA['incident_count'];
                        $cA['longitude'] = $totalLng / $cA['incident_count'];

                        unset($clusters[$j]);
                        $clusters = array_values($clusters);
                        $merged = true;
                        break 2;
                    }
                }
            }
        }

        // 3. Process clusters into color classification:
        // - RED (High Concentration): 4 or more recorded incidents within the 20-meter cluster
        // - ORANGE (Moderate Concentration): Exactly 3 recorded incidents within the 20-meter cluster
        // - YELLOW (Low Concentration): 1–2 recorded incidents within the 20-meter cluster
        $processed = [];
        foreach ($clusters as $c) {
            // Resolve most accurate barangay name from contained incidents
            foreach ($c['incidents'] as $subInc) {
                if (!empty($subInc['barangay']) && strcasecmp($subInc['barangay'], 'Opol') !== 0) {
                    $c['barangay'] = $subInc['barangay'];
                    break;
                }
            }

            $count = $c['incident_count'];

            if ($count >= 4) {
                $color = '#EF4444'; // Red
                $classification = 'High Incident Concentration';
                $intensity = 'Critical';
                $intensityClass = 'critical';
                $badgeText = 'High (4+)';
            } elseif ($count === 3) {
                $color = '#F97316'; // Orange
                $classification = 'Moderate Incident Concentration';
                $intensity = 'High';
                $intensityClass = 'high';
                $badgeText = 'Moderate (3)';
            } else {
                $color = '#EAB308'; // Yellow (1-2 incidents)
                $classification = 'Low Incident Concentration';
                $intensity = 'Moderate';
                $intensityClass = 'moderate';
                $badgeText = 'Low (1-2)';
            }

            // Most dominant incident type
            $typeCounts = array_count_values($c['incident_types']);
            arsort($typeCounts);
            $mostCommonType = !empty($typeCounts) ? array_key_first($typeCounts) : 'General Emergency';

            $c['color'] = $color;
            $c['classification'] = $classification;
            $c['intensity'] = $intensity;
            $c['intensity_class'] = $intensityClass;
            $c['badge_text'] = $badgeText;
            $c['most_common_type'] = $mostCommonType;
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
