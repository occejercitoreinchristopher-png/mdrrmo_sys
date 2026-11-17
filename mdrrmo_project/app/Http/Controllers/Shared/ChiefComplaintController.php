<?php

namespace App\Http\Controllers\Shared;

use App\Constants\EmergencyComplaints;
use App\Http\Controllers\Controller;
use App\Models\EmergencyComplaint;
use Illuminate\Http\Request;

class ChiefComplaintController extends Controller
{
    /**
     * Get all complaints (Standard base constants + Custom database entries)
     */
    public function index()
    {
        $dbComplaints = EmergencyComplaint::orderBy('complaint_name')->get();
        
        $categories = EmergencyComplaints::CATEGORIES;
        foreach ($dbComplaints as $item) {
            $cat = $item->category;
            if (! isset($categories[$cat])) {
                $categories[$cat] = [];
            }
            if (! in_array($item->complaint_name, $categories[$cat])) {
                $categories[$cat][] = $item->complaint_name;
            }
        }

        $all = [];
        foreach ($categories as $catList) {
            $all = array_merge($all, $catList);
        }
        $all = array_values(array_unique($all));
        sort($all);

        return response()->json([
            'categories' => $categories,
            'all' => $all,
        ]);
    }

    /**
     * Store new chief complaint from dispatcher web or admin
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:100',
            'complaint_name' => 'required|string|max:150',
            'description' => 'nullable|string|max:255',
        ]);

        $complaint = EmergencyComplaint::firstOrCreate(
            [
                'category' => trim($validated['category']),
                'complaint_name' => trim($validated['complaint_name']),
            ],
            [
                'description' => $validated['description'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Chief complaint saved successfully.',
            'complaint' => $complaint,
        ]);
    }
}
