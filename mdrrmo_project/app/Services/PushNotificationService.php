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
     * Notify resident when incident is rejected by Dispatcher or Responders.
     */
    public static function notifyIncidentRejected(Incident $incident): void
    {
        $resident = $incident->resident;
        $category = $incident->rejection_category ?? 'other';
        $reason = $incident->rejection_reason ? " Note: {$incident->rejection_reason}" : '';

        $title = match ($category) {
            'duplicate' => '📋 Duplicate Incident Report',
            'no_patient_found' => 'ℹ️ Incident Checked: No Patient on Scene',
            'out_of_jurisdiction' => '🗺️ Incident Outside Opol Coverage',
            'false_alarm' => '⚠️ Report Closed as False Alarm',
            'prank' => '🚨 Report Flagged as Prank Call',
            'test_drill' => '🧪 System Test / Drill Completed',
            default => '❌ Incident Report Not Approved',
        };

        $body = match ($category) {
            'duplicate' => "Your emergency report was merged as a duplicate of an existing active incident. Responders are already actively handling this location. No violation was recorded on your account.{$reason}",
            'no_patient_found' => "Responders arrived on scene and surveyed the area. No patients were found, or the incident was minor and parties already left. No penalty was recorded on your account.{$reason}",
            'out_of_jurisdiction' => "The reported location is outside the coverage area of MDRRMO Opol. Please contact your local municipal hotline.{$reason}",
            'false_alarm' => "Your emergency report was verified and recorded as a false alarm or accidental call. No violation was recorded on your account.{$reason}",
            'prank' => "Your emergency report was investigated and flagged as an unfounded or intentional prank call. Intentional prank calls disrupt emergency response and may lead to temporary suspension.{$reason}",
            'test_drill' => "Your emergency report was logged as part of a scheduled drill or system test.{$reason}",
            default => "Your emergency report was reviewed by the Dispatcher and was not approved for dispatch.{$reason}",
        };

        // 1. Persist notification in system_notifications database table for resident
        if ($resident) {
            try {
                \App\Models\SystemNotification::create([
                    'user_id' => $resident->id,
                    'incident_id' => $incident->id,
                    'title' => $title,
                    'message' => $body,
                    'type' => 'incident_rejected',
                    'status' => 'unread',
                    'data' => [
                        'category' => $category,
                        'reason' => $incident->rejection_reason,
                        'incident_id' => $incident->id,
                    ],
                ]);
            } catch (\Throwable $e) {
                Log::warning('Failed to persist SystemNotification for rejected incident: ' . $e->getMessage());
            }
        }

        // 2. Send Expo push notification
        self::sendToUser(
            $resident,
            $title,
            $body,
            [
                'type' => 'incident_rejected',
                'incident_id' => $incident->id,
                'category' => $category,
                'reason' => $incident->rejection_reason,
            ]
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
