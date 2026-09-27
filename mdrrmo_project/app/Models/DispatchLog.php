<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DispatchLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'incident_id',
        'dispatch_id',
        'user_id',
        'action_id',
        'previous_status',
        'new_status',
        'remarks',
    ];

    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }

    public function dispatch()
    {
        return $this->belongsTo(Dispatch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function action()
    {
        return $this->belongsTo(DispatchLogAction::class, 'action_id');
    }
}
