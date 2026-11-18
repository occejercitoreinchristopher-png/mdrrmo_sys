<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeatmapManualPinImage extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_grayscale' => 'boolean',
    ];

    public function manualPin()
    {
        return $this->belongsTo(HeatmapManualPin::class, 'heatmap_manual_pin_id');
    }
}
