<?php

namespace Tests\Feature;

use App\Models\Barangay;
use App\Models\Dispatch;
use App\Models\DispatchLog;
use App\Models\DispatchLogAction;
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
    protected IncidentType $incidentType;
    protected Incident $incident;
    protected DispatchLogAction $action;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin', 'phone_number' => '09170000001']);
        $this->dispatcher = User::factory()->create(['role' => 'dispatcher', 'phone_number' => '09170000002']);
        $this->responder = User::factory()->create(['role' => 'responder', 'phone_number' => '09170000003']);
        $this->resident = User::factory()->create(['role' => 'resident', 'phone_number' => '09170000004']);

        $this->barangay = Barangay::firstOrCreate(
            ['barangay_name' => 'Poblacion']
        );

        $this->incidentType = IncidentType::firstOrCreate(
            ['incident_type_name' => 'Medical Emergency'],
            ['type_description' => 'Medical Emergency Call']
        );

        $this->action = DispatchLogAction::firstOrCreate(
            ['name' => 'Incident Created'],
            ['is_system_action' => true]
        );

        $this->incident = Incident::create([
            'incident_type_id' => $this->incidentType->id,
            'incident_description' => 'Test Emergency Incident in Poblacion',
            'incident_address' => 'Zone 4, Poblacion',
            'caller_name' => 'Maria Makiling',
            'caller_phone_number' => '09170001111',
            'incident_status' => 'verified',
            'incident_latitude' => 8.51,
            'incident_longitude' => 124.58,
            'reported_at' => now(),
        ]);

        DispatchLog::create([
            'incident_id' => $this->incident->id,
            'user_id' => $this->dispatcher->id,
            'action_id' => $this->action->id,
            'previous_status' => null,
            'new_status' => 'verified',
            'remarks' => 'Incident verified and logged by dispatcher.',
        ]);
    }

    public function test_responders_and_residents_cannot_access_dispatch_logs(): void
    {
        // Responder attempt
        $res = $this->actingAs($this->responder)->get('/admin/dispatch-logs');
        $this->assertTrue(in_array($res->status(), [403, 302]));

        $res2 = $this->actingAs($this->responder)->get('/dispatcher/dispatch-logs');
        $this->assertTrue(in_array($res2->status(), [403, 302]));

        // Resident attempt
        $res3 = $this->actingAs($this->resident)->get('/admin/dispatch-logs');
        $this->assertTrue(in_array($res3->status(), [403, 302]));

        $res4 = $this->actingAs($this->resident)->get('/dispatcher/dispatch-logs');
        $this->assertTrue(in_array($res4->status(), [403, 302]));
    }

    public function test_admin_can_render_dispatch_logs_page(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/dispatch-logs');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('admin/DispatchLogs/Index'));
    }

    public function test_dispatcher_can_render_dispatch_logs_page(): void
    {
        $response = $this->actingAs($this->dispatcher)->get('/dispatcher/dispatch-logs');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('admin/DispatchLogs/Index'));
    }

    public function test_admin_and_dispatcher_can_fetch_dispatch_logs_api(): void
    {
        $adminRes = $this->actingAs($this->admin)->getJson('/admin/dispatch-logs/api/fetch');
        $adminRes->assertStatus(200);
        $adminRes->assertJsonStructure(['data', 'current_page', 'total']);
        $this->assertNotEmpty($adminRes->json('data'));

        $dispatcherRes = $this->actingAs($this->dispatcher)->getJson('/dispatcher/dispatch-logs/api/fetch');
        $dispatcherRes->assertStatus(200);
        $dispatcherRes->assertJsonStructure(['data', 'current_page', 'total']);
        $this->assertNotEmpty($dispatcherRes->json('data'));
    }

    public function test_server_side_search_filters_dispatch_logs_correctly(): void
    {
        // Search by caller name
        $response = $this->actingAs($this->dispatcher)->getJson('/dispatcher/dispatch-logs/api/fetch?search=Maria');
        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($this->incident->id, $data[0]['id']);

        // Search by non-matching query
        $emptyResponse = $this->actingAs($this->dispatcher)->getJson('/dispatcher/dispatch-logs/api/fetch?search=NonExistentQueryXYZ');
        $emptyResponse->assertStatus(200);
        $this->assertEmpty($emptyResponse->json('data'));
    }

    public function test_server_side_status_filter(): void
    {
        // Verified status match
        $response = $this->actingAs($this->dispatcher)->getJson('/dispatcher/dispatch-logs/api/fetch?status=verified');
        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('data'));

        // Non-matching status
        $emptyResponse = $this->actingAs($this->dispatcher)->getJson('/dispatcher/dispatch-logs/api/fetch?status=resolved');
        $emptyResponse->assertStatus(200);
        $this->assertEmpty($emptyResponse->json('data'));
    }

    public function test_server_side_date_filters(): void
    {
        // Today filter
        $response = $this->actingAs($this->dispatcher)->getJson('/dispatcher/dispatch-logs/api/fetch?date=today');
        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('data'));

        // Yesterday filter should not match today's incident
        $yesterdayResponse = $this->actingAs($this->dispatcher)->getJson('/dispatcher/dispatch-logs/api/fetch?date=yesterday');
        $yesterdayResponse->assertStatus(200);
        $this->assertEmpty($yesterdayResponse->json('data'));
    }

    public function test_server_side_pagination(): void
    {
        // Create additional incidents
        for ($i = 0; $i < 5; $i++) {
            Incident::create([
                'incident_type_id' => $this->incidentType->id,
                'incident_description' => "Incident test {$i}",
                'incident_address' => 'Poblacion',
                'incident_status' => 'verified',
                'incident_latitude' => 8.51,
                'incident_longitude' => 124.58,
                'reported_at' => now(),
            ]);
        }

        $response = $this->actingAs($this->dispatcher)->getJson('/dispatcher/dispatch-logs/api/fetch?per_page=3');
        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
        $this->assertEquals(3, $response->json('per_page'));
    }

    public function test_admin_and_dispatcher_can_view_single_incident_dispatch_log_details(): void
    {
        $adminRes = $this->actingAs($this->admin)->get("/admin/dispatch-logs/{$this->incident->id}");
        $adminRes->assertStatus(200);
        $adminRes->assertInertia(fn ($page) => $page->component('admin/DispatchLogs/Show')->has('incident'));

        $dispatcherRes = $this->actingAs($this->dispatcher)->get("/dispatcher/dispatch-logs/{$this->incident->id}");
        $dispatcherRes->assertStatus(200);
        $dispatcherRes->assertInertia(fn ($page) => $page->component('admin/DispatchLogs/Show')->has('incident'));
    }

    public function test_all_model_relationships_work(): void
    {
        $log = DispatchLog::where('incident_id', $this->incident->id)->first();

        $this->assertNotNull($log);
        $this->assertInstanceOf(Incident::class, $log->incident);
        $this->assertInstanceOf(User::class, $log->user);
        $this->assertInstanceOf(DispatchLogAction::class, $log->action);
        $this->assertTrue($this->incident->dispatchLogs->contains($log));
    }

    public function test_dispatch_log_creation_and_attributes(): void
    {
        $newAction = DispatchLogAction::firstOrCreate(
            ['name' => 'Dispatch Status Changed'],
            ['is_system_action' => false]
        );

        $newLog = DispatchLog::create([
            'incident_id' => $this->incident->id,
            'user_id' => $this->dispatcher->id,
            'action_id' => $newAction->id,
            'previous_status' => 'pending',
            'new_status' => 'enroute',
            'remarks' => 'Ambulance is currently on the way.',
        ]);

        $this->assertDatabaseHas('dispatch_logs', [
            'id' => $newLog->id,
            'incident_id' => $this->incident->id,
            'action_id' => $newAction->id,
            'previous_status' => 'pending',
            'new_status' => 'enroute',
            'remarks' => 'Ambulance is currently on the way.',
        ]);
    }
}
