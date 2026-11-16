<?php

namespace App\Services;

use App\Models\FcmDeviceToken;
use App\Models\SystemNotification;
use App\Models\User;
use App\Models\Dispatch;
use App\Models\Incident;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebaseMessagingService
{
    protected ?string $projectId;
    protected ?string $clientEmail;
    protected ?string $privateKey;

    public function __construct()
    {
        $this->projectId = config('services.firebase.project_id', env('FIREBASE_PROJECT_ID'));
        $this->clientEmail = config('services.firebase.client_email', env('FIREBASE_CLIENT_EMAIL'));
        $this->privateKey = config('services.firebase.private_key', env('FIREBASE_PRIVATE_KEY'));

        // If credentials file is provided instead
        $credentialsPath = config('services.firebase.credentials_path', env('FIREBASE_CREDENTIALS'));
        if ((!$this->clientEmail || !$this->privateKey) && $credentialsPath) {
            $fullPath = base_path($credentialsPath);
            if (file_exists($fullPath)) {
                $creds = json_decode(file_get_contents($fullPath), true);
                if (is_array($creds)) {
                    $this->projectId = $this->projectId ?: ($creds['project_id'] ?? null);
                    $this->clientEmail = $this->clientEmail ?: ($creds['client_email'] ?? null);
                    $this->privateKey = $this->privateKey ?: ($creds['private_key'] ?? null);
                }
            }
        }

        // Clean up formatted newlines in private key
        if ($this->privateKey) {
            $this->privateKey = str_replace('\n', "\n", $this->privateKey);
        }
    }

    /**
     * Check if FCM service is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->projectId) && !empty($this->clientEmail) && !empty($this->privateKey);
    }

    /**
     * Get Google OAuth2 Access Token for FCM HTTP v1
     */
    public function getAccessToken(): ?string
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            return Cache::remember('fcm_google_access_token', 3300, function () {
                return $this->generateAccessToken();
            });
        } catch (\Throwable $e) {
            return $this->generateAccessToken();
        }
    }

    /**
     * Generate Google OAuth2 Access Token using Service Account JWT
     */
    public function generateAccessToken(): ?string
    {
        try {
            $now = time();
            $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
            $claim = json_encode([
                'iss' => $this->clientEmail,
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud' => 'https://oauth2.googleapis.com/token',
                'exp' => $now + 3600,
                'iat' => $now,
            ]);

            $base64Header = $this->base64UrlEncode($header);
            $base64Claim = $this->base64UrlEncode($claim);
            $dataToSign = $base64Header . '.' . $base64Claim;

            $signature = '';
            $success = openssl_sign($dataToSign, $signature, $this->privateKey, OPENSSL_ALGO_SHA256);
            if (!$success) {
                Log::error('FCM: Failed to sign Google Service Account JWT.');
                return null;
            }

            $jwt = $dataToSign . '.' . $this->base64UrlEncode($signature);

            $response = Http::asForm()->timeout(10)->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if ($response->successful()) {
                return $response->json('access_token');
            }

            Log::error('FCM: Google OAuth2 token error: ' . $response->body());
            return null;
        } catch (\Throwable $e) {
            Log::error('FCM: Exception acquiring Google OAuth2 token: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Build event-specific notification title and message based on the actual backend event data
     */
    public function buildNotificationContent(string $eventType, ?Dispatch $dispatch = null, ?Incident $incident = null): array
    {
        $inc = $incident ?? $dispatch?->incident;
        $rawTypeName = $inc?->incidentType?->name ?? 'Emergency Incident';
        $rawBarangay = $inc?->barangay ?? $inc?->resident?->residentProfile?->barangay?->barangay_name ?? 'Opol';
        
        // Format clean barangay name without duplicate "Barangay" prefixes
        $cleanBarangay = trim(preg_replace('/^barangay\s+/i', '', trim($rawBarangay)));
        if (empty($cleanBarangay)) {
            $cleanBarangay = 'Opol';
        }

        switch ($eventType) {
            case 'dispatch_assigned':
                return [
                    'title' => 'Emergency Dispatch Assigned',
                    'message' => "You have been assigned to respond to a {$rawTypeName} in Barangay {$cleanBarangay}, Opol.",
                    'type' => 'dispatch_assigned',
                ];

            case 'dispatch_received':
                return [
                    'title' => 'New Emergency Dispatch',
                    'message' => 'A new emergency dispatch is waiting for your response. Please review the incident details.',
                    'type' => 'dispatch_received',
                ];

            case 'dispatch_reassigned':
                return [
                    'title' => 'Dispatch Assignment Updated',
                    'message' => 'Your dispatch assignment has been updated. Please review the latest incident information.',
                    'type' => 'dispatch_reassigned',
                ];

            case 'dispatch_cancelled':
            case 'incident_cancelled':
                return [
                    'title' => 'Incident Cancelled',
                    'message' => "The {$rawTypeName} incident assigned to you in Barangay {$cleanBarangay} has been cancelled.",
                    'type' => 'dispatch_cancelled',
                ];

            case 'incident_updated':
                return [
                    'title' => 'Incident Information Updated',
                    'message' => 'New information is available for your assigned incident. Please review the updated details.',
                    'type' => 'incident_updated',
                ];

            case 'dispatch_accepted':
                return [
                    'title' => 'Dispatch Accepted',
                    'message' => 'Your emergency dispatch has been successfully accepted.',
                    'type' => 'dispatch_accepted',
                ];

            default:
                return [
                    'title' => 'Emergency Dispatch Assigned',
                    'message' => "You have been assigned to respond to a {$rawTypeName} in Barangay {$cleanBarangay}, Opol.",
                    'type' => 'dispatch_assigned',
                ];
        }
    }

    /**
     * Send push notification to a specific FCM device token
     */
    public function sendToToken(string $token, string $title, string $body, array $data = []): array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken || !$this->projectId) {
            return [
                'success' => false,
                'error' => 'Firebase credentials not configured',
            ];
        }

        // Clean string values for FCM data payload (FCM HTTP v1 requires string key/values)
        $cleanData = [];
        foreach ($data as $key => $val) {
            if (is_array($val) || is_object($val)) {
                $cleanData[(string)$key] = json_encode($val);
            } else {
                $cleanData[(string)$key] = (string)$val;
            }
        }

        $cleanData['channelId'] = 'emergency_dispatch';

        $payload = [
            'message' => [
                'token' => $token,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                ],
                'data' => $cleanData,
                'android' => [
                    'priority' => 'high',
                    'notification' => [
                        'channel_id' => 'emergency_dispatch',
                        'sound' => 'alarm',
                        'default_vibrate_timings' => true,
                        'notification_priority' => 'PRIORITY_MAX',
                        'visibility' => 'PUBLIC',
                        'click_action' => 'OPEN_DISPATCH',
                    ],
                ],
            ],
        ];

        try {
            $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";
            $response = Http::withToken($accessToken)
                ->timeout(12)
                ->post($url, $payload);

            if ($response->successful()) {
                FcmDeviceToken::where('token', $token)->update(['last_used_at' => now()]);
                return ['success' => true, 'response' => $response->json()];
            }

            $errorBody = $response->json();
            $errorCode = $errorBody['error']['details'][0]['errorCode'] ?? $errorBody['error']['status'] ?? 'UNKNOWN';

            // Automatically deactivate stale or unregistered tokens
            if (in_array($errorCode, ['UNREGISTERED', 'NOT_FOUND', 'INVALID_ARGUMENT'])) {
                Log::warning("FCM: Deactivating invalid/expired token {$token} (Code: {$errorCode})");
                FcmDeviceToken::where('token', $token)->update(['is_active' => false]);
            }

            Log::error('FCM: Send failed: ' . $response->body());
            return ['success' => false, 'error' => $response->body()];
        } catch (\Throwable $e) {
            Log::error('FCM: Exception sending push notification: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Send accurate event-specific notifications to targeted responders and synchronize system_notifications database records
     */
    public function sendNotificationToUsers(
        array $userIds,
        string $eventType,
        ?Dispatch $dispatch = null,
        ?Incident $incident = null,
        array $extraData = []
    ): array {
        $content = $this->buildNotificationContent($eventType, $dispatch, $incident);
        $title = $content['title'];
        $message = $content['message'];
        $type = $content['type'];

        $inc = $incident ?? $dispatch?->incident;
        $rawTypeName = $inc?->incidentType?->name ?? 'Emergency Incident';
        $rawBarangay = $inc?->barangay ?? $inc?->resident?->residentProfile?->barangay?->barangay_name ?? 'Opol';
        $cleanBarangay = trim(preg_replace('/^barangay\s+/i', '', trim($rawBarangay)));
        if (empty($cleanBarangay)) {
            $cleanBarangay = 'Opol';
        }

        $cleanLocation = $inc?->clean_place_of_incident 
            ?? $inc?->place_of_incident 
            ?? $inc?->incident_address 
            ?? "Barangay {$cleanBarangay}, Opol";

        $dispatchId = $dispatch?->id ? (string) $dispatch->id : '';
        $incidentId = $inc?->id ? (string) $inc->id : ($dispatch?->incident_id ? (string) $dispatch->incident_id : '');
        $status = $dispatch?->dispatch_status ?? ($inc?->incident_status ?? 'assigned');
        $dispatchTime = $dispatch?->assigned_at ? $dispatch->assigned_at->toIso8601String() : now()->toIso8601String();

        $targetUserIds = array_values(array_unique(array_filter($userIds)));
        $results = [];

        foreach ($targetUserIds as $userId) {
            // Prevent duplicate records for same user, event type, and dispatch/incident within 5 seconds
            $existingNotif = SystemNotification::where('user_id', $userId)
                ->where('type', $type)
                ->when($dispatchId, fn($q) => $q->where('dispatch_id', $dispatchId))
                ->when(!$dispatchId && $incidentId, fn($q) => $q->where('incident_id', $incidentId))
                ->where('created_at', '>=', now()->subSeconds(5))
                ->first();

            $baseMetadata = array_merge([
                'notification_id' => '',
                'event_type' => $type,
                'title' => $title,
                'message' => $message,
                'incident_id' => $incidentId,
                'dispatch_id' => $dispatchId,
                'recipient_user_id' => (string) $userId,
                'incident_type' => $rawTypeName,
                'barangay' => $cleanBarangay,
                'location' => $cleanLocation,
                'dispatch_time' => $dispatchTime,
                'status' => $status,
                'acknowledgment_status' => $dispatch?->acknowledgment_status ?? 'pending',
                'created_at' => now()->toIso8601String(),
            ], $extraData);

            if (!$existingNotif) {
                $existingNotif = SystemNotification::create([
                    'user_id' => $userId,
                    'incident_id' => $incidentId ?: null,
                    'dispatch_id' => $dispatchId ?: null,
                    'title' => $title,
                    'message' => $message,
                    'type' => $type,
                    'status' => 'unread',
                    'data' => $baseMetadata,
                ]);

                // Update notification_id in data column
                $baseMetadata['notification_id'] = (string) $existingNotif->id;
                $existingNotif->update(['data' => $baseMetadata]);
            } else {
                $baseMetadata['notification_id'] = (string) $existingNotif->id;
            }

            // Retrieve active FCM registration tokens for this responder
            $tokens = FcmDeviceToken::where('user_id', $userId)
                ->where('is_active', true)
                ->pluck('token')
                ->toArray();

            $userDelivery = [
                'user_id' => $userId,
                'tokens_count' => count($tokens),
                'sent' => 0,
            ];

            foreach ($tokens as $token) {
                $res = $this->sendToToken($token, $title, $message, $baseMetadata);
                if (!empty($res['success'])) {
                    $userDelivery['sent']++;
                }
            }

            $results[] = $userDelivery;
        }

        return $results;
    }

    /**
     * Send emergency dispatch push notifications when a responder is assigned or reassigned
     */
    public function sendDispatchNotification(Dispatch $dispatch, array $targetUserIds = [], ?string $overrideEventType = null): array
    {
        if (empty($targetUserIds)) {
            $crewIds = $dispatch->crew()->pluck('users.id')->toArray();
            $targetUserIds = array_values(array_unique(array_filter(array_merge(
                $crewIds,
                [$dispatch->driver_id, $dispatch->emt_id]
            ))));
        }

        // Determine if this is an initial assignment or a reassignment
        $eventType = $overrideEventType;
        if (!$eventType) {
            $isReassignment = Dispatch::where('incident_id', $dispatch->incident_id)
                ->where('id', '!=', $dispatch->id)
                ->exists();
            $eventType = $isReassignment ? 'dispatch_reassigned' : 'dispatch_assigned';
        }

        return $this->sendNotificationToUsers($targetUserIds, $eventType, $dispatch);
    }

    /**
     * Send cancellation push notification to only the responders who were assigned to the cancelled dispatch
     */
    public function sendCancellationNotification(Dispatch $dispatch, array $targetUserIds = []): array
    {
        if (empty($targetUserIds)) {
            $crewIds = $dispatch->crew()->pluck('users.id')->toArray();
            $targetUserIds = array_values(array_unique(array_filter(array_merge(
                $crewIds,
                [$dispatch->driver_id, $dispatch->emt_id]
            ))));
        }

        return $this->sendNotificationToUsers($targetUserIds, 'dispatch_cancelled', $dispatch);
    }

    /**
     * Send dispatch accepted notification confirmation to the responder who accepted
     */
    public function sendAcceptedNotification(Dispatch $dispatch, User $user): array
    {
        return $this->sendNotificationToUsers([$user->id], 'dispatch_accepted', $dispatch);
    }

    /**
     * Send incident updated notification to responders assigned to active dispatches for this incident
     */
    public function sendIncidentUpdatedNotification(Incident $incident): array
    {
        $activeDispatches = $incident->dispatches()
            ->whereNotIn('dispatch_status', ['completed', 'cancelled'])
            ->get();

        $allUserIds = [];
        foreach ($activeDispatches as $dispatch) {
            $crewIds = $dispatch->crew()->pluck('users.id')->toArray();
            $allUserIds = array_merge($allUserIds, $crewIds, [$dispatch->driver_id, $dispatch->emt_id]);
        }

        $allUserIds = array_values(array_unique(array_filter($allUserIds)));
        if (empty($allUserIds)) {
            return [];
        }

        return $this->sendNotificationToUsers($allUserIds, 'incident_updated', null, $incident);
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
