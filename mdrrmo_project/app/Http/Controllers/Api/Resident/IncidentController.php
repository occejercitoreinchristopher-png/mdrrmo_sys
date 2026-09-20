<?php

namespace App\Http\Controllers\Api\Resident;

use App\Events\IncidentCreated;
use App\Events\ResidentCalledHotline;
use App\Events\ResidentCalledResponder;
use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IncidentController extends Controller
{
    public function index()
    {
        $incidents = Incident::where('resident_id', Auth::id())
            ->with([
                'incidentType',
                'images',
                'dispatches' => fn ($q) => $q->with(['ambulance', 'teamLeader', 'driver', 'emt'])->latest(),
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($incident) {
                $activeDispatch = $incident->dispatches->first(fn ($d) => ! in_array($d->dispatch_status, ['completed', 'cancelled']));
                $incident->active_dispatch = $activeDispatch;

                return $incident;
            });

        return response()->json(['data' => $incidents]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'incident_type_id' => 'required|exists:incident_types,id',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'reporter_latitude' => 'required|numeric',
            'reporter_longitude' => 'required|numeric',
            'reported_at' => 'nullable|date',
            'description' => 'nullable|string',
            'address' => 'nullable|string',
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:10240',
        ]);

        $hasActiveIncident = Incident::where('resident_id', Auth::id())
            ->whereIn('incident_status', ['pending', 'verified', 'assigned', 'responding'])
            ->where(function ($query) {
                $query->whereDoesntHave('dispatches')
                    ->orWhereHas('dispatches', function ($d) {
                        $d->whereNotIn('dispatch_status', ['completed', 'cancelled']);
                    });
            })
            ->exists();

        if ($hasActiveIncident) {
            return response()->json([
                'message' => 'You already have an active emergency report.',
            ], 422);
        }

        $incident = Incident::create([
            'resident_id' => Auth::id(),
            'incident_type_id' => $validated['incident_type_id'],
            'incident_latitude' => $validated['latitude'],
            'incident_longitude' => $validated['longitude'],
            'reporter_latitude' => $validated['reporter_latitude'],
            'reporter_longitude' => $validated['reporter_longitude'],
            'place_of_incident' => $validated['address'] ?? null,
            'incident_address' => $validated['address'] ?? null,
            'description' => $validated['description'] ?? '',
            'incident_status' => 'pending',
            'priority' => 'Moderate',
            'reported_at' => now(),
            'report_source' => 'resident_app',
        ]);

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('incidents', 'public');

            $incident->images()->create([
                'image_path' => $path,
                'capture_method' => 'camera',
            ]);
        }

        event(new IncidentCreated($incident));

        return response()->json([
            'message' => 'Emergency report submitted successfully',
            'data' => $incident,
        ], 201);
    }

    public function updateLocation(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        if ($incident->resident_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $incident->update([
            'reporter_latitude' => $validated['latitude'],
            'reporter_longitude' => $validated['longitude'],
        ]);

        return response()->json([
            'message' => 'Location updated successfully',
        ]);
    }

    public function callResponder(Request $request, Incident $incident)
    {
        // Validate request has lat, lng
        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        // Verify the incident belongs to the resident
        if ($incident->resident_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Update the incident's reporter location
        $incident->update([
            'reporter_latitude' => $validated['latitude'],
            'reporter_longitude' => $validated['longitude'],
        ]);

        // Fire event
        event(new ResidentCalledResponder($incident, $validated['latitude'], $validated['longitude']));

        return response()->json([
            'message' => 'Responder notified of location update',
            'data' => [
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
            ],
        ]);
    }

    public function callHotline(Request $request)
    {
        // Validate request has lat, lng
        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $user = Auth::user();

        // Fire event to dispatcher
        event(new ResidentCalledHotline($user, $validated['latitude'], $validated['longitude']));

        return response()->json([
            'message' => 'Dispatcher notified of hotline call',
            'data' => [
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
            ],
        ]);
    }
}
