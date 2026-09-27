<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IncidentImage extends Model
{
    protected $guarded = [];

    protected $appends = ['image_url', 'formatted_captured_at', 'latitude', 'longitude'];

    protected $casts = [
        'captured_at' => 'datetime',
        'image_latitude' => 'float',
        'image_longitude' => 'float',
    ];

    public function getLatitudeAttribute(): ?float
    {
        return isset($this->attributes['image_latitude']) ? (float) $this->attributes['image_latitude'] : null;
    }

    public function getLongitudeAttribute(): ?float
    {
        return isset($this->attributes['image_longitude']) ? (float) $this->attributes['image_longitude'] : null;
    }

    public function setLatitudeAttribute($value): void
    {
        $this->attributes['image_latitude'] = $value;
    }

    public function setLongitudeAttribute($value): void
    {
        $this->attributes['image_longitude'] = $value;
    }

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
