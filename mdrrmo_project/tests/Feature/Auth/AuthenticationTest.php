<?php

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Fortify\Features;

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('admin can authenticate and is redirected to admin dashboard', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->post(route('login.store'), [
        'email' => $admin->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($admin);
    $response->assertRedirect(route('admin.dashboard', absolute: false));
});

test('dispatcher can authenticate and is redirected to dispatcher dashboard', function () {
    $dispatcher = User::factory()->create(['role' => 'dispatcher']);

    $response = $this->post(route('login.store'), [
        'email' => $dispatcher->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($dispatcher);
    $response->assertRedirect(route('dispatcher.dashboard', absolute: false));
});

test('responder cannot authenticate on web and receives mobile-only message', function () {
    $responder = User::factory()->create(['role' => 'responder']);

    $response = $this->post(route('login.store'), [
        'email' => $responder->email,
        'password' => 'password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors([
        'email' => 'Responder accounts can only access the MDRRMO mobile application. Please use the Responder mobile app to continue.',
    ]);
});

test('resident cannot authenticate on web and receives mobile-only message', function () {
    $resident = User::factory()->create(['role' => 'resident']);

    $response = $this->post(route('login.store'), [
        'email' => $resident->email,
        'password' => 'password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors([
        'email' => 'Resident accounts can only access the MDRRMO mobile application. Please use the Resident mobile app to continue.',
    ]);
});

test('users with two factor enabled are redirected to two factor challenge', function () {
    $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());

    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]);

    $user = User::factory()->withTwoFactor()->create();

    $response = $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('two-factor.login'));
    $response->assertSessionHas('login.id', $user->id);
    $this->assertGuest();
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($user)->post(route('logout'));

    $response->assertRedirect(route('home'));

    $this->assertGuest();
});

test('users are rate limited', function () {
    $user = User::factory()->create();

    RateLimiter::increment(md5('login'.implode('|', [$user->email, '127.0.0.1'])), amount: 5);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertTooManyRequests();
});
