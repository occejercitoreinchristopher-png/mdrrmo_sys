<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dispatch extends Model
{
    protected $guarded = [];

    protected $appends = ['arrived_on_scene_at'];

    public function getArrivedOnSceneAtAttribute()
    {
        return $this->arrived_at;
    }

    protected function casts(): array
    {
        return [
            'crew_snapshot' => 'array',
            'assigned_at' => 'datetime',
            'accepted_at' => 'datetime',
            'en_route_at' => 'datetime',
            'arrived_at' => 'datetime',
            'completed_at' => 'datetime',
            'last_latitude' => 'float',
            'last_longitude' => 'float',
            'last_heading' => 'float',
            'last_accuracy' => 'float',
            'last_location_updated_at' => 'datetime',
        ];
    }

    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }

    public function patientCareRecord()
    {
        return $this->hasOne(PatientCareRecord::class);
    }

    public function pcrRecord()
    {
        return $this->patientCareRecord();
    }

    public function dispatcher()
    {
        return $this->belongsTo(User::class, 'dispatcher_id');
    }

    public function ambulance()
    {
        return $this->belongsTo(Ambulance::class);
    }

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function teamLeader()
    {
        return $this->belongsTo(User::class, 'emt_id');
    }

    public function getTeamLeaderIdAttribute()
    {
        return $this->attributes['team_leader_id'] ?? $this->emt_id;
    }

    public function emt()
    {
        return $this->belongsTo(User::class, 'emt_id');
    }

    public function crew()
    {
        return $this->belongsToMany(User::class, 'dispatch_crews')
            ->withPivot(['role', 'is_reliever_assignment'])
            ->withTimestamps();
    }

    public function images()
    {
        return $this->hasMany(IncidentImage::class, 'dispatch_id');
    }
}
