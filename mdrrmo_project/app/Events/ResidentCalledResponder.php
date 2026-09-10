<?php

namespace App\Events;

use App\Models\Incident;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ResidentCalledResponder implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $incident;

    public $latitude;

    public $longitude;

    /**
     * Create a new event instance.
     */
    public function __construct(Incident $incident, $latitude, $longitude)
    {
        $this->incident = $incident;
        $this->latitude = $latitude;
        $this->longitude = $longitude;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('incident.'.$this->incident->id),
            new PrivateChannel('dispatcher'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'incident_id' => $this->incident->id,
            'resident_name' => $this->incident->resident ? ($this->incident->resident->first_name.' '.$this->incident->resident->last_name) : 'Resident',
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'timestamp' => now()->toIso8601String(),
            'message' => 'Resident is calling and updated their location.',
        ];
    }
}
