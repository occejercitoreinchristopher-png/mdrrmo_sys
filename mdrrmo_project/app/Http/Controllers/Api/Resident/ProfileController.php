<?php

namespace App\Http\Controllers\Api\Resident;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\ResidentProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Get the authenticated resident's profile details.
     */
    public function show(Request $request)
    {
        $user = Auth::user();
        $user->load(['residentProfile.barangay']);

        $profile = $user->residentProfile;
        if (! $profile) {
            $profile = ResidentProfile::create([
                'user_id' => $user->id,
            ]);
            $profile->load('barangay');
        }

        $barangays = Barangay::orderBy('barangay_name')->get(['id', 'barangay_name']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'birthdate' => $user->birthdate ? Carbon::parse($user->birthdate)->format('Y-m-d') : null,
                'age' => $user->age,
                'role' => $user->role,
                'profile_photo_url' => $user->profile_photo_url,
            ],
            'resident_profile' => $profile,
            'barangays' => $barangays,
        ]);
    }

    /**
     * Update personal information.
     */
    public function updatePersonal(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'birthdate' => 'nullable|date|before:today',
            'phone_number' => 'nullable|string|max:25',
            'gender' => 'nullable|string|in:male,female,other',
            'barangay_id' => 'nullable|exists:barangays,id',
            'house_no' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
        ]);

        $user = Auth::user();

        $birthdate = $validated['birthdate'] ?? null;
        $age = $birthdate ? Carbon::parse($birthdate)->age : $user->age;

        $user->update([
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'birthdate' => $birthdate,
            'age' => $age,
            'phone_number' => $validated['phone_number'] ?? null,
        ]);

        $profile = $user->residentProfile;
        if (! $profile) {
            $profile = new ResidentProfile(['user_id' => $user->id]);
        }

        $profile->gender = $validated['gender'] ?? null;
        $profile->barangay_id = $validated['barangay_id'] ?? null;
        $profile->house_no = $validated['house_no'] ?? null;
        $profile->street = $validated['street'] ?? null;
        $profile->save();

        $profile->load('barangay');

        return response()->json([
            'success' => true,
            'message' => 'Personal information updated successfully.',
            'user' => $user->fresh(),
            'resident_profile' => $profile,
        ]);
    }

    /**
     * Update emergency and medical information.
     */
    public function updateEmergency(Request $request)
    {
        $validated = $request->validate([
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_number' => 'nullable|string|max:30',
            'emergency_contact_relationship' => 'nullable|string|max:100',
            'blood_type' => 'nullable|string|max:10',
            'allergies' => 'nullable|string|max:1000',
            'medical_notes' => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();
        $profile = $user->residentProfile;
        if (! $profile) {
            $profile = new ResidentProfile(['user_id' => $user->id]);
        }

        $profile->emergency_contact_name = $validated['emergency_contact_name'] ?? null;
        $profile->emergency_contact_number = $validated['emergency_contact_number'] ?? null;
        $profile->emergency_contact_relationship = $validated['emergency_contact_relationship'] ?? null;
        $profile->blood_type = $validated['blood_type'] ?? null;
        $profile->allergies = $validated['allergies'] ?? null;
        $profile->medical_notes = $validated['medical_notes'] ?? null;
        $profile->save();

        return response()->json([
            'success' => true,
            'message' => 'Emergency and medical information saved successfully.',
            'resident_profile' => $profile,
        ]);
    }

    /**
     * Upload or update profile avatar.
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $user = Auth::user();

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = 'resident_'.$user->id.'_'.Str::random(10).'.'.$file->getClientOriginalExtension();

            // Delete old photo if exists
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $path = $file->storeAs('profile-photos', $filename, 'public');

            $user->profile_photo_path = $path;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile photo updated successfully.',
                'photo_url' => asset('storage/'.$path),
            ]);
        }

        return response()->json(['message' => 'No photo provided.'], 400);
    }

    /**
     * Change password.
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password you provided is incorrect.'],
            ]);
        }

        $user->forceFill([
            'password' => $request->password,
            'password_change_required' => false,
            'temporary_password_expires_at' => null,
            'remember_token' => Str::random(60),
        ])->save();

        return response()->json([
            'success' => true,
            'message' => 'Your password has been changed successfully.',
        ]);
    }
}
