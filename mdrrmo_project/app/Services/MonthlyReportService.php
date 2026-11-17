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

        $rawYears = array_merge(
            $yearsFromIncidents,
            $yearsFromCreated,
            $yearsFromPcr,
            [$currentYear, $currentYear - 1]
        );
        $intYears = array_filter(array_map('intval', $rawYears));
        $allYears = array_unique($intYears);

        rsort($allYears);
        return array_values($allYears);
    }

    /**
     * Generate the complete monthly response and patient complaint report for the given year.
     */
    public function getFullYearReport(int $year): array
    {
        return $this->getFilteredReport([
            'period' => 'yearly',
            'year' => $year,
        ]);
    }

    /**
     * Build the complete dynamic map of categories and their chief complaints,
     * merging official base categories with custom categories and complaints
     * from database (EmergencyComplaint, IncidentType) and client-supplied params.
     */
    public function getAllCategoriesWithComplaints(array $clientCategories = [], array $clientIncidents = []): array
    {
        // 1. Start with official base categories
        $categories = self::REPORT1_CATEGORIES;

        // Helper to find existing category key (case-insensitive)
        $findCategoryKey = function (string $name) use (&$categories): ?string {
            $norm = strtoupper(trim($name));
            foreach (array_keys($categories) as $existingKey) {
                if (strtoupper(trim($existingKey)) === $norm) {
                    return $existingKey;
                }
            }
            return null;
        };

        // Helper to add a complaint to a category
        $addComplaintToCategory = function (string $catKey, string $complaint) use (&$categories) {
            $cTrim = trim($complaint);
            if (empty($cTrim)) return;
            $cNorm = strtolower($cTrim);
            foreach ($categories[$catKey] as $existingC) {
                if (strtolower(trim($existingC)) === $cNorm) {
                    return; // already exists
                }
            }
            $categories[$catKey][] = $cTrim;
        };

        // 2. Query Database: EmergencyComplaint table
        try {
            $dbComplaints = \App\Models\EmergencyComplaint::all();
            foreach ($dbComplaints as $dbC) {
                $rawCat = trim($dbC->category ?? '');
                $rawComp = trim($dbC->complaint_name ?? '');
                if (empty($rawComp)) continue;

                $targetCatKey = !empty($rawCat) ? $findCategoryKey($rawCat) : null;
                if (!$targetCatKey) {
                    $targetCatKey = strtoupper($rawCat ?: 'OTHER EMERGENCY');
                    $categories[$targetCatKey] = [];
                }
                $addComplaintToCategory($targetCatKey, $rawComp);
            }
        } catch (\Throwable $e) {}

        // 3. Query Database: IncidentType table (Categories/Types created by user)
        try {
            $dbTypes = \App\Models\IncidentType::all();
            foreach ($dbTypes as $type) {
                $tName = trim($type->incident_type_name ?? '');
                if (empty($tName)) continue;

                $existingCatKey = $findCategoryKey($tName);
                if (!$existingCatKey) {
                    $newCatKey = strtoupper($tName);
                    if (!isset($categories[$newCatKey])) {
                        $categories[$newCatKey] = [$tName];
                    }
                }
            }
        } catch (\Throwable $e) {}

        // 4. Merge Client-passed custom categories (from localStorage/UI)
        if (!empty($clientCategories)) {
            foreach ($clientCategories as $cCat) {
                $cCatTrim = trim($cCat);
                if (empty($cCatTrim)) continue;
                $existing = $findCategoryKey($cCatTrim);
                if (!$existing) {
                    $newKey = strtoupper($cCatTrim);
                    if (!isset($categories[$newKey])) {
                        $categories[$newKey] = [$cCatTrim];
                    }
                }
            }
        }

        // 5. Merge Client-passed custom incidents map: ['Category Name' => ['Complaint 1', 'Complaint 2']]
        if (!empty($clientIncidents)) {
            foreach ($clientIncidents as $catName => $incList) {
                if (!is_array($incList)) continue;
                $targetKey = $findCategoryKey($catName);
                if (!$targetKey) {
                    $targetKey = strtoupper(trim($catName));
                    $categories[$targetKey] = [];
                }
                foreach ($incList as $incItem) {
                    $addComplaintToCategory($targetKey, $incItem);
                }
            }
        }

        return $categories;
    }

    /**
     * Generate response and patient complaint report filtered by timeframe (Yearly, Monthly, Weekly, Daily).
     */
    public function getFilteredReport(array $params = []): array
    {
        $allCategories = $this->getAllCategoriesWithComplaints(
            $params['custom_categories'] ?? [],
            $params['custom_incidents'] ?? []
        );
        $catCount = count($allCategories);

        $period = $params['period'] ?? 'yearly';
        if (!in_array($period, ['yearly', 'monthly', 'weekly', 'daily'])) {
            $period = 'yearly';
        }

        $year = (int) ($params['year'] ?? now()->format('Y'));
        $month = (int) ($params['month'] ?? now()->format('n'));
        if ($month < 1 || $month > 12) {
            $month = (int) now()->format('n');
        }

        $dateStr = !empty($params['date']) ? $params['date'] : now()->format('Y-m-d');
        try {
            $targetDate = Carbon::parse($dateStr);
        } catch (\Throwable $e) {
            $targetDate = now();
        }

        switch ($period) {
            case 'monthly':
                $monthDate = Carbon::createFromDate($year, $month, 1);
                $monthName = $monthDate->format('F');
                $monthUpper = strtoupper($monthName);
                $daysInMonth = $monthDate->daysInMonth;

                $columns = [
                    ['key' => 'w1', 'label' => 'Wk 1 (1–7)'],
                    ['key' => 'w2', 'label' => 'Wk 2 (8–14)'],
                    ['key' => 'w3', 'label' => 'Wk 3 (15–21)'],
                    ['key' => 'w4', 'label' => 'Wk 4 (22–28)'],
                ];
                if ($daysInMonth > 28) {
                    $columns[] = ['key' => 'w5', 'label' => "Wk 5 (29–{$daysInMonth})"];
                }

                $titlePeriod = "FOR THE MONTH OF {$monthUpper} {$year}";
                $subtitlePeriod = "Counts by All {$catCount} Incident Categories & Chief of Complaint ({$monthName} {$year})";
                $totalLabel = "Monthly Total";
                $formCodeSuffix = "{$year}-M" . str_pad((string)$month, 2, '0', STR_PAD_LEFT);

                $incidentFilter = function ($q) use ($year, $month) {
                    $q->where(function ($sq) use ($year, $month) {
                        $sq->whereYear('reported_at', $year)->whereMonth('reported_at', $month)
                           ->orWhere(function ($ssq) use ($year, $month) {
                               $ssq->whereNull('reported_at')->whereYear('created_at', $year)->whereMonth('created_at', $month);
                           });
                    });
                };

                $pcrFilter = function ($q) use ($year, $month) {
                    $q->where(function ($sq) use ($year, $month) {
                        $sq->whereYear('record_date', $year)->whereMonth('record_date', $month)
                           ->orWhere(function ($ssq) use ($year, $month) {
                               $ssq->whereNull('record_date')->whereYear('created_at', $year)->whereMonth('created_at', $month);
                           });
                    });
                };

                $bucketResolver = function ($dt) {
                    $d = (int) Carbon::parse($dt)->format('j');
                    if ($d <= 7) return 'w1';
                    if ($d <= 14) return 'w2';
                    if ($d <= 21) return 'w3';
                    if ($d <= 28) return 'w4';
                    return 'w5';
                };
                break;

            case 'weekly':
                $startOfWeek = $targetDate->copy()->startOfWeek(Carbon::MONDAY);
                $endOfWeek = $targetDate->copy()->endOfWeek(Carbon::SUNDAY);

                $columns = [
                    ['key' => 'mon', 'label' => 'Mon (' . $startOfWeek->copy()->format('M d') . ')'],
                    ['key' => 'tue', 'label' => 'Tue (' . $startOfWeek->copy()->addDays(1)->format('M d') . ')'],
                    ['key' => 'wed', 'label' => 'Wed (' . $startOfWeek->copy()->addDays(2)->format('M d') . ')'],
                    ['key' => 'thu', 'label' => 'Thu (' . $startOfWeek->copy()->addDays(3)->format('M d') . ')'],
                    ['key' => 'fri', 'label' => 'Fri (' . $startOfWeek->copy()->addDays(4)->format('M d') . ')'],
                    ['key' => 'sat', 'label' => 'Sat (' . $startOfWeek->copy()->addDays(5)->format('M d') . ')'],
                    ['key' => 'sun', 'label' => 'Sun (' . $startOfWeek->copy()->addDays(6)->format('M d') . ')'],
                ];

                $titlePeriod = "FOR THE WEEK OF " . strtoupper($startOfWeek->format('F d')) . " – " . strtoupper($endOfWeek->format('F d, Y'));
                $subtitlePeriod = "Weekly Summary: " . $startOfWeek->format('M d') . " – " . $endOfWeek->format('M d, Y');
                $totalLabel = "Weekly Total";
                $formCodeSuffix = "{$startOfWeek->year}-W" . str_pad((string)$startOfWeek->weekOfYear, 2, '0', STR_PAD_LEFT);

                $sDateStr = $startOfWeek->copy()->startOfDay()->toDateTimeString();
                $eDateStr = $endOfWeek->copy()->endOfDay()->toDateTimeString();

                $incidentFilter = function ($q) use ($sDateStr, $eDateStr) {
                    $q->where(function ($sq) use ($sDateStr, $eDateStr) {
                        $sq->whereBetween('reported_at', [$sDateStr, $eDateStr])
                           ->orWhere(function ($ssq) use ($sDateStr, $eDateStr) {
                               $ssq->whereNull('reported_at')->whereBetween('created_at', [$sDateStr, $eDateStr]);
                           });
                    });
                };

                $pcrFilter = function ($q) use ($sDateStr, $eDateStr) {
                    $q->where(function ($sq) use ($sDateStr, $eDateStr) {
                        $sq->whereBetween('record_date', [$sDateStr, $eDateStr])
                           ->orWhere(function ($ssq) use ($sDateStr, $eDateStr) {
                               $ssq->whereNull('record_date')->whereBetween('created_at', [$sDateStr, $eDateStr]);
                           });
                    });
                };

                $bucketResolver = function ($dt) {
                    return strtolower(Carbon::parse($dt)->format('D'));
                };
                break;

            case 'daily':
                $dailyStr = $targetDate->format('Y-m-d');
                $formattedDate = $targetDate->format('F d, Y');
                $formattedDateUpper = strtoupper($formattedDate);

                $columns = [
                    ['key' => 't1', 'label' => '12AM–4AM'],
                    ['key' => 't2', 'label' => '4AM–8AM'],
                    ['key' => 't3', 'label' => '8AM–12PM'],
                    ['key' => 't4', 'label' => '12PM–4PM'],
                    ['key' => 't5', 'label' => '4PM–8PM'],
                    ['key' => 't6', 'label' => '8PM–12AM'],
                ];

                $titlePeriod = "FOR THE DATE: {$formattedDateUpper}";
                $subtitlePeriod = "24-Hour Shift Counts ({$formattedDate})";
                $totalLabel = "Daily Total";
                $formCodeSuffix = $dailyStr;

                $sDayStr = $targetDate->copy()->startOfDay()->toDateTimeString();
                $eDayStr = $targetDate->copy()->endOfDay()->toDateTimeString();

                $incidentFilter = function ($q) use ($sDayStr, $eDayStr) {
                    $q->where(function ($sq) use ($sDayStr, $eDayStr) {
                        $sq->whereBetween('reported_at', [$sDayStr, $eDayStr])
                           ->orWhere(function ($ssq) use ($sDayStr, $eDayStr) {
                               $ssq->whereNull('reported_at')->whereBetween('created_at', [$sDayStr, $eDayStr]);
                           });
                    });
                };

                $pcrFilter = function ($q) use ($sDayStr, $eDayStr) {
                    $q->where(function ($sq) use ($sDayStr, $eDayStr) {
                        $sq->whereBetween('record_date', [$sDayStr, $eDayStr])
                           ->orWhere(function ($ssq) use ($sDayStr, $eDayStr) {
                               $ssq->whereNull('record_date')->whereBetween('created_at', [$sDayStr, $eDayStr]);
                           });
                    });
                };

                $bucketResolver = function ($dt) {
                    $h = (int) Carbon::parse($dt)->format('G');
                    if ($h < 4) return 't1';
                    if ($h < 8) return 't2';
                    if ($h < 12) return 't3';
                    if ($h < 16) return 't4';
                    if ($h < 20) return 't5';
                    return 't6';
                };
                break;

            case 'yearly':
            default:
                $columns = [
                    ['key' => '1', 'label' => 'Jan'],
                    ['key' => '2', 'label' => 'Feb'],
                    ['key' => '3', 'label' => 'Mar'],
                    ['key' => '4', 'label' => 'Apr'],
                    ['key' => '5', 'label' => 'May'],
                    ['key' => '6', 'label' => 'Jun'],
                    ['key' => '7', 'label' => 'Jul'],
                    ['key' => '8', 'label' => 'Aug'],
                    ['key' => '9', 'label' => 'Sep'],
                    ['key' => '10', 'label' => 'Oct'],
                    ['key' => '11', 'label' => 'Nov'],
                    ['key' => '12', 'label' => 'Dec'],
                ];

                $titlePeriod = "FOR THE YEAR {$year}";
                $subtitlePeriod = "Counts by All {$catCount} Incident Categories & Chief of Complaint ({$year})";
                $totalLabel = "Annual Total";
                $formCodeSuffix = (string) $year;

                $incidentFilter = function ($q) use ($year) {
                    $q->where(function ($sq) use ($year) {
                        $sq->whereYear('reported_at', $year)
                           ->orWhere(function ($ssq) use ($year) {
                               $ssq->whereNull('reported_at')->whereYear('created_at', $year);
                           });
                    });
                };

                $pcrFilter = function ($q) use ($year) {
                    $q->where(function ($sq) use ($year) {
                        $sq->whereYear('record_date', $year)
                           ->orWhere(function ($ssq) use ($year) {
                               $ssq->whereNull('record_date')->whereYear('created_at', $year);
                           });
                    });
                };

                $bucketResolver = function ($dt) {
                    return (string) (int) Carbon::parse($dt)->format('n');
                };
                break;
        }

        $config = [
            'columns' => $columns,
            'total_label' => $totalLabel,
            'incident_filter' => $incidentFilter,
            'pcr_filter' => $pcrFilter,
            'bucket_resolver' => $bucketResolver,
            'period' => $period,
            'year' => $year,
            'all_categories' => $allCategories,
            'custom_incidents' => $params['custom_incidents'] ?? [],
        ];

        $report1 = $this->generateGenericReport1($config);
        $report2 = $this->generateGenericReport2($config);

        return [
            'period' => $period,
            'year' => $year,
            'month' => $month,
            'date' => $targetDate->format('Y-m-d'),
            'columns' => $columns,
            'title_period' => $titlePeriod,
            'subtitle_period' => $subtitlePeriod,
            'total_label' => $totalLabel,
            'form_code_suffix' => $formCodeSuffix,
            'category_count' => $catCount,
            'categories_list' => array_keys($allCategories),
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
        return $this->getFilteredReport(['period' => 'yearly', 'year' => $year])['report1'];
    }

    /**
     * Report 2: Monthly Patient Complaint Summary
     */
    public function generateReport2(int $year): array
    {
        return $this->getFilteredReport(['period' => 'yearly', 'year' => $year])['report2'];
    }

    /**
     * Generalized Report 1 Generator supporting all periods
     */
    public function generateGenericReport1(array $config): array
    {
        $columns = $config['columns'];
        $bucketResolver = $config['bucket_resolver'];
        $incidentFilter = $config['incident_filter'];
        $allCategories = $config['all_categories'] ?? $this->getAllCategoriesWithComplaints();

        $colKeys = array_column($columns, 'key');
        $blankCols = array_fill_keys($colKeys, 0);

        $categoriesData = [];
        foreach ($allCategories as $categoryName => $complaints) {
            $categoriesData[$categoryName] = [
                'complaints' => [],
                'subtotals' => $blankCols,
                'annual_subtotal' => 0,
            ];
            foreach ($complaints as $cName) {
                $categoriesData[$categoryName]['complaints'][$cName] = [
                    'months' => $blankCols,
                    'columns' => $blankCols,
                    'annual_total' => 0,
                    'total' => 0,
                ];
            }
        }

        $unclassifiedComplaints = [];

        $incidents = Incident::with([
            'incidentType',
            'dispatches.patientCareRecord',
            'dispatches.patientCareRecords',
        ])
        ->where($incidentFilter)
        ->where(function ($pq) {
            $pq->where('is_prank', false)->orWhereNull('is_prank');
        })
        ->whereNotIn('incident_status', ['rejected', 'cancelled'])
        ->get();

        foreach ($incidents as $incident) {
            $date = $incident->reported_at ?? $incident->created_at;
            if (!$date) continue;

            $bKey = $bucketResolver($date);
            if (!$bKey || !isset($blankCols[$bKey])) continue;

            $complaint = $this->resolveIncidentComplaint($incident);
            $classification = $this->matchReport1CategoryAndComplaint($complaint, $incident, $allCategories);

            if ($classification) {
                $cat = $classification['category'];
                $comp = $classification['complaint'];

                if (!isset($categoriesData[$cat])) {
                    $categoriesData[$cat] = [
                        'complaints' => [],
                        'subtotals' => $blankCols,
                        'annual_subtotal' => 0,
                    ];
                }

                if (!isset($categoriesData[$cat]['complaints'][$comp])) {
                    $categoriesData[$cat]['complaints'][$comp] = [
                        'months' => $blankCols,
                        'columns' => $blankCols,
                        'annual_total' => 0,
                        'total' => 0,
                    ];
                }

                $categoriesData[$cat]['complaints'][$comp]['columns'][$bKey]++;
                $categoriesData[$cat]['complaints'][$comp]['months'][$bKey]++;
                $categoriesData[$cat]['complaints'][$comp]['annual_total']++;
                $categoriesData[$cat]['complaints'][$comp]['total']++;

                $categoriesData[$cat]['subtotals'][$bKey]++;
                $categoriesData[$cat]['annual_subtotal']++;
            } else {
                $unclassifiedLabel = !empty($complaint) ? $complaint : 'Unclassified Incident';
                if (!isset($unclassifiedComplaints[$unclassifiedLabel])) {
                    $unclassifiedComplaints[$unclassifiedLabel] = [
                        'months' => $blankCols,
                        'columns' => $blankCols,
                        'annual_total' => 0,
                        'total' => 0,
                    ];
                }
                $unclassifiedComplaints[$unclassifiedLabel]['columns'][$bKey]++;
                $unclassifiedComplaints[$unclassifiedLabel]['months'][$bKey]++;
                $unclassifiedComplaints[$unclassifiedLabel]['annual_total']++;
                $unclassifiedComplaints[$unclassifiedLabel]['total']++;
            }
        }

        $columnSubtotals = $blankCols;
        $overallGrandTotal = 0;

        foreach ($categoriesData as $catName => $data) {
            foreach ($colKeys as $k) {
                $columnSubtotals[$k] += $data['subtotals'][$k];
            }
            $overallGrandTotal += $data['annual_subtotal'];
        }

        $unclassifiedSubtotals = $blankCols;
        $unclassifiedAnnual = 0;
        foreach ($unclassifiedComplaints as $uData) {
            foreach ($colKeys as $k) {
                $unclassifiedSubtotals[$k] += $uData['columns'][$k];
                $columnSubtotals[$k] += $uData['columns'][$k];
            }
            $unclassifiedAnnual += $uData['total'];
            $overallGrandTotal += $uData['total'];
        }

        return [
            'categories' => $categoriesData,
            'unclassified' => [
                'has_records' => count($unclassifiedComplaints) > 0,
                'complaints' => $unclassifiedComplaints,
                'subtotals' => $unclassifiedSubtotals,
                'annual_subtotal' => $unclassifiedAnnual,
            ],
            'monthly_subtotals' => $columnSubtotals,
            'annual_grand_total' => $overallGrandTotal,
        ];
    }

    /**
     * Generalized Report 2 Generator supporting all periods
     */
    public function generateGenericReport2(array $config): array
    {
        $columns = $config['columns'];
        $bucketResolver = $config['bucket_resolver'];
        $pcrFilter = $config['pcr_filter'];
        $customIncidents = $config['custom_incidents'] ?? [];

        $colKeys = array_column($columns, 'key');
        $blankCols = array_fill_keys($colKeys, 0);

        $pcrComplaints = self::REPORT2_PATIENT_COMPLAINTS;

        // Include any medical complaints from EmergencyComplaint table
        try {
            $dbMedComplaints = \App\Models\EmergencyComplaint::where(function($q) {
                $q->whereRaw('LOWER(TRIM(category)) = ?', ['medical emergency'])
                  ->orWhereNull('category');
            })->pluck('complaint_name')->toArray();

            foreach ($dbMedComplaints as $mName) {
                $mTrim = trim($mName);
                if (!empty($mTrim)) {
                    $found = false;
                    foreach ($pcrComplaints as $existing) {
                        if (strtolower(trim($existing)) === strtolower($mTrim)) {
                            $found = true;
                            break;
                        }
                    }
                    if (!$found) {
                        $pcrComplaints[] = $mTrim;
                    }
                }
            }
        } catch (\Throwable $e) {}

        // Include any medical complaints from client's custom incidents
        if (!empty($customIncidents)) {
            foreach ($customIncidents as $cat => $incList) {
                if (strtolower(trim($cat)) === 'medical emergency' && is_array($incList)) {
                    foreach ($incList as $cItem) {
                        $cTrim = trim($cItem);
                        if (!empty($cTrim)) {
                            $found = false;
                            foreach ($pcrComplaints as $existing) {
                                if (strtolower(trim($existing)) === strtolower($cTrim)) {
                                    $found = true;
                                    break;
                                }
                            }
                            if (!$found) {
                                $pcrComplaints[] = $cTrim;
                            }
                        }
                    }
                }
            }
        }

        $complaintsData = [];
        foreach ($pcrComplaints as $pComplaint) {
            $complaintsData[$pComplaint] = [
                'months' => $blankCols,
                'columns' => $blankCols,
                'annual_total' => 0,
                'total' => 0,
            ];
        }

        $otherComplaints = [];

        $pcrs = PatientCareRecord::with(['dispatch.incident'])
            ->where($pcrFilter)
            ->get();

        foreach ($pcrs as $pcr) {
            $incident = $pcr->dispatch?->incident;
            if ($incident && ($incident->is_prank || in_array($incident->incident_status, ['rejected', 'cancelled']))) {
                continue;
            }

            $date = $pcr->record_date ?? $incident?->reported_at ?? $pcr->created_at;
            if (!$date) continue;

            $bKey = $bucketResolver($date);
            if (!$bKey || !isset($blankCols[$bKey])) continue;

            $matchedKey = $this->matchReport2Complaint($pcr, $pcrComplaints);

            if ($matchedKey && isset($complaintsData[$matchedKey])) {
                $complaintsData[$matchedKey]['columns'][$bKey]++;
                $complaintsData[$matchedKey]['months'][$bKey]++;
                $complaintsData[$matchedKey]['annual_total']++;
                $complaintsData[$matchedKey]['total']++;
            } else {
                $otherLabel = !empty($pcr->clinical_chief_complaint) 
                    ? trim($pcr->clinical_chief_complaint) 
                    : 'Other Recorded Condition';
                if (!isset($otherComplaints[$otherLabel])) {
                    $otherComplaints[$otherLabel] = [
                        'months' => $blankCols,
                        'columns' => $blankCols,
                        'annual_total' => 0,
                        'total' => 0,
                    ];
                }
                $otherComplaints[$otherLabel]['columns'][$bKey]++;
                $otherComplaints[$otherLabel]['months'][$bKey]++;
                $otherComplaints[$otherLabel]['annual_total']++;
                $otherComplaints[$otherLabel]['total']++;
            }
        }

        $columnSubtotals = $blankCols;
        $overallGrandTotal = 0;

        foreach ($complaintsData as $data) {
            foreach ($colKeys as $k) {
                $columnSubtotals[$k] += $data['columns'][$k];
            }
            $overallGrandTotal += $data['total'];
        }

        foreach ($otherComplaints as $data) {
            foreach ($colKeys as $k) {
                $columnSubtotals[$k] += $data['columns'][$k];
            }
            $overallGrandTotal += $data['total'];
        }

        return [
            'complaints' => $complaintsData,
            'other_complaints' => [
                'has_records' => count($otherComplaints) > 0,
                'items' => $otherComplaints,
            ],
            'monthly_subtotals' => $columnSubtotals,
            'annual_grand_total' => $overallGrandTotal,
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
    protected function matchReport1CategoryAndComplaint(string $complaint, Incident $incident, array $allCategories = []): ?array
    {
        if (empty($allCategories)) {
            $allCategories = self::REPORT1_CATEGORIES;
        }

        $rawNorm = strtolower(trim($complaint));

        // 1. Exact match against all categories & complaints
        foreach ($allCategories as $category => $complaints) {
            foreach ($complaints as $target) {
                if (strtolower(trim($target)) === $rawNorm) {
                    return ['category' => $category, 'complaint' => $target];
                }
            }
        }

        // 2. Incident Type direct match against categories
        $typeName = trim($incident->incidentType?->incident_type_name ?? '');
        $typeNorm = strtolower($typeName);
        if (!empty($typeNorm)) {
            foreach ($allCategories as $category => $complaints) {
                if (strtolower(trim($category)) === $typeNorm) {
                    foreach ($complaints as $target) {
                        if (strtolower(trim($target)) === $rawNorm) {
                            return ['category' => $category, 'complaint' => $target];
                        }
                    }
                    return ['category' => $category, 'complaint' => !empty($complaint) ? $complaint : ($complaints[0] ?? $typeName)];
                }
            }
        }

        // 3. Special aliases & spelling preservation
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

        if (isset($aliasMap[$rawNorm]) && isset($allCategories[$aliasMap[$rawNorm]['category']])) {
            return $aliasMap[$rawNorm];
        }

        // 4. Substring matching for clinical complaints
        foreach ($allCategories as $category => $complaints) {
            foreach ($complaints as $target) {
                $targetNorm = strtolower(trim($target));
                if (!empty($rawNorm) && !empty($targetNorm)) {
                    if (str_contains($rawNorm, $targetNorm) || str_contains($targetNorm, $rawNorm)) {
                        return ['category' => $category, 'complaint' => $target];
                    }
                }
            }
        }

        // 5. Incident Type substring fallback
        if (!empty($typeNorm)) {
            foreach ($allCategories as $category => $complaints) {
                $catNorm = strtolower(trim($category));
                if (str_contains($catNorm, $typeNorm) || str_contains($typeNorm, $catNorm)) {
                    return ['category' => $category, 'complaint' => !empty($complaint) ? $complaint : ($complaints[0] ?? $typeName)];
                }
            }
        }

        return null;
    }

    /**
     * Match PCR record to Report 2 Patient Complaint.
     */
    protected function matchReport2Complaint(PatientCareRecord $pcr, array $allPcrComplaints = []): ?string
    {
        $comp = strtolower(trim($pcr->clinical_chief_complaint ?? ''));
        $assessmentArr = is_array($pcr->assessment) 
            ? $pcr->assessment 
            : (is_string($pcr->assessment) ? [$pcr->assessment] : []);

        $assessmentText = strtolower(implode(' ', $assessmentArr));
        $fullClinical = "{$comp} {$assessmentText}";

        $targets = !empty($allPcrComplaints) ? $allPcrComplaints : self::REPORT2_PATIENT_COMPLAINTS;

        // 1. Direct match with complaints list
        foreach ($targets as $target) {
            if (strtolower(trim($target)) === $comp) {
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
