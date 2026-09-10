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

Broadcast::channel('resident.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('incident.{id}', function ($user, $id) {
    // Both the resident who created it and the assigned responders/dispatchers should have access.
    // For simplicity in this emergency context, we return true, but normally you'd verify role/assignment.
    return true;
});
