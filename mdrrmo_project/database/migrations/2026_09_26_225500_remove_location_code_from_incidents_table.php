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
        if (Schema::hasTable('incidents') && Schema::hasColumn('incidents', 'location_code')) {
            // 1. Ensure any row that had a location_code string has its location_code_id populated
            if (Schema::hasTable('location_codes') && Schema::hasColumn('incidents', 'location_code_id')) {
                DB::statement("
                    UPDATE incidents i
                    JOIN location_codes lc ON UPPER(TRIM(i.location_code)) = UPPER(TRIM(lc.location_code))
                    SET i.location_code_id = lc.id
                    WHERE i.location_code_id IS NULL AND i.location_code IS NOT NULL
                ");
            }

            // 2. Drop the redundant location_code varchar column
            Schema::table('incidents', function (Blueprint $table) {
                $table->dropColumn('location_code');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('incidents') && ! Schema::hasColumn('incidents', 'location_code')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->string('location_code', 100)->nullable()->after('incident_longitude');
            });

            // Re-populate from location_codes
            if (Schema::hasTable('location_codes') && Schema::hasColumn('incidents', 'location_code_id')) {
                DB::statement("
                    UPDATE incidents i
                    JOIN location_codes lc ON i.location_code_id = lc.id
                    SET i.location_code = lc.location_code
                    WHERE i.location_code IS NULL
                ");
            }
        }
    }
};
