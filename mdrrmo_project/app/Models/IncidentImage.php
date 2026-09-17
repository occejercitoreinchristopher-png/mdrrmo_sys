<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IncidentImage extends Model
{
    protected $guarded = [];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if (! empty($this->image_path)) {
            return asset('storage/' . $this->image_path);
        }
        return null;
    }
}
