<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ensure all 14 official Opol barangays exist in the barangays table
        $officialBarangays = [
            'Awang',
            'Bagocboc',
            'Barra',
            'Bonbon',
            'Cauyonan',
            'Igpit',
            'Limonda',
            'Luyongbonbon',
            'Malanang',
            'Nangcaon',
            'Patag',
            'Poblacion',
            'Taboc',
            'Tingalan',
        ];

        // Normalize existing "Luyong Bonbon" to "Luyongbonbon" if needed, or ensure it exists
        $now = now();
        foreach ($officialBarangays as $bName) {
            $exists = DB::table('barangays')
                ->where('barangay_name', $bName)
                ->orWhere('barangay_name', str_replace('Luyongbonbon', 'Luyong Bonbon', $bName))
                ->first();

            if (! $exists) {
                DB::table('barangays')->insert([
                    'barangay_name' => $bName,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // 2. Create location_codes table strictly matching specification
        Schema::create('location_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barangay_id')->constrained('barangays')->cascadeOnDelete();
            $table->string('location_code',50)->unique()->index();
            $table->string('location_type',50)->index();
            $table->string('location_name',100);
            $table->string('location_description')->nullable();
            $table->decimal('location_latitude', 10, 7);
            $table->decimal('location_longitude', 10, 7);
            $table->timestamps();
        });

        // 3. Migrate existing location_markers to location_codes if location_markers exists
        if (Schema::hasTable('location_markers')) {
            $existingMarkers = DB::table('location_markers')->get();
            $barangayMap = DB::table('barangays')->get()->keyBy(function ($item) {
                return strtolower(str_replace(' ', '', $item->barangay_name));
            });

            foreach ($existingMarkers as $marker) {
                $markerBrgy = $marker->barangay_name ?? $marker->barangay ?? '';
                $cleanedKey = strtolower(str_replace(' ', '', $markerBrgy));
                $barangay = $barangayMap->get($cleanedKey);

                if (! $barangay) {
                    $barangay = $barangayMap->get('poblacion') ?? DB::table('barangays')->first();
                }

                if ($barangay) {
                    $nameUpper = strtoupper($marker->marker_name);
                    $codeUpper = strtoupper($marker->code);
                    $type = 'Landmark';

                    if (str_contains($nameUpper, 'STREETLIGHT') || str_starts_with($codeUpper, 'SL-') || str_starts_with($codeUpper, 'POST-')) {
                        $type = 'Post / Streetlight';
                    } elseif (str_contains($nameUpper, 'BRIDGE') || str_starts_with($codeUpper, 'BRG-')) {
                        $type = 'Bridge';
                    } elseif (str_contains($nameUpper, 'BARANGAY HALL') || str_starts_with($codeUpper, 'BRGY-')) {
                        $type = 'Barangay Hall';
                    } elseif (str_contains($nameUpper, 'SCHOOL') || str_starts_with($codeUpper, 'SCH-')) {
                        $type = 'School';
                    } elseif (str_contains($nameUpper, 'HEALTH') || str_contains($nameUpper, 'HOSPITAL')) {
                        $type = 'Health Facility';
                    } elseif (str_contains($nameUpper, 'EVACUATION')) {
                        $type = 'Evacuation Center';
                    } elseif (str_contains($nameUpper, 'ROAD') || str_contains($nameUpper, 'HIGHWAY') || str_contains($nameUpper, 'JUNCTION')) {
                        $type = 'Road';
                    }

                    DB::table('location_codes')->insertOrIgnore([
                        'barangay_id' => $barangay->id,
                        'location_code' => $marker->code,
                        'location_type' => $type,
                        'location_name' => $marker->marker_name,
                        'location_description' => $marker->marker_description ?? $marker->description ?? null,
                        'location_latitude' => $marker->marker_latitude ?? $marker->latitude,
                        'location_longitude' => $marker->marker_longitude ?? $marker->longitude,
                        'created_at' => $marker->created_at ?? $now,
                        'updated_at' => $marker->updated_at ?? $now,
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('location_codes');
    }
};
