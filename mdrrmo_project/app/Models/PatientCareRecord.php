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

        if ($dispatch->relationLoaded('crew') && $dispatch->crew && $dispatch->crew->isNotEmpty()) {
            foreach ($dispatch->crew as $c) {
                $names[] = trim("{$c->first_name} {$c->last_name}");
            }
        }

        if ($dispatch->driver) {
            $names[] = trim("{$dispatch->driver->first_name} {$dispatch->driver->last_name}");
        }

        if ($dispatch->emt) {
            $names[] = trim("{$dispatch->emt->first_name} {$dispatch->emt->last_name}");
        }

        $unique = [];
        $seen = [];
        foreach ($names as $name) {
            $clean = trim(preg_replace('/\s*\([^)]*\)/', '', $name));
            if (empty($clean)) {
                continue;
            }
            $lower = mb_strtolower($clean);
            if (! isset($seen[$lower])) {
                $seen[$lower] = true;
                $unique[] = mb_convert_case($clean, MB_CASE_TITLE, 'UTF-8');
            }
        }

        return ! empty($unique) ? implode(', ', $unique) : null;
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
