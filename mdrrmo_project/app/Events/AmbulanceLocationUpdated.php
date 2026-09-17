<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AmbulanceLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ambulance;
    public $dispatch_id;
    public $responder_id;
    public $responder_name;
    public $latitude;
    public $longitude;
    public $heading;
    public $accuracy;
    public $timestamp;
    public $dispatch_status;

    /**
     * Create a new event instance.
     */
    public function __construct(
        $ambulance,
        $dispatch_id = null,
        $responder_id = null,
        $responder_name = null,
        $latitude = null,
        $longitude = null,
        $heading = null,
        $accuracy = null,
        $timestamp = null,
        $dispatch_status = null
    ) {
        if (is_array($ambulance)) {
            $this->ambulance = $ambulance['ambulance'] ?? $ambulance;
            $this->dispatch_id = $ambulance['dispatch_id'] ?? $dispatch_id;
            $this->responder_id = $ambulance['responder_id'] ?? $responder_id;
            $this->responder_name = $ambulance['responder_name'] ?? $responder_name;
            $this->latitude = $ambulance['latitude'] ?? $latitude;
            $this->longitude = $ambulance['longitude'] ?? $longitude;
            $this->heading = $ambulance['heading'] ?? $heading;
            $this->accuracy = $ambulance['accuracy'] ?? $accuracy;
            $this->timestamp = $ambulance['timestamp'] ?? $timestamp;
            $this->dispatch_status = $ambulance['dispatch_status'] ?? $dispatch_status;
        } else {
            $this->ambulance = $ambulance;
            $this->dispatch_id = $dispatch_id;
            $this->responder_id = $responder_id;
            $this->responder_name = $responder_name;
            $this->latitude = $latitude;
            $this->longitude = $longitude;
            $this->heading = $heading;
            $this->accuracy = $accuracy;
            $this->timestamp = $timestamp;
            $this->dispatch_status = $dispatch_status;
        }
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('dispatcher')];

        if ($this->dispatch_id) {
            $channels[] = new PrivateChannel('dispatch.'.$this->dispatch_id);

            try {
                $dispatch = \App\Models\Dispatch::with('incident')->find($this->dispatch_id);
                if ($dispatch) {
                    if ($dispatch->incident_id) {
                        $channels[] = new PrivateChannel('incident.'.$dispatch->incident_id);
                    }
                    $residentId = $dispatch->incident?->resident_id;
                    if ($residentId) {
                        $channels[] = new PrivateChannel('resident.'.$residentId);
                    }
                }
            } catch (\Throwable $e) {
                // Fail silently on channel resolution
            }
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'AmbulanceLocationUpdated';
    }

    /**
     * Data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'ambulance' => $this->ambulance,
            'dispatch_id' => $this->dispatch_id,
            'ambulance_id' => is_array($this->ambulance) ? ($this->ambulance['id'] ?? null) : ($this->ambulance?->id ?? null),
            'responder_id' => $this->responder_id,
            'responder_name' => $this->responder_name,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'heading' => $this->heading,
            'accuracy' => $this->accuracy,
            'timestamp' => $this->timestamp,
            'dispatch_status' => $this->dispatch_status,
        ];
    }
}
