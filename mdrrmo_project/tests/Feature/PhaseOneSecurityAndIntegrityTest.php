<?php

use App\Events\AmbulanceLocationUpdated;
use App\Events\DispatchAccepted;
use App\Events\DispatchCompleted;
use App\Events\PatientCareRecordSubmitted;
use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\Patient;
use App\Models\PatientCareRecord;
use App\Models\ResponderProfile;
use App\Models\User;
use Illuminate\Support\Facades\Event;

test('1.1 /debug-dispatches route is removed and returns 404', function () {
    $response = $this->get('/debug-dispatches');
    $response->assertNotFound();
});

test('1.2 incident broadcast channel denies unauthorized users and authorizes owner resident and dispatcher', function () {
    $resident = User::factory()->create(['role' => 'resident']);
    $otherResident = User::factory()->create(['role' => 'resident']);
    $dispatcher = User::factory()->create(['role' => 'dispatcher']);

    $type = IncidentType::create(['name' => 'General', 'description' => 'General incident']);
    $incident = Incident::create([
        'resident_id' => $resident->id,
        'incident_type_id' => $type->id,
        'incident_description' => 'Emergency report',
        'incident_latitude' => 8.5205,
        'incident_longitude' => 124.5772,
        'reported_at' => now(),
        'incident_status' => 'pending',
    ]);

    $broadcaster = \Illuminate\Support\Facades\Broadcast::driver();
    $reflection = new ReflectionClass(\Illuminate\Broadcasting\Broadcasters\Broadcaster::class);
    $verifyMethod = $reflection->getMethod('verifyUserCanAccessChannel');
    $verifyMethod->setAccessible(true);

    $makeRequest = function ($user) {
        $req = \Illuminate\Http\Request::create('/broadcasting/auth', 'POST');
        $req->setUserResolver(fn () => $user);
        return $req;
    };

    // Other resident (unauthorized) -> throws AccessDeniedHttpException
    expect(fn () => $verifyMethod->invoke($broadcaster, $makeRequest($otherResident), "incident.{$incident->id}"))
        ->toThrow(\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException::class);

    // Owner resident -> authorized
    expect(fn () => $verifyMethod->invoke($broadcaster, $makeRequest($resident), "incident.{$incident->id}"))
        ->not->toThrow(\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException::class);

    // Dispatcher -> authorized
    expect(fn () => $verifyMethod->invoke($broadcaster, $makeRequest($dispatcher), "incident.{$incident->id}"))
        ->not->toThrow(\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException::class);
});

test('1.2 dispatch broadcast channel denies unauthorized users and authorizes assigned driver', function () {
    $dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $assignedDriver = User::factory()->create(['role' => 'responder']);
    $unassignedResponder = User::factory()->create(['role' => 'responder']);

    $ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-TEST-CH',
        'plate_number' => 'CH-111',
        'vehicle_name' => 'Channel Unit',
        'vehicle_type' => 'Ambulance',
        'status' => 'dispatched',
    ]);

    $type = IncidentType::create(['name' => 'Medical', 'description' => 'Medical']);
    $incident = Incident::create([
        'incident_type_id' => $type->id,
        'incident_description' => 'Emergency report',
        'incident_latitude' => 8.5205,
        'incident_longitude' => 124.5772,
        'reported_at' => now(),
        'incident_status' => 'pending',
    ]);

    $dispatch = Dispatch::create([
        'incident_id' => $incident->id,
        'dispatcher_id' => $dispatcher->id,
        'ambulance_id' => $ambulance->id,
        'driver_id' => $assignedDriver->id,
        'dispatch_status' => 'assigned',
    ]);

    $broadcaster = \Illuminate\Support\Facades\Broadcast::driver();
    $reflection = new ReflectionClass(\Illuminate\Broadcasting\Broadcasters\Broadcaster::class);
    $verifyMethod = $reflection->getMethod('verifyUserCanAccessChannel');
    $verifyMethod->setAccessible(true);

    $makeRequest = function ($user) {
        $req = \Illuminate\Http\Request::create('/broadcasting/auth', 'POST');
        $req->setUserResolver(fn () => $user);
        return $req;
    };

    // Unassigned responder -> throws AccessDeniedHttpException
    expect(fn () => $verifyMethod->invoke($broadcaster, $makeRequest($unassignedResponder), "dispatch.{$dispatch->id}"))
        ->toThrow(\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException::class);

    // Assigned driver -> authorized
    expect(fn () => $verifyMethod->invoke($broadcaster, $makeRequest($assignedDriver), "dispatch.{$dispatch->id}"))
        ->not->toThrow(\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException::class);
});

