<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResponderProfile extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_reliever' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopePermanent($query)
    {
        return $query->where('is_reliever', false);
    }

    public function scopeRelievers($query)
    {
        return $query->where('is_reliever', true);
    }
}
