<?php

namespace App\Http\Controllers\Api\Resident;

use App\Http\Controllers\Controller;
use App\Models\EmergencyHotline;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class HotlineController extends Controller
{
    /**
     * Get list of active emergency hotlines for resident mobile app.
     * Cached in memory for high-concurrency scaling (thousands of users).
     */
    public function index(Request $request)
    {
        $hotlines = Cache::remember('active_emergency_hotlines', now()->addDay(), function () {
            return EmergencyHotline::active()
                ->get([
                    'id',
                    'name',
                    'short_label',
                    'phone_number',
                    'description',
                    'icon_type',
                    'accent_color',
                    'is_active',
                    'sort_order',
                ]);
        });

        return response()->json([
            'status' => 'success',
            'data' => $hotlines,
        ]);
    }
}
