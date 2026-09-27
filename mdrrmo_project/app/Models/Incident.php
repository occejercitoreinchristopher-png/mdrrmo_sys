<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    protected $guarded = [];

    public const OPOL_BARANGAYS = [
        'Awang', 'Bagocboc', 'Barra', 'Bonbon', 'Cauyonan',
        'Igpit', 'Limonda', 'Luyongbonbon', 'Malanang',
        'Nangcaon', 'Patag', 'Poblacion', 'Taboc', 'Tingalan'
    ];

    protected static ?array $cachedGeojson = null;

    protected $appends = [
        'location', 
        'barangay', 
        'pcr_chief_complaint', 
        'pcr_chief_complaints', 
        'description', 
        'chief_complaint', 
        'place_of_incident',
        'location_code',
    ];

    public function getDescriptionAttribute(): ?string
    {
        return $this->attributes['incident_description'] ?? null;
    }

    public function getChiefComplaintAttribute(): ?string
    {
        if (! empty($this->pcr_chief_complaint)) {
            return $this->pcr_chief_complaint;
        }

        $desc = $this->attributes['incident_description'] ?? null;
        if ($desc && preg_match('/^\[(.*?)\]/', $desc, $matches)) {
            return $matches[1];
        }

        return $desc ?? $this->incidentType?->incident_type_name ?? null;
    }

    public function getPlaceOfIncidentAttribute(): ?string
    {
        return $this->attributes['incident_address'] ?? null;
    }

    public function setDescriptionAttribute($value): void
    {
        $this->attributes['incident_description'] = $value;
    }

    public function setChiefComplaintAttribute($value): void
    {
        $existing = $this->attributes['incident_description'] ?? '';
        if (empty($existing)) {
            $this->attributes['incident_description'] = "[{$value}]";
        } elseif (! str_contains($existing, "[{$value}]")) {
            $this->attributes['incident_description'] = "[{$value}] {$existing}";
        }
    }

    public function setPlaceOfIncidentAttribute($value): void
    {
        if (empty($this->attributes['incident_address'])) {
            $this->attributes['incident_address'] = $value;
        }
    }

    public function locationCode()
    {
        return $this->belongsTo(LocationCode::class, 'location_code_id');
    }

    public function getAttribute($key)
    {
        if ($key === 'locationCode') {
            return $this->getRelationValue('locationCode');
        }

        return parent::getAttribute($key);
    }

    public function getLocationCodeAttribute(): ?string
    {
        return $this->getRelationValue('locationCode')?->location_code;
    }

    public function setLocationCodeAttribute($value): void
    {
        if ($value) {
            $loc = LocationCode::where('location_code', $value)->first();
            if ($loc) {
                $this->attributes['location_code_id'] = $loc->id;
            }
        }
    }

    public function setLocationCodeIdAttribute($value): void
    {
        $this->attributes['location_code_id'] = $value;
    }

    public function getLocationAttribute(): ?string
    {
        return $this->incident_address
            ?: ($this->location_code ? "Marker {$this->location_code}" : null)
            ?: $this->resident?->residentProfile?->barangay?->barangay_name
            ?: 'Opol, Misamis Oriental';
    }

    public function getBarangayAttribute(): ?string
    {
        if ($this->resident?->residentProfile?->barangay?->barangay_name) {
            return $this->resident->residentProfile->barangay->barangay_name;
        }

        $fromCoords = self::resolveBarangayFromCoordinates($this->incident_latitude, $this->incident_longitude);
        if ($fromCoords) {
            return $fromCoords;
        }

        $fullText = $this->incident_address ?? '';
        if (!empty($fullText)) {
            foreach (self::OPOL_BARANGAYS as $bName) {
                if (stripos($fullText, $bName) !== false) {
                    return $bName;
                }
            }
            if (stripos($fullText, 'luyong bonbon') !== false || stripos($fullText, 'luyong-bonbon') !== false) {
                return 'Luyongbonbon';
            }
        }

        return null;
    }

    public function getPcrChiefComplaintAttribute(): ?string
    {
        if ($this->relationLoaded('dispatches')) {
            foreach ($this->dispatches as $d) {
                if ($d->relationLoaded('patientCareRecord') && $d->patientCareRecord?->chief_complaint) {
                    return $d->patientCareRecord->chief_complaint;
                }
            }
        }
        return null;
    }

    public function getPcrChiefComplaintsAttribute(): array
    {
        if ($this->relationLoaded('dispatches')) {
            return $this->dispatches->map(function ($d) {
                return $d->relationLoaded('patientCareRecord') ? $d->patientCareRecord?->chief_complaint : null;
            })->filter()->unique()->values()->all();
        }
        return [];
    }

    protected static function resolveBarangayFromCoordinates($lat, $lng): ?string
    {
        if (!$lat || !$lng || (float)$lat == 0 || (float)$lng == 0) {
            return null;
        }

        if (self::$cachedGeojson === null) {
            $path = resource_path('data/opol_barangays.json');
            if (file_exists($path)) {
                self::$cachedGeojson = json_decode(file_get_contents($path), true);
            } else {
                self::$cachedGeojson = [];
            }
        }

        if (empty(self::$cachedGeojson['features'])) {
            return null;
        }

        $pt = [(float)$lng, (float)$lat];

        foreach (self::$cachedGeojson['features'] as $feature) {
            $rawName = strtolower(trim($feature['properties']['name'] ?? ''));
            $normName = match ($rawName) {
                'luyong-bonbon', 'luyong bonbon' => 'Luyongbonbon',
                default => ucfirst($rawName),
            };

            $geometry = $feature['geometry'] ?? null;
            if (!$geometry) continue;

            $type = $geometry['type'] ?? '';
            $coords = $geometry['coordinates'] ?? [];

            if ($type === 'Polygon') {
                if (isset($coords[0]) && self::isPointInPolygon($pt, $coords[0])) {
                    return $normName;
                }
            } elseif ($type === 'MultiPolygon') {
                foreach ($coords as $poly) {
                    if (isset($poly[0]) && self::isPointInPolygon($pt, $poly[0])) {
                        return $normName;
                    }
                }
            }
        }

        return null;
    }

    protected static function isPointInPolygon(array $point, array $polygon): bool
    {
        $x = $point[0];
        $y = $point[1];
        $inside = false;
        $n = count($polygon);
        for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
            $xi = $polygon[$i][0];
            $yi = $polygon[$i][1];
            $xj = $polygon[$j][0];
            $yj = $polygon[$j][1];
            $intersect = (($yi > $y) != ($yj > $y))
                && ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);
            if ($intersect) {
                $inside = !$inside;
            }
        }
        return $inside;
    }

    protected function casts(): array
    {
        return [
            'reported_at' => 'datetime',
            'verified_at' => 'datetime',
            'resolved_at' => 'datetime',
            'is_prank' => 'boolean',
        ];
    }

    public static function getPrankHistoryForReporter(?int $residentId, ?string $phoneNumber): array
    {
        if (! $residentId && ! $phoneNumber) {
            return [
                'has_prank_history' => false,
                'prank_count' => 0,
                'latest_prank' => null,
            ];
        }

        $query = self::where('is_prank', true);
        if ($residentId && $phoneNumber) {
            $query->where(function ($q) use ($residentId, $phoneNumber) {
                $q->where('resident_id', $residentId)
                  ->orWhere('caller_phone_number', $phoneNumber);
            });
        } elseif ($residentId) {
            $query->where('resident_id', $residentId);
        } else {
            $query->where('caller_phone_number', $phoneNumber);
        }

        $pranks = $query->latest('reported_at')->get();
        $latest = $pranks->first();

        return [
            'has_prank_history' => $pranks->isNotEmpty(),
            'prank_count' => $pranks->count(),
            'latest_prank' => $latest ? [
                'id' => $latest->id,
                'reported_at' => $latest->reported_at?->toIso8601String(),
                'formatted_date' => $latest->reported_at ? $latest->reported_at->format('M d, Y, h:i A') : $latest->created_at->format('M d, Y, h:i A'),
                'time_ago' => $latest->reported_at?->diffForHumans() ?? $latest->created_at->diffForHumans(),
                'rejection_reason' => $latest->rejection_reason,
                'rejection_category' => $latest->rejection_category,
                'place_of_incident' => $latest->place_of_incident ?? $latest->incident_address ?? 'Location not specified',
            ] : null,
        ];
    }

    public function resident()
    {
        return $this->belongsTo(User::class, 'resident_id');
    }

    public function incidentType()
    {
        return $this->belongsTo(IncidentType::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function dispatches()
    {
        return $this->hasMany(Dispatch::class);
    }

    public function images()
    {
        return $this->hasMany(IncidentImage::class);
    }

    public function dispatchLogs()
    {
        return $this->hasMany(DispatchLog::class);
    }
}
