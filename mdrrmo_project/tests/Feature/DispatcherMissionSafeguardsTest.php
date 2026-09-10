<?php

use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\ResponderProfile;
use App\Models\User;

test('admin cannot delete responder while assigned to active dispatch', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $responder = User::factory()->create(['role' => 'responder']);
    ResponderProfile::create([
        'user_id' => $responder->id,
        'badge_number' => 'RSP-TEST',
        'team' => 'Alpha',
        'position' => 'driver',
        'availability' => 'busy',
    ]);

    $type = IncidentType::create(['name' => 'Medical', 'description' => 'Test']);
    $ambulance = Ambulance::create(['ambulance_code' => 'AMB-01', 'plate_number' => 'TEST-01', 'vehicle_name' => 'Unit 1', 'vehicle_type' => 'Van', 'status' => 'dispatched']);
    $incident = Incident::create([
        'resident_id' => $responder->id,
        'incident_type_id' => $type->id,
        'description' => 'Active Emergency',
        'incident_status' => 'responding',
        'incident_latitude' => 8.53,
        'incident_longitude' => 124.56,
        'reporter_latitude' => 8.53,
        'reporter_longitude' => 124.56,
        'reported_at' => now(),
    ]);

    $dispatch = Dispatch::create([
        'incident_id' => $incident->id,
        'dispatcher_id' => $admin->id,
        'ambulance_id' => $ambulance->id,
        'driver_id' => $responder->id,
        'dispatch_status' => 'arrived_on_scene',
        'assigned_at' => now(),
    ]);

    $response = $this->actingAs($admin)->delete("/admin/users/{$responder->id}");

    $response->assertSessionHas('error');
    expect(User::find($responder->id))->not->toBeNull();
});

test('dispatcher can force resolve an active dispatch and incident', function () {
    $dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $responder = User::factory()->create(['role' => 'responder']);
    $profile = ResponderProfile::create([
        'user_id' => $responder->id,
        'badge_number' => 'RSP-TEST2',
        'team' => 'Alpha',
        'position' => 'driver',
        'availability' => 'busy',
    ]);

    $type = IncidentType::create(['name' => 'Trauma', 'description' => 'Test']);
    $ambulance = Ambulance::create(['ambulance_code' => 'AMB-02', 'plate_number' => 'TEST-02', 'vehicle_name' => 'Unit 2', 'vehicle_type' => 'Van', 'status' => 'dispatched']);
    $incident = Incident::create([
        'resident_id' => $responder->id,
        'incident_type_id' => $type->id,
        'description' => 'Test Incident',
        'incident_status' => 'responding',
        'incident_latitude' => 8.53,
        'incident_longitude' => 124.56,
        'reporter_latitude' => 8.53,
        'reporter_longitude' => 124.56,
        'reported_at' => now(),
    ]);

    $dispatch = Dispatch::create([
        'incident_id' => $incident->id,
        'dispatcher_id' => $dispatcher->id,
        'ambulance_id' => $ambulance->id,
        'driver_id' => $responder->id,
        'dispatch_status' => 'arrived_on_scene',
        'assigned_at' => now(),
    ]);

    $response = $this->actingAs($dispatcher)->post("/dispatcher/dispatches/{$dispatch->id}/resolve");

    $response->assertSessionHas('success');
    expect($dispatch->fresh()->dispatch_status)->toBe('completed');
    expect($incident->fresh()->incident_status)->toBe('resolved');
    expect($ambulance->fresh()->status)->toBe('available');
    expect($profile->fresh()->availability)->toBe('available');
});

test('dispatcher can cancel a dispatch and return incident to verified queue', function () {
    $dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $responder = User::factory()->create(['role' => 'responder']);
    $profile = ResponderProfile::create([
        'user_id' => $responder->id,
        'badge_number' => 'RSP-TEST3',
        'team' => 'Alpha',
        'position' => 'driver',
        'availability' => 'busy',
    ]);

    $type = IncidentType::create(['name' => 'Fire', 'description' => 'Test']);
    $ambulance = Ambulance::create(['ambulance_code' => 'AMB-03', 'plate_number' => 'TEST-03', 'vehicle_name' => 'Unit 3', 'vehicle_type' => 'Van', 'status' => 'dispatched']);
    $incident = Incident::create([
        'resident_id' => $responder->id,
        'incident_type_id' => $type->id,
        'description' => 'Test Fire',
        'incident_status' => 'assigned',
        'incident_latitude' => 8.53,
        'incident_longitude' => 124.56,
        'reporter_latitude' => 8.53,
        'reporter_longitude' => 124.56,
        'reported_at' => now(),
    ]);

    $dispatch = Dispatch::create([
        'incident_id' => $incident->id,
        'dispatcher_id' => $dispatcher->id,
        'ambulance_id' => $ambulance->id,
        'driver_id' => $responder->id,
        'dispatch_status' => 'assigned',
        'assigned_at' => now(),
    ]);

    $response = $this->actingAs($dispatcher)->post("/dispatcher/dispatches/{$dispatch->id}/cancel", [
        'revert_incident' => true,
    ]);

    $response->assertSessionHas('success');
    expect($dispatch->fresh()->dispatch_status)->toBe('cancelled');
    expect($incident->fresh()->incident_status)->toBe('verified');
    expect($ambulance->fresh()->status)->toBe('available');
    expect($profile->fresh()->availability)->toBe('available');
});
