<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    protected $guarded = [];

    protected $appends = ['location', 'barangay'];

    public function getLocationAttribute(): ?string
    {
        return $this->place_of_incident
            ?: $this->incident_address
            ?: ($this->location_code ? "Marker {$this->location_code}" : null)
            ?: $this->resident?->residentProfile?->barangay?->barangay_name
            ?: 'Opol, Misamis Oriental';
    }

    public function getBarangayAttribute(): ?string
    {
        return $this->resident?->residentProfile?->barangay?->barangay_name
            ?: null;
    }

    protected function casts(): array
    {
        return [
            'reported_at' => 'datetime',
            'verified_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function resident()
    {
        return $this->belongsTo(User::class, 'resident_id');
    }

    public function incidentType()
    {
        return $this->belongsTo(IncidentType::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function dispatches()
    {
        return $this->hasMany(Dispatch::class);
    }

    public function images()
    {
        return $this->hasMany(IncidentImage::class);
    }
}
