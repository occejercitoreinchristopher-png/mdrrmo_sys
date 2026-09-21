<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DispatchStatusUpdated implements ShouldBroadcastNow
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
            $this->dispatch->team_leader_id,
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
        return 'DispatchStatusUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'dispatch' => $this->dispatch->loadMissing(['incident', 'ambulance']),
        ];
    }
}
