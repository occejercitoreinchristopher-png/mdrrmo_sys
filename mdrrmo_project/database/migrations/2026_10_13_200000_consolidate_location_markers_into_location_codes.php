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
        // 1. Ensure any remaining markers from location_markers exist in location_codes
        if (Schema::hasTable('location_markers') && Schema::hasTable('location_codes')) {
            $existingMarkers = DB::table('location_markers')->get();
            $now = now();
            $defaultBarangayId = DB::table('barangays')->value('id') ?? 1;

            foreach ($existingMarkers as $marker) {
                $code = $marker->code ?? null;
                if (! $code) continue;

                $exists = DB::table('location_codes')->where('location_code', $code)->exists();
                if (! $exists) {
                    $barangayId = $marker->barangay_id ?? $defaultBarangayId;
                    DB::table('location_codes')->insert([
                        'barangay_id' => $barangayId,
                        'location_code' => $code,
                        'location_type' => 'Landmark',
                        'location_name' => $marker->marker_name ?? $code,
                        'location_description' => $marker->marker_description ?? $marker->description ?? null,
                        'location_latitude' => $marker->marker_latitude ?? $marker->latitude ?? 0,
                        'location_longitude' => $marker->marker_longitude ?? $marker->longitude ?? 0,
                        'created_at' => $marker->created_at ?? $now,
                        'updated_at' => $marker->updated_at ?? $now,
                    ]);
                }
            }

            // 2. Drop the redundant location_markers table
            Schema::dropIfExists('location_markers');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('location_markers')) {
            Schema::create('location_markers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('barangay_id')->nullable()->constrained('barangays')->nullOnDelete();
                $table->string('code')->unique();
                $table->string('marker_name');
                $table->text('marker_description')->nullable();
                $table->decimal('marker_latitude', 10, 7);
                $table->decimal('marker_longitude', 10, 7);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }
};
