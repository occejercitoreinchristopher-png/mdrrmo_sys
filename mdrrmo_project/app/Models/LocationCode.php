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
        'description',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

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
