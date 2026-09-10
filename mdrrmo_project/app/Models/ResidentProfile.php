<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResidentProfile extends Model
{
    protected $guarded = [];

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }
}
