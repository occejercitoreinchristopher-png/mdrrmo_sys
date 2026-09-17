<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordNotExpired
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->password_change_required) {
            // Check if the temporary password has expired (e.g. 24 hours)
            if ($user->temporary_password_expires_at && $user->temporary_password_expires_at->isPast()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')
                    ->with('error', 'Your temporary password has expired (valid for 24 hours). Please contact your administrator for assistance.')
                    ->withErrors(['email' => 'Your temporary password has expired. Please contact your administrator for assistance.']);
            }

            // Allowed routes when password change is required
            if (! $request->routeIs('password.change', 'password.change.update', 'logout')) {
                return redirect()->route('password.change');
            }
        }

        return $next($request);
    }
}
