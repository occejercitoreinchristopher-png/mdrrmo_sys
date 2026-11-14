<?php

use App\Models\ResponderProfile;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->responder = User::factory()->create([
        'role' => 'responder',
        'first_name' => 'Alex',
        'last_name' => 'Reyes',
    ]);

    $this->profile = ResponderProfile::create([
        'user_id' => $this->responder->id,
        'badge_number' => 'RESP-999',
        'team' => 'Team Alpha',
        'position' => 'emt',
        'availability' => 'available',
    ]);
});

test('responder cannot create walk-in dispatch if offline or unavailable', function () {
    $this->profile->update(['availability' => 'offline']);
    Sanctum::actingAs($this->responder);

    $response = $this->postJson('/api/responder/dispatches/walk-in', [
        'latitude' => 8.5312,
        'longitude' => 124.5695,
    ]);

    $response->assertStatus(403);
    $response->assertJsonPath('message', 'You are currently off-duty or offline. Please switch to Available on duty first.');
});

test('responder can successfully create walk-in dispatch with coordinates', function () {
    Sanctum::actingAs($this->responder);

    $response = $this->postJson('/api/responder/dispatches/walk-in', [
        'latitude' => 8.5312,
        'longitude' => 124.5695,
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('message', 'Walk-in dispatch created successfully');
    $response->assertJsonPath('data.dispatch_status', 'arrived_on_scene');
    $response->assertJsonPath('data.incident.description', 'Walk-In / Direct Citizen Emergency Request');
    $response->assertJsonPath('data.incident.incident_status', 'responding');
    $response->assertJsonPath('data.ambulance.plate_number', 'WALK-IN');
    $response->assertJsonPath('data.ambulance.vehicle_type', 'Station');
});

test('responder cannot create walk-in dispatch if already on an active mission', function () {
    $incident = \App\Models\Incident::create([
        'incident_description' => 'Test Incident',
        'location' => 'Opol',
        'latitude' => 8.5312,
        'longitude' => 124.5695,
        'incident_status' => 'responding',
        'reported_by_id' => $this->responder->id,
    ]);
    $ambulance = \App\Models\Ambulance::create([
        'ambulance_code' => 'AMB-01',
        'plate_number' => 'AMB-TEST-01',
        'vehicle_name' => 'Ambulance Test 01',
        'vehicle_type' => 'Type 1',
        'status' => 'dispatched',
    ]);

    $dispatcher = User::factory()->create(['role' => 'dispatcher']);

    \App\Models\Dispatch::create([
        'dispatcher_id' => $dispatcher->id,
        'incident_id' => $incident->id,
        'driver_id' => $this->responder->id,
        'ambulance_id' => $ambulance->id,
        'dispatch_status' => 'en_route',
        'assigned_at' => now(),
    ]);

    Sanctum::actingAs($this->responder);

    $response = $this->postJson('/api/responder/dispatches/walk-in', [
        'latitude' => 8.5312,
        'longitude' => 124.5695,
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', 'You already have an active emergency mission. Please complete or update your current mission before creating a walk-in.');
});

