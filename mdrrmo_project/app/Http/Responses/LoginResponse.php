<?php

namespace App\Http\Responses;

use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        // Strictly reject Responder and Resident accounts from web login
        if ($user->role === 'responder') {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Responder accounts can only access the MDRRMO mobile application. Please use the Responder mobile app to continue.',
            ]);
        }

        if ($user->role === 'resident') {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Resident accounts can only access the MDRRMO mobile application. Please use the Resident mobile app to continue.',
            ]);
        }

        if ($user->password_change_required) {
            return redirect()->route('password.change');
        }

        if ($user->role === 'admin') {
            return redirect()->intended(route('admin.dashboard'));
        }

        if ($user->role === 'dispatcher') {
            return redirect()->intended(route('dispatcher.dashboard'));
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        throw ValidationException::withMessages([
            'email' => 'This account is not authorized to access the web application.',
        ]);
    }
}
