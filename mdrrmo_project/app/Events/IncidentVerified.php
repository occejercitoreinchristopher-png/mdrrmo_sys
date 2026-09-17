<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncidentVerified implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public $incident;

    public function __construct($incident)
    {
        $this->incident = $incident;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('dispatcher')];

        if ($this->incident?->id) {
            $channels[] = new PrivateChannel('incident.'.$this->incident->id);
        }

        if ($this->incident?->resident_id) {
            $channels[] = new PrivateChannel('resident.'.$this->incident->resident_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'IncidentVerified';
    }

    public function broadcastWith(): array
    {
        return [
            'incident' => $this->incident->loadMissing(['incidentType', 'resident', 'dispatches']),
        ];
    }
}
