<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DispatchAccepted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public $dispatch;

    public function __construct($dispatch)
    {
        $this->dispatch = $dispatch;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('dispatcher')];

        $assignedUserIds = $this->dispatch->crew()->pluck('users.id')->toArray();
        $fallbackUserIds = array_filter([
            $this->dispatch->driver_id,
            $this->dispatch->emt_id,
        ]);
        $allResponderIds = array_unique(array_merge($assignedUserIds, $fallbackUserIds));

        foreach ($allResponderIds as $userId) {
            $channels[] = new PrivateChannel('responder.'.$userId);
        }

        if ($this->dispatch->incident_id) {
            $channels[] = new PrivateChannel('incident.'.$this->dispatch->incident_id);
        }

        $residentId = $this->dispatch->incident?->resident_id;
        if ($residentId) {
            $channels[] = new PrivateChannel('resident.'.$residentId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'DispatchAccepted';
    }

    public function broadcastWith(): array
    {
        $dispatch = $this->dispatch->loadMissing(['incident', 'incident.incidentType', 'ambulance', 'driver', 'teamLeader', 'emt']);
        $inc = $dispatch->incident;
        $rawTypeName = $inc?->incidentType?->name ?? 'Emergency Incident';
        $rawBarangay = $inc?->barangay ?? $inc?->resident?->residentProfile?->barangay?->barangay_name ?? 'Opol';
        $cleanBarangay = trim(preg_replace('/^barangay\s+/i', '', trim($rawBarangay)));
        if (empty($cleanBarangay)) {
            $cleanBarangay = 'Opol';
        }

        return [
            'dispatch' => $dispatch,
            'dispatch_id' => $dispatch->id,
            'incident_id' => $dispatch->incident_id,
            'event_type' => 'dispatch_accepted',
            'type' => 'dispatch_accepted',
            'title' => 'Dispatch Accepted',
            'message' => 'Your emergency dispatch has been successfully accepted.',
            'incident_type' => $rawTypeName,
            'barangay' => $cleanBarangay,
            'status' => 'accepted',
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
