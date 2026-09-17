<?php

use App\Mail\TemporaryPasswordMail;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

test('admin can create a user without providing password and temporary password is emailed', function () {
    Mail::fake();

    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post('/admin/users', [
        'first_name' => 'John',
        'middle_name' => 'Paul',
        'last_name' => 'Dispatcher',
        'email' => 'temp.dispatcher@example.com',
        'phone_number' => '09123456780',
        'role' => 'dispatcher',
        'status' => 'active',
    ]);

    $response->assertSessionHas('success', "User account created successfully. A temporary password has been sent to the user's email address. The user must change their password on their first login.");

    $user = User::where('email', 'temp.dispatcher@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->password_change_required)->toBeTrue();
    expect($user->temporary_password_expires_at)->not->toBeNull();
    expect($user->temporary_password_expires_at->isFuture())->toBeTrue();

    Mail::assertSent(TemporaryPasswordMail::class, function ($mail) use ($user) {
        return $mail->hasTo($user->email)
            && !empty($mail->temporaryPassword)
            && strlen($mail->temporaryPassword) === 12
            && !$mail->isReset;
    });
});

test('user with password_change_required is redirected to /change-password upon login and blocked from dashboard', function () {
    $user = User::factory()->create([
        'email' => 'force.change@example.com',
        'password' => Hash::make('TempPass1234'),
        'role' => 'dispatcher',
        'password_change_required' => true,
        'temporary_password_expires_at' => now()->addHours(24),
    ]);

    $response = $this->post('/login', [
        'email' => 'force.change@example.com',
        'password' => 'TempPass1234',
    ]);

    $response->assertRedirect('/change-password');

    // Trying to visit dispatcher dashboard while password_change_required is true
    $dashboardResponse = $this->actingAs($user)->get('/dispatcher/dashboard');
    $dashboardResponse->assertRedirect('/change-password');
});

test('user with expired temporary password is automatically logged out with error message', function () {
    $user = User::factory()->create([
        'email' => 'expired.user@example.com',
        'password' => Hash::make('TempPass1234'),
        'role' => 'dispatcher',
        'password_change_required' => true,
        'temporary_password_expires_at' => now()->subHour(), // Expired
    ]);

    $response = $this->actingAs($user)->get('/dispatcher/dashboard');

    $response->assertRedirect('/login');
    $response->assertSessionHasErrors(['email' => 'Your temporary password has expired. Please contact your administrator for assistance.']);
    $this->assertGuest();
});

test('user can successfully change temporary password and is redirected to role dashboard', function () {
    $user = User::factory()->create([
        'email' => 'change.ok@example.com',
        'password' => Hash::make('TempPass1234!'),
        'role' => 'dispatcher',
        'password_change_required' => true,
        'temporary_password_expires_at' => now()->addHours(24),
    ]);

    $response = $this->actingAs($user)->post('/change-password', [
        'current_password' => 'TempPass1234!',
        'password' => 'NewSecurePassword123',
        'password_confirmation' => 'NewSecurePassword123',
    ]);

    $response->assertRedirect(route('dispatcher.dashboard'));
    $response->assertSessionHas('success', 'Password created successfully! Welcome to the Dispatch Center.');

    $user->refresh();
    expect($user->password_change_required)->toBeFalse();
    expect($user->temporary_password_expires_at)->toBeNull();
    expect(Hash::check('NewSecurePassword123', $user->password))->toBeTrue();
});

test('user cannot change password if current password does not match or same password is reused', function () {
    $user = User::factory()->create([
        'email' => 'wrong.pass@example.com',
        'password' => Hash::make('TempPass1234!'),
        'role' => 'dispatcher',
        'password_change_required' => true,
        'temporary_password_expires_at' => now()->addHours(24),
    ]);

    // Wrong current password
    $response = $this->actingAs($user)->post('/change-password', [
        'current_password' => 'IncorrectPass',
        'password' => 'NewSecurePassword123',
        'password_confirmation' => 'NewSecurePassword123',
    ]);
    $response->assertSessionHasErrors(['current_password']);

    // Reusing same password
    $response2 = $this->actingAs($user)->post('/change-password', [
        'current_password' => 'TempPass1234!',
        'password' => 'TempPass1234!',
        'password_confirmation' => 'TempPass1234!',
    ]);
    $response2->assertSessionHasErrors(['password']);
});

test('admin can trigger reset password for a user', function () {
    Mail::fake();

    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create([
        'email' => 'target.user@example.com',
        'role' => 'dispatcher',
        'password_change_required' => false,
        'temporary_password_expires_at' => null,
    ]);

    $response = $this->actingAs($admin)->post("/admin/users/{$user->id}/reset-password");

    $response->assertSessionHas('success', "Password reset successfully. A temporary password has been sent to the user's registered email address. The user must change their password after logging in.");

    $user->refresh();
    expect($user->password_change_required)->toBeTrue();
    expect($user->temporary_password_expires_at)->not->toBeNull();
    expect($user->temporary_password_expires_at->isFuture())->toBeTrue();

    Mail::assertSent(TemporaryPasswordMail::class, function ($mail) use ($user) {
        return $mail->hasTo($user->email)
            && !empty($mail->temporaryPassword)
            && $mail->isReset === true;
    });
});
