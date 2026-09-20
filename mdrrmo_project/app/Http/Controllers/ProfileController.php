<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    use PasswordValidationRules;

    /**
     * Display the authenticated user's profile.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('profile', [
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'birthdate' => $user->birthdate ? Carbon::parse($user->birthdate)->format('Y-m-d') : null,
                'age' => $user->age,
                'gender' => $user->gender,
                'address' => $user->address,
                'zip_code' => $user->zip_code,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'role' => $user->role,
                'position' => $user->position,
                'status' => $user->status,
                'created_at' => $user->created_at?->toIso8601String(),
                'updated_at' => $user->updated_at?->toIso8601String(),
            ],
            'status' => session('status'),
        ]);
    }

    /**
     * Update the authenticated user's personal information.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'max:50'],
            'birthdate' => ['nullable', 'date', 'before_or_equal:today'],
            'age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'position' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'zip_code' => ['nullable', 'string', 'max:20'],
            'phone_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'phone_number')->ignore($user->id),
            ],
        ], [
            'first_name.required' => 'First name is required.',
            'last_name.required' => 'Last name is required.',
            'phone_number.required' => 'Phone number is required.',
            'phone_number.unique' => 'This phone number is already registered to another account.',
        ]);

        // Explicitly only assign permitted profile fields (never allow role, status, email, or id)
        $user->fill([
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'gender' => $validated['gender'] ?? null,
            'birthdate' => $validated['birthdate'] ?? null,
            'age' => $validated['age'] ?? null,
            'position' => $validated['position'] ?? null,
            'address' => $validated['address'] ?? null,
            'zip_code' => $validated['zip_code'] ?? null,
            'phone_number' => $validated['phone_number'],
        ]);

        $user->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Profile updated successfully.']);

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Update the authenticated user's password.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'password' => ['required', 'string', Password::min(8), 'confirmed'],
        ], [
            'current_password.required' => 'Current password is required.',
            'current_password.current_password' => 'Current password is incorrect.',
            'password.required' => 'New password is required.',
            'password.min' => 'Password must contain at least 8 characters.',
            'password.confirmed' => 'New passwords do not match.',
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Password changed successfully.']);

        return back()->with('success', 'Password changed successfully.');
    }
}
