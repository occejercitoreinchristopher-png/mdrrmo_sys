<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
                'profile_photo_url' => $user->profile_photo_url,
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
            'address' => $validated['address'] ?? null,
            'zip_code' => $validated['zip_code'] ?? null,
            'phone_number' => $validated['phone_number'],
        ]);

        $user->save();

        if ($user->role === 'responder' && isset($validated['position'])) {
            $user->responderProfile?->update(['position' => $validated['position']]);
        }

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

    /**
     * Upload or update profile photo.
     */
    public function updatePhoto(Request $request): RedirectResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ], [
            'photo.required' => 'Please select an image to upload.',
            'photo.image' => 'The uploaded file must be an image.',
            'photo.mimes' => 'Allowed image formats: jpeg, png, jpg, webp.',
            'photo.max' => 'Image size cannot exceed 5MB.',
        ]);

        $user = $request->user();

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = 'profile_' . $user->id . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();

            // Delete old photo if exists
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $path = $file->storeAs('profile-photos', $filename, 'public');
            $user->update(['profile_photo_path' => $path]);

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Profile photo updated successfully.']);

            return back()->with('success', 'Profile photo updated successfully.');
        }

        return back()->with('error', 'No photo was uploaded.');
    }

    /**
     * Remove the current profile photo.
     */
    public function deletePhoto(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
            $user->update(['profile_photo_path' => null]);

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Profile photo removed successfully.']);

            return back()->with('success', 'Profile photo removed successfully.');
        }

        return back();
    }
}
