<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Barangay extends Model
{
    protected $guarded = [];

    /**
     * Relationship with LocationCode.
     */
    public function locationCodes(): HasMany
    {
        return $this->hasMany(LocationCode::class);
    }

    /**
     * Relationship with DispatchLog.
     */
    public function dispatchLogs(): HasMany
    {
        return $this->hasMany(DispatchLog::class);
    }
}
