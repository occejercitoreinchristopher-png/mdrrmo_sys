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
        Schema::create('incident_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')
                ->constrained('incidents')
                ->cascadeOnDelete();

            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('dispatch_id')->nullable()->constrained('dispatches')->nullOnDelete();
            $table->foreignId('patient_care_record_id')->nullable()->constrained('patient_care_records')->nullOnDelete();

            $table->string('image_path',200);
            $table->decimal('image_latitude', 10, 8)->nullable();
            $table->decimal('image_longitude', 11, 8)->nullable();
            $table->string('location_name',100)->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->string('source',100)->default('resident');

            $table->enum('capture_method', [
                'camera',
            ])->default('camera');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incident_images');
    }
};
