<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientCareRecord extends Model
{
    protected $guarded = [];

    protected $appends = [
        'chief_complaint',
        'gender',
        'responders',
        'dispatch_time',
        'en_route_time',
        'on_scene_time',
    ];

    public function getChiefComplaintAttribute(): ?string
    {
        return $this->attributes['clinical_chief_complaint'] ?? null;
    }

    public function getGenderAttribute(): ?string
    {
        return $this->patient?->gender ?? null;
    }

    public function getDispatchTimeAttribute(): ?string
    {
        if (! $this->relationLoaded('dispatch') && ! $this->dispatch_id) {
            return null;
        }

        $dispatch = $this->dispatch;
        if (! $dispatch) {
            return null;
        }

        $time = $dispatch->created_at ?? $dispatch->assigned_at;
        return $time ? $time->format('H:i') : null;
    }

    public function getEnRouteTimeAttribute(): ?string
    {
        if (! $this->relationLoaded('dispatch') && ! $this->dispatch_id) {
            return null;
        }

        $dispatch = $this->dispatch;
        if (! $dispatch || ! $dispatch->en_route_at) {
            return null;
        }

        return $dispatch->en_route_at->format('H:i');
    }

    public function getOnSceneTimeAttribute(): ?string
    {
        if (! $this->relationLoaded('dispatch') && ! $this->dispatch_id) {
            return null;
        }

        $dispatch = $this->dispatch;
        if (! $dispatch) {
            return null;
        }

        $time = $dispatch->arrived_on_scene_at ?: $dispatch->arrived_at;
        return $time ? $time->format('H:i') : null;
    }

    public function getRespondersAttribute(): ?string
    {
        if (! $this->relationLoaded('dispatch') && ! $this->dispatch_id) {
            return null;
        }

        $dispatch = $this->dispatch;
        if (! $dispatch) {
            return null;
        }

        $names = [];

        if ($dispatch->relationLoaded('crew') && $dispatch->crew->isNotEmpty()) {
            foreach ($dispatch->crew as $c) {
                $role = ! empty($c->pivot?->role) ? ' (' . strtoupper($c->pivot->role) . ')' : '';
                $names[] = trim("{$c->first_name} {$c->last_name}{$role}");
            }
        } else {
            if ($dispatch->driver) {
                $names[] = "{$dispatch->driver->first_name} {$dispatch->driver->last_name} (Driver)";
            }
            if ($dispatch->emt) {
                $names[] = "{$dispatch->emt->first_name} {$dispatch->emt->last_name} (EMT)";
            }
        }

        return ! empty($names) ? implode(', ', array_unique($names)) : null;
    }

    public function setChiefComplaintAttribute($value): void
    {
        $this->attributes['clinical_chief_complaint'] = $value;
    }

    protected $casts = [
        'assessment' => 'array',
        'assessment_markers' => 'array',
        'vital_signs' => 'array',
        'glasgow_coma_scale' => 'array',
        'disposition' => 'array',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function dispatch()
    {
        return $this->belongsTo(Dispatch::class);
    }

    public function images()
    {
        return $this->hasMany(IncidentImage::class, 'patient_care_record_id');
    }
}
