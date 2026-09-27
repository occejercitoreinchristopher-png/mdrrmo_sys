<?php

use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\ResponderProfile;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    // Create dispatcher
    $this->dispatcher = User::factory()->create([
        'role' => 'dispatcher',
        'status' => 'active',
    ]);

    // Create Incident Type & Ambulance
    $this->incidentType = IncidentType::firstOrCreate(
        ['id' => 1],
        ['name' => 'Medical Emergency', 'description' => 'General Medical Emergency']
    );

    $this->ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-TEST',
        'vehicle_name' => 'Test Unit',
        'vehicle_type' => 'Van',
        'plate_number' => 'TST-999',
        'status' => 'available',
    ]);

    // Team Alpha: Mark (Driver - off duty)
    $this->mark = User::factory()->create([
        'first_name' => 'Mark',
        'last_name' => 'Cruz',
        'role' => 'responder',
        'status' => 'active',
    ]);
    ResponderProfile::create([
        'user_id' => $this->mark->id,
        'badge_number' => 'RSP-M01',
        'team' => 'Alpha',
        'position' => 'driver',
        'availability' => 'off_duty',
    ]);

    // Team Bravo: Carlos (Driver - available)
    $this->carlos = User::factory()->create([
        'first_name' => 'Carlos',
        'last_name' => 'Reyes',
        'role' => 'responder',
        'status' => 'active',
    ]);
    ResponderProfile::create([
        'user_id' => $this->carlos->id,
        'badge_number' => 'RSP-C01',
        'team' => 'Bravo',
        'position' => 'driver',
        'availability' => 'available',
    ]);

    // Incident #6
    $this->incident = Incident::create([
        'resident_id' => $this->dispatcher->id,
        'incident_type_id' => $this->incidentType->id,
        'incident_latitude' => 8.5200,
        'incident_longitude' => 124.5800,
        'reporter_latitude' => 8.5200,
        'reporter_longitude' => 124.5800,
        'description' => 'Heart palpitations near plaza',
        'incident_status' => 'verified',
        'reported_at' => now(),
    ]);
});

test('carlos from team bravo can be borrowed by team alpha for an emergency mission without changing permanent crew', function () {
    $response = $this->actingAs($this->dispatcher)->post(route('dispatcher.dispatches.store'), [
        'incident_id' => $this->incident->id,
        'ambulance_id' => $this->ambulance->id,
        'team' => 'Alpha',
        'driver_id' => $this->carlos->id,
    ]);

    $response->assertSessionHasNoErrors();

    // Verify Carlos's permanent crew is still Team Bravo
    $this->carlos->refresh();
    expect($this->carlos->responderProfile->team)->toBe('Bravo');
    expect($this->carlos->responderProfile->availability)->toBe('busy');

    // Verify dispatch was created
    $dispatch = Dispatch::where('incident_id', $this->incident->id)->first();
    expect($dispatch)->not->toBeNull();
    expect($dispatch->team)->toBe('Alpha');
    expect($dispatch->driver_id)->toBe($this->carlos->id);
});

test('responder roster shows borrowed badge, temporary mission, and permanent crew', function () {
    // Deploy Carlos (Team Bravo) to Team Alpha mission
    $this->actingAs($this->dispatcher)->post(route('dispatcher.dispatches.store'), [
        'incident_id' => $this->incident->id,
        'ambulance_id' => $this->ambulance->id,
        'team' => 'Alpha',
        'driver_id' => $this->carlos->id,
    ]);

    $response = $this->actingAs($this->dispatcher)->get(route('dispatcher.responders'));
    $response->assertOk();

    $users = $response->viewData('page')['props']['users'];
    $carlosData = collect($users)->firstWhere('id', $this->carlos->id);

    expect($carlosData['permanent_crew'])->toBe('Team Bravo');
    expect($carlosData['current_status'])->toBe('assigned');
    expect($carlosData['is_borrowed'])->toBeTrue();
    expect($carlosData['temporary_mission']['borrowed_to'])->toBe('Team Alpha');
    expect($carlosData['temporary_mission']['incident_id'])->toBe($this->incident->id);
});

