<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BarangayController extends Controller
{
    /**
     * Display the 14 official barangays and their location codes.
     */
    public function index(Request $request)
    {
        $barangays = Barangay::withCount('locationCodes')
            ->orderBy('barangay_name', 'asc')
            ->get();

        $transformed = $barangays->map(function ($b) {
            return [
                'id' => $b->id,
                'name' => $b->barangay_name,
                'municipality' => 'Opol',
                'province' => 'Misamis Oriental',
                'location_codes_count' => (int) $b->location_codes_count,
            ];
        });

        return Inertia::render('admin/Barangays', [
            'barangays' => $transformed,
        ]);
    }
}
