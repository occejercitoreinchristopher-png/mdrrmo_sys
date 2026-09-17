<?php

namespace App\Services;

use App\Models\Dispatch;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    /**
     * Send Expo push notification to a single user.
     */
    public static function sendToUser(?User $user, string $title, string $body, array $data = []): void
    {
        if (! $user || empty($user->expo_push_token)) {
            return;
        }

        self::send([
            'to' => $user->expo_push_token,
            'sound' => 'default',
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'priority' => 'high',
        ]);
    }

    /**
     * Send push notification to multiple users.
     */
    public static function sendToUsers($users, string $title, string $body, array $data = []): void
    {
        $messages = [];
        foreach ($users as $user) {
            if (! empty($user->expo_push_token)) {
                $messages[] = [
                    'to' => $user->expo_push_token,
                    'sound' => 'default',
                    'title' => $title,
                    'body' => $body,
                    'data' => $data,
                    'priority' => 'high',
                ];
            }
        }

        if (! empty($messages)) {
            self::sendBatch($messages);
        }
    }

    /**
     * Notify resident when incident is verified by Dispatcher.
     */
    public static function notifyIncidentVerified(Incident $incident): void
    {
        $resident = $incident->resident;
        self::sendToUser(
            $resident,
            '🚨 Incident Approved',
            'Your emergency report has been verified by the Dispatcher. A responder is being assigned to your incident.',
            ['type' => 'incident_verified', 'incident_id' => $incident->id]
        );
    }

    /**
     * Notify resident when incident is rejected by Dispatcher.
     */
    public static function notifyIncidentRejected(Incident $incident): void
    {
        $resident = $incident->resident;
        $reason = $incident->rejection_reason ? " Reason: {$incident->rejection_reason}" : '';
        self::sendToUser(
            $resident,
            '❌ Incident Report Not Approved',
            "Your emergency report was reviewed by the Dispatcher and was not approved for dispatch.{$reason}",
            ['type' => 'incident_rejected', 'incident_id' => $incident->id, 'reason' => $incident->rejection_reason]
        );
    }

    /**
     * Notify resident when responder/ambulance is assigned.
     */
    public static function notifyResponderAssigned(Dispatch $dispatch): void
    {
        $resident = $dispatch->incident?->resident;
        self::sendToUser(
            $resident,
            '🚑 Responder Assigned',
            'A responder has been assigned to your emergency report.',
            ['type' => 'responder_assigned', 'dispatch_id' => $dispatch->id, 'incident_id' => $dispatch->incident_id]
        );
    }

    /**
     * Notify resident when responder starts traveling (en route).
     */
    public static function notifyResponderEnRoute(Dispatch $dispatch): void
    {
        $resident = $dispatch->incident?->resident;
        self::sendToUser(
            $resident,
            '🚑 Responder is on the way',
            'Your assigned responder is currently traveling to your location.',
            ['type' => 'responder_en_route', 'dispatch_id' => $dispatch->id, 'incident_id' => $dispatch->incident_id]
        );
    }

    /**
     * Low-level send single payload to Expo API.
     */
    private static function send(array $payload): void
    {
        try {
            Http::withHeaders([
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate',
                'Content-Type' => 'application/json',
            ])->timeout(5)->post('https://exp.host/--/api/v2/push/send', $payload);
        } catch (\Throwable $e) {
            Log::warning('Failed to send Expo push notification: '.$e->getMessage());
        }
    }

    /**
     * Low-level send batch payload to Expo API.
     */
    private static function sendBatch(array $messages): void
    {
        try {
            Http::withHeaders([
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate',
                'Content-Type' => 'application/json',
            ])->timeout(5)->post('https://exp.host/--/api/v2/push/send', $messages);
        } catch (\Throwable $e) {
            Log::warning('Failed to send batch Expo push notifications: '.$e->getMessage());
        }
    }
}
