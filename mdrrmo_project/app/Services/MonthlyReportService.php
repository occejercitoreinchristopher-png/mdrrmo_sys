<?php

namespace App\Services;

use App\Models\Incident;
use App\Models\PatientCareRecord;
use Carbon\Carbon;

class MonthlyReportService
{
    /**
     * Official 5 Categories and complete Chief of Complaint list for MDRRMO Opol.
     * Preserves official names and spellings from municipal reference records.
     */
    public const REPORT1_CATEGORIES = [
        'MEDICAL EMERGENCY' => [
            'Medical Emergency',
            'Cardiac Emergency',
            'Respiratory Emergency',
            'Diabetic Emergency',
            'Psychiatric Emergency',
            'Motor Vehicular Accidents',
            'Motor Vehicular Accidents (Pedestrian)',
            'Mass Casualty Incident (Trauma)',
            'Mass Casualty Incident (Medical, Infectious)',
            'Industrial Accident',
            'Transport Home to Hospital',
            'Transport for Check Up',
            'Transport for Referral',
            'Transport for Hospital Admission',
            'Transport (Cadaver)',
            'Covid-19 Transport',
            'Bleeding',
            'Hemorrage/Laceration/Abrasion',
            'Trauma',
            'Fall Victim',
            'Fracture/Dislocation',
            'Abdominal Pain',
            'Back Pain',
            'Headache',
            'Eye Problem',
            'Breathing Problems/Difficulty of Breathing',
            'Burns',
            'Electrical Shock',
            'Allergic Reaction',
            'Overdose',
            'Flu-like Symptoms',
            'Unconscious',
            'Seizures',
            'Pregnancy/Childbirth',
            'Wound Dressing/First Aid',
            'Dead',
            'Nausea and Vomiting',
            'Covid Transport',
            'Fainting',
            'Suicide',
            'CVA (Stroke)',
            'Animal Bite',
            'Stab Wound',
            'Hypertensive Emergency',
            'Psychosomatic Disorder',
            'Post Operative Case',
            'Loss Bowel Movement/Mild Dehydration',
            'Chest Pain',
            'Body Weakness',
            'Attempted Suicide',
        ],
        'FIRE EMERGENCY' => [
            'Fire Incidents',
            'Hazardous Materials',
            'Hazardous Condition',
        ],
        'SEVERE WEATHER / FLOOD' => [
            'Sever Weather',
            'Search and Rescue/Retreival',
            'Water Rescue/Drowning Incident',
            'Evacuation Center Management',
        ],
        'CRIME & SECURITY' => [
            'Bomb Threat',
            'Hostage Situation',
            'Terrorism',
            'Assault',
            'Missing Persons',
        ],
        'OTHER / NON-EMERGENCY OPERATIONS' => [
            'Public Service',
            'Training',
            'Stand-By Unit',
            'Calls (Emergency, Assistance and Inquiry)',
            'Waiver',
        ],
    ];

    /**
     * 34 Official Patient Complaint / Assessment items for Report 2.
     */
    public const REPORT2_PATIENT_COMPLAINTS = [
        'Hemorrhage/Laceration/Abrasion',
        'Trauma',
        'Fall Victim',
        'Fracture/Dislocation',
        'Abdominal Pain',
        'Back Pain',
        'Headache',
        'Eye Problem',
        'Breathing Problems/Difficulty of Breathing',
        'Burns',
        'Electrical Shock',
        'Allergic Reaction',
        'Overdose',
        'Flu-like Symptoms',
        'Unconscious',
        'Seizures',
        'Pregnancy/Childbirth',
        'Wound Dressing/First Aid',
        'Dead',
        'Nausea and Vomiting',
        'Covid Transport',
        'Waiver',
        'Fainting',
        'Suicide',
        'CVA (Stroke)',
        'Animal Bite',
        'Stab Wound',
        'Hypertensive Emergency',
        'Psychosomatic Disorder',
        'Post Operative Case',
        'Loss Bowel Movement/Mild Dehydration',
        'Chest Pain',
        'Body Weakness',
        'Attempted Suicide',
    ];

    public const MONTH_NAMES = [
        1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
        5 => 'May', 6 => 'Jun', 7 => 'Jul', 8 => 'Aug',
        9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec'
    ];

