<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IncidentImage extends Model
{
    protected $guarded = [];

    protected $appends = ['image_url', 'formatted_captured_at'];

    protected $casts = [
        'captured_at' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function getImageUrlAttribute(): ?string
    {
        if (! empty($this->image_path)) {
            return asset('storage/' . $this->image_path);
        }
        return null;
    }

    public function getFormattedCapturedAtAttribute(): ?string
    {
        $dt = $this->captured_at ?: $this->created_at;
        return $dt ? $dt->format('F j, Y, g:i A') : null;
    }

    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function dispatch()
    {
        return $this->belongsTo(Dispatch::class);
    }

    public function patientCareRecord()
    {
        return $this->belongsTo(PatientCareRecord::class);
    }
}
