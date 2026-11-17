<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmergencyComplaint extends Model
{
    protected $fillable = [
        'category',
        'complaint_name',
        'description',
    ];
}