    /**
     * Get distinct years available in database records.
     */
    public function getAvailableYears(): array
    {
        $currentYear = (int) now()->format('Y');
        $yearsFromIncidents = Incident::selectRaw('YEAR(reported_at) as y')
            ->whereNotNull('reported_at')
            ->distinct()
            ->pluck('y')
            ->toArray();

        $yearsFromCreated = Incident::selectRaw('YEAR(created_at) as y')
            ->whereNotNull('created_at')
            ->distinct()
            ->pluck('y')
            ->toArray();

        $yearsFromPcr = PatientCareRecord::selectRaw('YEAR(created_at) as y')
            ->whereNotNull('created_at')
            ->distinct()
            ->pluck('y')
            ->toArray();

        $allYears = array_unique(array_filter(array_merge(
            $yearsFromIncidents,
            $yearsFromCreated,
            $yearsFromPcr,
            [$currentYear, $currentYear - 1]
        )));

        rsort($allYears);
        return array_values($allYears);
    }

    /**
     * Generate the complete monthly response and patient complaint report for the given year.
     */
    public function getFullYearReport(int $year): array
    {
        $report1 = $this->generateReport1($year);
        $report2 = $this->generateReport2($year);

        return [
            'year' => $year,
            'available_years' => $this->getAvailableYears(),
            'report1' => $report1,
            'report2' => $report2,
            'generated_at' => now()->format('F d, Y h:i A'),
        ];
    }

    /**
     * Report 1: Monthly Emergency Response Summary
     */
    public function generateReport1(int $year): array
    {
        // Initialize 12 months for each category and chief of complaint
        $categoriesData = [];
        foreach (self::REPORT1_CATEGORIES as $categoryName => $complaints) {
            $categoriesData[$categoryName] = [
                'complaints' => [],
                'subtotals' => array_fill(1, 12, 0),
                'annual_subtotal' => 0,
            ];
            foreach ($complaints as $cName) {
                $categoriesData[$categoryName]['complaints'][$cName] = [
                    'months' => array_fill(1, 12, 0),
                    'annual_total' => 0,
                ];
            }
        }

        $unclassifiedComplaints = [];

        // Query qualifying incidents for the year
        // Excludes pranks, rejected, and cancelled reports
        $incidents = Incident::with([
            'incidentType',
            'dispatches.patientCareRecord',
            'dispatches.patientCareRecords',
        ])
        ->where(function ($q) use ($year) {
            $q->whereYear('reported_at', $year)
              ->orWhere(function ($sq) use ($year) {
                  $sq->whereNull('reported_at')->whereYear('created_at', $year);
              });
        })
        ->where('is_prank', false)
        ->whereNotIn('incident_status', ['rejected', 'cancelled'])
        ->get();

        foreach ($incidents as $incident) {
            $date = $incident->reported_at ?? $incident->created_at;
            if (!$date) continue;

            $month = (int) Carbon::parse($date)->format('n');
            if ($month < 1 || $month > 12) continue;

            $complaint = $this->resolveIncidentComplaint($incident);
            $classification = $this->matchReport1CategoryAndComplaint($complaint, $incident);

            if ($classification) {
                $cat = $classification['category'];
                $comp = $classification['complaint'];

                $categoriesData[$cat]['complaints'][$comp]['months'][$month]++;
                $categoriesData[$cat]['complaints'][$comp]['annual_total']++;
                $categoriesData[$cat]['subtotals'][$month]++;
                $categoriesData[$cat]['annual_subtotal']++;
            } else {
                // Place in Unclassified
                $unclassifiedLabel = !empty($complaint) ? $complaint : 'Unclassified Incident';
                if (!isset($unclassifiedComplaints[$unclassifiedLabel])) {
                    $unclassifiedComplaints[$unclassifiedLabel] = [
                        'months' => array_fill(1, 12, 0),
                        'annual_total' => 0,
                    ];
                }
                $unclassifiedComplaints[$unclassifiedLabel]['months'][$month]++;
                $unclassifiedComplaints[$unclassifiedLabel]['annual_total']++;
            }
        }

        // Calculate Monthly Grand Subtotals and Overall Grand Total
        $monthlySubtotals = array_fill(1, 12, 0);
        $annualGrandTotal = 0;

        foreach ($categoriesData as $catName => $data) {
            for ($m = 1; $m <= 12; $m++) {
                $monthlySubtotals[$m] += $data['subtotals'][$m];
            }
            $annualGrandTotal += $data['annual_subtotal'];
        }

        // Include unclassified in grand totals if any
        $unclassifiedSubtotals = array_fill(1, 12, 0);
        $unclassifiedAnnual = 0;
        foreach ($unclassifiedComplaints as $uData) {
            for ($m = 1; $m <= 12; $m++) {
                $unclassifiedSubtotals[$m] += $uData['months'][$m];
                $monthlySubtotals[$m] += $uData['months'][$m];
            }
            $unclassifiedAnnual += $uData['annual_total'];
            $annualGrandTotal += $uData['annual_total'];
        }

        return [
            'categories' => $categoriesData,
            'unclassified' => [
                'has_records' => count($unclassifiedComplaints) > 0,
                'complaints' => $unclassifiedComplaints,
                'subtotals' => $unclassifiedSubtotals,
                'annual_subtotal' => $unclassifiedAnnual,
            ],
            'monthly_subtotals' => $monthlySubtotals,
            'annual_grand_total' => $annualGrandTotal,
        ];
    }

