<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResponderProfile extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_reliever' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopePermanent($query)
    {
        return $query->where('is_reliever', false);
    }

    public function scopeRelievers($query)
    {
        return $query->where('is_reliever', true);
    }

    /**
     * Auto-heal responder availability: Any responder whose profile is marked 'busy'
     * but who does NOT have an active emergency dispatch is restored to 'available'.
     */
    public static function syncBusyAvailability(): void
    {
        try {
            $activeAssignedUserIds = Dispatch::whereNotIn('dispatch_status', ['completed', 'cancelled'])
                ->with('crew')
                ->get()
                ->flatMap(function ($d) {
                    return array_merge(
                        $d->crew->pluck('id')->toArray(),
                        array_filter([$d->driver_id, $d->emt_id])
                    );
                })
                ->unique()
                ->filter()
                ->values()
                ->toArray();

            static::where('availability', 'busy')
                ->whereNotIn('user_id', $activeAssignedUserIds)
                ->update(['availability' => 'available']);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('syncBusyAvailability warning: ' . $e->getMessage());
        }
    }
}
