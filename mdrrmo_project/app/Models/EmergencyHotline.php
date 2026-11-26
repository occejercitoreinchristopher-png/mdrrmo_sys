<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmergencyHotline extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'short_label',
        'phone_number',
        'description',
        'icon_type',
        'accent_color',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected static function booted()
    {
        static::saved(function () {
            \Illuminate\Support\Facades\Cache::forget('active_emergency_hotlines');
        });

        static::deleted(function () {
            \Illuminate\Support\Facades\Cache::forget('active_emergency_hotlines');
        });
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order', 'asc');
    }
}
