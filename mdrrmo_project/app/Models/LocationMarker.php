<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocationMarker extends Model
{
    protected $guarded = [];

    protected $appends = ['barangay', 'description', 'latitude', 'longitude'];

    protected function casts(): array
    {
        return [
            'barangay_id' => 'integer',
            'marker_latitude' => 'float',
            'marker_longitude' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class, 'barangay_id');
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
        return $this->attributes['marker_description'] ?? null;
    }

    public function getLatitudeAttribute(): ?float
    {
        return isset($this->attributes['marker_latitude']) ? (float) $this->attributes['marker_latitude'] : null;
    }

    public function getLongitudeAttribute(): ?float
    {
        return isset($this->attributes['marker_longitude']) ? (float) $this->attributes['marker_longitude'] : null;
    }

    public function setBarangayAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['barangay_id'] = (int) $value;
        } elseif (is_string($value) && trim($value) !== '') {
            $barangay = Barangay::firstOrCreate(['barangay_name' => trim($value)]);
            $this->attributes['barangay_id'] = $barangay->id;
        }
    }

    public function setBarangayNameAttribute($value): void
    {
        $this->setBarangayAttribute($value);
    }

    public function setDescriptionAttribute($value): void
    {
        $this->attributes['marker_description'] = $value;
    }

    public function setLatitudeAttribute($value): void
    {
        $this->attributes['marker_latitude'] = $value;
    }

    public function setLongitudeAttribute($value): void
    {
        $this->attributes['marker_longitude'] = $value;
    }
}
