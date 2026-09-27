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
        $channels = [
            new PrivateChannel('dispatcher'),
            new PrivateChannel('responders'),
        ];

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
        $type = $this->incident->incidentType?->name ?? 'Emergency Incident';
        $barangay = $this->incident->resident?->residentProfile?->barangay?->barangay_name ?? null;
        $location = $this->incident->place_of_incident ?: $this->incident->incident_address ?: ($barangay ? "Barangay {$barangay}" : 'Opol, Misamis Oriental');
        $verifiedAt = $this->incident->verified_at ? $this->incident->verified_at->toIso8601String() : now()->toIso8601String();

        return [
            'incident' => $this->incident->loadMissing(['incidentType', 'resident.residentProfile.barangay', 'dispatches']),
            'type' => 'verified_incident_available',
            'notification' => [
                'title' => '🔔 New Verified Incident',
                'body' => "A new {$type} incident has been verified and is ready for dispatch.",
                'incident_id' => $this->incident->id,
                'incident_type' => $type,
                'priority' => $this->incident->priority ?? 'Moderate',
                'location' => $location,
                'barangay' => $barangay,
                'verified_at' => $verifiedAt,
                'report_source' => $this->incident->report_source,
            ],
        ];
    }
}
