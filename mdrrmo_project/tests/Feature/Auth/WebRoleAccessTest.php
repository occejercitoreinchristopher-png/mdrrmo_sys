<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('admin can log in to web application and reaches admin dashboard', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'password' => Hash::make('secret123'),
    ]);

    $response = $this->post(route('login.store'), [
        'email' => $admin->email,
        'password' => 'secret123',
    ]);

    $this->assertAuthenticatedAs($admin);
    $response->assertRedirect(route('admin.dashboard', absolute: false));
});

test('dispatcher can log in to web application and reaches dispatcher dashboard', function () {
    $dispatcher = User::factory()->create([
        'role' => 'dispatcher',
        'password' => Hash::make('secret123'),
    ]);

    $response = $this->post(route('login.store'), [
        'email' => $dispatcher->email,
        'password' => 'secret123',
    ]);

    $this->assertAuthenticatedAs($dispatcher);
    $response->assertRedirect(route('dispatcher.dashboard', absolute: false));
});

test('responder is rejected from web login with clear mobile-only message without altering database role', function () {
    $responder = User::factory()->create([
        'role' => 'responder',
        'password' => Hash::make('secret123'),
    ]);

    $response = $this->post(route('login.store'), [
        'email' => $responder->email,
        'password' => 'secret123',
    ]);

    // Must remain guest on web
    $this->assertGuest();

    // Must receive mobile-only notification error
    $response->assertSessionHasErrors([
        'email' => 'Responder accounts can only access the MDRRMO mobile application. Please use the Responder mobile app to continue.',
    ]);

    // Database role must remain untouched as 'responder'
    $responder->refresh();
    expect($responder->role)->toBe('responder');
});

test('resident is rejected from web login with clear mobile-only message without altering database role', function () {
    $resident = User::factory()->create([
        'role' => 'resident',
        'password' => Hash::make('secret123'),
    ]);

    $response = $this->post(route('login.store'), [
        'email' => $resident->email,
        'password' => 'secret123',
    ]);

    // Must remain guest on web
    $this->assertGuest();

    // Must receive mobile-only notification error
    $response->assertSessionHasErrors([
        'email' => 'Resident accounts can only access the MDRRMO mobile application. Please use the Resident mobile app to continue.',
    ]);

    // Database role must remain untouched as 'resident'
    $resident->refresh();
    expect($resident->role)->toBe('resident');
});

test('responder can still authenticate normally in the mobile api', function () {
    $responder = User::factory()->create([
        'role' => 'responder',
        'password' => Hash::make('secret123'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $responder->email,
        'password' => 'secret123',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['token', 'user']);

    expect($response->json('user.role'))->toBe('responder');
});

test('resident can still authenticate normally in the mobile api', function () {
    $resident = User::factory()->create([
        'role' => 'resident',
        'password' => Hash::make('secret123'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $resident->email,
        'password' => 'secret123',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['token', 'user']);

    expect($response->json('user.role'))->toBe('resident');
});

test('responder session navigating to dispatcher web routes is terminated and redirected to login', function () {
    $responder = User::factory()->create([
        'role' => 'responder',
    ]);

    $response = $this->actingAs($responder)->get(route('dispatcher.dashboard'));

    $this->assertGuest();
    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors([
        'email' => 'Responder accounts can only access the MDRRMO mobile application. Please use the Responder mobile app to continue.',
    ]);
});
