<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmergencyHotline;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class HotlineController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');

        $query = EmergencyHotline::query()->orderBy('sort_order', 'asc')->orderBy('id', 'asc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('short_label', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $hotlines = $query->paginate(15)->withQueryString();

        return Inertia::render('admin/Hotlines/Index', [
            'hotlines' => $hotlines->items(),
            'filters' => [
                'search' => $search ?? '',
            ],
            'pagination' => [
                'currentPage' => $hotlines->currentPage(),
                'lastPage' => $hotlines->lastPage(),
                'perPage' => $hotlines->perPage(),
                'total' => $hotlines->total(),
            ],
            'stats' => [
                'total' => EmergencyHotline::count(),
                'active' => EmergencyHotline::where('is_active', true)->count(),
                'inactive' => EmergencyHotline::where('is_active', false)->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'short_label' => 'nullable|string|max:150',
            'phone_number' => ['required', 'string', 'regex:/^[0-9]{3,11}$/'],
            'description' => 'nullable|string|max:150',
            'icon_type' => 'required|string|in:police,fire,medical,siren,phone,shield',
            'accent_color' => 'required|string|max:150',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ], [
            'phone_number.regex' => 'The phone/mobile number must only contain numbers and be 11 digits or fewer (e.g. 911 or 09XXXXXXXXX).',
        ]);

        if (!isset($validated['sort_order'])) {
            $maxOrder = EmergencyHotline::max('sort_order') ?? 0;
            $validated['sort_order'] = $maxOrder + 1;
        }

        EmergencyHotline::create($validated);
        Cache::forget('active_emergency_hotlines');

        return back()->with('success', 'Emergency hotline created successfully.');
    }

    public function update(Request $request, EmergencyHotline $hotline)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'short_label' => 'nullable|string|max:150',
            'phone_number' => ['required', 'string', 'regex:/^[0-9]{3,11}$/'],
            'description' => 'nullable|string|max:150',
            'icon_type' => 'required|string|in:police,fire,medical,siren,phone,shield',
            'accent_color' => 'required|string|max:150',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ], [
            'phone_number.regex' => 'The phone/mobile number must only contain numbers and be 11 digits or fewer (e.g. 911 or 09XXXXXXXXX).',
        ]);

        $hotline->update($validated);
        Cache::forget('active_emergency_hotlines');

        return back()->with('success', 'Emergency hotline updated successfully.');
    }

    public function toggleActive(EmergencyHotline $hotline)
    {
        $hotline->update([
            'is_active' => !$hotline->is_active,
        ]);
        Cache::forget('active_emergency_hotlines');

        $status = $hotline->is_active ? 'activated' : 'deactivated';
        return back()->with('success', "Hotline \"{$hotline->name}\" {$status}.");
    }

    public function destroy(EmergencyHotline $hotline)
    {
        $name = $hotline->name;
        $hotline->delete();
        Cache::forget('active_emergency_hotlines');

        return back()->with('success', "Hotline \"{$name}\" deleted successfully.");
    }
}
