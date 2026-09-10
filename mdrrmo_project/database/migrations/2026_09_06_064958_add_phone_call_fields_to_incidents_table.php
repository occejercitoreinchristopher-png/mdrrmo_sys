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
        Schema::table('incidents', function (Blueprint $table) {
            $table->foreignId('resident_id')->nullable()->change();
            $table->decimal('reporter_latitude', 10, 7)->nullable()->change();
            $table->decimal('reporter_longitude', 10, 7)->nullable()->change();

            $table->string('caller_phone_number')->nullable()->after('resident_id');
            $table->string('chief_complaint')->nullable()->after('incident_type_id');
            $table->string('location_code')->nullable()->after('description');
            $table->string('place_of_incident')->nullable()->after('location_code');
            $table->string('incident_address')->nullable()->after('place_of_incident');
            $table->string('location_source')->default('resident_gps')->after('incident_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->dropColumn([
                'caller_phone_number',
                'chief_complaint',
                'location_code',
                'place_of_incident',
                'incident_address',
                'location_source',
            ]);
        });
    }
};
