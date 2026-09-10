<?php

use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\ResponderProfile;
use App\Models\User;

test('resident can submit new emergency report after mission is cancelled by dispatcher', function () {
    $resident = User::factory()->create(['role' => 'resident']);
    $dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $responder = User::factory()->create(['role' => 'responder']);
    ResponderProfile::create([
        'user_id' => $responder->id,
        'team' => 'Alpha',
        'position' => 'driver',
        'badge_number' => 'RESP-'.uniqid(),
    ]);

    $type = IncidentType::create(['name' => 'Medical Emergency', 'description' => 'Test']);
    $ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-TEST-C1',
        'plate_number' => 'CANC-101',
        'vehicle_name' => 'Unit C1',
        'vehicle_type' => 'Van',
        'status' => 'dispatched',
    ]);

    $incident = Incident::create([
        'resident_id' => $resident->id,
        'incident_type_id' => $type->id,
        'description' => 'First Incident',
        'incident_status' => 'assigned',
        'incident_latitude' => 8.52,
        'incident_longitude' => 124.58,
        'reporter_latitude' => 8.52,
        'reporter_longitude' => 124.58,
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

    // Dispatcher cancels mission with revert_incident => false
    $response = $this->actingAs($dispatcher)->post("/dispatcher/dispatches/{$dispatch->id}/cancel", [
        'revert_incident' => false,
    ]);

    $response->assertSessionHas('success');
    expect($dispatch->fresh()->dispatch_status)->toBe('cancelled');
    expect($incident->fresh()->incident_status)->toBe('cancelled');

    // Resident can now post new report without 422 error
    $newReportData = [
        'incident_type_id' => $type->id,
        'latitude' => 8.521,
        'longitude' => 124.581,
        'reporter_latitude' => 8.521,
        'reporter_longitude' => 124.581,
        'photo' => \Illuminate\Http\UploadedFile::fake()->image('photo.jpg'),
    ];

    $storeResponse = $this->actingAs($resident)->postJson('/api/resident/incidents', $newReportData);
    $storeResponse->assertCreated();
});

test('resident can submit new emergency report after mission is cancelled by responder', function () {
    $resident = User::factory()->create(['role' => 'resident']);
    $responder = User::factory()->create(['role' => 'responder']);
    ResponderProfile::create([
        'user_id' => $responder->id,
        'team' => 'Bravo',
        'position' => 'driver',
        'badge_number' => 'RESP-'.uniqid(),
        'availability' => 'busy',
    ]);

    $type = IncidentType::create(['name' => 'Trauma', 'description' => 'Test']);
    $ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-TEST-C2',
        'plate_number' => 'CANC-102',
        'vehicle_name' => 'Unit C2',
        'vehicle_type' => 'Van',
        'status' => 'dispatched',
    ]);

    $incident = Incident::create([
        'resident_id' => $resident->id,
        'incident_type_id' => $type->id,
        'description' => 'Responder Cancelled Incident',
        'incident_status' => 'assigned',
        'incident_latitude' => 8.52,
        'incident_longitude' => 124.58,
        'reporter_latitude' => 8.52,
        'reporter_longitude' => 124.58,
        'reported_at' => now(),
    ]);

    $dispatch = Dispatch::create([
        'incident_id' => $incident->id,
        'dispatcher_id' => $responder->id,
        'ambulance_id' => $ambulance->id,
        'driver_id' => $responder->id,
        'dispatch_status' => 'assigned',
        'assigned_at' => now(),
    ]);

    // Responder cancels/declines mission
    $statusResponse = $this->actingAs($responder)->postJson("/api/responder/dispatches/{$dispatch->id}/status", [
        'status' => 'cancelled',
    ]);

    $statusResponse->assertOk();
    expect($dispatch->fresh()->dispatch_status)->toBe('cancelled');
    expect($incident->fresh()->incident_status)->toBe('cancelled');

    // Resident can now report without 422 error
    $newReportData = [
        'incident_type_id' => $type->id,
        'latitude' => 8.522,
        'longitude' => 124.582,
        'reporter_latitude' => 8.522,
        'reporter_longitude' => 124.582,
        'photo' => \Illuminate\Http\UploadedFile::fake()->image('photo2.jpg'),
    ];

    $storeResponse = $this->actingAs($resident)->postJson('/api/resident/incidents', $newReportData);
    $storeResponse->assertCreated();
});

test('responder can update dispatch status to arrived_on_scene without column error', function () {
    $responder = User::factory()->create(['role' => 'responder']);
    ResponderProfile::create([
        'user_id' => $responder->id,
        'team' => 'Charlie',
        'position' => 'driver',
        'badge_number' => 'RESP-'.uniqid(),
        'availability' => 'busy',
    ]);

    $type = IncidentType::create(['name' => 'Accident', 'description' => 'Test']);
    $ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-TEST-C3',
        'plate_number' => 'ARRV-103',
        'vehicle_name' => 'Unit C3',
        'vehicle_type' => 'Van',
        'status' => 'dispatched',
    ]);

    $incident = Incident::create([
        'resident_id' => $responder->id,
        'incident_type_id' => $type->id,
        'description' => 'Road crash',
        'incident_status' => 'responding',
        'incident_latitude' => 8.52,
        'incident_longitude' => 124.58,
        'reporter_latitude' => 8.52,
        'reporter_longitude' => 124.58,
        'reported_at' => now(),
    ]);

    $dispatch = Dispatch::create([
        'incident_id' => $incident->id,
        'dispatcher_id' => $responder->id,
        'ambulance_id' => $ambulance->id,
        'driver_id' => $responder->id,
        'dispatch_status' => 'en_route',
        'assigned_at' => now(),
        'en_route_at' => now(),
    ]);

    $statusResponse = $this->actingAs($responder)->postJson("/api/responder/dispatches/{$dispatch->id}/status", [
        'status' => 'arrived_on_scene',
    ]);

    $statusResponse->assertOk();
    expect($dispatch->fresh()->dispatch_status)->toBe('arrived_on_scene');
    expect($dispatch->fresh()->arrived_at)->not->toBeNull();
});
