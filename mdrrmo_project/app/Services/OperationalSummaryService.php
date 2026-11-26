<?php

namespace App\Services;

use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\ResponderProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OperationalSummaryService
{
    protected const CACHE_KEY = 'mdrrmo_operational_ai_summary';
    protected const CACHE_TTL_SECONDS = 15;

    /**
     * Invalidate the cached operational summary whenever new emergencies or fleet events occur.
     */
    public static function invalidateCache(): void
    {
        try {
            Cache::forget(self::CACHE_KEY);
        } catch (\Throwable $e) {
            // safely ignore if cache driver is temporarily unreachable
        }
    }

    /**
     * Get the executive operational summary (cached or freshly generated).
     */
    public function getSummary(bool $forceRefresh = false): array
    {
        if ($forceRefresh) {
            Cache::forget(self::CACHE_KEY);
        }

        return Cache::remember(self::CACHE_KEY, now()->addSeconds(self::CACHE_TTL_SECONDS), function () {
            return $this->generateSummary();
        });
    }

    /**
     * Gather live operational statistics encompassing all dashboard cards and charts:
     * - Incident Status (pending, verified, dispatched, on scene, cancelled, total reported, resolved, resolution rate)
     * - Emergency Types (distribution across the 5 official classifications for resolved cases)
     * - Dispatch & Fleet Performance (active/completed dispatches, ambulance readiness, responders on duty)
     * - Hotspot geographic sector
     */
    public function collectOperationalData(): array
    {
        $now = Carbon::now();
        $startOfThisMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // 1. Incidents & Status Breakdown
        $totalIncidents = Incident::count();
        $pendingCount = Incident::where('incident_status', 'pending')->count();
        $verifiedCount = Incident::where('incident_status', 'verified')->count();
        $assignedCount = Incident::where('incident_status', 'assigned')->count();
        $respondingCount = Incident::where('incident_status', 'responding')->count();
        $cancelledCount = Incident::where('incident_status', 'cancelled')->count();
        $rejectedCount = Incident::where('incident_status', 'rejected')->count();
        $resolvedIncidents = Incident::where('incident_status', 'resolved')->count();
        $activeIncidents = $pendingCount + $verifiedCount + $assignedCount + $respondingCount;
        $pendingDispatch = $pendingCount + $verifiedCount;
        $resolvedToday = Incident::where('incident_status', 'resolved')
            ->where(function ($q) {
                $q->whereDate('resolved_at', today())
                    ->orWhere(function ($sub) {
                        $sub->whereNull('resolved_at')->whereDate('updated_at', today());
                    });
            })
            ->count();
        $resolutionRate = $totalIncidents > 0 ? round(($resolvedIncidents / $totalIncidents) * 100) : 0;

        $incidentsThisMonth = Incident::where('created_at', '>=', $startOfThisMonth)->count();
        $incidentsLastMonth = Incident::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();
        $incidentsTrend = $incidentsLastMonth > 0
            ? round((($incidentsThisMonth - $incidentsLastMonth) / $incidentsLastMonth) * 100)
            : ($incidentsThisMonth > 0 ? 100 : 0);

        // 2. Emergency Types Distribution (Resolved Cases across the 5 Official MDRRMO Classifications)
        $officialEmergencyTypes = [
            'Medical Emergency' => 0,
            'Fire Emergency' => 0,
            'Severe Weather / Flood' => 0,
            'Crime & Security' => 0,
            'Search & Rescue' => 0,
        ];

        $resolvedIncidentsWithTypes = Incident::where('incident_status', 'resolved')
            ->with('incidentType')
            ->get();

        foreach ($resolvedIncidentsWithTypes as $inc) {
            $typeName = $inc->incidentType?->incident_type_name ?? $inc->incidentType?->name ?? '';
            if (preg_match('/medical|trauma|acute|health|injury/i', $typeName)) {
                $officialEmergencyTypes['Medical Emergency']++;
            } elseif (preg_match('/fire|burn|flame|structural/i', $typeName)) {
                $officialEmergencyTypes['Fire Emergency']++;
            } elseif (preg_match('/weather|flood|typhoon|storm|landslide|water surge/i', $typeName)) {
                $officialEmergencyTypes['Severe Weather / Flood']++;
            } elseif (preg_match('/crime|security|violence|assault|theft|robbery/i', $typeName)) {
                $officialEmergencyTypes['Crime & Security']++;
            } elseif (preg_match('/search|rescue|drowning|retrieval|lost/i', $typeName)) {
                $officialEmergencyTypes['Search & Rescue']++;
            } elseif (!empty($typeName)) {
                $officialEmergencyTypes['Medical Emergency']++;
            }
        }

        // Determine top emergency type
        arsort($officialEmergencyTypes);
        $topTypeName = key($officialEmergencyTypes);
        $topTypeCount = current($officialEmergencyTypes);

        // 3. Ambulance Fleet (exclude station walk-in placeholder)
        $fleetQuery = fn () => Ambulance::where('plate_number', '!=', 'WALK-IN')
            ->where(function ($q) {
                $q->whereNull('vehicle_type')
                    ->orWhere('vehicle_type', '!=', 'Station');
            })
            ->where(function ($q) {
                $q->whereNull('ambulance_code')
                    ->orWhere(function ($sub) {
                        $sub->where('ambulance_code', 'not like', '%STATION%')
                            ->where('ambulance_code', 'not like', '%WALK%');
                    });
            });

        $totalAmbulances = $fleetQuery()->count();
        $availableAmbulances = $fleetQuery()->where('status', 'available')->count();
        $dispatchedAmbulances = $fleetQuery()->whereIn('status', ['dispatched', 'in_mission', 'en_route', 'on_scene'])->count();
        $maintenanceAmbulances = $fleetQuery()->where('status', 'maintenance')->count();

        // 4. Responders & Residents
        $totalResponders = User::whereIn('role', ['responder', 'team_leader', 'emt', 'driver'])->count();
        $availableResponders = ResponderProfile::where('availability', 'available')->count();
        $totalResidents = User::where('role', 'resident')->count();
        $verifiedResidents = User::where('role', 'resident')->where('verification_status', 'Verified')->count();
        $pendingResidents = max(0, $totalResidents - $verifiedResidents);

        // 5. Dispatches & Performance
        $totalDispatches = Dispatch::count();
        $activeDispatches = Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])->count();
        $completedDispatches = Dispatch::where('dispatch_status', 'completed')->count();
        $completedDispatchesToday = Dispatch::where('dispatch_status', 'completed')
            ->whereDate('completed_at', today())
            ->count();

        // 6. Top Incident Barangay
        $barangayGroups = [];
        $allIncidents = Incident::with(['resident.residentProfile.barangay', 'locationCode.barangay'])->get();
        foreach ($allIncidents as $inc) {
            $b = $inc->barangay;
            if (empty($b) || strtolower($b) === 'unknown' || strtolower($b) === 'unassigned') {
                continue;
            }
            $barangayGroups[$b] = ($barangayGroups[$b] ?? 0) + 1;
        }
        arsort($barangayGroups);
        $topBarangayName = !empty($barangayGroups) ? (string) key($barangayGroups) : 'Barangay Poblacion';
        $topBarangayCount = !empty($barangayGroups) ? (int) current($barangayGroups) : 0;

        return [
            // Status Card
            'total_incidents' => $totalIncidents,
            'active_incidents' => $activeIncidents,
            'pending_incidents' => $pendingCount,
            'verified_incidents' => $verifiedCount,
            'assigned_incidents' => $assignedCount,
            'responding_incidents' => $respondingCount,
            'cancelled_incidents' => $cancelledCount,
            'rejected_incidents' => $rejectedCount,
            'resolved_incidents' => $resolvedIncidents,
            'resolved_today' => $resolvedToday,
            'resolution_rate' => $resolutionRate,
            'incidents_trend' => $incidentsTrend,
            'pending_dispatch' => $pendingDispatch,

            // Emergency Types Card
            'emergency_types' => $officialEmergencyTypes,
            'top_incident_type' => $topTypeName,
            'top_type_count' => $topTypeCount,

            // Fleet & Dispatch Performance
            'total_ambulances' => $totalAmbulances,
            'available_ambulances' => $availableAmbulances,
            'dispatched_ambulances' => $dispatchedAmbulances,
            'maintenance_ambulances' => $maintenanceAmbulances,
            'total_dispatches' => $totalDispatches,
            'active_dispatches' => $activeDispatches,
            'completed_dispatches' => $completedDispatches,
            'completed_dispatches_today' => $completedDispatchesToday,
            'total_responders' => $totalResponders,
            'available_responders' => $availableResponders,

            // Demographics & Hotspots
            'total_residents' => $totalResidents,
            'verified_residents' => $verifiedResidents,
            'pending_residents' => $pendingResidents,
            'top_barangay_name' => $topBarangayName,
            'top_barangay_count' => $topBarangayCount,
        ];
    }

    /**
     * Generate the operational summary using Gemini API, with automatic intelligent fallback.
     */
    protected function generateSummary(): array
    {
        $data = $this->collectOperationalData();
        $apiKey = config('services.gemini.api_key', env('GEMINI_API_KEY'));
        $model = config('services.gemini.model', env('GEMINI_MODEL', 'gemini-2.5-flash'));

        if (!empty($apiKey)) {
            try {
                $summary = $this->callGeminiApi($data, $apiKey, $model);
                if (!empty($summary)) {
                    return [
                        'summary' => $summary,
                        'updated_at' => Carbon::now()->toIso8601String(),
                        'updated_at_human' => 'Just now',
                        'source' => 'gemini_ai',
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini API Operational Summary failed, using intelligent fallback: ' . $e->getMessage());
            }
        }

        // Deterministic intelligent fallback incorporating all dashboard analytics
        $fallbackSummary = $this->generateIntelligentFallback($data);

        return [
            'summary' => $fallbackSummary,
            'updated_at' => Carbon::now()->toIso8601String(),
            'updated_at_human' => 'Just now',
            'source' => 'built_in_ai',
        ];
    }

    /**
     * Call Google Gemini API to synthesize the dashboard metrics into an executive summary.
     */
    protected function callGeminiApi(array $d, string $apiKey, string $model): ?string
    {
        $typesBreakdown = collect($d['emergency_types'])
            ->map(fn ($count, $name) => "{$name}: {$count}")
            ->implode(', ');

        $prompt = <<<EOT
You are an executive operational assistant for the Municipal Disaster Risk Reduction and Management Office (MDRRMO) of Opol, Misamis Oriental, Philippines.

Synthesize these live operational statistics from the MDRRMO command center dashboard into an authoritative executive operational briefing:
1. INCIDENT STATUS CARD:
- Total Reported Incidents: {$d['total_incidents']}
- Active Cases: {$d['active_incidents']} (Pending Verification: {$d['pending_incidents']}, Verified: {$d['verified_incidents']}, Dispatched: {$d['assigned_incidents']}, On Scene: {$d['responding_incidents']}, Cancelled: {$d['cancelled_incidents']})
- Cumulative Resolved Cases: {$d['resolved_incidents']} ({$d['resolved_today']} closed today), Resolution Efficiency: {$d['resolution_rate']}%. Monthly Trend: {$d['incidents_trend']}%.

2. EMERGENCY TYPES CARD (Resolved Cases Distribution across the 5 Official MDRRMO Classifications):
- Breakdown: {$typesBreakdown}
- Primary Category: {$d['top_incident_type']} ({$d['top_type_count']} resolved cases)

3. INCIDENT DISPATCH & FLEET PERFORMANCE:
- Dispatches: {$d['active_dispatches']} active missions, {$d['completed_dispatches']} completed dispatches ({$d['completed_dispatches_today']} completed today)
- Ambulance Units: {$d['available_ambulances']} of {$d['total_ambulances']} available for immediate deployment ({$d['dispatched_ambulances']} committed, {$d['maintenance_ambulances']} in maintenance)
- Responders: {$d['available_responders']} of {$d['total_responders']} emergency personnel active on duty
- Geographic Hotspot: Barangay {$d['top_barangay_name']} ({$d['top_barangay_count']} recorded cases)

TASK:
Produce a cohesive, professional executive operational summary paragraph (strictly 3 to 4 sentences).
You MUST explicitly cover:
1. Incident Status breakdown (active incidents, pending, verified, dispatched, on scene, cancelled, and resolution rate).
2. Emergency Types distribution of resolved incidents (highlighting the leading resolved classifications like Medical, Fire, Weather, Crime, or Search & Rescue).
3. Dispatch & Fleet Performance (active and completed dispatches, ambulance readiness, responder coverage, and hotspot focus).

CRITICAL FORMATTING CONSTRAINTS:
1. Provide ONLY ONE SINGLE PARAGRAPH. No multiple paragraphs.
2. NO bullet points, NO numbered lists, NO markdown bold headings, NO asterisks for styling, NO salutations or sign-offs.
3. Plain text only.
4. Use the exact provided numbers without fabricating statistics.
EOT;

        $response = Http::timeout(10)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
            [
                'contents' => [
                    ['parts' => [['text' => $prompt]]]
                ],
                'generationConfig' => [
                    'temperature' => 0.2,
                    'maxOutputTokens' => 800,
                ],
            ]
        );

        if ($response->successful()) {
            $json = $response->json();
            $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
            if ($text) {
                return trim(preg_replace('/\s+/', ' ', str_replace(['*', '#', '"'], '', $text)));
            }
        }

        // Fallback model if standard model is unavailable
        if ($response->status() === 503 || $response->status() === 404) {
            $altModel = ($model === 'gemini-2.5-flash') ? 'gemini-1.5-flash' : 'gemini-2.5-flash';
            $retryResponse = Http::timeout(8)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$altModel}:generateContent?key={$apiKey}",
                [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.2,
                        'maxOutputTokens' => 500,
                    ],
                ]
            );
            if ($retryResponse->successful()) {
                $retryJson = $retryResponse->json();
                $retryText = $retryJson['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if ($retryText) {
                    return trim(preg_replace('/\s+/', ' ', str_replace(['*', '#', '"'], '', $retryText)));
                }
            }
        }

        return null;
    }

    /**
     * Deterministic intelligent operational summary generator (Safe Fallback).
     * Fully covers Incident Status, Emergency Types, and Dispatch & Fleet Performance.
     */
    protected function generateIntelligentFallback(array $d): string
    {
        // 1. Incident Status Breakdown
        $statusParts = [];
        if ($d['pending_incidents'] > 0) $statusParts[] = "{$d['pending_incidents']} pending verification";
        if ($d['verified_incidents'] > 0) $statusParts[] = "{$d['verified_incidents']} verified";
        if ($d['assigned_incidents'] > 0) $statusParts[] = "{$d['assigned_incidents']} dispatched";
        if ($d['responding_incidents'] > 0) $statusParts[] = "{$d['responding_incidents']} on scene";
        if ($d['cancelled_incidents'] > 0) $statusParts[] = "{$d['cancelled_incidents']} cancelled";

        $statusDetail = !empty($statusParts) ? ' (' . implode(', ', $statusParts) . ')' : '';

        $statusSentence = $d['active_incidents'] > 0
            ? "MDRRMO Opol is currently managing {$d['active_incidents']} active emergency incident" . ($d['active_incidents'] > 1 ? 's' : '') . " out of {$d['total_incidents']} total reported{$statusDetail}, with {$d['resolved_incidents']} resolved cases to date ({$d['resolved_today']} closed today) sustaining a {$d['resolution_rate']}% resolution efficiency."
            : "Emergency operations record zero active incidents across {$d['total_incidents']} total reported cases ({$d['cancelled_incidents']} cancelled), with {$d['resolved_incidents']} successfully resolved cases achieving an overall resolution rate of {$d['resolution_rate']}%.";

        // 2. Emergency Types Distribution (Resolved Cases across the 5 Official MDRRMO Classifications)
        $typesParts = [];
        foreach ($d['emergency_types'] as $typeName => $count) {
            if ($count > 0) {
                $typesParts[] = "{$typeName} ({$count})";
            }
        }
        $typesSentence = !empty($typesParts)
            ? "Resolved incident classifications show " . implode(', ', $typesParts) . ", with {$d['top_incident_type']} forming the predominant emergency category."
            : "Emergency classification readiness remains active across all five official types: Medical Emergency, Fire Emergency, Severe Weather / Flood, Crime & Security, and Search & Rescue.";

        // 3. Dispatch & Fleet Performance
        $dispatchSentence = "Dispatch and fleet performance tracks {$d['active_dispatches']} active deployment" . ($d['active_dispatches'] !== 1 ? 's' : '') . " and {$d['completed_dispatches']} completed dispatches, supported by {$d['available_ambulances']} of {$d['total_ambulances']} ambulance units ready for immediate response alongside {$d['available_responders']} of {$d['total_responders']} emergency responders on active duty.";

        // 4. Geographic Hotspot / Priority Monitoring
        $hotspotSentence = !empty($d['top_barangay_name']) && $d['top_barangay_count'] > 0
            ? "Barangay {$d['top_barangay_name']} remains the primary operational hotspot with {$d['top_barangay_count']} recorded cases, serving as the focal area for rapid-response asset positioning."
            : "Emergency call volume remains evenly distributed across monitored municipal sectors.";

        return "{$statusSentence} {$typesSentence} {$dispatchSentence} {$hotspotSentence}";
    }
}
