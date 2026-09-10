<?php

use App\Events\AmbulanceLocationUpdated;
use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\ResponderProfile;
use App\Models\User;
use Illuminate\Support\Facades\Event;

test('assigned responder can post live GPS location updates and broadcast event', function () {
    Event::fake([AmbulanceLocationUpdated::class]);

    $dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $driver = User::factory()->create(['role' => 'responder', 'first_name' => 'Juan', 'last_name' => 'Dela Cruz']);
    ResponderProfile::create([
        'user_id' => $driver->id,
        'badge_number' => 'RSP-LIVE-1',
        'team' => 'Alpha',
        'position' => 'driver',
        'availability' => 'busy',
    ]);

    $type = IncidentType::create(['name' => 'Accident', 'description' => 'Vehicle collision']);
    $ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-LIVE-1',
        'plate_number' => 'LIVE-999',
        'vehicle_name' => 'Bravo Unit',
        'vehicle_type' => 'Ambulance',
        'status' => 'dispatched',
    ]);

    $incident = Incident::create([
        'resident_id' => $driver->id,
        'incident_type_id' => $type->id,
        'description' => 'Traffic incident along highway',
        'incident_status' => 'responding',
        'incident_latitude' => 8.5205,
        'incident_longitude' => 124.5772,
        'reporter_latitude' => 8.5205,
        'reporter_longitude' => 124.5772,
        'reported_at' => now(),
    ]);

    $dispatch = Dispatch::create([
        'incident_id' => $incident->id,
        'dispatcher_id' => $dispatcher->id,
        'ambulance_id' => $ambulance->id,
        'driver_id' => $driver->id,
        'dispatch_status' => 'en_route',
        'assigned_at' => now(),
        'en_route_at' => now(),
    ]);

    $payload = [
        'latitude' => 8.5140,
        'longitude' => 124.5710,
        'heading' => 45.5,
        'accuracy' => 5.0,
        'timestamp' => now()->toIso8601String(),
    ];

    $response = $this->actingAs($driver, 'sanctum')
        ->postJson("/api/responder/dispatches/{$dispatch->id}/location", $payload);

    $response->assertOk()
        ->assertJsonPath('data.dispatch_id', $dispatch->id)
        ->assertJsonPath('data.latitude', 8.5140)
        ->assertJsonPath('data.longitude', 124.5710);

    $dispatch->refresh();
    expect($dispatch->last_latitude)->toBe(8.5140)
        ->and($dispatch->last_longitude)->toBe(124.5710)
        ->and($dispatch->last_heading)->toBe(45.5)
        ->and($dispatch->last_location_updated_at)->not->toBeNull();

    Event::assertDispatched(AmbulanceLocationUpdated::class, function ($event) use ($dispatch) {
        return $event->dispatch_id === $dispatch->id
            && $event->latitude === 8.5140
            && $event->longitude === 124.5710;
    });
});

test('cannot update location for a completed or cancelled dispatch', function () {
    $driver = User::factory()->create(['role' => 'responder']);
    $type = IncidentType::create(['name' => 'Medical 2', 'description' => 'General']);
    $ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-LIVE-2',
        'plate_number' => 'LIVE-888',
        'vehicle_name' => 'Unit 2',
        'vehicle_type' => 'Ambulance',
        'status' => 'available',
    ]);
    $incident = Incident::create([
        'resident_id' => $driver->id,
        'incident_type_id' => $type->id,
        'description' => 'Finished mission',
        'incident_status' => 'resolved',
        'incident_latitude' => 8.5205,
        'incident_longitude' => 124.5772,
        'reporter_latitude' => 8.5205,
        'reporter_longitude' => 124.5772,
        'reported_at' => now(),
    ]);

    $dispatch = Dispatch::create([
        'incident_id' => $incident->id,
        'dispatcher_id' => $driver->id,
        'ambulance_id' => $ambulance->id,
        'driver_id' => $driver->id,
        'dispatch_status' => 'completed',
        'assigned_at' => now(),
        'completed_at' => now(),
    ]);

    $response = $this->actingAs($driver, 'sanctum')
        ->postJson("/api/responder/dispatches/{$dispatch->id}/location", [
            'latitude' => 8.5140,
            'longitude' => 124.5710,
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('message', 'Cannot update location for an inactive or completed mission.');
});
