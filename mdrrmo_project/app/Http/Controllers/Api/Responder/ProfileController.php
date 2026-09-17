<?php

namespace App\Http\Controllers\Api\Responder;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function updateStatus(Request $request)
    {
        $request->validate([
            'status' => 'required|in:available,offline',
        ]);

        $user = Auth::user();
        $profile = $user->responderProfile;

        if (! $profile) {
            return response()->json(['message' => 'No responder profile found.'], 404);
        }

        $profile->availability = $request->status;
        $profile->save();

        return response()->json([
            'message' => 'Status updated successfully',
            'availability' => $profile->availability,
        ]);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120', // 5MB max
        ]);

        $user = Auth::user();

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = 'profile_'.$user->id.'_'.Str::random(10).'.'.$file->getClientOriginalExtension();

            // Delete old photo if exists
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $path = $file->storeAs('profile-photos', $filename, 'public');

            $user->profile_photo_path = $path;
            $user->save();

            return response()->json([
                'message' => 'Profile photo updated successfully',
                'photo_url' => asset('storage/'.$path),
            ]);
        }

        return response()->json(['message' => 'No photo provided'], 400);
    }

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
