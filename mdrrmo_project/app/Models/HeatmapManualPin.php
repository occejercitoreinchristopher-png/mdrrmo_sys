<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeatmapManualPin extends Model
{
    protected $guarded = [];

    protected $casts = [
        'pin_latitude' => 'float',
        'pin_longitude' => 'float',
    ];

    public function incidentType()
    {
        return $this->belongsTo(IncidentType::class, 'incident_type_id');
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class, 'barangay_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function images()
    {
        return $this->hasMany(HeatmapManualPinImage::class, 'heatmap_manual_pin_id');
    }
}
