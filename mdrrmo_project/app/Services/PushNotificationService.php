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
     * Pass channelId='mission_alarm' and sound='alarm.mp3' for emergency alerts.
     */
    public static function sendToUser(?User $user, string $title, string $body, array $data = [], ?string $channelId = null, string $sound = 'default'): void
    {
        if (! $user || empty($user->expo_push_token)) {
            return;
        }

        $payload = [
            'to' => $user->expo_push_token,
            'sound' => $sound,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'priority' => 'high',
        ];

        if ($channelId) {
            $payload['channelId'] = $channelId;
        }

        self::send($payload);
    }

    /**
     * Send push notification to multiple users.
     * Pass channelId='mission_alarm' and sound='alarm.mp3' for emergency alerts.
     */
    public static function sendToUsers($users, string $title, string $body, array $data = [], ?string $channelId = null, string $sound = 'default'): void
    {
        $messages = [];
        foreach ($users as $user) {
            if (! empty($user->expo_push_token)) {
                $message = [
                    'to' => $user->expo_push_token,
                    'sound' => $sound,
                    'title' => $title,
                    'body' => $body,
                    'data' => $data,
                    'priority' => 'high',
                ];

                if ($channelId) {
                    $message['channelId'] = $channelId;
                }

                $messages[] = $message;
            }
        }

        if (! empty($messages)) {
            self::sendBatch($messages);
        }
    }

    /**
     * Notify available responders when an incident is verified and ready for dispatch.
     * Uses mission_alarm channel so Android plays alarm.mp3 even in background.
     */
    public static function notifyRespondersNewVerifiedIncident(Incident $incident): void
    {
        $responders = User::where('role', 'responder')
            ->whereNotNull('expo_push_token')
            ->where('expo_push_token', '!=', '')
            ->get();

        if ($responders->isEmpty()) {
            return;
        }

        $incidentType = $incident->incidentType?->name ?? 'Emergency';
        $barangay = $incident->resident?->residentProfile?->barangay?->barangay_name ?? null;
        $location = $incident->place_of_incident ?: $incident->incident_address ?: ($barangay ? "Barangay {$barangay}" : 'Opol, Misamis Oriental');
        $verifiedAt = $incident->verified_at ? $incident->verified_at->toIso8601String() : now()->toIso8601String();

        $title = '🚨 New Verified Incident';
        $body = "A new {$incidentType} incident has been verified and is ready for dispatch.";

        $data = [
            'type' => 'verified_incident_available',
            'incident_id' => $incident->id,
            'incident_type' => $incidentType,
            'priority' => $incident->priority ?? 'Moderate',
            'location' => $location,
            'barangay' => $barangay,
            'verified_at' => $verifiedAt,
            'report_source' => $incident->report_source,
        ];

        // Use mission_alarm_v2 channel with alarm.mp3 so it rings even when app is backgrounded
        self::sendToUsers($responders, $title, $body, $data, 'mission_alarm_v2', 'alarm.mp3');
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
