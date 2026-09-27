<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocationCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'barangay_id',
        'location_code',
        'location_type',
        'location_name',
        'location_description',
        'location_latitude',
        'location_longitude',
    ];

    protected $appends = ['code', 'marker_name', 'barangay_name', 'description', 'latitude', 'longitude'];

    protected $casts = [
        'location_latitude' => 'float',
        'location_longitude' => 'float',
    ];

    public function getDescriptionAttribute(): ?string
    {
        return $this->attributes['location_description'] ?? null;
    }

    public function getLatitudeAttribute(): ?float
    {
        return isset($this->attributes['location_latitude']) ? (float) $this->attributes['location_latitude'] : null;
    }

    public function getLongitudeAttribute(): ?float
    {
        return isset($this->attributes['location_longitude']) ? (float) $this->attributes['location_longitude'] : null;
    }

    public function setDescriptionAttribute($value): void
    {
        $this->attributes['location_description'] = $value;
    }

    public function setLatitudeAttribute($value): void
    {
        $this->attributes['location_latitude'] = $value;
    }

    public function setLongitudeAttribute($value): void
    {
        $this->attributes['location_longitude'] = $value;
    }

    /**
     * Relationship with Incidents.
     */
    public function incidents(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Incident::class, 'location_code_id');
    }

    /**
     * Relationship with Barangay.
     */
    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    /**
     * Backward-compatible alias for code.
     */
    public function getCodeAttribute(): string
    {
        return $this->location_code;
    }

    /**
     * Backward-compatible alias for marker_name.
     */
    public function getMarkerNameAttribute(): string
    {
        return $this->location_name;
    }

    /**
     * Backward-compatible alias for barangay string.
     */
    public function getBarangayNameAttribute(): string
    {
        return $this->barangay?->barangay_name ?? '';
    }
}
