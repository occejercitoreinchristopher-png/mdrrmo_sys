<?php

namespace App\Events;

use App\Models\Dispatch;
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
        $dispatch = $this->dispatch->loadMissing([
            'incident',
            'incident.incidentType',
            'incident.resident',
            'ambulance',
            'crew',
            'driver',
            'emt',
        ]);

        $inc = $dispatch->incident;
        $rawTypeName = $inc?->incidentType?->name ?? 'Emergency Incident';
        $rawBarangay = $inc?->barangay ?? $inc?->resident?->residentProfile?->barangay?->barangay_name ?? 'Opol';
        $cleanBarangay = trim(preg_replace('/^barangay\s+/i', '', trim($rawBarangay)));
        if (empty($cleanBarangay)) {
            $cleanBarangay = 'Opol';
        }

        $cleanLocation = $inc?->clean_place_of_incident 
            ?? $inc?->place_of_incident 
            ?? $inc?->incident_address 
            ?? "Barangay {$cleanBarangay}, Opol";

        $isReassignment = Dispatch::where('incident_id', $dispatch->incident_id)
            ->where('id', '!=', $dispatch->id)
            ->exists();

        $eventType = $isReassignment ? 'dispatch_reassigned' : 'dispatch_assigned';
        $title = $isReassignment ? 'Dispatch Assignment Updated' : 'Emergency Dispatch Assigned';
        $message = $isReassignment
            ? 'Your dispatch assignment has been updated. Please review the latest incident information.'
            : "You have been assigned to respond to a {$rawTypeName} in Barangay {$cleanBarangay}, Opol.";

        return [
            'dispatch' => $dispatch,
            'dispatch_id' => $dispatch->id,
            'incident_id' => $dispatch->incident_id,
            'event_type' => $eventType,
            'type' => $eventType,
            'title' => $title,
            'message' => $message,
            'incident_type' => $rawTypeName,
            'barangay' => $cleanBarangay,
            'location' => $cleanLocation,
            'dispatch_time' => $dispatch->assigned_at ? $dispatch->assigned_at->toIso8601String() : now()->toIso8601String(),
            'status' => $dispatch->dispatch_status ?? 'assigned',
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
