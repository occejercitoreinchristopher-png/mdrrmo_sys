<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResidentProfile extends Model
{
    protected $guarded = [];

    public function setHouseNoAttribute($value): void
    {
        // Column removed in 2026_11_02 migration; ignore to prevent SQL errors
    }

    public function setStreetAttribute($value): void
    {
        // Column removed in 2026_11_02 migration; ignore to prevent SQL errors
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }
}