    /**
     * Report 2: Monthly Patient Complaint Summary
     */
    public function generateReport2(int $year): array
    {
        // Initialize 34 standard complaint rows
        $complaintsData = [];
        foreach (self::REPORT2_PATIENT_COMPLAINTS as $pComplaint) {
            $complaintsData[$pComplaint] = [
                'months' => array_fill(1, 12, 0),
                'annual_total' => 0,
            ];
        }

        $otherComplaints = [];

        // Query qualifying PCR records for the year
        $pcrs = PatientCareRecord::with(['dispatch.incident'])
            ->where(function ($q) use ($year) {
                $q->whereYear('record_date', $year)
                  ->orWhere(function ($sq) use ($year) {
                      $sq->whereNull('record_date')->whereYear('created_at', $year);
                  });
            })
            ->get();

        foreach ($pcrs as $pcr) {
            // Exclude PCRs tied to prank or rejected incidents
            $incident = $pcr->dispatch?->incident;
            if ($incident && ($incident->is_prank || in_array($incident->incident_status, ['rejected', 'cancelled']))) {
                continue;
            }

            $date = $pcr->record_date ?? $incident?->reported_at ?? $pcr->created_at;
            if (!$date) continue;

            $month = (int) Carbon::parse($date)->format('n');
            if ($month < 1 || $month > 12) continue;

            $matchedKey = $this->matchReport2Complaint($pcr);

            if ($matchedKey && isset($complaintsData[$matchedKey])) {
                $complaintsData[$matchedKey]['months'][$month]++;
                $complaintsData[$matchedKey]['annual_total']++;
            } else {
                $otherLabel = !empty($pcr->clinical_chief_complaint) 
                    ? trim($pcr->clinical_chief_complaint) 
                    : 'Other Recorded Condition';
                if (!isset($otherComplaints[$otherLabel])) {
                    $otherComplaints[$otherLabel] = [
                        'months' => array_fill(1, 12, 0),
                        'annual_total' => 0,
                    ];
                }
                $otherComplaints[$otherLabel]['months'][$month]++;
                $otherComplaints[$otherLabel]['annual_total']++;
            }
        }

        // Calculate Monthly Subtotals and Grand Total
        $monthlySubtotals = array_fill(1, 12, 0);
        $annualGrandTotal = 0;

        foreach ($complaintsData as $data) {
            for ($m = 1; $m <= 12; $m++) {
                $monthlySubtotals[$m] += $data['months'][$m];
            }
            $annualGrandTotal += $data['annual_total'];
        }

        foreach ($otherComplaints as $data) {
            for ($m = 1; $m <= 12; $m++) {
                $monthlySubtotals[$m] += $data['months'][$m];
            }
            $annualGrandTotal += $data['annual_total'];
        }

        return [
            'complaints' => $complaintsData,
            'other_complaints' => [
                'has_records' => count($otherComplaints) > 0,
                'items' => $otherComplaints,
            ],
            'monthly_subtotals' => $monthlySubtotals,
            'annual_grand_total' => $annualGrandTotal,
        ];
    }

    /**
     * Resolve the authoritative chief complaint for an incident.
     */
    protected function resolveIncidentComplaint(Incident $incident): string
    {
        // 1. Check PCR clinical chief complaint (responder's on-scene authority)
        if ($incident->relationLoaded('dispatches') && $incident->dispatches->isNotEmpty()) {
            foreach ($incident->dispatches as $d) {
                if ($d->relationLoaded('patientCareRecords') && $d->patientCareRecords->isNotEmpty()) {
                    foreach ($d->patientCareRecords as $pcr) {
                        if (!empty($pcr->clinical_chief_complaint)) {
                            return trim($pcr->clinical_chief_complaint);
                        }
                    }
                }
                if ($d->relationLoaded('patientCareRecord') && !empty($d->patientCareRecord?->clinical_chief_complaint)) {
                    return trim($d->patientCareRecord->clinical_chief_complaint);
                }
            }
        }

        // 2. Bracketed text in incident description e.g. "[Chest Pain] Patient fell"
        $desc = $incident->incident_description ?? '';
        if (preg_match('/^\[(.*?)\]/', $desc, $matches) && !empty($matches[1])) {
            return trim($matches[1]);
        }

        // 3. Reported chief complaint attribute
        if (!empty($incident->reported_chief_complaint)) {
            return trim($incident->reported_chief_complaint);
        }

        // 4. Incident Type Name
        if ($incident->incidentType && !empty($incident->incidentType->incident_type_name)) {
            return trim($incident->incidentType->incident_type_name);
        }

        return $desc;
    }

