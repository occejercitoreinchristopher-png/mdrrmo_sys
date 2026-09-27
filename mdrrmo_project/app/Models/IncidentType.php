<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IncidentType extends Model
{
    protected $guarded = [];

    protected $appends = ['name', 'description'];

    public function getNameAttribute(): ?string
    {
        return $this->attributes['incident_type_name'] ?? null;
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->attributes['type_description'] ?? null;
    }

    public function setNameAttribute($value): void
    {
        $this->attributes['incident_type_name'] = $value;
    }

    public function setDescriptionAttribute($value): void
    {
        $this->attributes['type_description'] = $value;
    }
}
