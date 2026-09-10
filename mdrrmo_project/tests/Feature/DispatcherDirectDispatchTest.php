<?php

use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\ResponderProfile;
use App\Models\User;

test('dispatcher can directly deploy an ambulance and crew to a verified incident in-place', function () {
    $dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $responder = User::factory()->create(['role' => 'responder', 'first_name' => 'Mel', 'last_name' => 'Ejercito']);
    $profile = ResponderProfile::create([
        'user_id' => $responder->id,
        'badge_number' => 'RSP-999',
        'team' => 'Alpha',
        'position' => 'driver',
        'availability' => 'available',
    ]);

    $type = IncidentType::create(['name' => 'Medical Emergency', 'description' => 'Test']);
    $ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-01',
        'plate_number' => 'ABC-1234',
        'vehicle_name' => 'Toyota HiAce',
        'vehicle_type' => 'Type 1',
        'status' => 'available',
    ]);

    $incident = Incident::create([
        'resident_id' => null,
        'caller_phone_number' => '+639123456789',
        'chief_complaint' => 'Medical Emergency',
        'location_code' => 'SL-001',
        'place_of_incident' => 'Streetlight 001 - Poblacion',
        'incident_type_id' => $type->id,
        'description' => 'Direct Emergency Call',
        'incident_status' => 'verified',
        'incident_latitude' => 8.53,
        'incident_longitude' => 124.56,
        'reported_at' => now(),
    ]);

    $response = $this->actingAs($dispatcher)->post('/dispatcher/dispatches', [
        'incident_id' => $incident->id,
        'ambulance_id' => $ambulance->id,
        'team' => 'Alpha',
    ]);

    $response->assertSessionHas('success');

    $dispatch = Dispatch::where('incident_id', $incident->id)->first();
    expect($dispatch)->not->toBeNull();
    expect($dispatch->ambulance_id)->toBe($ambulance->id);
    expect($dispatch->driver_id)->toBe($responder->id);
    expect($dispatch->dispatch_status)->toBe('assigned');

    expect($incident->fresh()->incident_status)->toBe('assigned');
    expect($ambulance->fresh()->status)->toBe('dispatched');
    expect($profile->fresh()->availability)->toBe('busy');
});
