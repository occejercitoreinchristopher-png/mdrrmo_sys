<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DispatchLogAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'is_system_action',
    ];

    protected $casts = [
        'is_system_action' => 'boolean',
    ];

    public function logs()
    {
        return $this->hasMany(DispatchLog::class, 'action_id');
    }
}
