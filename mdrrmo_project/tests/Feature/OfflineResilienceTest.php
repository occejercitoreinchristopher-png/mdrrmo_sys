<?php

use App\Models\Ambulance;
use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\ResponderProfile;
use App\Models\User;

beforeEach(function () {
    $this->dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $this->driver = User::factory()->create(['role' => 'responder', 'first_name' => 'Juan', 'last_name' => 'Dela Cruz']);
    ResponderProfile::create([
        'user_id' => $this->driver->id,
        'badge_number' => 'RSP-OFFLINE-1',
        'team' => 'Alpha',
        'position' => 'driver',
        'availability' => 'busy',
    ]);

    $this->type = IncidentType::create(['name' => 'Trauma', 'description' => 'Physical trauma']);
    $this->ambulance = Ambulance::create([
        'ambulance_code' => 'AMB-TEST-OFFLINE',
        'plate_number' => 'OFFLINE-01',
        'vehicle_name' => 'Alpha One',
        'vehicle_type' => 'Ambulance',
        'status' => 'dispatched',
    ]);

    $this->incident = Incident::create([
        'resident_id' => $this->driver->id,
        'incident_type_id' => $this->type->id,
        'description' => 'Test emergency incident for offline resilience',
        'incident_status' => 'responding',
        'incident_latitude' => 8.5205,
        'incident_longitude' => 124.5772,
        'reported_at' => now(),
    ]);

    $this->dispatch = Dispatch::create([
        'incident_id' => $this->incident->id,
        'dispatcher_id' => $this->dispatcher->id,
        'ambulance_id' => $this->ambulance->id,
        'driver_id' => $this->driver->id,
        'dispatch_status' => 'assigned',
        'assigned_at' => now(),
    ]);
});

test('idempotency: accepting an already accepted or advanced dispatch returns 200 without error', function () {
    // 1. Initial acceptance
    $res1 = $this->actingAs($this->driver, 'sanctum')
        ->postJson("/api/responder/dispatches/{$this->dispatch->id}/accept");
    
    $res1->assertOk()
        ->assertJsonPath('data.dispatch_status', 'accepted');

    // 2. Redundant acceptance (simulating offline replay after network drop)
    $res2 = $this->actingAs($this->driver, 'sanctum')
        ->postJson("/api/responder/dispatches/{$this->dispatch->id}/accept");

    $res2->assertOk()
        ->assertJsonPath('already_processed', true)
        ->assertJsonPath('message', 'Dispatch already accepted.');
});

test('idempotency: updating status to an already reached state returns 200 without conflict', function () {
    // 1. First status update to arrived_on_scene
    $res1 = $this->actingAs($this->driver, 'sanctum')
        ->postJson("/api/responder/dispatches/{$this->dispatch->id}/status", [
            'status' => 'arrived_on_scene',
            'latitude' => 8.5205,
            'longitude' => 124.5772,
        ]);
    $res1->assertOk();

    // 2. Redundant status update replay
    $res2 = $this->actingAs($this->driver, 'sanctum')
        ->postJson("/api/responder/dispatches/{$this->dispatch->id}/status", [
            'status' => 'arrived_on_scene',
            'latitude' => 8.5205,
            'longitude' => 124.5772,
        ]);

    $res2->assertOk()
        ->assertJsonPath('already_processed', true);
});

test('batch sync: successfully replays queued offline actions and maps temporary patient IDs', function () {
    $tempPatientId = 'temp_patient_test_uuid_9999';

    $batchPayload = [
        'operations' => [
            [
                'id' => 'op-1',
                'action' => 'ACCEPT_DISPATCH',
                'dispatchId' => $this->dispatch->id,
                'payload' => ['accepted_at' => now()->toIso8601String()],
            ],
            [
                'id' => 'op-1b',
                'action' => 'UPDATE_STATUS',
                'dispatchId' => $this->dispatch->id,
                'payload' => [
                    'status' => 'arrived_on_scene',
                    'timestamp' => now()->toIso8601String(),
                ],
            ],
            [
                'id' => 'op-2',
                'action' => 'CREATE_PATIENT',
                'payload' => [
                    'first_name' => 'Offline',
                    'last_name' => 'Survivor',
                    'temp_id' => $tempPatientId,
                    'gender' => 'male',
                    'age' => '30',
                ],
            ],
            [
                'id' => 'op-3',
                'action' => 'UPDATE_PCR',
                'dispatchId' => $this->dispatch->id,
                'payload' => [
                    'patient_id' => $tempPatientId,
                    'chief_complaint' => 'Offline recorded injury',
                    'vital_signs' => [
                        'blood_pressure' => '120/80',
                        'pulse_rate' => 75,
                    ],
                ],
            ],
            [
                'id' => 'op-4',
                'action' => 'SUBMIT_PCR',
                'dispatchId' => $this->dispatch->id,
                'payload' => [
                    'patient_id' => $tempPatientId,
                    'is_completed' => true,
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->driver, 'sanctum')
        ->postJson('/api/responder/sync/batch', $batchPayload);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('synced_count', 5);

    // Verify dispatch is marked completed
    $this->dispatch->refresh();
    expect($this->dispatch->dispatch_status)->toBe('completed');

    // Verify patient was created in database and temp ID was remapped
    $createdPatient = \App\Models\Patient::where('patient_first_name', 'Offline')
        ->where('patient_last_name', 'Survivor')
        ->first();
    expect($createdPatient)->not->toBeNull();

    // Verify PCR is tied to real patient ID
    $pcr = \App\Models\PatientCareRecord::where('dispatch_id', $this->dispatch->id)->first();
    expect($pcr)->not->toBeNull();
    expect($pcr->patient_id)->toBe($createdPatient->id);
    expect($pcr->chief_complaint)->toBe('Offline recorded injury');
});
