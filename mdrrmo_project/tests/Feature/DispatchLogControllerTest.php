<?php

namespace Tests\Feature;

use App\Models\Barangay;
use App\Models\DispatchLog;
use App\Models\DispatchLogAudit;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DispatchLogControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $dispatcher;
    protected User $responder;
    protected User $resident;
    protected Barangay $barangay;
    protected Incident $incident;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->dispatcher = User::factory()->create(['role' => 'dispatcher']);
        $this->responder = User::factory()->create(['role' => 'responder']);
        $this->resident = User::factory()->create(['role' => 'resident']);

        $this->barangay = Barangay::firstOrCreate(
            ['barangay_name' => 'Poblacion']
        );

        $incidentType = IncidentType::firstOrCreate(
            ['incident_type_name' => 'Medical Emergency'],
            ['type_description' => 'Medical Emergency Call']
        );

        $this->incident = Incident::create([
            'incident_type_id' => $incidentType->id,
            'incident_description' => 'Test Emergency Incident',
            'incident_latitude' => 8.51,
            'incident_longitude' => 124.58,
            'reported_at' => now(),
        ]);
    }

    public function test_responders_and_residents_cannot_access_dispatch_logs(): void
    {
        // Responder attempt
        $res = $this->actingAs($this->responder)->getJson('/admin/dispatch-logs');
        $res->assertStatus(403);

        $res2 = $this->actingAs($this->responder)->getJson('/dispatcher/dispatch-logs');
        $res2->assertStatus(403);

        // Resident attempt
        $res3 = $this->actingAs($this->resident)->getJson('/admin/dispatch-logs');
        $res3->assertStatus(403);

        $res4 = $this->actingAs($this->resident)->getJson('/dispatcher/dispatch-logs');
        $res4->assertStatus(403);
    }

    public function test_dispatcher_can_list_and_store_dispatch_log(): void
    {
        // Store call log with attempted spoofed user_id
        $spoofedUserId = 99999;
        $response = $this->actingAs($this->dispatcher)->postJson('/dispatcher/dispatch-logs', [
            'user_id' => $spoofedUserId, // Frontend attempts to spoof user_id
            'caller_name' => 'Maria Makiling',
            'caller_phone' => '09170001111',
            'caller_type' => 'resident',
            'barangay_id' => $this->barangay->id,
            'location' => 'Zone 4, Poblacion',
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'call_status' => 'answered',
            'reason' => 'Emergency report',
        ]);

        $response->assertStatus(201);
        $data = $response->json('dispatch_log');

        // Security assertion: user_id must be the authenticated dispatcher, NOT spoofed user_id
        $this->assertEquals($this->dispatcher->id, $data['user_id']);
        $this->assertNotEquals($spoofedUserId, $data['user_id']);

        // Index listing
        $listResponse = $this->actingAs($this->dispatcher)->getJson('/dispatcher/dispatch-logs');
        $listResponse->assertStatus(200);
        $this->assertNotEmpty($listResponse->json('dispatch_logs'));
    }

    public function test_dispatcher_can_edit_fields_and_link_to_incident(): void
    {
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'Original Name',
            'caller_phone' => '09171234567',
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'call_status' => 'answered',
        ]);

        // Dispatcher updates caller info and links incident
        $response = $this->actingAs($this->dispatcher)->putJson("/dispatcher/dispatch-logs/{$dispatchLog->id}", [
            'caller_name' => 'Updated Caller Name',
            'incident_id' => $this->incident->id,
            'notes' => 'Linked to newly verified incident.',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('dispatch_logs', [
            'id' => $dispatchLog->id,
            'caller_name' => 'Updated Caller Name',
            'incident_id' => $this->incident->id,
        ]);

        // Audit trail must be recorded automatically
        $this->assertDatabaseHas('dispatch_log_audits', [
            'dispatch_log_id' => $dispatchLog->id,
            'field_changed' => 'caller_name',
            'old_value' => 'Original Name',
            'new_value' => 'Updated Caller Name',
            'changed_by' => $this->dispatcher->id,
        ]);
    }

    public function test_dispatcher_cannot_delete_dispatch_logs(): void
    {
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_phone' => '09171234567',
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'call_status' => 'answered',
        ]);

        $response = $this->actingAs($this->dispatcher)->deleteJson("/dispatcher/dispatch-logs/{$dispatchLog->id}");
        $response->assertStatus(403);

        $this->assertDatabaseHas('dispatch_logs', [
            'id' => $dispatchLog->id,
            'deleted_at' => null,
        ]);
    }

    public function test_dispatcher_cannot_view_audit_history(): void
    {
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_phone' => '09171234567',
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'call_status' => 'answered',
        ]);

        $dispatchLog->update(['call_status' => 'cancelled', 'cancellation_reason' => 'Duplicate call']);

        $response = $this->actingAs($this->dispatcher)->getJson("/dispatcher/dispatch-logs/{$dispatchLog->id}");
        $response->assertStatus(200);
        $this->assertArrayNotHasKey('dispatch_log_audits', $response->json('dispatch_log'));
        $this->assertFalse($response->json('can_view_audits'));
    }

    public function test_admin_can_view_audit_history(): void
    {
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_phone' => '09171234567',
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'call_status' => 'answered',
        ]);

        $dispatchLog->update(['call_status' => 'cancelled', 'cancellation_reason' => 'Prank call']);

        $response = $this->actingAs($this->admin)->getJson("/admin/dispatch-logs/{$dispatchLog->id}");
        $response->assertStatus(200);
        $this->assertTrue($response->json('can_view_audits'));
        $this->assertNotEmpty($response->json('dispatch_log.dispatch_log_audits'));
    }

    public function test_admin_can_soft_delete_dispatch_log_and_audit_history_is_retained(): void
    {
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'To be deleted',
            'caller_phone' => '09171234567',
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'call_status' => 'answered',
        ]);

        $dispatchLog->update(['notes' => 'Some updated notes to generate audit trail']);

        // Admin soft delete
        $response = $this->actingAs($this->admin)->deleteJson("/admin/dispatch-logs/{$dispatchLog->id}");
        $response->assertStatus(200);

        // Assert soft deleted
        $this->assertSoftDeleted('dispatch_logs', ['id' => $dispatchLog->id]);

        // Assert audit trail preserved
        $this->assertDatabaseHas('dispatch_log_audits', [
            'dispatch_log_id' => $dispatchLog->id,
            'field_changed' => 'notes',
        ]);
    }

    public function test_admin_can_render_dispatch_logs_page(): void
    {
        DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Citizen Pedro',
            'caller_phone' => '09170002222',
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'call_status' => 'answered',
            'call_started_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/dispatch-logs');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/DispatchLogs')
            ->has('dispatchLogs')
            ->has('pagination')
            ->has('barangays')
            ->has('incidents')
            ->where('canDelete', true)
            ->where('canViewAudits', true)
        );
    }

    public function test_dispatcher_can_render_dispatch_logs_page(): void
    {
        $response = $this->actingAs($this->dispatcher)->get('/dispatcher/dispatch-logs');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('dispatcher/DispatchLogs')
            ->has('dispatchLogs')
            ->has('pagination')
            ->has('barangays')
            ->has('incidents')
            ->where('canDelete', false)
            ->where('canViewAudits', false)
        );
    }

    public function test_server_side_search_filters_dispatch_logs_correctly(): void
    {
        $log1 = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Maria Clara Dela Cruz',
            'caller_phone' => '09171234567',
            'location' => 'Zone 2 Highway near Gas Station',
            'reason' => 'Report of typhoon flooding',
            'notes' => 'Advised evacuation to designated shelter',
            'call_status' => 'answered',
            'call_started_at' => now(),
        ]);

        $log2 = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'John Doe',
            'caller_phone' => '09289998877',
            'location' => 'Poblacion Market Center',
            'reason' => 'Minor vehicular collision',
            'notes' => 'Paramedic team deployed immediately',
            'call_status' => 'answered',
            'incident_id' => $this->incident->id,
            'call_started_at' => now(),
        ]);

        $log3 = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'Anonymous Caller',
            'caller_phone' => '09990001122',
            'call_status' => 'cancelled',
            'cancellation_reason' => 'Suspected prank / false alarm',
            'call_started_at' => now(),
        ]);

        // 1. Search by caller_name (case-insensitive partial: "maria")
        $res = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?search=mArIa');
        $res->assertStatus(200);
        $ids = collect($res->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($log1->id, $ids);
        $this->assertNotContains($log2->id, $ids);

        // 2. Search by caller_phone
        $res2 = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?search=0928999');
        $res2->assertStatus(200);
        $ids2 = collect($res2->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($log2->id, $ids2);
        $this->assertNotContains($log1->id, $ids2);

        // 3. Search by location ("highway")
        $res3 = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?search=highway');
        $res3->assertStatus(200);
        $ids3 = collect($res3->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($log1->id, $ids3);
        $this->assertNotContains($log2->id, $ids3);

        // 4. Search by reason ("typhoon")
        $res4 = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?search=typhoon');
        $res4->assertStatus(200);
        $ids4 = collect($res4->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($log1->id, $ids4);

        // 5. Search by notes ("paramedic")
        $res5 = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?search=paramedic');
        $res5->assertStatus(200);
        $ids5 = collect($res5->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($log2->id, $ids5);

        // 6. Search by cancellation_reason ("false alarm")
        $res6 = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?search=false+alarm');
        $res6->assertStatus(200);
        $ids6 = collect($res6->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($log3->id, $ids6);

        // 7. Search by Incident ID ("INC-{id}" or numeric)
        $res7 = $this->actingAs($this->admin)->getJson("/admin/dispatch-logs?search=INC-{$this->incident->id}");
        $res7->assertStatus(200);
        $ids7 = collect($res7->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($log2->id, $ids7);
        $this->assertNotContains($log1->id, $ids7);
    }

    public function test_server_side_status_filter(): void
    {
        $answered = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Call A',
            'call_status' => 'answered',
            'call_started_at' => now(),
        ]);
        $missed = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Call B',
            'call_status' => 'missed',
            'call_started_at' => now(),
        ]);
        $cancelled = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Call C',
            'call_status' => 'cancelled',
            'cancellation_reason' => 'Dropped',
            'call_started_at' => now(),
        ]);

        // Filter: Answered
        $res = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?status=answered');
        $res->assertStatus(200);
        $ids = collect($res->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($answered->id, $ids);
        $this->assertNotContains($missed->id, $ids);
        $this->assertNotContains($cancelled->id, $ids);

        // Filter: Missed
        $resMissed = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?status=missed');
        $idsMissed = collect($resMissed->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($missed->id, $idsMissed);
        $this->assertNotContains($answered->id, $idsMissed);

        // Filter: Cancelled
        $resCancelled = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?status=cancelled');
        $idsCancelled = collect($resCancelled->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($cancelled->id, $idsCancelled);
        $this->assertNotContains($answered->id, $idsCancelled);

        // Filter: All
        $resAll = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?status=all');
        $idsAll = collect($resAll->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($answered->id, $idsAll);
        $this->assertContains($missed->id, $idsAll);
        $this->assertContains($cancelled->id, $idsAll);
    }

    public function test_server_side_incident_filter(): void
    {
        $withInc = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Linked Call',
            'incident_id' => $this->incident->id,
            'call_started_at' => now(),
        ]);
        $withoutInc = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Unlinked Call',
            'incident_id' => null,
            'call_started_at' => now(),
        ]);

        // Filter: With Incident
        $resWith = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?incident=with_incident');
        $idsWith = collect($resWith->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($withInc->id, $idsWith);
        $this->assertNotContains($withoutInc->id, $idsWith);

        // Filter: Without Incident
        $resWithout = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?incident=without_incident');
        $idsWithout = collect($resWithout->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($withoutInc->id, $idsWithout);
        $this->assertNotContains($withInc->id, $idsWithout);
    }

    public function test_server_side_direction_filter(): void
    {
        $incoming = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Incoming Call',
            'direction' => 'incoming',
            'call_started_at' => now(),
        ]);
        $outgoing = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Outgoing Call',
            'direction' => 'outgoing',
            'call_started_at' => now(),
        ]);

        // Filter: Incoming
        $res = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?direction=incoming');
        $ids = collect($res->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($incoming->id, $ids);
        $this->assertNotContains($outgoing->id, $ids);

        // Filter: Outgoing
        $res2 = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?direction=outgoing');
        $ids2 = collect($res2->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($outgoing->id, $ids2);
        $this->assertNotContains($incoming->id, $ids2);
    }

    public function test_server_side_call_type_filter(): void
    {
        $emergency = DispatchLog::create([
            'user_id' => $this->admin->id,
            'call_type' => 'emergency',
            'call_started_at' => now(),
        ]);
        $followUp = DispatchLog::create([
            'user_id' => $this->admin->id,
            'call_type' => 'follow_up',
            'call_started_at' => now(),
        ]);
        $inquiry = DispatchLog::create([
            'user_id' => $this->admin->id,
            'call_type' => 'inquiry',
            'call_started_at' => now(),
        ]);

        $res = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?call_type=follow_up');
        $ids = collect($res->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($followUp->id, $ids);
        $this->assertNotContains($emergency->id, $ids);
        $this->assertNotContains($inquiry->id, $ids);
    }

    public function test_server_side_barangay_and_handled_by_filter(): void
    {
        $brgyIgpit = Barangay::firstOrCreate(['barangay_name' => 'Igpit']);

        $logAdminBrgy1 = DispatchLog::create([
            'user_id' => $this->admin->id,
            'barangay_id' => $this->barangay->id, // Poblacion
            'call_started_at' => now(),
        ]);
        $logDispatcherBrgy2 = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'barangay_id' => $brgyIgpit->id,
            'call_started_at' => now(),
        ]);

        // Filter: Barangay (Poblacion)
        $resBrgy = $this->actingAs($this->admin)->getJson("/admin/dispatch-logs?barangay_id={$this->barangay->id}");
        $idsBrgy = collect($resBrgy->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($logAdminBrgy1->id, $idsBrgy);
        $this->assertNotContains($logDispatcherBrgy2->id, $idsBrgy);

        // Filter: Handled By (Dispatcher)
        $resUser = $this->actingAs($this->admin)->getJson("/admin/dispatch-logs?user_id={$this->dispatcher->id}");
        $idsUser = collect($resUser->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($logDispatcherBrgy2->id, $idsUser);
        $this->assertNotContains($logAdminBrgy1->id, $idsUser);
    }

    public function test_server_side_date_filters_and_custom_range(): void
    {
        $todayLog = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Today Call',
            'call_started_at' => now(),
        ]);
        $yesterdayLog = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Yesterday Call',
            'call_started_at' => now()->subDay()->setTime(10, 0, 0),
        ]);
        $lastMonthLog = DispatchLog::create([
            'user_id' => $this->admin->id,
            'caller_name' => 'Old Call',
            'call_started_at' => now()->subMonths(2)->setTime(10, 0, 0),
        ]);

        // Filter: Today
        $resToday = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?date_range=today');
        $idsToday = collect($resToday->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($todayLog->id, $idsToday);
        $this->assertNotContains($yesterdayLog->id, $idsToday);
        $this->assertNotContains($lastMonthLog->id, $idsToday);

        // Filter: Yesterday
        $resYesterday = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?date_range=yesterday');
        $idsYesterday = collect($resYesterday->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($yesterdayLog->id, $idsYesterday);
        $this->assertNotContains($todayLog->id, $idsYesterday);

        // Filter: Custom Date Range
        $fromDate = now()->subDays(3)->toDateString();
        $toDate = now()->subHours(12)->toDateString();
        $resCustom = $this->actingAs($this->admin)->getJson("/admin/dispatch-logs?date_range=custom&from={$fromDate}&to={$toDate}");
        $idsCustom = collect($resCustom->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($yesterdayLog->id, $idsCustom);
        $this->assertNotContains($lastMonthLog->id, $idsCustom);
    }

    public function test_multiple_filters_work_together(): void
    {
        $matching = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'Target Citizen',
            'caller_phone' => '09179998888',
            'call_status' => 'answered',
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'barangay_id' => $this->barangay->id,
            'incident_id' => $this->incident->id,
            'call_started_at' => now(),
        ]);

        $nonMatchingDirection = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'Target Citizen',
            'caller_phone' => '09179998888',
            'call_status' => 'answered',
            'direction' => 'outgoing', // Different direction
            'call_type' => 'emergency',
            'barangay_id' => $this->barangay->id,
            'incident_id' => $this->incident->id,
            'call_started_at' => now(),
        ]);

        $nonMatchingStatus = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'Target Citizen',
            'caller_phone' => '09179998888',
            'call_status' => 'missed', // Different status
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'barangay_id' => $this->barangay->id,
            'incident_id' => $this->incident->id,
            'call_started_at' => now(),
        ]);

        $res = $this->actingAs($this->admin)->getJson(
            "/admin/dispatch-logs?search=Target&status=answered&direction=incoming&call_type=emergency&barangay_id={$this->barangay->id}&user_id={$this->dispatcher->id}&incident=with_incident"
        );
        $res->assertStatus(200);
        $ids = collect($res->json('dispatch_logs'))->pluck('id')->all();
        $this->assertContains($matching->id, $ids);
        $this->assertNotContains($nonMatchingDirection->id, $ids);
        $this->assertNotContains($nonMatchingStatus->id, $ids);
    }

    public function test_server_side_pagination_defaults_to_20_records(): void
    {
        // Create 25 records
        for ($i = 1; $i <= 25; $i++) {
            DispatchLog::create([
                'user_id' => $this->admin->id,
                'caller_name' => "Caller #{$i}",
                'call_started_at' => now()->subMinutes(30 - $i),
            ]);
        }

        // Page 1 default
        $res = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs');
        $res->assertStatus(200);

        $pagination = $res->json('pagination');
        $this->assertEquals(20, $pagination['per_page']);
        $this->assertEquals(25, $pagination['total']);
        $this->assertEquals(1, $pagination['current_page']);
        $this->assertEquals(2, $pagination['last_page']);
        $this->assertEquals(1, $pagination['from']);
        $this->assertEquals(20, $pagination['to']);
        $this->assertCount(20, $res->json('dispatch_logs'));

        // Page 2
        $resPage2 = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?page=2');
        $resPage2->assertStatus(200);

        $pagination2 = $resPage2->json('pagination');
        $this->assertEquals(2, $pagination2['current_page']);
        $this->assertEquals(21, $pagination2['from']);
        $this->assertEquals(25, $pagination2['to']);
        $this->assertCount(5, $resPage2->json('dispatch_logs'));
    }

    public function test_pagination_preserves_filters_across_pages(): void
    {
        // 25 answered calls
        for ($i = 1; $i <= 25; $i++) {
            DispatchLog::create([
                'user_id' => $this->admin->id,
                'caller_name' => "Answered #{$i}",
                'call_status' => 'answered',
                'call_started_at' => now()->subMinutes(60 - $i),
            ]);
        }

        // 10 missed calls
        for ($j = 1; $j <= 10; $j++) {
            DispatchLog::create([
                'user_id' => $this->admin->id,
                'caller_name' => "Missed #{$j}",
                'call_status' => 'missed',
                'call_started_at' => now()->subMinutes(60 - $j),
            ]);
        }

        // Query page 2 with status=answered
        $res = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs?status=answered&page=2');
        $res->assertStatus(200);

        $pagination = $res->json('pagination');
        $this->assertEquals(25, $pagination['total']);
        $this->assertEquals(2, $pagination['current_page']);
        $this->assertEquals(21, $pagination['from']);
        $this->assertEquals(25, $pagination['to']);
        $this->assertCount(5, $res->json('dispatch_logs'));

        // All returned records must have call_status = answered
        foreach ($res->json('dispatch_logs') as $item) {
            $this->assertEquals('answered', $item['call_status']);
        }
    }

    public function test_dispatch_log_to_incident_workflow(): void
    {
        // 1. Originating Dispatch Log without Incident and initially marked missed
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'Emergency Caller',
            'caller_phone' => '09171234567',
            'call_status' => 'missed',
            'incident_id' => null,
            'call_started_at' => now(),
        ]);

        $this->assertNull($dispatchLog->incident_id);
        $this->assertEquals('missed', $dispatchLog->call_status);

        // Step 1: Mark call as 'answered' when continuing to create Incident Report
        $updateRes = $this->actingAs($this->dispatcher)->putJson("/dispatcher/dispatch-logs/{$dispatchLog->id}", [
            'call_status' => 'answered',
        ]);
        $updateRes->assertStatus(200);

        $dispatchLog->refresh();
        $this->assertEquals('answered', $dispatchLog->call_status);

        // Step 2 & 4: Submit incident creation workflow with originating dispatch_log_id
        $incidentType = IncidentType::first();
        $response = $this->actingAs($this->dispatcher)->post('/dispatcher/incidents/phone-call', [
            'caller_name' => 'Emergency Caller',
            'caller_phone_number' => '09171234567',
            'incident_type_id' => $incidentType->id,
            'location_method' => 'pinpoint',
            'latitude' => 8.5222,
            'longitude' => 124.5715,
            'place_of_incident' => 'Zone 1, Poblacion, Opol',
            'location_confirmed' => true,
            'description' => 'Medical trauma reported via call log workflow.',
            'dispatch_log_id' => $dispatchLog->id,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertStatus(302);

        // Assert newly created Incident
        $newIncident = Incident::latest('id')->first();
        $this->assertNotNull($newIncident);

        // Assert DispatchLog was linked to the new Incident and kept answered status
        $dispatchLog->refresh();
        $this->assertEquals($newIncident->id, $dispatchLog->incident_id);
        $this->assertEquals('answered', $dispatchLog->call_status);

        // Assert audit trail was recorded for the Incident assignment
        $this->assertDatabaseHas('dispatch_log_audits', [
            'dispatch_log_id' => $dispatchLog->id,
            'field_changed' => 'incident_id',
            'new_value' => (string) $newIncident->id,
        ]);
    }

    public function test_cancelling_call_requires_cancellation_reason_on_backend(): void
    {
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'John Doe',
            'caller_phone' => '09171234567',
            'call_status' => 'answered',
            'call_started_at' => now(),
        ]);

        // Attempt to cancel call without cancellation_reason on update
        $res = $this->actingAs($this->dispatcher)->putJson("/dispatcher/dispatch-logs/{$dispatchLog->id}", [
            'call_status' => 'cancelled',
        ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['cancellation_reason']);

        // Attempt to create a new call with cancelled status without cancellation_reason
        $createRes = $this->actingAs($this->dispatcher)->postJson('/dispatcher/dispatch-logs', [
            'caller_name' => 'Anonymous Caller',
            'call_status' => 'cancelled',
        ]);

        $createRes->assertStatus(422);
        $createRes->assertJsonValidationErrors(['cancellation_reason']);
    }

    public function test_cancelling_call_with_reason_sets_cancelled_metadata_and_records_audit_trail(): void
    {
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'Jane Smith',
            'caller_phone' => '09181234567',
            'call_status' => 'answered',
            'call_started_at' => now(),
        ]);

        $cancellationReason = 'Caller disconnected before incident details could be confirmed.';

        $res = $this->actingAs($this->dispatcher)->putJson("/dispatcher/dispatch-logs/{$dispatchLog->id}", [
            'call_status' => 'cancelled',
            'cancellation_reason' => $cancellationReason,
        ]);

        $res->assertStatus(200);

        $dispatchLog->refresh();
        $this->assertEquals('cancelled', $dispatchLog->call_status);
        $this->assertEquals($cancellationReason, $dispatchLog->cancellation_reason);
        $this->assertEquals($this->dispatcher->id, $dispatchLog->cancelled_by);
        $this->assertNotNull($dispatchLog->cancelled_at);

        // Verify audit records created for status and cancellation reason
        $this->assertDatabaseHas('dispatch_log_audits', [
            'dispatch_log_id' => $dispatchLog->id,
            'changed_by' => $this->dispatcher->id,
            'field_changed' => 'call_status',
            'old_value' => 'answered',
            'new_value' => 'cancelled',
        ]);

        $this->assertDatabaseHas('dispatch_log_audits', [
            'dispatch_log_id' => $dispatchLog->id,
            'changed_by' => $this->dispatcher->id,
            'field_changed' => 'cancellation_reason',
            'new_value' => $cancellationReason,
        ]);

        $this->assertDatabaseHas('dispatch_log_audits', [
            'dispatch_log_id' => $dispatchLog->id,
            'changed_by' => $this->dispatcher->id,
            'field_changed' => 'cancelled_by',
            'new_value' => (string) $this->dispatcher->id,
        ]);
    }

    public function test_dispatcher_can_manually_record_missed_call(): void
    {
        $payload = [
            'caller_name' => 'Juan Dela Cruz',
            'caller_phone' => '09171234567',
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'call_status' => 'missed',
            'call_started_at' => now()->toDateTimeString(),
        ];

        $response = $this->actingAs($this->dispatcher)->postJson('/dispatcher/dispatch-logs', $payload);

        $response->assertStatus(201);
        $data = $response->json('dispatch_log');

        $this->assertEquals('incoming', $data['direction']);
        $this->assertEquals('missed', $data['call_status']);
        $this->assertEquals('Juan Dela Cruz', $data['caller_name']);
        $this->assertEquals('09171234567', $data['caller_phone']);
        $this->assertEquals('emergency', $data['call_type']);
        $this->assertEquals($this->dispatcher->id, $data['user_id']);
        $this->assertNull($data['duration_seconds'] ?? null);
        $this->assertNull($data['call_ended_at'] ?? null);

        // Assert database record
        $this->assertDatabaseHas('dispatch_logs', [
            'caller_name' => 'Juan Dela Cruz',
            'caller_phone' => '09171234567',
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'call_status' => 'missed',
            'duration_seconds' => null,
            'call_ended_at' => null,
        ]);
    }

    public function test_missed_call_duration_remains_null_even_on_update(): void
    {
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'Pending Caller',
            'caller_phone' => '09199887766',
            'direction' => 'incoming',
            'call_type' => 'emergency',
            'call_status' => 'answered',
            'call_started_at' => now(),
            'duration_seconds' => 120,
        ]);

        $this->assertEquals(120, $dispatchLog->duration_seconds);

        // Update to missed status
        $updateResponse = $this->actingAs($this->dispatcher)->putJson("/dispatcher/dispatch-logs/{$dispatchLog->id}", [
            'call_status' => 'missed',
            'duration_seconds' => 50, // Should be forced to null for missed calls
        ]);

        $updateResponse->assertStatus(200);

        $dispatchLog->refresh();
        $this->assertEquals('missed', $dispatchLog->call_status);
        $this->assertNull($dispatchLog->duration_seconds);

        // Assert audit trail records status change and duration change
        $this->assertDatabaseHas('dispatch_log_audits', [
            'dispatch_log_id' => $dispatchLog->id,
            'field_changed' => 'call_status',
            'old_value' => 'answered',
            'new_value' => 'missed',
        ]);
    }

    public function test_all_model_relationships_work(): void
    {
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'barangay_id' => $this->barangay->id,
            'incident_id' => $this->incident->id,
            'cancelled_by' => $this->admin->id,
            'caller_name' => 'Relationship Test Caller',
            'caller_phone' => '09171112233',
            'call_status' => 'cancelled',
            'cancellation_reason' => 'Test reason',
            'call_started_at' => now(),
        ]);

        // Trigger an audit record
        $dispatchLog->update(['notes' => 'Generated audit entry']);

        // DispatchLog -> User
        $this->assertInstanceOf(User::class, $dispatchLog->user);
        $this->assertEquals($this->dispatcher->id, $dispatchLog->user->id);

        // User -> DispatchLogs
        $this->assertTrue($this->dispatcher->dispatchLogs->contains($dispatchLog));

        // DispatchLog -> Barangay
        $this->assertInstanceOf(Barangay::class, $dispatchLog->barangay);
        $this->assertEquals($this->barangay->id, $dispatchLog->barangay->id);

        // Barangay -> DispatchLogs
        $this->assertTrue($this->barangay->dispatchLogs->contains($dispatchLog));

        // DispatchLog -> Incident
        $this->assertInstanceOf(Incident::class, $dispatchLog->incident);
        $this->assertEquals($this->incident->id, $dispatchLog->incident->id);

        // Incident -> DispatchLogs
        $this->assertTrue($this->incident->dispatchLogs->contains($dispatchLog));

        // DispatchLog -> CancelledBy
        $this->assertInstanceOf(User::class, $dispatchLog->cancelledBy);
        $this->assertEquals($this->admin->id, $dispatchLog->cancelledBy->id);

        // DispatchLog -> DispatchLogAudits
        $this->assertNotEmpty($dispatchLog->dispatchLogAudits);
        $audit = $dispatchLog->dispatchLogAudits->first();
        $this->assertInstanceOf(DispatchLogAudit::class, $audit);
        $this->assertEquals($dispatchLog->id, $audit->dispatchLog->id);
    }

    public function test_audit_records_are_immutable(): void
    {
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'Original',
            'call_status' => 'answered',
            'call_started_at' => now(),
        ]);

        $dispatchLog->update(['caller_name' => 'Modified Name']);

        $audit = DispatchLogAudit::where('dispatch_log_id', $dispatchLog->id)->first();
        $this->assertNotNull($audit);

        // Attempting to modify audit must throw RuntimeException
        $this->expectException(\RuntimeException::class);
        $audit->update(['old_value' => 'Tampered Value']);
    }

    public function test_audit_records_cannot_be_deleted(): void
    {
        $dispatchLog = DispatchLog::create([
            'user_id' => $this->dispatcher->id,
            'caller_name' => 'Original',
            'call_status' => 'answered',
            'call_started_at' => now(),
        ]);

        $dispatchLog->update(['caller_name' => 'Modified Name']);

        $audit = DispatchLogAudit::where('dispatch_log_id', $dispatchLog->id)->first();
        $this->assertNotNull($audit);

        // Attempting to delete audit must throw RuntimeException
        $this->expectException(\RuntimeException::class);
        $audit->delete();
    }
}


