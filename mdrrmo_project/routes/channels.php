<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('dispatcher', function ($user) {
    return in_array($user->role, ['admin', 'dispatcher']);
});

Broadcast::channel('responder.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('responders', function ($user) {
    return in_array($user->role, ['responder', 'admin', 'dispatcher']);
});

Broadcast::channel('resident.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('incident.{id}', function ($user, $id) {
    if (in_array($user->role, ['admin', 'dispatcher'])) {
        return true;
    }

    $incident = \App\Models\Incident::find($id);
    if (! $incident) {
        return false;
    }

    if ((int) $incident->resident_id === (int) $user->id) {
        return true;
    }

    return $incident->dispatches()->where(function ($dq) use ($user) {
        $dq->where('driver_id', $user->id)
            ->orWhere('emt_id', $user->id)
            ->orWhereHas('crew', function ($cq) use ($user) {
                $cq->where('users.id', $user->id);
            });
    })->exists();
});

Broadcast::channel('dispatch.{id}', function ($user, $id) {
    if (in_array($user->role, ['admin', 'dispatcher'])) {
        return true;
    }

    $dispatch = \App\Models\Dispatch::with('incident')->find($id);
    if (! $dispatch) {
        return false;
    }

    if ($dispatch->incident && (int) $dispatch->incident->resident_id === (int) $user->id) {
        return true;
    }

    if ((int) $dispatch->driver_id === (int) $user->id || (int) $dispatch->emt_id === (int) $user->id) {
        return true;
    }

    return $dispatch->crew()->where('users.id', $user->id)->exists();
});

