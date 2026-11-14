<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated admin or dispatcher is redirected to their dashboard', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $response = $this->actingAs($admin)->get(route('dashboard'));
    $response->assertRedirect(route('admin.dashboard'));

    $dispatcher = User::factory()->create(['role' => 'dispatcher']);
    $response = $this->actingAs($dispatcher)->get(route('dashboard'));
    $response->assertRedirect(route('dispatcher.dashboard'));
});

test('residents and responders visiting web dashboard are redirected to login', function () {
    $resident = User::factory()->create(['role' => 'resident']);
    $response = $this->actingAs($resident)->get(route('dashboard'));
    $response->assertRedirect(route('login'));

    $responder = User::factory()->create(['role' => 'responder']);
    $response = $this->actingAs($responder)->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});