    /**
     * Match complaint to Report 1 Category and Official Chief of Complaint.
     */
    protected function matchReport1CategoryAndComplaint(string $complaint, Incident $incident): ?array
    {
        $rawNorm = strtolower(trim($complaint));

        // 1. Exact match against official list
        foreach (self::REPORT1_CATEGORIES as $category => $complaints) {
            foreach ($complaints as $target) {
                if (strtolower($target) === $rawNorm) {
                    return ['category' => $category, 'complaint' => $target];
                }
            }
        }

        // 2. Special aliases & spelling preservation
        $aliasMap = [
            'severe weather' => ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Sever Weather'],
            'sever weather' => ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Sever Weather'],
            'flash flood' => ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Sever Weather'],
            'search and rescue' => ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Search and Rescue/Retreival'],
            'search and rescue/retrieval' => ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Search and Rescue/Retreival'],
            'search and rescue/retreival' => ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Search and Rescue/Retreival'],
            'water rescue' => ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Water Rescue/Drowning Incident'],
            'drowning' => ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Water Rescue/Drowning Incident'],
            'water rescue/drowning incident' => ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Water Rescue/Drowning Incident'],
            'evacuation center' => ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Evacuation Center Management'],
            'evacuation center management' => ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Evacuation Center Management'],

            // Hemorrhage spelling
            'hemorrhage/laceration/abrasion' => ['category' => 'MEDICAL EMERGENCY', 'complaint' => 'Hemorrage/Laceration/Abrasion'],
            'hemorrage/laceration/abrasion' => ['category' => 'MEDICAL EMERGENCY', 'complaint' => 'Hemorrage/Laceration/Abrasion'],
            'laceration' => ['category' => 'MEDICAL EMERGENCY', 'complaint' => 'Hemorrage/Laceration/Abrasion'],
            'abrasion' => ['category' => 'MEDICAL EMERGENCY', 'complaint' => 'Hemorrage/Laceration/Abrasion'],

            // Vehicular
            'vehicular accident' => ['category' => 'MEDICAL EMERGENCY', 'complaint' => 'Motor Vehicular Accidents'],
            'motor vehicular accident' => ['category' => 'MEDICAL EMERGENCY', 'complaint' => 'Motor Vehicular Accidents'],
            'motor vehicular accidents' => ['category' => 'MEDICAL EMERGENCY', 'complaint' => 'Motor Vehicular Accidents'],
            'car crash' => ['category' => 'MEDICAL EMERGENCY', 'complaint' => 'Motor Vehicular Accidents'],
            'pedestrian' => ['category' => 'MEDICAL EMERGENCY', 'complaint' => 'Motor Vehicular Accidents (Pedestrian)'],

            // Fire
            'fire incident' => ['category' => 'FIRE EMERGENCY', 'complaint' => 'Fire Incidents'],
            'fire incidents' => ['category' => 'FIRE EMERGENCY', 'complaint' => 'Fire Incidents'],
            'fire emergency' => ['category' => 'FIRE EMERGENCY', 'complaint' => 'Fire Incidents'],

            // Crime
            'crime & security' => ['category' => 'CRIME & SECURITY', 'complaint' => 'Assault'],
            'theft' => ['category' => 'CRIME & SECURITY', 'complaint' => 'Assault'],
            'robbery' => ['category' => 'CRIME & SECURITY', 'complaint' => 'Assault'],
        ];

        if (isset($aliasMap[$rawNorm])) {
            return $aliasMap[$rawNorm];
        }

        // 3. Substring matching for clinical complaints
        foreach (self::REPORT1_CATEGORIES as $category => $complaints) {
            foreach ($complaints as $target) {
                $targetNorm = strtolower($target);
                if (str_contains($rawNorm, $targetNorm) || str_contains($targetNorm, $rawNorm)) {
                    return ['category' => $category, 'complaint' => $target];
                }
            }
        }

        // 4. Incident Type fallback
        $typeName = strtolower($incident->incidentType?->incident_type_name ?? '');
        if ($typeName === 'medical emergency') {
            return ['category' => 'MEDICAL EMERGENCY', 'complaint' => 'Medical Emergency'];
        }
        if ($typeName === 'fire emergency') {
            return ['category' => 'FIRE EMERGENCY', 'complaint' => 'Fire Incidents'];
        }
        if (str_contains($typeName, 'weather') || str_contains($typeName, 'flood')) {
            return ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Sever Weather'];
        }
        if (str_contains($typeName, 'search') || str_contains($typeName, 'rescue')) {
            return ['category' => 'SEVERE WEATHER / FLOOD', 'complaint' => 'Search and Rescue/Retreival'];
        }
        if (str_contains($typeName, 'crime') || str_contains($typeName, 'security')) {
            return ['category' => 'CRIME & SECURITY', 'complaint' => 'Assault'];
        }

        return null;
    }