test('original member mark can return while carlos remains assigned to active mission', function () {
    // Deploy Carlos to Incident
    $this->actingAs($this->dispatcher)->post(route('dispatcher.dispatches.store'), [
        'incident_id' => $this->incident->id,
        'ambulance_id' => $this->ambulance->id,
        'team' => 'Alpha',
        'driver_id' => $this->carlos->id,
    ]);

    // Mark returns from absent/off_duty to available
    $markResponse = $this->actingAs($this->dispatcher)->patch(route('dispatcher.responders.status', $this->mark->id), [
        'availability' => 'available',
    ]);
    $markResponse->assertSessionHasNoErrors();

    // Mark is now available in Team Alpha
    $this->mark->refresh();
    expect($this->mark->responderProfile->availability)->toBe('available');
    expect($this->mark->responderProfile->team)->toBe('Alpha');

    // Carlos is locked on active mission and cannot be manually set to available prematurely
    $carlosResponse = $this->actingAs($this->dispatcher)->patch(route('dispatcher.responders.status', $this->carlos->id), [
        'availability' => 'available',
    ]);
    $carlosResponse->assertSessionHasErrors('availability');

    // Carlos remains on the mission
    $this->carlos->refresh();
    expect($this->carlos->responderProfile->availability)->toBe('busy');
    expect($this->carlos->responderProfile->team)->toBe('Bravo');
});

test('mission completion automatically returns carlos to permanent crew team bravo with confirmation message', function () {
    // Deploy Carlos
    $this->actingAs($this->dispatcher)->post(route('dispatcher.dispatches.store'), [
        'incident_id' => $this->incident->id,
        'ambulance_id' => $this->ambulance->id,
        'team' => 'Alpha',
        'driver_id' => $this->carlos->id,
    ]);

    $dispatch = Dispatch::where('incident_id', $this->incident->id)->first();

    // Complete mission
    $resolveResponse = $this->actingAs($this->dispatcher)->post(route('dispatcher.dispatches.resolve', $dispatch->id));
    $resolveResponse->assertSessionHasNoErrors();
    $resolveResponse->assertSessionHas('success');

    $flashMessage = session('success');
    expect($flashMessage)->toContain('Carlos');
    expect($flashMessage)->toContain('has been returned to Team Bravo');

    // Carlos is now available and his permanent crew is Team Bravo
    $this->carlos->refresh();
    expect($this->carlos->responderProfile->availability)->toBe('available');
    expect($this->carlos->responderProfile->team)->toBe('Bravo');

    // Carlos no longer has active dispatch or borrowed badge
    $response = $this->actingAs($this->dispatcher)->get(route('dispatcher.responders'));
    $users = $response->viewData('page')['props']['users'];
    $carlosData = collect($users)->firstWhere('id', $this->carlos->id);

    expect($carlosData['permanent_crew'])->toBe('Team Bravo');
    expect($carlosData['current_status'])->toBe('available');
    expect($carlosData['is_borrowed'])->toBeFalse();
    expect($carlosData['temporary_mission'])->toBeNull();
});

test('borrowing is prohibited when the requesting team already has an available on-duty member for that role', function () {
    // Make Mark (Team Alpha driver) available
    $this->mark->responderProfile->update(['availability' => 'available']);

    // Attempt to borrow Carlos (Team Bravo) for Team Alpha
    $response = $this->actingAs($this->dispatcher)->post(route('dispatcher.dispatches.store'), [
        'incident_id' => $this->incident->id,
        'ambulance_id' => $this->ambulance->id,
        'team' => 'Alpha',
        'driver_id' => $this->carlos->id,
    ]);

    // Should be rejected because Team Alpha already has an on-duty driver
    $response->assertStatus(422);
});
