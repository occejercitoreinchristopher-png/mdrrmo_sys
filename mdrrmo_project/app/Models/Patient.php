<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $guarded = [];

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    public function careRecords()
    {
        return $this->hasMany(PatientCareRecord::class);
    }

    public function latestCareRecord()
    {
        return $this->hasOne(PatientCareRecord::class)->latestOfMany();
    }

    public function registeredUser()
    {
        return $this->belongsTo(User::class, 'registered_user_id');
    }
}
