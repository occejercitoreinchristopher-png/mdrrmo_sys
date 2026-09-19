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
    $response->assertJsonPath('message', 'You must be available/on duty to create a walk-in.');
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
    $response->assertJsonPath('data.incident.description', 'Walk-In / Station Assistance');
    $response->assertJsonPath('data.incident.incident_status', 'responding');
    $response->assertJsonPath('data.ambulance.plate_number', 'WALK-IN');
    $response->assertJsonPath('data.ambulance.vehicle_type', 'Station');
});

test('responder cannot create walk-in dispatch if already on an active mission', function () {
    $incident = \App\Models\Incident::factory()->create();
    $ambulance = \App\Models\Ambulance::factory()->create();

    \App\Models\Dispatch::create([
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

