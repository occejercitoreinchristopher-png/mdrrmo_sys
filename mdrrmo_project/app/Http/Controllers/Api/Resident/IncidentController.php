<?php

namespace App\Http\Controllers\Api\Resident;

use App\Events\IncidentCreated;
use App\Events\IncidentRejected;
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
        $user = Auth::user();
        $isSuspended = $user->isReportingSuspended();
        $prankCount = Incident::where('resident_id', $user->id)
            ->where(function ($q) {
                $q->where('is_prank', true)
                  ->orWhere('rejection_category', 'prank');
            })
            ->count();

        $totalRejected = Incident::where('resident_id', $user->id)
            ->where('incident_status', 'rejected')
            ->count();

        $incidents = Incident::where('resident_id', $user->id)
            ->with([
                'incidentType',
                'images',
                'dispatches' => fn ($q) => $q->with([
                    'ambulance', 
                    'teamLeader.responderProfile', 
                    'driver.responderProfile', 
                    'emt.responderProfile',
                ])->latest(),
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($incident) {
                $activeDispatch = $incident->dispatches->first(fn ($d) => ! in_array($d->dispatch_status, ['completed', 'cancelled']));
                if ($activeDispatch) {
                    // For resident privacy and security, do not expose responder real names, only their ID / Badge ID
                    if ($activeDispatch->driver) {
                        $badge = $activeDispatch->driver->responderProfile?->badge_number ?: sprintf('RSP-%04d', $activeDispatch->driver->id);
                        $activeDispatch->driver->badge_number = $badge;
                        $activeDispatch->driver->badge_id = $badge;
                        $activeDispatch->driver->first_name = 'Responder';
                        $activeDispatch->driver->last_name = $badge;
                    }
                    if ($activeDispatch->teamLeader) {
                        $badge = $activeDispatch->teamLeader->responderProfile?->badge_number ?: sprintf('RSP-%04d', $activeDispatch->teamLeader->id);
                        $activeDispatch->teamLeader->badge_number = $badge;
                        $activeDispatch->teamLeader->badge_id = $badge;
                        $activeDispatch->teamLeader->first_name = 'Responder';
                        $activeDispatch->teamLeader->last_name = $badge;
                    }
                    if ($activeDispatch->emt) {
                        $badge = $activeDispatch->emt->responderProfile?->badge_number ?: sprintf('RSP-%04d', $activeDispatch->emt->id);
                        $activeDispatch->emt->badge_number = $badge;
                        $activeDispatch->emt->badge_id = $badge;
                        $activeDispatch->emt->first_name = 'Responder';
                        $activeDispatch->emt->last_name = $badge;
                    }
                }
                $incident->setAttribute('active_dispatch', $activeDispatch);

                return $incident;
            });

        $user->syncVerificationStatus();
        $completeness = $user->checkProfileCompleteness();
        $isVerified = $user->isVerifiedResident();

        return response()->json([
            'data' => $incidents,
            'suspension' => [
                'is_suspended' => $isSuspended,
                'suspended_until' => $isSuspended && $user->reporting_suspended_until ? $user->reporting_suspended_until->toIso8601String() : null,
                'prank_count' => $prankCount,
                'total_rejected_count' => $totalRejected,
            ],
            'verification' => [
                'verification_status' => $user->verification_status,
                'is_verified' => $isVerified,
                'missing_fields' => $completeness['missing_fields'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if ($user->isReportingSuspended()) {
            return response()->json([
                'message' => 'Your reporting privileges are temporarily suspended until ' . $user->reporting_suspended_until->format('M d, Y h:i A') . ' due to multiple rejected reports.',
                'suspended_until' => $user->reporting_suspended_until->toIso8601String(),
            ], 403);
        }

        // Automatic Resident Profile Verification Check
        if ($user->role === 'resident') {
            $user->syncVerificationStatus();
            if (! $user->isVerifiedResident()) {
                $completeness = $user->checkProfileCompleteness();
                return response()->json([
                    'message' => 'Complete your personal information to unlock the accident reporting feature.',
                    'verification_status' => $user->verification_status,
                    'is_verified' => false,
                    'missing_fields' => $completeness['missing_fields'],
                ], 403);
            }
        }

        $validated = $request->validate([
            'incident_type_id' => 'required|exists:incident_types,id',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'reporter_latitude' => 'required|numeric',
            'reporter_longitude' => 'required|numeric',
            'reported_at' => 'nullable|date',
            'description' => 'nullable|string',
            'address' => 'nullable|string',
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240',
            'photo_latitude' => 'nullable|numeric',
            'photo_longitude' => 'nullable|numeric',
            'photo_location_name' => 'nullable|string',
            'photo_captured_at' => 'nullable|date',
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
            'incident_address' => $validated['address'] ?? null,
            'description' => $validated['description'] ?? '',
            'incident_status' => 'pending',
            'priority' => 'Moderate',
            'reported_at' => now(),
            'report_source' => 'resident_app',
        ]);

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('incidents', 'public');

            $photoLat = $request->filled('photo_latitude') ? (float) $request->photo_latitude : (float) $validated['latitude'];
            $photoLng = $request->filled('photo_longitude') ? (float) $request->photo_longitude : (float) $validated['longitude'];
            $photoLocationName = $request->filled('photo_location_name') ? $request->photo_location_name : ($validated['address'] ?? null);
            $photoCapturedAt = $request->filled('photo_captured_at') ? \Carbon\Carbon::parse($request->photo_captured_at) : now();

            $incident->images()->create([
                'user_id' => Auth::id(),
                'image_path' => $path,
                'capture_method' => 'camera',
                'latitude' => $photoLat,
                'longitude' => $photoLng,
                'location_name' => $photoLocationName,
                'captured_at' => $photoCapturedAt,
                'source' => 'resident',
            ]);
        }

        $incident->load(['incidentType', 'resident.residentProfile.barangay', 'images']);
        $incident->reporter_prank_history = Incident::getPrankHistoryForReporter(Auth::id(), Auth::user()?->phone_number);

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

    public function cancel(Request $request, Incident $incident)
    {
        $user = Auth::user();

        if ($incident->resident_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        if (! in_array($incident->incident_status, ['pending', 'verified'])) {
            return response()->json([
                'message' => 'Cannot cancel: A response team is already assigned or en route. Please contact the MDRRMO hotline immediately.',
            ], 422);
        }

        $hasActiveDispatch = $incident->dispatches()
            ->whereNotIn('dispatch_status', ['completed', 'cancelled'])
            ->exists();

        if ($hasActiveDispatch || in_array($incident->incident_status, ['assigned', 'responding'])) {
            return response()->json([
                'message' => 'Cannot cancel: A response team is already assigned or en route. Please contact the MDRRMO hotline immediately.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $reason = $validated['reason'] ?? 'Cancelled by reporting resident';

        $updatePayload = [
            'incident_status' => 'cancelled',
            'resolved_at' => now(),
        ];

        if (\Illuminate\Support\Facades\Schema::hasColumn('incidents', 'verification_remarks')) {
            $updatePayload['verification_remarks'] = mb_substr("Cancelled by resident: {$reason}", 0, 100);
        }

        if (\Illuminate\Support\Facades\Schema::hasColumn('incidents', 'rejection_reason')) {
            $updatePayload['rejection_reason'] = mb_substr("Cancelled by resident: {$reason}", 0, 500);
        }

        if (\Illuminate\Support\Facades\Schema::hasColumn('incidents', 'notes')) {
            $updatePayload['notes'] = "Cancelled by resident: {$reason}";
        }

        $incident->update($updatePayload);

        try {
            event(new IncidentRejected($incident));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Broadcast error on resident incident cancellation: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Emergency report cancelled successfully.',
            'data' => $incident->fresh(['incidentType', 'images']),
        ]);
    }
}
