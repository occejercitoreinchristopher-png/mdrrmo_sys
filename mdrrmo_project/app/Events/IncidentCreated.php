<?php

namespace App\Events;

use App\Models\Incident;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncidentCreated implements ShouldBroadcastNow
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
        return [new PrivateChannel('dispatcher')];
    }

    public function broadcastAs(): string
    {
        return 'IncidentCreated';
    }

    public function broadcastWith(): array
    {
        $this->incident->loadMissing([
            'incidentType',
            'resident.residentProfile.barangay',
            'images',
        ]);

        if (!isset($this->incident->reporter_prank_history)) {
            $this->incident->reporter_prank_history = Incident::getPrankHistoryForReporter(
                $this->incident->resident_id,
                $this->incident->resident?->phone_number
            );
        }

        return [
            'incident' => $this->incident,
        ];
    }
}

