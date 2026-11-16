<?php

namespace Tests\Feature;

use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\ResponderProfile;
use App\Models\SystemNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResponderDispatchAcknowledgmentTest extends TestCase
{
    use RefreshDatabase;

    protected function createResponder(string $position = 'driver'): User
    {
        $user = User::factory()->create([
            'role' => 'responder',
        ]);

        ResponderProfile::create([
            'user_id' => $user->id,
            'position' => $position,
            'team' => 'Alpha',
            'availability' => 'available',
        ]);

        return $user;
    }

    protected function createDispatch(User $driver, User $emt): Dispatch
    {
        $dispatcher = User::factory()->create(['role' => 'dispatcher']);
        $resident = User::factory()->create(['role' => 'resident']);

        $incidentType = IncidentType::create([
            'incident_type_name' => 'Trauma / Injury',
            'type_description' => 'General Trauma or Injury',
        ]);

        $incident = Incident::create([
            'resident_id' => $resident->id,
            'incident_type_id' => $incidentType->id,
            'incident_description' => 'Motorcycle accident along highway',
            'place_of_incident' => 'Barangay Barra, Opol',
            'incident_latitude' => 8.5200,
            'incident_longitude' => 124.5800,
            'incident_status' => 'verified',
            'priority' => 'High',
            'report_source' => 'app',
        ]);

        $ambulance = Ambulance::create([
            'plate_number' => 'AMB-TEST-01',
            'ambulance_code' => 'AMB-01',
            'vehicle_name' => 'Alpha 1',
            'vehicle_type' => 'Type 1',
            'status' => 'assigned',
        ]);

        return Dispatch::create([
            'incident_id' => $incident->id,
            'dispatcher_id' => $dispatcher->id,
            'ambulance_id' => $ambulance->id,
            'team' => 'Alpha',
            'driver_id' => $driver->id,
            'emt_id' => $emt->id,
            'dispatch_status' => 'assigned',
            'acknowledgment_status' => 'pending',
            'assigned_at' => now(),
        ]);
    }

    public function test_assigned_responder_can_view_mission_details(): void
    {
        $driver = $this->createResponder('driver');
        $emt = $this->createResponder('emt');
        $dispatch = $this->createDispatch($driver, $emt);

        $response = $this->actingAs($driver, 'sanctum')
            ->getJson("/api/responder/dispatches/{$dispatch->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $dispatch->id);
        $response->assertJsonPath('data.acknowledgment_status', 'pending');
    }

    public function test_assigned_responder_can_acknowledge_dispatch(): void
    {
        $driver = $this->createResponder('driver');
        $emt = $this->createResponder('emt');
        $dispatch = $this->createDispatch($driver, $emt);

        // System notification to verify sync
        $notif = SystemNotification::create([
            'user_id' => $driver->id,
            'incident_id' => $dispatch->incident_id,
            'dispatch_id' => $dispatch->id,
            'title' => 'Emergency Dispatch Assigned',
            'message' => 'You have been assigned to respond.',
            'type' => 'dispatch_assigned',
            'status' => 'unread',
        ]);

        $response = $this->actingAs($driver, 'sanctum')
            ->postJson("/api/responder/dispatches/{$dispatch->id}/acknowledge");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.acknowledgment_status', 'acknowledged');
        $response->assertJsonPath('data.acknowledged_by', $driver->id);

        $dispatch->refresh();
        $this->assertEquals('acknowledged', $dispatch->acknowledgment_status);
        $this->assertNotNull($dispatch->acknowledged_at);
        $this->assertEquals($driver->id, $dispatch->acknowledged_by);

        // Verify system notification marked read
        $notif->refresh();
        $this->assertEquals('read', $notif->status);
        $this->assertNotNull($notif->read_at);
    }

    public function test_unassigned_responder_cannot_acknowledge_dispatch(): void
    {
        $driver = $this->createResponder('driver');
        $emt = $this->createResponder('emt');
        $unrelatedResponder = $this->createResponder('driver');
        $dispatch = $this->createDispatch($driver, $emt);

        $response = $this->actingAs($unrelatedResponder, 'sanctum')
            ->postJson("/api/responder/dispatches/{$dispatch->id}/acknowledge");

        $response->assertStatus(403);
    }

    public function test_dispatch_acknowledgment_is_idempotent(): void
    {
        $driver = $this->createResponder('driver');
        $emt = $this->createResponder('emt');
        $dispatch = $this->createDispatch($driver, $emt);

        // First acknowledgment
        $this->actingAs($driver, 'sanctum')
            ->postJson("/api/responder/dispatches/{$dispatch->id}/acknowledge")
            ->assertStatus(200);

        $dispatch->refresh();
        $firstAckTime = $dispatch->acknowledged_at;

        // Second acknowledgment should succeed idempotently
        $response = $this->actingAs($driver, 'sanctum')
            ->postJson("/api/responder/dispatches/{$dispatch->id}/acknowledge");

        $response->assertStatus(200);
        $response->assertJsonPath('already_acknowledged', true);

        $dispatch->refresh();
        $this->assertEquals($firstAckTime->toDateTimeString(), $dispatch->acknowledged_at->toDateTimeString());
    }
}
