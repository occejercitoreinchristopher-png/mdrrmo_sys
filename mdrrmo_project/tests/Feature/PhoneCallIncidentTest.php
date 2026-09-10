<?php

use App\Models\Barangay;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\LocationMarker;
use App\Models\ResidentProfile;
use App\Models\User;

beforeEach(function () {
    $this->dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $this->type = IncidentType::create(['name' => 'Medical Emergency', 'description' => 'Medical']);
    $this->marker = LocationMarker::create([
        'code' => 'SL-001',
        'marker_name' => 'Streetlight 001',
        'barangay' => 'Poblacion',
        'latitude' => 8.5312000,
        'longitude' => 124.5695000,
        'description' => 'Near Municipal Hall',
        'is_active' => true,
    ]);
});

test('dispatcher can lookup an active location code', function () {
    $response = $this->actingAs($this->dispatcher)->getJson('/dispatcher/location-markers/lookup?code=SL-001');

    $response->assertStatus(200);
    $response->assertJsonPath('data.code', 'SL-001');
    $response->assertJsonPath('data.marker_name', 'Streetlight 001');
    $response->assertJsonPath('data.barangay', 'Poblacion');
});

test('location lookup returns 404 for invalid code', function () {
    $response = $this->actingAs($this->dispatcher)->getJson('/dispatcher/location-markers/lookup?code=NONEXISTENT');

    $response->assertStatus(404);
    $response->assertJsonPath('message', 'Location code not found. Please verify the code with the caller.');
});

test('phone call incident rejects invalid Philippine phone number', function () {
    $response = $this->actingAs($this->dispatcher)->post('/dispatcher/incidents/phone-call', [
        'caller_phone_number' => '12345', // Invalid
        'incident_type_id' => $this->type->id,
        'location_code' => 'SL-001',
        'location_confirmed' => true,
    ]);

    $response->assertSessionHasErrors('caller_phone_number');
});

test('phone call incident requires location confirmation', function () {
    $response = $this->actingAs($this->dispatcher)->post('/dispatcher/incidents/phone-call', [
        'caller_phone_number' => '09171234567',
        'incident_type_id' => $this->type->id,
        'location_code' => 'SL-001',
        'location_confirmed' => false,
    ]);

    $response->assertSessionHasErrors('location_confirmed');
});

test('dispatcher can successfully create phone emergency incident with normalized phone', function () {
    $response = $this->actingAs($this->dispatcher)->post('/dispatcher/incidents/phone-call', [
        'caller_phone_number' => '09171234567',
        'incident_type_id' => $this->type->id,
        'chief_complaint' => 'Cardiac Emergency',
        'location_code' => 'SL-001',
        'location_confirmed' => true,
        'description' => 'Patient experiencing severe chest pain.',
    ]);

    $response->assertSessionHas('success');

    $incident = Incident::where('caller_phone_number', '+639171234567')->first();
    expect($incident)->not->toBeNull();
    expect($incident->incident_type_id)->toBe($this->type->id);
    expect($incident->chief_complaint)->toBe('Cardiac Emergency');
    expect($incident->location_code)->toBe('SL-001');
    expect($incident->location_source)->toBe('location_code');
    expect($incident->incident_status)->toBe('pending');
    expect((float) $incident->incident_latitude)->toBe(8.5312000);
    expect((float) $incident->incident_longitude)->toBe(124.5695000);
    expect($incident->place_of_incident)->toContain('Streetlight 001');
    expect($incident->place_of_incident)->toContain('Poblacion');
});

test('phone emergency incident automatically links registered resident profile if phone matches', function () {
    $barangay = Barangay::create(['barangay_name' => 'Poblacion']);
    $resident = User::factory()->create([
        'role' => 'resident',
        'phone_number' => '09187654321',
        'first_name' => 'Maria',
        'last_name' => 'Clara',
    ]);
    ResidentProfile::create([
        'user_id' => $resident->id,
        'barangay_id' => $barangay->id,
        'house_no' => '123',
        'street' => 'Main Street',
        'birthdate' => '1995-05-10',
        'gender' => 'female',
    ]);

    $response = $this->actingAs($this->dispatcher)->post('/dispatcher/incidents/phone-call', [
        'caller_phone_number' => '+639187654321',
        'incident_type_id' => $this->type->id,
        'location_code' => 'SL-001',
        'location_confirmed' => true,
        'description' => 'Breathing difficulty',
    ]);

    $response->assertSessionHas('success');

    $incident = Incident::where('caller_phone_number', '+639187654321')->first();
    expect($incident)->not->toBeNull();
    expect($incident->resident_id)->toBe($resident->id);
    expect($incident->incident_address)->toContain('Main Street');
    expect($incident->incident_address)->toContain('Poblacion');
});

