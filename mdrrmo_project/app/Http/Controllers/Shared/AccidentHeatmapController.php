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
        $minThreshold = (int) $request->input('min_threshold', 2);

        // Base query with relations
        $query = Incident::with([
            'incidentType',
            'resident.residentProfile.barangay',
            'dispatches.patientCareRecord',
        ]);

        // Exclude prank reports
        $query->where('is_prank', false);

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
            $query->where('incident_type_id', $incidentTypeId);
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

            return [
                'id' => $inc->id,
                'incident_id' => $inc->id,
                'incident_type' => $inc->incidentType?->incident_type_name ?? 'Emergency',
                'incident_type_id' => $inc->incident_type_id,
                'status' => $inc->incident_status,
                'priority' => $inc->priority ?? 'Moderate',
                'address' => $inc->incident_address ?? $inc->place_of_incident ?? 'Opol, Misamis Oriental',
                'barangay' => $inc->barangay ?? 'Opol',
                'description' => $inc->incident_description ?? '',
                'chief_complaint' => $inc->chief_complaint ?? $inc->incidentType?->incident_type_name ?? 'Emergency',
                'latitude' => $lat,
                'longitude' => $lng,
                'has_coords' => $hasCoords,
                'created_at' => $inc->created_at ? $inc->created_at->toISOString() : null,
                'formatted_date' => $inc->created_at ? $inc->created_at->format('M d, Y h:i A') : '',
                'time_ago' => $inc->created_at ? $inc->created_at->diffForHumans() : '',
            ];
        });

        // 1. Calculate Ranked Hotspots (Clustered by proximity or primary address)
        $hotspots = $this->calculateHotspots($incidentsData, $minThreshold);

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
     * Compute recurring incident hotspots grouped by rounded geographic coordinates
     * or distinct landmark locations.
     */
    protected function calculateHotspots($incidents, int $minThreshold = 2): array
    {
        $clusters = [];

        foreach ($incidents as $inc) {
            if (!$inc['has_coords']) {
                continue;
            }

            // Cluster key: round coordinates to ~3 decimal places (~110m radius)
            // or match specific street/landmark name
            $roundLat = round($inc['latitude'], 3);
            $roundLng = round($inc['longitude'], 3);
            $clusterKey = "{$roundLat}_{$roundLng}";

            if (!isset($clusters[$clusterKey])) {
                $clusters[$clusterKey] = [
                    'key' => $clusterKey,
                    'latitude' => $inc['latitude'],
                    'longitude' => $inc['longitude'],
                    'barangay' => $inc['barangay'],
                    'location_name' => $inc['address'],
                    'count' => 0,
                    'incident_ids' => [],
                    'incident_types' => [],
                    'recent_incidents' => [],
                ];
            }

            $clusters[$clusterKey]['count']++;
            $clusters[$clusterKey]['incident_ids'][] = $inc['id'];
            $clusters[$clusterKey]['incident_types'][] = $inc['incident_type'];
            if (count($clusters[$clusterKey]['recent_incidents']) < 5) {
                $clusters[$clusterKey]['recent_incidents'][] = [
                    'id' => $inc['id'],
                    'type' => $inc['incident_type'],
                    'date' => $inc['formatted_date'],
                    'status' => $inc['status'],
                ];
            }

            // Better location name if current is generic
            if (strlen($inc['address']) > strlen($clusters[$clusterKey]['location_name']) && !str_starts_with($inc['address'], 'Opol')) {
                $clusters[$clusterKey]['location_name'] = $inc['address'];
            }
        }

        // Process clusters into ranked hotspots
        $hotspots = [];
        foreach ($clusters as $c) {
            // Compute most dominant incident type in this cluster
            $typeCounts = array_count_values($c['incident_types']);
            arsort($typeCounts);
            $mostCommonType = !empty($typeCounts) ? array_key_first($typeCounts) : 'General Emergency';

            // Intensity classification based on incident volume
            // Note: Clearly defined as incident frequency density per specification
            $count = $c['count'];
            if ($count >= 5) {
                $intensity = 'Critical';
                $intensityClass = 'critical';
                $color = '#ef4444'; // Red
            } elseif ($count >= 3) {
                $intensity = 'High';
                $intensityClass = 'high';
                $color = '#f59e0b'; // Amber
            } else {
                $intensity = 'Moderate';
                $intensityClass = 'moderate';
                $color = '#06b6d4'; // Cyan
            }

            $hotspots[] = [
                'cluster_key' => $c['key'],
                'latitude' => $c['latitude'],
                'longitude' => $c['longitude'],
                'location_name' => $c['location_name'],
                'barangay' => $c['barangay'],
                'incident_count' => $count,
                'most_common_type' => $mostCommonType,
                'intensity' => $intensity,
                'intensity_class' => $intensityClass,
                'color' => $color,
                'incident_ids' => $c['incident_ids'],
                'recent_incidents' => $c['recent_incidents'],
                'meets_threshold' => $count >= $minThreshold,
            ];
        }

        // Sort descending by incident count
        usort($hotspots, fn($a, $b) => $b['incident_count'] <=> $a['incident_count']);

        // Assign numerical ranks
        $ranked = [];
        $currentRank = 1;
        foreach ($hotspots as $item) {
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
