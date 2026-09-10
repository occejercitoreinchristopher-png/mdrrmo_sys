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
        Schema::create('patient_care_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispatch_id')
                ->constrained('dispatches')
                ->cascadeOnDelete();

            $table->foreignId('patient_id')
                ->constrained('patients')
                ->restrictOnDelete();

            // Patient Information
            $table->date('record_date')->nullable();
            $table->string('caller_no')->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->enum('civil_status', ['single', 'married', 'widowed', 'child', 'separated'])->nullable();
            $table->string('place_of_incident')->nullable();
            $table->string('chief_complaint')->nullable();
            $table->enum('nature_of_call', ['emergency', 'transport', 'standby', 'non-emergency', 'medical assistance'])->nullable();

            // Times
            $table->time('dispatch_time')->nullable();
            $table->time('en_route_time')->nullable();
            $table->time('on_scene_time')->nullable();
            $table->time('transport_time')->nullable();
            $table->time('arrived_hf_time')->nullable();
            $table->time('departed_hf_time')->nullable();

            // Clinical / Assessment (Using JSON to keep it concise)
            $table->json('assessment')->nullable();
            $table->json('vital_signs')->nullable();
            $table->json('glasgow_coma_scale')->nullable();

            $table->text('special_instructions')->nullable();

            // Incident/Patient Disposition
            $table->string('disposition')->nullable();

            // Footer Info
            $table->string('responders')->nullable();
            $table->boolean('transported')->default(false);
            $table->string('transported_to')->nullable();
            $table->string('received_by')->nullable();
            $table->boolean('waiver_signed')->default(false);
            $table->string('witness_name')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_care_records');
    }
};
