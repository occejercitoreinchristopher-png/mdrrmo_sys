<?php

namespace App\Http\Controllers\Api\Responder;

use App\Http\Controllers\Controller;
use App\Models\FcmDeviceToken;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    /**
     * Register or update an FCM push device token for the authenticated responder
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'device_type' => 'nullable|string|in:android,ios,web',
            'device_name' => 'nullable|string|max:100',
        ]);

        $token = FcmDeviceToken::updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => $request->user()->id,
                'device_type' => $validated['device_type'] ?? 'android',
                'device_name' => $validated['device_name'] ?? null,
                'is_active' => true,
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'FCM push token registered successfully.',
            'device_token' => $token,
        ]);
    }

    /**
     * Deactivate or remove an FCM device token upon logout
     */
    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'token' => 'nullable|string',
        ]);

        if (!empty($validated['token'])) {
            FcmDeviceToken::where('token', $validated['token'])
                ->where('user_id', $request->user()->id)
                ->update(['is_active' => false]);
        } else {
            // Deactivate all tokens for this user on general logout
            FcmDeviceToken::where('user_id', $request->user()->id)
                ->update(['is_active' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => 'FCM push token deactivated successfully.',
        ]);
    }
}