test('dispatcher can lookup recognized caller when phone matches registered resident', function () {
    $barangay = Barangay::create(['barangay_name' => 'Poblacion']);
    $resident = User::factory()->create([
        'role' => 'resident',
        'phone_number' => '+639936062977',
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
    ]);
    ResidentProfile::create([
        'user_id' => $resident->id,
        'barangay_id' => $barangay->id,
        'house_no' => '456',
        'street' => 'Rizal Street',
        'birthdate' => '1990-01-01',
        'gender' => 'male',
    ]);

    $response = $this->actingAs($this->dispatcher)->getJson('/dispatcher/callers/lookup?phone=09936062977');

    $response->assertStatus(200);
    $response->assertJsonPath('recognized', true);
    $response->assertJsonPath('data.caller_name', 'Juan Dela Cruz');
    $response->assertJsonPath('data.is_registered_resident', true);
    $response->assertJsonPath('data.resident_address', '456, Rizal Street, Barangay Poblacion');
});

test('dispatcher can lookup previous location and total calls for repeat caller', function () {
    Incident::create([
        'caller_phone_number' => '+639936062977',
        'incident_type_id' => $this->type->id,
        'description' => 'Test emergency incident call',
        'location_code' => 'SL-001',
        'place_of_incident' => 'Streetlight 001, Barangay Poblacion',
        'incident_latitude' => 8.5312000,
        'incident_longitude' => 124.5695000,
        'location_source' => 'location_code',
        'incident_status' => 'pending',
        'priority' => 'Moderate',
        'reported_at' => now(),
    ]);

    $response = $this->actingAs($this->dispatcher)->getJson('/dispatcher/callers/lookup?phone=+639936062977');

    $response->assertStatus(200);
    $response->assertJsonPath('recognized', true);
    $response->assertJsonPath('data.total_calls', 1);
    $response->assertJsonPath('data.previous_location.code', 'SL-001');
    $response->assertJsonPath('data.previous_location.barangay', 'Poblacion');
});

test('caller lookup returns recognized false for new unknown phone number', function () {
    $response = $this->actingAs($this->dispatcher)->getJson('/dispatcher/callers/lookup?phone=09120000000');

    $response->assertStatus(200);
    $response->assertJsonPath('recognized', false);
    $response->assertJsonPath('data', null);
});

test('caller lookup returns 422 for invalid phone format', function () {
    $response = $this->actingAs($this->dispatcher)->getJson('/dispatcher/callers/lookup?phone=12345');

    $response->assertStatus(422);
    $response->assertJsonPath('recognized', false);
});

test('dispatcher can search caller phone numbers for autocomplete dropdown', function () {
    $barangay = Barangay::create(['barangay_name' => 'Poblacion']);
    $resident = User::factory()->create([
        'role' => 'resident',
        'phone_number' => '09936062977',
        'first_name' => 'Carlos',
        'last_name' => 'Mendoza',
    ]);
    ResidentProfile::create([
        'user_id' => $resident->id,
        'barangay_id' => $barangay->id,
        'house_no' => '789',
        'street' => 'Baybay Road',
        'birthdate' => '1988-04-12',
        'gender' => 'male',
    ]);

    // Test search by partial phone digits
    $response = $this->actingAs($this->dispatcher)->getJson('/dispatcher/callers/search?q=9936');
    $response->assertStatus(200);
    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    expect($data[0]['caller_name'])->toBe('Carlos Mendoza');
    expect($data[0]['phone_number'])->toBe('09936062977');

    // Test search by resident name
    $responseName = $this->actingAs($this->dispatcher)->getJson('/dispatcher/callers/search?q=Carlos');
    $responseName->assertStatus(200);
    $dataName = $responseName->json('data');
    expect($dataName)->not->toBeEmpty();
    expect($dataName[0]['caller_name'])->toBe('Carlos Mendoza');
});
