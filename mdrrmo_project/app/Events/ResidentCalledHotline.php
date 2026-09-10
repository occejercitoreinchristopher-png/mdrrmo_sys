<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ResidentCalledHotline implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $resident;

    public $latitude;

    public $longitude;

    /**
     * Create a new event instance.
     */
    public function __construct(User $resident, $latitude, $longitude)
    {
        $this->resident = $resident;
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
            new PrivateChannel('dispatcher'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'resident_id' => $this->resident->id,
            'resident_name' => $this->resident->first_name.' '.$this->resident->last_name,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'timestamp' => now()->toIso8601String(),
            'message' => 'Resident is calling the MDRRMO hotline!',
        ];
    }
}
