<?php

namespace App\Http\Controllers\Dispatcher;

use App\Events\ResponderStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Dispatch;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResponderController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', $request->input('q', '')));
        $status = strtolower(trim((string) $request->input('status', '')));
        $role = strtolower(trim((string) $request->input('role', '')));
        $team = trim((string) $request->input('team', ''));

        // 1. Fetch active dispatches first to accurately classify deployed responders
        $activeDispatches = Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])
            ->with(['incident.incidentType', 'ambulance', 'crew'])
            ->get();

        $assignedUserIds = collect();
        foreach ($activeDispatches as $d) {
            if ($d->driver_id) $assignedUserIds->push((int) $d->driver_id);
            if ($d->emt_id) $assignedUserIds->push((int) $d->emt_id);
            foreach ($d->crew as $c) {
                $assignedUserIds->push((int) $c->id);
            }
        }
        $assignedUserIds = $assignedUserIds->unique()->values()->toArray();

        // 2. Base Query for responders
        $query = User::whereIn('role', ['responder', 'team_leader', 'emt', 'driver'])
            ->with(['responderProfile'])
            ->withCount('tokens');

        // Search Filter
        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('id', $search)
                    ->orWhereHas('responderProfile', function ($rq) use ($search) {
                        $rq->where('badge_number', 'like', "%{$search}%")
                            ->orWhere('team', 'like', "%{$search}%")
                            ->orWhere('position', 'like', "%{$search}%");
                    });

                if (preg_match('/^rsp-0*(\d+)$/i', $search, $matches)) {
                    $q->orWhere('id', (int) $matches[1]);
                }
            });
        }

        // Status Filter (Only 3 canonical statuses: available, assigned, offline)
        if (! empty($status)) {
            if ($status === 'assigned') {
                $query->whereIn('id', $assignedUserIds);
            } elseif ($status === 'available') {
                $query->whereNotIn('id', $assignedUserIds)
                    ->whereHas('responderProfile', fn ($rq) => $rq->where('availability', 'available'));
            } elseif ($status === 'offline') {
                $query->whereNotIn('id', $assignedUserIds)
                    ->where(function ($sub) {
                        $sub->whereDoesntHave('responderProfile')
                            ->orWhereHas('responderProfile', fn ($rq) => $rq->where('availability', '!=', 'available'));
                    });
            }
        }

        // Role Filter
        if (! empty($role)) {
            $query->where(function ($q) use ($role) {
                if ($role === 'team_leader') {
                    $q->where('role', 'team_leader')
                        ->orWhereHas('responderProfile', fn ($rq) => $rq->where('position', 'like', '%leader%'));
                } else {
                    $q->where('role', $role)
                        ->orWhereHas('responderProfile', fn ($rq) => $rq->where('position', 'like', "%{$role}%"));
                }
            });
        }

        // Team Filter
        if (! empty($team)) {
            if (strtolower($team) === 'reliever') {
                $query->whereHas('responderProfile', fn ($rq) => $rq->where('is_reliever', true));
            } elseif (strtolower($team) === 'unassigned') {
                $query->whereHas('responderProfile', fn ($rq) => $rq->whereNull('team')->orWhere('team', ''));
            } else {
                $query->whereHas('responderProfile', function ($rq) use ($team) {
                    $rq->where('team', 'like', "%{$team}%")
                        ->where(function ($sub) {
                            $sub->where('is_reliever', false)
                                ->orWhereNull('is_reliever');
                        });
                });
            }
        }

        $users = $query->orderBy('id', 'asc')
            ->paginate(25)
            ->withQueryString();

        // 3. Attach active dispatch and reliever mission info to users
        $users->getCollection()->transform(function ($user) use ($activeDispatches) {
            $dispatch = $activeDispatches->first(function ($d) use ($user) {
                return $d->driver_id === $user->id 
                    || $d->emt_id === $user->id 
                    || $d->crew->contains('id', $user->id);
            });

            $rawRole = $user->responderProfile?->position ?? $user->role;
            $displayRole = match (strtolower(str_replace(['_', '-'], ' ', (string) $rawRole))) {
                'driver' => 'Driver',
                'emt' => 'EMT',
                default => ucfirst(str_replace('_', ' ', (string) $rawRole)),
            };

            $rawBadge = $user->responderProfile?->badge_number;
            $badgeNumber = ! empty($rawBadge) ? $rawBadge : sprintf('RSP-%04d', $user->id);

            $user->badge_id = $badgeNumber;
            $user->badge_number = $badgeNumber;

            $isReliever = (bool) $user->responderProfile?->is_reliever;
            $rawTeam = $user->responderProfile?->team;
            $permanentCrew = $isReliever 
                ? 'Reliever Pool' 
                : ($rawTeam ? (str_starts_with($rawTeam, 'Team ') ? $rawTeam : 'Team '.$rawTeam) : 'Unassigned');

            $temporaryMission = null;

            if ($dispatch) {
                $dispatchTeam = $dispatch->team
                    ? (str_starts_with($dispatch->team, 'Team ') ? $dispatch->team : 'Team '.$dispatch->team)
                    : null;

                $temporaryMission = [
                    'dispatch_id' => $dispatch->id,
                    'incident_id' => $dispatch->incident_id,
                    'incident_code' => $dispatch->incident?->location_code,
                    'incident_type' => $dispatch->incident?->incidentType?->name ?? 'Emergency Incident',
                    'dispatch_team' => $dispatchTeam,
                    'borrowed_to' => $dispatchTeam,
                    'dispatch_status' => $dispatch->dispatch_status,
                    'is_reliever' => $isReliever,
                    'permanent_crew' => $permanentCrew,
                ];
            }

            $isBorrowed = ($isReliever && (bool) $dispatch) || ($dispatch && $dispatchTeam && $permanentCrew !== 'Unassigned' && $dispatchTeam !== $permanentCrew);

            $user->is_reliever = $isReliever;
            $user->display_role = $displayRole;
            $user->permanent_crew = $permanentCrew;
            $user->temporary_mission = $temporaryMission;
            $user->is_borrowed = $isBorrowed;
            $user->current_status = $dispatch ? 'assigned' : (($user->responderProfile?->availability === 'available') ? 'available' : 'offline');
            $user->is_logged_in = (int) ($user->tokens_count ?? 0) > 0;
            $user->dispatches = $dispatch ? [$dispatch] : [];

            return $user;
        });

        // 4. Compute overall KPI metrics (Total, Assigned, Available, Offline)
        $allResponders = User::whereIn('role', ['responder', 'team_leader', 'emt', 'driver'])
            ->with(['responderProfile'])
            ->get();

        $summary = [
            'total' => $allResponders->count(),
            'assigned' => $allResponders->filter(fn ($u) => in_array($u->id, $assignedUserIds))->count(),
            'available' => $allResponders->filter(fn ($u) => ! in_array($u->id, $assignedUserIds) && ($u->responderProfile?->availability === 'available'))->count(),
            'offline' => $allResponders->filter(fn ($u) => ! in_array($u->id, $assignedUserIds) && ($u->responderProfile?->availability !== 'available'))->count(),
            'relievers' => $allResponders->filter(fn ($u) => (bool) $u->responderProfile?->is_reliever)->count(),
        ];

        // 5. JSON Response for TanStack Query / AJAX (do not intercept Inertia visits)
        if (! $request->header('X-Inertia') && ($request->wantsJson() || $request->expectsJson())) {
            return response()->json([
                'users' => $users->items(),
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ],
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'role' => $role,
                    'team' => $team,
                ],
                'summary' => $summary,
            ]);
        }

        return Inertia::render('dispatcher/Responders', [
            'users' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
                'role' => $role,
                'team' => $team,
            ],
            'summary' => $summary,
        ]);
    }

    public function updateStatus(Request $request, User $user)
    {
        $validated = $request->validate([
            'availability' => 'required|string|in:available,offline,off_duty',
        ]);

        // Check if user is currently assigned to an active mission
        $hasActiveDispatch = Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])
            ->where(function ($q) use ($user) {
                $q->where('driver_id', $user->id)
                    ->orWhere('emt_id', $user->id)
                    ->orWhereHas('crew', fn ($cq) => $cq->where('users.id', $user->id));
            })->first();

        if ($hasActiveDispatch) {
            return back()->withErrors([
                'availability' => "Cannot change status while {$user->first_name} is actively deployed on Incident #{$hasActiveDispatch->incident_id}. The mission must be completed first.",
            ]);
        }

        $newAvailability = $validated['availability'] === 'available' ? 'available' : 'offline';

        if ($user->responderProfile) {
            $user->responderProfile->update(['availability' => $newAvailability]);
            try {
                broadcast(new ResponderStatusUpdated($user));
            } catch (\Throwable $e) {}
        }

        $statusLabel = $newAvailability === 'available' ? 'Available' : 'Offline';

        return back()->with('success', "{$user->first_name} {$user->last_name} marked as {$statusLabel}.");
    }

    public function updateBadge(Request $request, User $user)
    {
        $validated = $request->validate([
            'badge_number' => 'required|string|max:50',
        ]);

        $badgeNumber = trim($validated['badge_number']);

        if ($user->responderProfile) {
            $user->responderProfile->update(['badge_number' => $badgeNumber]);
        } else {
            \App\Models\ResponderProfile::create([
                'user_id' => $user->id,
                'badge_number' => $badgeNumber,
                'position' => in_array($user->role, ['driver', 'emt']) ? $user->role : 'driver',
                'team' => 'Alpha',
                'availability' => 'available',
            ]);
        }

        return back()->with('success', "Badge ID updated to {$badgeNumber} for {$user->first_name} {$user->last_name}.");
    }
}
