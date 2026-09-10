<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientCareRecord extends Model
{
    protected $guarded = [];

    protected $casts = [
        'assessment' => 'array',
        'assessment_markers' => 'array',
        'vital_signs' => 'array',
        'glasgow_coma_scale' => 'array',
        'disposition' => 'array',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function dispatch()
    {
        return $this->belongsTo(Dispatch::class);
    }
}