test('1.3 unassigned responder cannot accept another responders dispatch (IDOR blocked)', function () {
    Event::fake([DispatchAccepted::class]);

    $dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $assignedDriver = User::factory()->create(['role' => 'responder']);
    $unassignedResponder = User::factory()->create(['role' => 'responder']);

    $ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-TEST-ACCEPT',
        'plate_number' => 'ACC-111',
        'vehicle_name' => 'Accept Unit',
        'vehicle_type' => 'Ambulance',
        'status' => 'dispatched',
    ]);

    $type = IncidentType::create(['name' => 'Medical', 'description' => 'Medical emergency']);
    $incident = Incident::create([
        'incident_type_id' => $type->id,
        'incident_description' => 'Test emergency incident description',
        'incident_latitude' => 8.5205,
        'incident_longitude' => 124.5772,
        'reported_at' => now(),
        'incident_status' => 'pending',
    ]);

    $dispatch = Dispatch::create([
        'incident_id' => $incident->id,
        'dispatcher_id' => $dispatcher->id,
        'ambulance_id' => $ambulance->id,
        'driver_id' => $assignedDriver->id,
        'dispatch_status' => 'assigned',
    ]);

    // Unassigned responder attempts to accept
    $response = $this->actingAs($unassignedResponder, 'sanctum')
        ->postJson("/api/responder/dispatches/{$dispatch->id}/accept");

    $response->assertStatus(403);
    expect($dispatch->fresh()->dispatch_status)->toBe('assigned');

    // Assigned driver accepts
    $acceptResponse = $this->actingAs($assignedDriver, 'sanctum')
        ->postJson("/api/responder/dispatches/{$dispatch->id}/accept");

    $acceptResponse->assertOk();
    expect($dispatch->fresh()->dispatch_status)->toBe('accepted');
});

test('1.3 unassigned responder cannot spoof vehicle location for another dispatch', function () {
    Event::fake([AmbulanceLocationUpdated::class]);

    $dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $assignedDriver = User::factory()->create(['role' => 'responder']);
    $unassignedResponder = User::factory()->create(['role' => 'responder']);

    $ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-TEST-LOC',
        'plate_number' => 'LOC-111',
        'vehicle_name' => 'Loc Unit',
        'vehicle_type' => 'Ambulance',
        'status' => 'dispatched',
    ]);

    $type = IncidentType::create(['name' => 'Fire', 'description' => 'Fire incident']);
    $incident = Incident::create([
        'incident_type_id' => $type->id,
        'incident_description' => 'Test emergency incident description',
        'incident_latitude' => 8.5205,
        'incident_longitude' => 124.5772,
        'reported_at' => now(),
        'incident_status' => 'responding',
    ]);

    $dispatch = Dispatch::create([
        'incident_id' => $incident->id,
        'dispatcher_id' => $dispatcher->id,
        'ambulance_id' => $ambulance->id,
        'driver_id' => $assignedDriver->id,
        'dispatch_status' => 'en_route',
    ]);

    $payload = [
        'latitude' => 8.525,
        'longitude' => 124.585,
    ];

    $response = $this->actingAs($unassignedResponder, 'sanctum')
        ->postJson("/api/responder/dispatches/{$dispatch->id}/location", $payload);

    $response->assertStatus(403);
});

test('1.4 PCR submission releases all crew members and driver availability back to available', function () {
    Event::fake([PatientCareRecordSubmitted::class, DispatchCompleted::class]);

    $dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $driver = User::factory()->create(['role' => 'responder']);
    $crewMember = User::factory()->create(['role' => 'responder']);

    ResponderProfile::create([
        'user_id' => $driver->id,
        'badge_number' => 'RSP-DRV-9',
        'team' => 'Alpha',
        'position' => 'driver',
        'availability' => 'busy',
    ]);

    ResponderProfile::create([
        'user_id' => $crewMember->id,
        'badge_number' => 'RSP-CRW-9',
        'team' => 'Alpha',
        'position' => 'emt',
        'availability' => 'busy',
    ]);

    $ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-TEST-PCR',
        'plate_number' => 'PCR-111',
        'vehicle_name' => 'Charlie Unit',
        'vehicle_type' => 'Ambulance',
        'status' => 'dispatched',
    ]);

    $type = IncidentType::create(['name' => 'Trauma', 'description' => 'Trauma case']);
    $incident = Incident::create([
        'incident_type_id' => $type->id,
        'incident_description' => 'Test emergency incident description',
        'incident_latitude' => 8.5205,
        'incident_longitude' => 124.5772,
        'reported_at' => now(),
        'incident_status' => 'responding',
    ]);

    $dispatch = Dispatch::create([
        'incident_id' => $incident->id,
        'dispatcher_id' => $dispatcher->id,
        'ambulance_id' => $ambulance->id,
        'driver_id' => $driver->id,
        'dispatch_status' => 'arrived_on_scene',
    ]);

    // Attach crew member via pivot
    $dispatch->crew()->attach($crewMember->id, ['role' => 'emt']);

    $patient = Patient::create([
        'first_name' => 'John',
        'last_name' => 'Doe',
    ]);

    PatientCareRecord::create([
        'dispatch_id' => $dispatch->id,
        'patient_id' => $patient->id,
    ]);

    // Submit PCR as driver
    $response = $this->actingAs($driver, 'sanctum')
        ->postJson("/api/responder/dispatches/{$dispatch->id}/pcr/submit");

    $response->assertOk();

    // Verify ambulance is available
    expect($ambulance->fresh()->status)->toBe('available');

    // Verify BOTH driver and crew member availability are released to available
    expect(ResponderProfile::where('user_id', $driver->id)->value('availability'))->toBe('available');
    expect(ResponderProfile::where('user_id', $crewMember->id)->value('availability'))->toBe('available');
    expect($dispatch->fresh()->dispatch_status)->toBe('completed');
});
