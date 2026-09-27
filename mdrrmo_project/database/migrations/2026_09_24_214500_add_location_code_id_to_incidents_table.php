<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Sync any markers from location_markers to location_codes so no data is missing
        if (Schema::hasTable('location_markers') && Schema::hasTable('location_codes')) {
            $existingMarkers = DB::table('location_markers')->get();
            $now = now();

            foreach ($existingMarkers as $marker) {
                $code = $marker->code;
                $exists = DB::table('location_codes')->where('location_code', $code)->first();

                if (! $exists) {
                    $barangayId = $marker->barangay_id ?? null;
                    if (! $barangayId) {
                        $pob = DB::table('barangays')->where('barangay_name', 'Poblacion')->first();
                        $barangayId = $pob?->id ?? DB::table('barangays')->value('id');
                    }

                    $nameUpper = strtoupper($marker->marker_name ?? '');
                    $codeUpper = strtoupper($code ?? '');
                    $type = 'Post / Streetlight';

                    if (str_starts_with($codeUpper, 'MKR-') || str_contains($nameUpper, 'EMERGENCY')) {
                        $type = 'Emergency Marker';
                    } elseif (str_contains($nameUpper, 'BRIDGE')) {
                        $type = 'Bridge';
                    } elseif (str_contains($nameUpper, 'SCHOOL')) {
                        $type = 'School';
                    }

                    DB::table('location_codes')->insert([
                        'barangay_id' => $barangayId,
                        'location_code' => $code,
                        'location_type' => $type,
                        'location_name' => $marker->marker_name ?? $code,
                        'location_description' => $marker->marker_description ?? $marker->description ?? null,
                        'location_latitude' => $marker->marker_latitude ?? $marker->latitude ?? 0,
                        'location_longitude' => $marker->marker_longitude ?? $marker->longitude ?? 0,
                        'created_at' => $marker->created_at ?? $now,
                        'updated_at' => $marker->updated_at ?? $now,
                    ]);
                }
            }
        }

        // 2. Add location_code_id to incidents table as a foreign key
        if (Schema::hasTable('incidents') && ! Schema::hasColumn('incidents', 'location_code_id')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->foreignId('location_code_id')
                    ->nullable()
                    ->after('incident_longitude')
                    ->constrained('location_codes')
                    ->nullOnDelete();
            });

            // 3. Link any existing incidents with location_code to the matching location_code_id
            $incidents = DB::table('incidents')->whereNotNull('location_code')->get();
            foreach ($incidents as $inc) {
                $loc = DB::table('location_codes')->where('location_code', $inc->location_code)->first();
                if ($loc) {
                    DB::table('incidents')->where('id', $inc->id)->update([
                        'location_code_id' => $loc->id,
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
        if (Schema::hasTable('incidents') && Schema::hasColumn('incidents', 'location_code_id')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->dropForeign(['location_code_id']);
                $table->dropColumn('location_code_id');
            });
        }
    }
};
