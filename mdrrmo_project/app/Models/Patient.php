<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $guarded = [];

    protected $appends = ['name', 'full_name', 'first_name', 'middle_name', 'last_name', 'birthdate', 'gender'];

    public function getNameAttribute(): string
    {
        return trim(($this->patient_first_name ?? '') . ' ' . ($this->patient_last_name ?? ''));
    }

    public function getFullNameAttribute(): string
    {
        return trim(($this->patient_first_name ?? '') . ' ' . ($this->patient_middle_name ?? '') . ' ' . ($this->patient_last_name ?? ''));
    }

    public function getFirstNameAttribute(): ?string
    {
        return $this->attributes['patient_first_name'] ?? null;
    }

    public function getMiddleNameAttribute(): ?string
    {
        return $this->attributes['patient_middle_name'] ?? null;
    }

    public function getLastNameAttribute(): ?string
    {
        return $this->attributes['patient_last_name'] ?? null;
    }

    public function getBirthdateAttribute(): ?string
    {
        return $this->attributes['patient_birthdate'] ?? null;
    }

    public function getGenderAttribute(): ?string
    {
        return $this->attributes['patient_gender'] ?? null;
    }

    public function setFirstNameAttribute($value): void
    {
        $this->attributes['patient_first_name'] = $value;
    }

    public function setMiddleNameAttribute($value): void
    {
        $this->attributes['patient_middle_name'] = $value;
    }

    public function setLastNameAttribute($value): void
    {
        $this->attributes['patient_last_name'] = $value;
    }

    public function setBirthdateAttribute($value): void
    {
        $this->attributes['patient_birthdate'] = $value;
    }

    public function setGenderAttribute($value): void
    {
        $this->attributes['patient_gender'] = $value;
    }

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
