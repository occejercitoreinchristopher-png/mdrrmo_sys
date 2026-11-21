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
        $dispatch = $this->dispatch->loadMissing(['incident', 'incident.incidentType', 'ambulance']);
        $status = $dispatch->dispatch_status;
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

        $eventType = 'dispatch_status_updated';
        $title = 'Dispatch Status Updated';
        $message = "Dispatch status is now {$status}.";

        if ($status === 'cancelled') {
            $eventType = 'dispatch_cancelled';
            $title = 'Incident Cancelled';
            $message = "The {$rawTypeName} incident assigned to you in Barangay {$cleanBarangay} has been cancelled.";
        } elseif ($status === 'accepted') {
            $eventType = 'dispatch_accepted';
            $title = 'Dispatch Accepted';
            $message = 'Your emergency dispatch has been successfully accepted.';
        } elseif ($status === 'en_route') {
            $eventType = 'dispatch_en_route';
            $title = 'En Route to Incident';
            $message = "Response unit is en route to {$rawTypeName} in Barangay {$cleanBarangay}.";
        } elseif ($status === 'arrived_on_scene') {
            $eventType = 'dispatch_arrived';
            $title = 'Arrived on Scene';
            $message = "Response unit has arrived on scene at {$cleanLocation}.";
        } elseif ($status === 'completed') {
            $eventType = 'dispatch_completed';
            $title = 'Emergency Mission Completed';
            $message = "Emergency dispatch for {$rawTypeName} in Barangay {$cleanBarangay} has been completed.";
        }

        $lightIncident = $inc ? [
            'id' => $inc->id,
            'place_of_incident' => $cleanLocation,
            'barangay' => $cleanBarangay,
            'incident_type' => $inc->incidentType ? [
                'id' => $inc->incidentType->id,
                'name' => $inc->incidentType->name,
            ] : null,
        ] : null;

        $lightAmbulance = $dispatch->ambulance ? [
            'id' => $dispatch->ambulance->id,
            'plate_number' => $dispatch->ambulance->plate_number,
            'ambulance_code' => $dispatch->ambulance->ambulance_code,
            'vehicle_name' => $dispatch->ambulance->vehicle_name,
        ] : null;

        $cleanDispatch = [
            'id' => $dispatch->id,
            'incident_id' => $dispatch->incident_id,
            'ambulance_id' => $dispatch->ambulance_id,
            'team' => $dispatch->team,
            'driver_id' => $dispatch->driver_id,
            'emt_id' => $dispatch->emt_id,
            'dispatch_status' => $status,
            'acknowledgment_status' => $dispatch->acknowledgment_status ?? 'pending',
            'assigned_at' => $dispatch->assigned_at ? $dispatch->assigned_at->toIso8601String() : null,
            'incident' => $lightIncident,
            'ambulance' => $lightAmbulance,
        ];

        return [
            'dispatch' => $cleanDispatch,
            'dispatch_id' => $dispatch->id,
            'incident_id' => $dispatch->incident_id,
            'event_type' => $eventType,
            'type' => $eventType,
            'status' => $status,
            'title' => $title,
            'message' => $message,
            'incident_type' => $rawTypeName,
            'barangay' => $cleanBarangay,
            'location' => $cleanLocation,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
