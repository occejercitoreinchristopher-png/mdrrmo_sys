<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PasswordChangeController extends Controller
{
    /**
     * Display the forced password change screen.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'responder') {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Responder accounts can only access the MDRRMO mobile application. Please use the Responder mobile app to continue.',
            ]);
        }

        if ($user->role === 'resident') {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Resident accounts can only access the MDRRMO mobile application. Please use the Resident mobile app to continue.',
            ]);
        }

        // If password change is not required, redirect to their normal dashboard
        if (! $user->password_change_required) {
            if ($user->role === 'admin') {
                return redirect()->route('admin.dashboard');
            }
            if ($user->role === 'dispatcher') {
                return redirect()->route('dispatcher.dashboard');
            }

            auth()->logout();
            return redirect()->route('login');
        }

        return Inertia::render('auth/ChangePassword', [
            'user' => [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Process the forced password change.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
        ], [
            'current_password.required' => 'Please enter your temporary password.',
            'password.different' => 'Your new password must be different from your temporary password.',
            'password.min' => 'Your new password must be at least 8 characters.',
            'password.confirmed' => 'The password confirmation does not match.',
        ]);

        $currentPassword = (string) $request->current_password;
        if (! Hash::check($currentPassword, $user->password) && ! Hash::check(trim($currentPassword), $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'The provided temporary password does not match our records.',
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($request->password),
            'password_change_required' => false,
            'temporary_password_expires_at' => null,
        ])->save();

        if ($user->role === 'admin') {
            return redirect()->route('admin.dashboard')->with('success', 'Password created successfully! Welcome to the Admin Portal.');
        }

        if ($user->role === 'dispatcher') {
            return redirect()->route('dispatcher.dashboard')->with('success', 'Password created successfully! Welcome to the Dispatch Center.');
        }

        auth()->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->withErrors([
            'email' => 'This account can only access the MDRRMO mobile application.',
        ]);
    }
}
