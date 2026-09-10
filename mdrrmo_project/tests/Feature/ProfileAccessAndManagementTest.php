<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('guest cannot access profile and is redirected to login', function () {
    $response = $this->get('/profile');
    $response->assertRedirect('/login');
});

test('resident cannot access profile and receives 403 forbidden', function () {
    $resident = User::factory()->create(['role' => 'resident']);

    $response = $this->actingAs($resident)->get('/profile');
    $response->assertStatus(403);
});

test('responder cannot access profile and receives 403 forbidden', function () {
    $responder = User::factory()->create(['role' => 'responder']);

    $response = $this->actingAs($responder)->get('/profile');
    $response->assertStatus(403);
});

test('admin can access profile page', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'first_name' => 'Super',
        'last_name' => 'Admin',
        'position' => 'Chief Administrator',
    ]);

    $response = $this->actingAs($admin)->get('/profile');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('profile')
        ->where('user.first_name', 'Super')
        ->where('user.role', 'admin')
        ->where('user.position', 'Chief Administrator')
    );
});

test('dispatcher can access profile page', function () {
    $dispatcher = User::factory()->create([
        'role' => 'dispatcher',
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'position' => 'Emergency Dispatcher',
    ]);

    $response = $this->actingAs($dispatcher)->get('/profile');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('profile')
        ->where('user.first_name', 'Juan')
        ->where('user.role', 'dispatcher')
        ->where('user.position', 'Emergency Dispatcher')
    );
});

test('authenticated user can update their own personal information', function () {
    $dispatcher = User::factory()->create([
        'role' => 'dispatcher',
        'first_name' => 'Original',
        'last_name' => 'Name',
        'phone_number' => '09111111111',
        'position' => 'Old Position',
    ]);

    $response = $this->actingAs($dispatcher)->patch('/profile', [
        'first_name' => 'UpdatedFirst',
        'middle_name' => 'UpdatedMid',
        'last_name' => 'UpdatedLast',
        'phone_number' => '09222222222',
        'position' => 'Senior Dispatch Officer',
    ]);

    $response->assertSessionHas('success', 'Profile updated successfully.');
    $dispatcher->refresh();

    expect($dispatcher->first_name)->toBe('UpdatedFirst');
    expect($dispatcher->middle_name)->toBe('UpdatedMid');
    expect($dispatcher->last_name)->toBe('UpdatedLast');
    expect($dispatcher->phone_number)->toBe('09222222222');
    expect($dispatcher->position)->toBe('Senior Dispatch Officer');
});

test('user cannot modify their own role, status, or email via profile update', function () {
    $dispatcher = User::factory()->create([
        'role' => 'dispatcher',
        'status' => 'active',
        'email' => 'original@mdrrmo.gov.ph',
    ]);

    $response = $this->actingAs($dispatcher)->patch('/profile', [
        'first_name' => 'Hacker',
        'last_name' => 'Attempt',
        'phone_number' => '09333333333',
        'role' => 'admin', // Malicious attempt to escalate privileges
        'status' => 'inactive',
        'email' => 'newemail@mdrrmo.gov.ph',
    ]);

    $dispatcher->refresh();
    expect($dispatcher->role)->toBe('dispatcher');
    expect($dispatcher->status)->toBe('active');
    expect($dispatcher->email)->toBe('original@mdrrmo.gov.ph');
});

test('user can change password with valid current password', function () {
    $user = User::factory()->create([
        'role' => 'dispatcher',
        'password' => Hash::make('oldpassword123'),
    ]);

    $response = $this->actingAs($user)->put('/profile/password', [
        'current_password' => 'oldpassword123',
        'password' => 'newsecretpass456',
        'password_confirmation' => 'newsecretpass456',
    ]);

    $response->assertSessionHas('success', 'Password changed successfully.');
    $user->refresh();

    expect(Hash::check('newsecretpass456', $user->password))->toBeTrue();
});

test('password change fails when current password is wrong', function () {
    $user = User::factory()->create([
        'role' => 'dispatcher',
        'password' => Hash::make('correctpassword123'),
    ]);

    $response = $this->actingAs($user)->put('/profile/password', [
        'current_password' => 'wrongpassword',
        'password' => 'newsecretpass456',
        'password_confirmation' => 'newsecretpass456',
    ]);

    $response->assertSessionHasErrors('current_password');
    $user->refresh();

    expect(Hash::check('correctpassword123', $user->password))->toBeTrue();
});

test('password change fails when confirmation does not match', function () {
    $user = User::factory()->create([
        'role' => 'dispatcher',
        'password' => Hash::make('oldpassword123'),
    ]);

    $response = $this->actingAs($user)->put('/profile/password', [
        'current_password' => 'oldpassword123',
        'password' => 'newsecretpass456',
        'password_confirmation' => 'mismatchedpass999',
    ]);

    $response->assertSessionHasErrors('password');
});
