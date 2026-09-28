<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DispatchCreated implements ShouldBroadcastNow
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
        $channels = [
            new PrivateChannel('dispatcher'),
            new PrivateChannel('responders'),
        ];

        $crewIds = $this->dispatch->crew()->pluck('users.id')->toArray();
        $assignedUserIds = array_unique(array_filter(array_merge(
            $crewIds,
            [$this->dispatch->driver_id, $this->dispatch->emt_id]
        )));

        foreach ($assignedUserIds as $userId) {
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
        return 'DispatchCreated';
    }

    public function broadcastWith(): array
    {
        return [
            'dispatch' => $this->dispatch->loadMissing([
                'incident',
                'incident.incidentType',
                'incident.resident',
                'ambulance',
                'crew',
                'driver',
                'emt',
            ]),
        ];
    }
}
