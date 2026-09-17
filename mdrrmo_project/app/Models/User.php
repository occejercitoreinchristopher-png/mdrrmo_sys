<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $expo_push_token
 */
#[Fillable(['first_name', 'middle_name', 'last_name', 'age', 'birthdate', 'email', 'phone_number', 'profile_photo_path', 'password', 'role', 'position', 'status', 'expo_push_token', 'password_change_required', 'temporary_password_expires_at'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $appends = ['name', 'birthday', 'profile_photo_url'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birthdate' => 'date:Y-m-d',
            'age' => 'integer',
            'password_change_required' => 'boolean',
            'temporary_password_expires_at' => 'datetime',
        ];
    }

    public function getBirthdayAttribute(): ?string
    {
        return $this->birthdate ? Carbon::parse($this->birthdate)->format('Y-m-d') : null;
    }

    public function setBirthdayAttribute($value): void
    {
        $this->attributes['birthdate'] = $value;
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        if (! empty($this->profile_photo_path)) {
            return asset('storage/' . $this->profile_photo_path);
        }
        return null;
    }

    public function getNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function setNameAttribute($value): void
    {
        $parts = explode(' ', trim($value ?? ''), 2);
        $this->attributes['first_name'] = $parts[0] ?? '';
        $this->attributes['last_name'] = $parts[1] ?? '';
    }

    public function responderProfile()
    {
        return $this->hasOne(ResponderProfile::class);
    }

    public function residentProfile()
    {
        return $this->hasOne(ResidentProfile::class);
    }

    public function reportedIncidents()
    {
        return $this->hasMany(Incident::class, 'resident_id');
    }
}
