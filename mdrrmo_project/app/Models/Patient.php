<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class Patient extends Model
{
    protected $guarded = [];

    protected static ?string $cachedAddressColumn = null;
    protected static bool $addressColumnChecked = false;

    public static function addressColumn(): ?string
    {
        if (! static::$addressColumnChecked) {
            static::$addressColumnChecked = true;
            if (Schema::hasColumn('patients', 'street')) {
                static::$cachedAddressColumn = 'street';
            } elseif (Schema::hasColumn('patients', 'home_address')) {
                static::$cachedAddressColumn = 'home_address';
            } else {
                static::$cachedAddressColumn = null;
            }
        }

        return static::$cachedAddressColumn;
    }

    protected $casts = [
        'is_unidentified' => 'boolean',
        'identified_at' => 'datetime',
    ];

    protected $appends = ['name', 'full_name', 'first_name', 'middle_name', 'last_name', 'birthdate', 'gender', 'address'];

    public function getHomeAddressAttribute(): ?string
    {
        if (! empty($this->attributes['home_address'])) {
            return $this->attributes['home_address'];
        }

        $parts = array_filter([
            $this->attributes['house_no'] ?? null,
            $this->attributes['street'] ?? null,
        ]);

        return ! empty($parts) ? implode(', ', $parts) : null;
    }

    public function getAddressAttribute(): ?string
    {
        return $this->home_address;
    }

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

    public function setHomeAddressAttribute($value): void
    {
        $col = static::addressColumn();
        if ($col) {
            $this->attributes[$col] = $value ? mb_substr(trim((string) $value), 0, 255) : null;
        }
    }

    public function setAddressAttribute($value): void
    {
        $this->setHomeAddressAttribute($value);
    }

    public function setStreetAttribute($value): void
    {
        $col = static::addressColumn();
        if ($col === 'street') {
            $this->attributes['street'] = $value ? mb_substr(trim((string) $value), 0, 255) : null;
        }
    }

    public function setHouseNoAttribute($value): void
    {
        if (Schema::hasColumn('patients', 'house_no')) {
            $this->attributes['house_no'] = $value ? mb_substr(trim((string) $value), 0, 100) : null;
        }
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

    /**
     * Consolidate duplicate patient records sharing identical first and last names.
     * Re-links all PCRs to the canonical master record and deletes redundant rows.
     */
    public static function consolidateDuplicates(): array
    {
        $patients = static::where('is_unidentified', false)
            ->whereNotNull('patient_first_name')
            ->whereNotNull('patient_last_name')
            ->whereRaw("LOWER(TRIM(COALESCE(patient_first_name, ''))) != 'unknown'")
            ->get();

        $grouped = $patients->groupBy(function ($p) {
            $first = preg_replace('/\s+/', ' ', strtolower(trim($p->first_name ?? '')));
            $last = preg_replace('/\s+/', ' ', strtolower(trim($p->last_name ?? '')));
            return "{$first}|{$last}";
        });

        $mergedPatientsCount = 0;
        $relinkedPcrsCount = 0;
        $details = [];

        foreach ($grouped as $key => $records) {
            if ($records->count() <= 1) {
                continue;
            }

            // Sort: prioritize records with registered_user_id, most PCRs, barangay, real birthdate, address
            $sorted = $records->sortByDesc(function ($p) {
                $score = 0;
                if ($p->registered_user_id) {
                    $score += 30;
                }
                $pcrCount = PatientCareRecord::where('patient_id', $p->id)->count();
                $score += $pcrCount * 10;
                if ($p->barangay_id) {
                    $score += 5;
                }
                $addressCol = static::addressColumn();
                if ($addressCol && !empty($p->{$addressCol})) {
                    $score += 4;
                }
                if (!empty($p->patient_birthdate)) {
                    $score += str_ends_with($p->patient_birthdate, '-01-01') ? 2 : 6;
                }
                if (!empty($p->patient_gender)) {
                    $score += 2;
                }
                return $score;
            })->values();

            $master = $sorted->first();
            $duplicates = $sorted->slice(1);

            DB::transaction(function () use ($master, $duplicates, &$mergedPatientsCount, &$relinkedPcrsCount, &$details, $key) {
                $updates = [];
                $addressCol = static::addressColumn();
                $groupRelinkedPcrs = 0;

                foreach ($duplicates as $dup) {
                    // Transfer attributes if master is missing them or has synthetic
                    $masterHasSyntheticBday = empty($master->patient_birthdate) || str_ends_with($master->patient_birthdate, '-01-01');
                    $dupHasRealBday = !empty($dup->patient_birthdate) && !str_ends_with($dup->patient_birthdate, '-01-01');

                    if (($masterHasSyntheticBday && $dupHasRealBday) || (empty($master->patient_birthdate) && !empty($dup->patient_birthdate))) {
                        $master->patient_birthdate = $dup->patient_birthdate;
                        $updates['patient_birthdate'] = $dup->patient_birthdate;
                    }

                    if ($addressCol && empty($master->{$addressCol}) && !empty($dup->{$addressCol})) {
                        $master->{$addressCol} = $dup->{$addressCol};
                        $updates[$addressCol] = $dup->{$addressCol};
                    }

                    if (empty($master->patient_gender) && !empty($dup->patient_gender)) {
                        $master->patient_gender = $dup->patient_gender;
                        $updates['patient_gender'] = $dup->patient_gender;
                    }

                    if (empty($master->barangay_id) && !empty($dup->barangay_id)) {
                        $master->barangay_id = $dup->barangay_id;
                        $updates['barangay_id'] = $dup->barangay_id;
                    }

                    if (empty($master->registered_user_id) && !empty($dup->registered_user_id)) {
                        $master->registered_user_id = $dup->registered_user_id;
                        $updates['registered_user_id'] = $dup->registered_user_id;
                    }

                    // Re-link PCRs
                    $pcrsCount = PatientCareRecord::where('patient_id', $dup->id)->count();
                    if ($pcrsCount > 0) {
                        PatientCareRecord::where('patient_id', $dup->id)->update([
                            'patient_id' => $master->id,
                        ]);
                        $groupRelinkedPcrs += $pcrsCount;
                        $relinkedPcrsCount += $pcrsCount;
                    }

                    // Delete duplicate
                    $dup->delete();
                    $mergedPatientsCount++;
                }

                if (!empty($updates)) {
                    $master->save();
                }

                $details[] = [
                    'name' => ucwords(str_replace('|', ' ', $key)),
                    'master_id' => $master->id,
                    'duplicates_removed' => $duplicates->count(),
                    'pcrs_relinked' => $groupRelinkedPcrs,
                ];
            });
        }

        return [
            'merged_patients' => $mergedPatientsCount,
            'relinked_pcrs' => $relinkedPcrsCount,
            'details' => $details,
        ];
    }
}
