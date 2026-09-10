<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PatientCareRecordSubmitted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $pcr;

    public function __construct($pcr = null)
    {
        $this->pcr = $pcr;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return is_array(new PrivateChannel('dispatcher')) ? new PrivateChannel('dispatcher') : [new PrivateChannel('dispatcher')];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->pcr?->id,
            'dispatch_id' => $this->pcr?->dispatch_id,
            'patient_id' => $this->pcr?->patient_id,
            'chief_complaint' => $this->pcr?->chief_complaint,
            'nature_of_call' => $this->pcr?->nature_of_call,
            'created_at' => $this->pcr?->created_at?->toISOString() ?? now()->toISOString(),
        ];
    }
}
