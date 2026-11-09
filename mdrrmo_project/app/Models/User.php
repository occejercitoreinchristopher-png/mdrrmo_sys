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
#[Fillable(['first_name', 'middle_name', 'last_name', 'gender', 'age', 'birthdate', 'email', 'phone_number', 'address', 'zip_code', 'profile_photo_path', 'password', 'role', 'status', 'verification_status', 'reporting_suspended_until', 'expo_push_token', 'password_change_required', 'temporary_password_expires_at'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $appends = ['name', 'birthday', 'profile_photo_url', 'position', 'is_verified'];

    public function getIsVerifiedAttribute(): bool
    {
        return $this->verification_status === 'Verified';
    }

    public function getPositionAttribute(): ?string
    {
        return $this->responderProfile?->position;
    }

    public function isReportingSuspended(): bool
    {
        return $this->reporting_suspended_until !== null && $this->reporting_suspended_until->isFuture();
    }

    /**
     * Check completeness of the resident's required profile fields.
     *
     * @return array{is_complete: bool, missing_fields: array<string>}
     */
    public function checkProfileCompleteness(): array
    {
        $missing = [];

        // 1. Complete Name
        if (empty(trim($this->first_name ?? ''))) {
            $missing['first_name'] = 'First Name';
        }
        if (empty(trim($this->last_name ?? ''))) {
            $missing['last_name'] = 'Last Name';
        }

        // 2. Birthdate
        if (empty($this->birthdate)) {
            $missing['birthdate'] = 'Birthdate';
        }

        // 3. Age (auto-calculated from birthdate if possible)
        if (empty($this->age) || (int) $this->age <= 0) {
            if (! empty($this->birthdate)) {
                $this->age = Carbon::parse($this->birthdate)->age;
            } else {
                $missing['age'] = 'Age';
            }
        }

        // 4. Sex / Gender
        if (empty(trim($this->gender ?? ''))) {
            $missing['gender'] = 'Sex';
        }

        // 5. Contact Number
        if (empty(trim($this->phone_number ?? ''))) {
            $missing['phone_number'] = 'Contact Number';
        }

        // 6. Barangay
        $profile = $this->relationLoaded('residentProfile') ? $this->residentProfile : $this->residentProfile()->first();
        if (empty($profile?->barangay_id)) {
            $missing['barangay'] = 'Barangay';
        }

        return [
            'is_complete' => empty($missing),
            'missing_fields' => array_values($missing),
        ];
    }

    /**
     * Automatically update and persist the verification status based on completeness.
     *
     * @return string 'Verified'|'Pending'
     */
    public function syncVerificationStatus(): string
    {
        if ($this->role !== 'resident') {
            if ($this->verification_status !== 'Verified') {
                $this->verification_status = 'Verified';
                $this->saveQuietly();
            }
            return 'Verified';
        }

        $completeness = $this->checkProfileCompleteness();
        $targetStatus = $completeness['is_complete'] ? 'Verified' : 'Pending';

        if ($this->verification_status !== $targetStatus) {
            $this->verification_status = $targetStatus;
            $this->saveQuietly();
        }

        return $targetStatus;
    }

    public function isVerifiedResident(): bool
    {
        if ($this->role !== 'resident') {
            return true;
        }

        return $this->verification_status === 'Verified';
    }

    protected static function booted(): void
    {
        static::deleting(function (User $user) {
            $user->responderProfile?->delete();
        });
    }

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
            'reporting_suspended_until' => 'datetime',
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

    public function dispatchLogs()
    {
        return $this->hasMany(DispatchLog::class);
    }
}
