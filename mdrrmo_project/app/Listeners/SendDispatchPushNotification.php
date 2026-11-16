<?php

namespace App\Listeners;

use App\Events\DispatchCreated;
use App\Models\Dispatch;
use App\Models\User;
use App\Services\FirebaseMessagingService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendDispatchPushNotification
{
    protected FirebaseMessagingService $fcmService;

    /**
     * Create the event listener.
     */
    public function __construct(FirebaseMessagingService $fcmService)
    {
        $this->fcmService = $fcmService;
    }

    /**
     * Handle the event.
     */
    public function handle(DispatchCreated $event): void
    {
        $dispatch = $event->dispatch;

        // Collect assigned user IDs from dispatch_crews, driver, and emt
        $userIds = array_values(array_unique(array_filter(array_merge(
            $dispatch->crew()->pluck('users.id')->toArray(),
            [$dispatch->driver_id, $dispatch->emt_id]
        ))));

        if (empty($userIds)) {
            return;
        }

        // Check if this incident had a previous dispatch (reassignment)
        $isReassignment = Dispatch::where('incident_id', $dispatch->incident_id)
            ->where('id', '!=', $dispatch->id)
            ->exists();

        $eventType = $isReassignment ? 'dispatch_reassigned' : 'dispatch_assigned';
        $content = $this->fcmService->buildNotificationContent($eventType, $dispatch);

        // 1. Direct Native Firebase Cloud Messaging (FCM HTTP v1) + system_notifications recording
        try {
            $this->fcmService->sendDispatchNotification($dispatch, $userIds, $eventType);
        } catch (\Throwable $e) {
            Log::error('FCM Dispatch Notification failed: ' . $e->getMessage());
        }

        // 2. Legacy Expo Push Proxy Fallback (if any user still has legacy expo_push_token)
        $usersWithExpoToken = User::whereIn('id', $userIds)
            ->whereNotNull('expo_push_token')
            ->get();

        if ($usersWithExpoToken->isNotEmpty()) {
            $incident = $dispatch->incident;
            $typeName = $incident?->incidentType?->name ?? 'Emergency Incident';
            $rawBarangay = $incident?->barangay ?? $incident?->resident?->residentProfile?->barangay?->barangay_name ?? 'Opol';
            $cleanBarangay = trim(preg_replace('/^barangay\s+/i', '', trim($rawBarangay)));
            $cleanLocation = $incident?->clean_place_of_incident ?? $incident?->place_of_incident ?? "Barangay {$cleanBarangay}, Opol";

            $messages = [];
            foreach ($usersWithExpoToken as $user) {
                $messages[] = [
                    'to' => $user->expo_push_token,
                    'sound' => 'alarm.mp3',
                    'title' => $content['title'],
                    'body' => $content['message'],
                    'data' => [
                        'event_type' => $eventType,
                        'type' => $eventType,
                        'title' => $content['title'],
                        'message' => $content['message'],
                        'dispatch_id' => (string) $dispatch->id,
                        'incident_id' => (string) $dispatch->incident_id,
                        'incident_type' => $typeName,
                        'barangay' => $cleanBarangay,
                        'location' => $cleanLocation,
                        'status' => (string) $dispatch->dispatch_status,
                    ],
                    'priority' => 'high',
                    'channelId' => 'emergency_dispatch',
                    'ttl' => 300,
                ];
            }

            try {
                Http::timeout(5)->withHeaders([
                    'Accept' => 'application/json',
                    'Accept-Encoding' => 'gzip, deflate',
                    'Content-Type' => 'application/json',
                ])->post('https://exp.host/--/api/v2/push/send', $messages);
            } catch (\Throwable $e) {
                Log::warning('Expo Push Proxy Fallback error: ' . $e->getMessage());
            }
        }
    }
}
