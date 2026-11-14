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

    public function setCodeAttribute($value): void
    {
        $this->attributes['location_code'] = $value;
    }

    public function setMarkerNameAttribute($value): void
    {
        $this->attributes['location_name'] = $value;
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

    public function setIsActiveAttribute($value): void
    {
        // location_codes has no is_active column; ignore
    }

    public function setBarangayAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['barangay_id'] = (int) $value;
        } elseif (is_string($value) && trim($value) !== '') {
            $b = Barangay::firstOrCreate(['barangay_name' => trim($value)]);
            $this->attributes['barangay_id'] = $b->id;
        }
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->location_type)) {
                $model->location_type = 'Landmark';
            }
            if (empty($model->barangay_id)) {
                $b = Barangay::first() ?? Barangay::create(['barangay_name' => 'Poblacion']);
                $model->barangay_id = $b->id;
            }
        });
    }
}
