<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ambulance extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function teamLeader()
    {
        return $this->belongsTo(User::class, 'team_leader_id');
    }

    public function emt()
    {
        return $this->belongsTo(User::class, 'emt_id');
    }
}
