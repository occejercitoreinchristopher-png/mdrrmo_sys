<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->whereNull('deleted_at')],
            'phone_number' => 'nullable|string|max:20',
            'birthdate' => 'nullable|date|before:today',
            'birthday' => 'nullable|date|before:today',
            'age' => 'nullable|integer|min:1|max:120',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $birthdate = $validated['birthdate'] ?? $validated['birthday'] ?? null;
        $age = ! empty($validated['age']) ? (int) $validated['age'] : null;
        if ($birthdate && empty($age)) {
            $age = \Illuminate\Support\Carbon::parse($birthdate)->age;
        }

        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
            'birthdate' => $birthdate,
            'age' => $age,
            'password' => Hash::make($validated['password']),
            'role' => 'resident',
            'status' => 'active',
        ]);

        $token = $user->createToken('mobile-device')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role,
                'profile_photo_url' => $user->profile_photo_url,
                'responder_profile' => $user->responderProfile,
                'resident_profile' => $user->residentProfile,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['We could not find an account with this email address.'],
            ]);
        }

        if (! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The password you entered is incorrect.'],
            ]);
        }

        Auth::login($user);

        // Ensure they have a valid role for mobile access
        if ($user->role !== 'resident' && $user->role !== 'responder') {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['Unauthorized access.'],
            ]);
        }

        $token = $user->createToken('mobile-device')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role,
                'password_change_required' => (bool)$user->password_change_required,
                'profile_photo_url' => $user->profile_photo_url,
                'responder_profile' => $user->responderProfile,
                'resident_profile' => $user->residentProfile,
            ],
        ]);
    }

    public function user(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'role' => $user->role,
            'password_change_required' => (bool)$user->password_change_required,
            'profile_photo_url' => $user->profile_photo_url,
            'responder_profile' => $user->responderProfile,
            'resident_profile' => $user->residentProfile,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function updatePushToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $user = $request->user();
        $user->expo_push_token = $request->token;
        $user->save();

        return response()->json(['message' => 'Push token updated successfully']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Send reset link using default broker (silently handles non-existing users to prevent enumeration)
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'success' => true,
            'message' => 'If the email address is registered, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'password_change_required' => false,
                    'temporary_password_expires_at' => null,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Your password has been reset successfully.',
            ]);
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
