<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('patient_care_records')) {
            Schema::table('patient_care_records', function (Blueprint $table) {
                $columnsToDrop = [];
                if (Schema::hasColumn('patient_care_records', 'dispatch_time')) {
                    $columnsToDrop[] = 'dispatch_time';
                }
                if (Schema::hasColumn('patient_care_records', 'en_route_time')) {
                    $columnsToDrop[] = 'en_route_time';
                }
                if (Schema::hasColumn('patient_care_records', 'on_scene_time')) {
                    $columnsToDrop[] = 'on_scene_time';
                }

                if (! empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('patient_care_records')) {
            Schema::table('patient_care_records', function (Blueprint $table) {
                if (! Schema::hasColumn('patient_care_records', 'dispatch_time')) {
                    $table->time('dispatch_time')->nullable()->after('nature_of_call');
                }
                if (! Schema::hasColumn('patient_care_records', 'en_route_time')) {
                    $table->time('en_route_time')->nullable()->after('dispatch_time');
                }
                if (! Schema::hasColumn('patient_care_records', 'on_scene_time')) {
                    $table->time('on_scene_time')->nullable()->after('en_route_time');
                }
            });
        }
    }
};
