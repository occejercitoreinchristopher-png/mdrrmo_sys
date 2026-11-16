<?php

namespace App\Services;

use App\Models\FcmDeviceToken;
use App\Models\SystemNotification;
use App\Models\User;
use App\Models\Dispatch;
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

        // Clean string values for FCM data payload (FCM HTTP v1 requires string values)
        $cleanData = [];
        foreach ($data as $key => $val) {
            if (is_array($val) || is_object($val)) {
                $cleanData[(string)$key] = json_encode($val);
            } else {
                $cleanData[(string)$key] = (string)$val;
            }
        }

        // Add standard channel ID
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
     * Send emergency dispatch push notifications to assigned crew members and log to system_notifications
     */
    public function sendDispatchNotification(Dispatch $dispatch, array $targetUserIds = []): array
    {
        $incident = $dispatch->incident;
        $typeName = $incident?->incidentType?->name ?? 'Emergency Incident';
        $locationClean = $incident?->clean_place_of_incident ?? $incident?->place_of_incident ?? 'Opol, Misamis Oriental';
        $barangay = $incident?->barangay ?? $incident?->resident?->residentProfile?->barangay?->barangay_name ?? 'Opol';

        $title = '🚨 EMERGENCY DISPATCH ASSIGNED';
        $body = "New Dispatch: {$typeName} at {$locationClean}. Tap to respond.";

        $dataPayload = [
            'type' => 'dispatch_assigned',
            'dispatch_id' => (string) $dispatch->id,
            'incident_id' => (string) $dispatch->incident_id,
            'incident_type' => (string) $typeName,
            'location' => (string) $locationClean,
            'barangay' => (string) $barangay,
            'team' => (string) ($dispatch->team ?? ''),
            'timestamp' => now()->toIso8601String(),
        ];

        // Determine all assigned user IDs if not explicitly passed
        if (empty($targetUserIds)) {
            $crewIds = $dispatch->crew()->pluck('users.id')->toArray();
            $targetUserIds = array_values(array_unique(array_filter(array_merge(
                $crewIds,
                [$dispatch->driver_id, $dispatch->emt_id]
            ))));
        }

        $results = [];

        foreach ($targetUserIds as $userId) {
            // 1. Ensure system_notifications record exists (without duplicating)
            $existingNotif = SystemNotification::where('user_id', $userId)
                ->where('dispatch_id', $dispatch->id)
                ->where('type', 'dispatch_assigned')
                ->first();

            if (!$existingNotif) {
                $existingNotif = SystemNotification::create([
                    'user_id' => $userId,
                    'incident_id' => $dispatch->incident_id,
                    'dispatch_id' => $dispatch->id,
                    'title' => $title,
                    'message' => $body,
                    'type' => 'dispatch_assigned',
                    'status' => 'unread',
                    'data' => $dataPayload,
                ]);
            }

            // Include notification ID in the payload for client synchronization
            $payloadWithNotifId = array_merge($dataPayload, [
                'notification_id' => (string) $existingNotif->id,
            ]);

            // 2. Retrieve active FCM tokens for this user
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
                $res = $this->sendToToken($token, $title, $body, $payloadWithNotifId);
                if ($res['success']) {
                    $userDelivery['sent']++;
                }
            }

            $results[] = $userDelivery;
        }

        return $results;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
