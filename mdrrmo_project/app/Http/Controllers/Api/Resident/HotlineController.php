<?php

namespace App\Http\Controllers\Api\Resident;

use App\Http\Controllers\Controller;
use App\Models\EmergencyHotline;
use Illuminate\Http\Request;

class HotlineController extends Controller
{
    /**
     * Get list of active emergency hotlines for resident mobile app.
     */
    public function index(Request $request)
    {
        $hotlines = EmergencyHotline::active()
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

        return response()->json([
            'status' => 'success',
            'data' => $hotlines,
        ]);
    }
}
