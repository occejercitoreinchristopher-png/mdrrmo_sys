<?php

use App\Models\User;

test('public registration always creates a resident regardless of provided role', function () {
    $response = $this->post('/register', [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
        'phone_number' => '09123456789',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'admin', // Attempting to inject admin role
    ]);

    $response->assertRedirect('/dashboard');
    $this->assertAuthenticated();

    $user = User::where('email', 'john@example.com')->first();
    expect($user->role)->toBe('resident'); // It should force 'resident'
});

test('admin can create dispatcher or responder', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post('/admin/users', [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'jane@example.com',
        'phone_number' => '09987654321',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'dispatcher',
        'status' => 'active',
    ]);

    $response->assertSessionHas('success');

    $user = User::where('email', 'jane@example.com')->first();
    expect($user->role)->toBe('dispatcher');
});

test('admin cannot create a resident via admin users endpoint', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post('/admin/users', [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'jane2@example.com',
        'phone_number' => '09987654322',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'resident',
        'status' => 'active',
    ]);

    $response->assertSessionHasErrors('role');
});

test('dispatcher can create responder but not dispatcher or admin', function () {
    $dispatcher = User::factory()->create(['role' => 'dispatcher']);

    $response = $this->actingAs($dispatcher)->post('/dispatcher/users', [
        'first_name' => 'Resp',
        'last_name' => 'Onder',
        'email' => 'resp@example.com',
        'phone_number' => '09987654323',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'responder',
        'status' => 'active',
        'is_reliever' => false,
        'team' => 'Alpha',
        'position' => 'emt',
    ]);

    $response->assertSessionHas('success');
    $user = User::where('email', 'resp@example.com')->first();
    expect($user->role)->toBe('responder');

    $response2 = $this->actingAs($dispatcher)->post('/dispatcher/users', [
        'first_name' => 'Disp',
        'last_name' => 'Atcher',
        'email' => 'disp@example.com',
        'phone_number' => '09987654324',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'dispatcher',
        'status' => 'active',
    ]);

    $response2->assertSessionHasErrors('role');
});

test('non-admin cannot access admin users endpoint', function () {
    $dispatcher = User::factory()->create(['role' => 'dispatcher']);

    $response = $this->actingAs($dispatcher)->get('/admin/users');
    $response->assertStatus(403);
});
