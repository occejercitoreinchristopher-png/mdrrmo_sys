<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Unauthorized action.');
        }

        // On web routes, redirect Responder and Resident to login with the mobile app notice
        if (! $request->expectsJson() && ! $request->is('api/*')) {
            if ($user->role === 'responder') {
                \Illuminate\Support\Facades\Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors([
                    'email' => 'Responder accounts can only access the MDRRMO mobile application. Please use the Responder mobile app to continue.',
                ]);
            }

            if ($user->role === 'resident') {
                \Illuminate\Support\Facades\Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors([
                    'email' => 'Resident accounts can only access the MDRRMO mobile application. Please use the Resident mobile app to continue.',
                ]);
            }
        }

        // Allow 'admin' to access any role-restricted route
        if ($user->role !== 'admin' && ! in_array($user->role, $roles)) {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}
