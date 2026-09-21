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
        Schema::table('incident_images', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('incident_id')->constrained('users')->nullOnDelete();
            $table->foreignId('dispatch_id')->nullable()->after('user_id')->constrained('dispatches')->nullOnDelete();
            $table->foreignId('patient_care_record_id')->nullable()->after('dispatch_id')->constrained('patient_care_records')->nullOnDelete();
            $table->decimal('latitude', 10, 8)->nullable()->after('image_path');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            $table->text('location_name')->nullable()->after('longitude');
            $table->timestamp('captured_at')->nullable()->after('location_name');
            $table->string('source')->default('resident')->after('captured_at'); // 'resident' or 'responder_pcr'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incident_images', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['dispatch_id']);
            $table->dropForeign(['patient_care_record_id']);
            $table->dropColumn([
                'user_id',
                'dispatch_id',
                'patient_care_record_id',
                'latitude',
                'longitude',
                'location_name',
                'captured_at',
                'source',
            ]);
        });
    }
};
