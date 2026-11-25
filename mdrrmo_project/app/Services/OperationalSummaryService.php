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
    protected const CACHE_TTL_MINUTES = 15;

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

        return Cache::remember(self::CACHE_KEY, now()->addMinutes(self::CACHE_TTL_MINUTES), function () {
            return $this->generateSummary();
        });
    }

    /**
     * Gather live operational statistics from existing database queries.
     */
    public function collectOperationalData(): array
    {
        $now = Carbon::now();
        $startOfThisMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // 1. Incidents
        $totalIncidents = Incident::count();
        $pendingCount = Incident::where('incident_status', 'pending')->count();
        $verifiedCount = Incident::where('incident_status', 'verified')->count();
        $assignedCount = Incident::where('incident_status', 'assigned')->count();
        $respondingCount = Incident::where('incident_status', 'responding')->count();
        $activeIncidents = $pendingCount + $verifiedCount + $assignedCount + $respondingCount;
        $pendingDispatch = $pendingCount + $verifiedCount;
        $resolvedIncidents = Incident::where('incident_status', 'resolved')->count();
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

        // 2. Resident App Users
        $totalResidents = User::where('role', 'resident')->count();
        $verifiedResidents = User::where('role', 'resident')->where('verification_status', 'Verified')->count();
        $pendingResidents = max(0, $totalResidents - $verifiedResidents);

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

        // 4. Responders
        $totalResponders = User::whereIn('role', ['responder', 'team_leader', 'emt', 'driver'])->count();
        $availableResponders = ResponderProfile::where('availability', 'available')->count();

        // 5. Dispatches
        $totalDispatches = Dispatch::count();
        $activeDispatches = Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])->count();

        // 6. Top Incident Barangay (using accessor resolution like DashboardController)
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

        // 7. Top Incident Type
        $topType = IncidentType::withCount('incidents')
            ->orderByDesc('incidents_count')
            ->first();
        $topTypeName = $topType?->incident_type_name ?? $topType?->name ?? 'Medical & Trauma Emergency';

        return [
            'total_residents' => $totalResidents,
            'verified_residents' => $verifiedResidents,
            'pending_residents' => $pendingResidents,
            'total_ambulances' => $totalAmbulances,
            'available_ambulances' => $availableAmbulances,
            'dispatched_ambulances' => $dispatchedAmbulances,
            'maintenance_ambulances' => $maintenanceAmbulances,
            'total_responders' => $totalResponders,
            'available_responders' => $availableResponders,
            'total_incidents' => $totalIncidents,
            'active_incidents' => $activeIncidents,
            'pending_dispatch' => $pendingDispatch,
            'responding_incidents' => $respondingCount,
            'resolved_incidents' => $resolvedIncidents,
            'resolved_today' => $resolvedToday,
            'resolution_rate' => $resolutionRate,
            'incidents_trend' => $incidentsTrend,
            'total_dispatches' => $totalDispatches,
            'active_dispatches' => $activeDispatches,
            'top_barangay_name' => $topBarangayName,
            'top_barangay_count' => $topBarangayCount,
            'top_incident_type' => $topTypeName,
        ];
    }

    /**
     * Generate the operational summary using Gemini API, with automatic fallback.
     */
    protected function generateSummary(): array
    {
        $data = $this->collectOperationalData();
        $apiKey = config('services.gemini.api_key', env('GEMINI_API_KEY'));
        $model = config('services.gemini.model', env('GEMINI_MODEL', 'gemini-3.5-flash'));

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

        // Deterministic intelligent fallback
        $fallbackSummary = $this->generateIntelligentFallback($data);

        return [
            'summary' => $fallbackSummary,
            'updated_at' => Carbon::now()->toIso8601String(),
            'updated_at_human' => 'Just now',
            'source' => 'built_in_ai',
        ];
    }

    /**
     * Call Google Gemini API to generate the single-paragraph summary.
     */
    protected function callGeminiApi(array $d, string $apiKey, string $model): ?string
    {
        $prompt = <<<EOT
You are an executive operational assistant for the Municipal Disaster Risk Reduction and Management Office (MDRRMO) of Opol, Misamis Oriental, Philippines.

Analyze these current operational statistics from the live MDRRMO database:
- Registered Residents: {$d['total_residents']} ({$d['verified_residents']} verified, {$d['pending_residents']} pending verification).
- Ambulance Fleet: {$d['total_ambulances']} total units ({$d['available_ambulances']} available/ready, {$d['dispatched_ambulances']} currently dispatched, {$d['maintenance_ambulances']} in maintenance).
- Responders: {$d['total_responders']} registered ({$d['available_responders']} currently recorded as on duty/available).
- Incident Workload: {$d['active_incidents']} active incidents ({$d['pending_dispatch']} awaiting dispatch, {$d['responding_incidents']} in active response), with {$d['resolved_incidents']} resolved cases ({$d['resolved_today']} resolved today), achieving a {$d['resolution_rate']}% resolution rate. Monthly incident trend: {$d['incidents_trend']}%.
- Top Incident Location: Barangay {$d['top_barangay_name']} with {$d['top_barangay_count']} recorded cases.
- Primary Incident Category: {$d['top_incident_type']}.

TASK:
Generate a single, cohesive, professional executive operational summary paragraph (strictly 3 to 4 sentences).
- Explain current emergency workload and operational performance.
- Clarify ambulance fleet availability and responder deployment readiness.
- Highlight the primary incident hotspot barangay or dominant emergency category requiring monitoring.
- Maintain an objective, authoritative executive tone appropriate for MDRRMO leadership.

CRITICAL FORMATTING CONSTRAINTS:
1. Provide ONLY ONE SINGLE PARAGRAPH. No multiple paragraphs.
2. NO bullet points, NO numbered lists, NO markdown bold headings, NO asterisks for styling, NO salutations or sign-offs.
3. Plain text only.
4. Do not invent or fabricate statistics not present in the provided figures.
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
                    'thinkingConfig' => [
                        'thinkingBudget' => 0,
                    ],
                ],
            ]
        );

        if ($response->successful()) {
            $json = $response->json();
            $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
            if ($text) {
                // Clean any newlines or quotes into a single clean paragraph
                $clean = trim(preg_replace('/\s+/', ' ', str_replace(['*', '#', '"'], '', $text)));
                return $clean;
            }
        }

        // If high demand or temporary model error, attempt fallback to gemini-flash-latest or gemini-3.1-flash-lite
        if ($response->status() === 503 || $response->status() === 404) {
            $altModel = ($model === 'gemini-3.5-flash') ? 'gemini-3.1-flash-lite' : 'gemini-flash-latest';
            $retryResponse = Http::timeout(8)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$altModel}:generateContent?key={$apiKey}",
                [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.2,
                        'maxOutputTokens' => 250,
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
     */
    protected function generateIntelligentFallback(array $d): string
    {
        $incidentSentence = $d['active_incidents'] > 0
            ? "MDRRMO Opol is currently managing {$d['active_incidents']} active emergency incident" . ($d['active_incidents'] > 1 ? 's' : '') . ", with {$d['pending_dispatch']} awaiting dispatch assignment and {$d['resolved_incidents']} successfully resolved cases to date ({$d['resolved_today']} closed today), reflecting an overall resolution efficiency of {$d['resolution_rate']}%."
            : "Emergency operations currently report zero active incidents, with {$d['resolved_incidents']} cumulative resolved cases ({$d['resolved_today']} closed today) sustaining an overall resolution rate of {$d['resolution_rate']}%.";

        $readinessSentence = $d['available_ambulances'] > 0
            ? "Emergency transport readiness is stable with {$d['available_ambulances']} of {$d['total_ambulances']} ambulance units available for immediate dispatch, supported by {$d['available_responders']} of {$d['total_responders']} registered emergency responders on active duty."
            : "Ambulance fleet availability is currently constrained with {$d['total_ambulances']} units committed or in maintenance, while {$d['available_responders']} emergency personnel remain deployed on active operations.";

        $hotspotSentence = !empty($d['top_barangay_name']) && $d['top_barangay_count'] > 0
            ? "Incident distribution indicates Barangay {$d['top_barangay_name']} as the primary operational hotspot with {$d['top_barangay_count']} recorded cases primarily concerning {$d['top_incident_type']}, indicating key areas where proactive monitoring and rapid medical response assets should remain prioritized."
            : "Incident volume remains evenly distributed across monitored municipal sectors, with {$d['top_incident_type']} constituting the primary response category.";

        return "{$incidentSentence} {$readinessSentence} {$hotspotSentence}";
    }
}
