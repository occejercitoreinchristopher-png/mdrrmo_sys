<?php

namespace App\Listeners;

use App\Events\DispatchCreated;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class SendDispatchPushNotification
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(DispatchCreated $event): void
    {
        $dispatch = $event->dispatch;

        // Collect assigned user IDs from dispatch_crews, driver, and emt
        $userIds = array_unique(array_filter(array_merge(
            $dispatch->crew()->pluck('users.id')->toArray(),
            [$dispatch->driver_id, $dispatch->emt_id]
        )));

        if (empty($userIds)) {
            return;
        }

        // Get users with push tokens
        $users = User::whereIn('id', $userIds)
            ->whereNotNull('expo_push_token')
            ->get();

        if ($users->isEmpty()) {
            return;
        }

        $messages = [];
        foreach ($users as $user) {
            $messages[] = [
                'to' => $user->expo_push_token,
                'sound' => 'default',
                'title' => 'New Mission Assigned!',
                'body' => 'You have been assigned to a new emergency mission. Open the app to view details.',
                'data' => [
                    'dispatch_id' => $dispatch->id,
                    'type' => 'new_mission',
                ],
                'priority' => 'high',
            ];
        }

        // Also notify the resident that a responder has been assigned
        $resident = $dispatch->incident?->resident;
        if ($resident && ! empty($resident->expo_push_token)) {
            $messages[] = [
                'to' => $resident->expo_push_token,
                'sound' => 'default',
                'title' => '🚑 Responder Assigned',
                'body' => 'A responder has been assigned to your emergency report.',
                'data' => [
                    'dispatch_id' => $dispatch->id,
                    'incident_id' => $dispatch->incident_id,
                    'type' => 'responder_assigned',
                ],
                'priority' => 'high',
            ];
        }

        try {
            Http::withHeaders([
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate',
                'Content-Type' => 'application/json',
            ])->post('https://exp.host/--/api/v2/push/send', $messages);
        } catch (\Exception $e) {
            \Log::error('Failed to send Expo push notification: '.$e->getMessage());
        }
    }
}
