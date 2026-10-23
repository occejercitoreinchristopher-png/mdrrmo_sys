<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Consolidated LocationMarker model (aliased to location_codes table)
 */
class LocationMarker extends Model
{
    protected $table = 'location_codes';

    protected $guarded = [];

    protected $appends = ['code', 'marker_name', 'barangay', 'description', 'latitude', 'longitude'];

    protected function casts(): array
    {
        return [
            'barangay_id' => 'integer',
            'location_latitude' => 'float',
            'location_longitude' => 'float',
        ];
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class, 'barangay_id');
    }

    public function getCodeAttribute(): ?string
    {
        return $this->attributes['location_code'] ?? null;
    }

    public function getMarkerNameAttribute(): ?string
    {
        return $this->attributes['location_name'] ?? null;
    }

    public function getBarangayAttribute(): ?string
    {
        $relation = $this->relationLoaded('barangay')
            ? $this->getRelation('barangay')
            : $this->barangay()->first();

        return $relation?->barangay_name;
    }

    public function getBarangayNameAttribute(): ?string
    {
        return $this->getBarangayAttribute();
    }

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
}
