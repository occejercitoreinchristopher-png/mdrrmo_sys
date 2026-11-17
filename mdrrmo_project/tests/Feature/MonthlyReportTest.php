<?php

use App\Models\User;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Services\MonthlyReportService;

test('guests are redirected from reports and monthly summary', function () {
    $this->get('/reports')->assertRedirect(route('login'));
    $this->get('/reports/monthly-summary')->assertRedirect(route('login'));
});

test('residents cannot access reports or monthly summary', function () {
    $resident = User::factory()->create(['role' => 'resident']);

    $this->actingAs($resident)->get('/reports')->assertForbidden();
    $this->actingAs($resident)->get('/reports/monthly-summary')->assertForbidden();
});

test('admin can access reports dashboard and receive monthlyReportData', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get('/reports');
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('admin/Reports')
            ->has('monthlyReportData')
            ->has('monthlyReportData.report1')
            ->has('monthlyReportData.report2')
            ->has('monthlyReportData.year')
    );
});

test('dispatcher can access reports dashboard', function () {
    $dispatcher = User::factory()->create(['role' => 'dispatcher']);

    $response = $this->actingAs($dispatcher)->get('/reports');
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('admin/Reports')
            ->has('monthlyReportData')
    );
});

test('monthly summary api returns complete official 5 categories and patient complaints structure', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $year = (int) now()->format('Y');

    $response = $this->actingAs($admin)->getJson("/reports/monthly-summary?year={$year}");
    $response->assertOk();
    $data = $response->json();

    // Check high level structure
    expect($data)->toHaveKeys(['year', 'available_years', 'report1', 'report2', 'generated_at']);
    expect($data['year'])->toBe($year);

    // Verify 5 Categories in Report 1
    $report1 = $data['report1'];
    expect($report1)->toHaveKeys(['categories', 'monthly_subtotals', 'annual_grand_total']);
    
    $expectedCategories = [
        'MEDICAL EMERGENCY',
        'FIRE EMERGENCY',
        'SEVERE WEATHER / FLOOD',
        'CRIME & SECURITY',
        'OTHER / NON-EMERGENCY OPERATIONS',
    ];

    foreach ($expectedCategories as $cat) {
        expect($report1['categories'])->toHaveKey($cat);
        expect($report1['categories'][$cat])->toHaveKeys(['complaints', 'subtotals', 'annual_subtotal']);
    }

    // Verify Medical Emergency has 50 entries
    expect(count($report1['categories']['MEDICAL EMERGENCY']['complaints']))->toBe(50);
    // Verify Fire Emergency has 3 entries
    expect(count($report1['categories']['FIRE EMERGENCY']['complaints']))->toBe(3);
    // Verify Severe Weather / Flood has 4 entries
    expect(count($report1['categories']['SEVERE WEATHER / FLOOD']['complaints']))->toBe(4);
    // Verify Crime & Security has 5 entries
    expect(count($report1['categories']['CRIME & SECURITY']['complaints']))->toBe(5);
    // Verify Other / Non-Emergency Operations has 5 entries
    expect(count($report1['categories']['OTHER / NON-EMERGENCY OPERATIONS']['complaints']))->toBe(5);

    // Total Chief Complaints across all 5 categories = 67
    $totalComplaints = 0;
    foreach ($report1['categories'] as $catData) {
        $totalComplaints += count($catData['complaints']);
    }
    expect($totalComplaints)->toBe(67);

    // Verify Report 2 has 34 Patient Complaints
    $report2 = $data['report2'];
    expect($report2)->toHaveKeys(['complaints', 'monthly_subtotals', 'annual_grand_total']);
    expect(count($report2['complaints']))->toBe(34);
});

test('report calculations and subtotals match mathematical sums', function () {
    $service = new MonthlyReportService();
    $year = (int) now()->format('Y');
    $report = $service->getFullYearReport($year);

    $report1 = $report['report1'];
    $calculatedGrandTotal = 0;
    $calculatedMonthlySubtotals = array_fill(1, 12, 0);

    foreach ($report1['categories'] as $catName => $catData) {
        $catCalculatedAnnual = 0;
        $catCalculatedMonths = array_fill(1, 12, 0);

        foreach ($catData['complaints'] as $compName => $compData) {
            $compAnnual = array_sum($compData['months']);
            expect($compData['annual_total'])->toBe($compAnnual);

            for ($m = 1; $m <= 12; $m++) {
                $catCalculatedMonths[$m] += $compData['months'][$m];
            }
            $catCalculatedAnnual += $compAnnual;
        }

        // Check category subtotals
        for ($m = 1; $m <= 12; $m++) {
            expect($catData['subtotals'][$m])->toBe($catCalculatedMonths[$m]);
            $calculatedMonthlySubtotals[$m] += $catCalculatedMonths[$m];
        }
        expect($catData['annual_subtotal'])->toBe($catCalculatedAnnual);
        $calculatedGrandTotal += $catCalculatedAnnual;
    }

    // Include unclassified in check if any
    if (!empty($report1['unclassified']['has_records'])) {
        foreach ($report1['unclassified']['complaints'] as $uComp) {
            for ($m = 1; $m <= 12; $m++) {
                $calculatedMonthlySubtotals[$m] += $uComp['months'][$m];
            }
            $calculatedGrandTotal += $uComp['annual_total'];
        }
    }

    for ($m = 1; $m <= 12; $m++) {
        expect($report1['monthly_subtotals'][$m])->toBe($calculatedMonthlySubtotals[$m]);
    }
    expect($report1['annual_grand_total'])->toBe($calculatedGrandTotal);
});