    /**
     * Match PCR record to Report 2 Patient Complaint.
     */
    protected function matchReport2Complaint(PatientCareRecord $pcr): ?string
    {
        $comp = strtolower(trim($pcr->clinical_chief_complaint ?? ''));
        $assessmentArr = is_array($pcr->assessment) 
            ? $pcr->assessment 
            : (is_string($pcr->assessment) ? [$pcr->assessment] : []);

        $assessmentText = strtolower(implode(' ', $assessmentArr));
        $fullClinical = "{$comp} {$assessmentText}";

        // 1. Direct match with 34 list
        foreach (self::REPORT2_PATIENT_COMPLAINTS as $target) {
            if (strtolower($target) === $comp) {
                return $target;
            }
        }

        // 2. Keyword heuristic matching against 34 list
        if (str_contains($fullClinical, 'bleed') || str_contains($fullClinical, 'hemorrhage') || str_contains($fullClinical, 'laceration') || str_contains($fullClinical, 'abrasion') || str_contains($fullClinical, 'avulsion') || str_contains($fullClinical, 'amputation')) {
            return 'Hemorrhage/Laceration/Abrasion';
        }
        if (str_contains($fullClinical, 'trauma') || str_contains($fullClinical, 'injury') || str_contains($fullClinical, 'vehicular') || str_contains($fullClinical, 'accident')) {
            return 'Trauma';
        }
        if (str_contains($fullClinical, 'fall')) {
            return 'Fall Victim';
        }
        if (str_contains($fullClinical, 'fracture') || str_contains($fullClinical, 'dislocation')) {
            return 'Fracture/Dislocation';
        }
        if (str_contains($fullClinical, 'burn')) {
            return 'Burns';
        }
        if (str_contains($fullClinical, 'dead') || str_contains($fullClinical, 'cadaver') || str_contains($fullClinical, 'deceased')) {
            return 'Dead';
        }
        if (str_contains($fullClinical, 'suicide') && str_contains($fullClinical, 'attempt')) {
            return 'Attempted Suicide';
        }
        if (str_contains($fullClinical, 'suicide')) {
            return 'Suicide';
        }
        if (str_contains($fullClinical, 'fever') || str_contains($fullClinical, 'cough') || str_contains($fullClinical, 'flu')) {
            return 'Flu-like Symptoms';
        }
        if (str_contains($fullClinical, 'breath') || str_contains($fullClinical, 'dyspnea') || str_contains($fullClinical, 'asthma')) {
            return 'Breathing Problems/Difficulty of Breathing';
        }
        if (str_contains($fullClinical, 'chest pain') || str_contains($fullClinical, 'cardiac')) {
            return 'Chest Pain';
        }
        if (str_contains($fullClinical, 'unconscious') || str_contains($fullClinical, 'unresponsive')) {
            return 'Unconscious';
        }
        if (str_contains($fullClinical, 'seizure') || str_contains($fullClinical, 'convulsion')) {
            return 'Seizures';
        }
        if (str_contains($fullClinical, 'stroke') || str_contains($fullClinical, 'cva')) {
            return 'CVA (Stroke)';
        }
        if (str_contains($fullClinical, 'headache')) {
            return 'Headache';
        }
        if (str_contains($fullClinical, 'abdominal') || str_contains($fullClinical, 'stomach')) {
            return 'Abdominal Pain';
        }
        if (str_contains($fullClinical, 'back pain')) {
            return 'Back Pain';
        }
        if (str_contains($fullClinical, 'wound dressing') || str_contains($fullClinical, 'first aid')) {
            return 'Wound Dressing/First Aid';
        }
        if (str_contains($fullClinical, 'weakness')) {
            return 'Body Weakness';
        }
        if (str_contains($fullClinical, 'waiver')) {
            return 'Waiver';
        }

        return null;
    }
}
