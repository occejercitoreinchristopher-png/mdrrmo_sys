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
        Schema::table('heatmap_manual_pins', function (Blueprint $table) {
            if (! Schema::hasColumn('heatmap_manual_pins', 'area_name')) {
                $table->string('area_name', 150)->nullable()->after('id');
            }
            if (! Schema::hasColumn('heatmap_manual_pins', 'geometry_type')) {
                $table->string('geometry_type', 20)->default('POINT')->after('area_name');
            }
            if (! Schema::hasColumn('heatmap_manual_pins', 'polygon_coordinates')) {
                $table->json('polygon_coordinates')->nullable()->after('geometry_type');
            }
            if (! Schema::hasColumn('heatmap_manual_pins', 'risk_level')) {
                $table->string('risk_level', 50)->nullable()->default('Moderate')->after('custom_pin_type');
            }
        });

        // Make coordinates and address nullable to seamlessly support polygons without required street address
        Schema::table('heatmap_manual_pins', function (Blueprint $table) {
            $table->decimal('pin_latitude', 10, 7)->nullable()->change();
            $table->decimal('pin_longitude', 10, 7)->nullable()->change();
            $table->string('pin_address', 255)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('heatmap_manual_pins', function (Blueprint $table) {
            if (Schema::hasColumn('heatmap_manual_pins', 'area_name')) {
                $table->dropColumn('area_name');
            }
            if (Schema::hasColumn('heatmap_manual_pins', 'geometry_type')) {
                $table->dropColumn('geometry_type');
            }
            if (Schema::hasColumn('heatmap_manual_pins', 'polygon_coordinates')) {
                $table->dropColumn('polygon_coordinates');
            }
            if (Schema::hasColumn('heatmap_manual_pins', 'risk_level')) {
                $table->dropColumn('risk_level');
            }
        });
    }
};
