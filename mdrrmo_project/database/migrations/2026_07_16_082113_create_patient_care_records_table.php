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
            $table->string('caller_no',11)->nullable();
            $table->string('contact_number',11)->nullable();
            $table->enum('civil_status', ['single', 'married', 'widowed', 'child', 'separated'])->nullable();
            $table->string('place_of_incident',100)->nullable();
            $table->string('clinical_chief_complaint', 100)->nullable();
            $table->enum('nature_of_call', ['emergency', 'transport', 'standby', 'non-emergency', 'medical assistance'])->nullable();

            // Times: Operational response times (dispatch, en-route, arrived on-scene) are tracked on dispatches table
            // Hospital transport and arrival times are recorded here for patient transfer
            $table->time('transport_time')->nullable();
            $table->time('arrived_hf_time')->nullable();
            $table->time('departed_hf_time')->nullable();

            // Clinical / Assessment (Using JSON to keep it concise)
            $table->json('assessment')->nullable();
            $table->json('assessment_markers')->nullable();
            $table->json('vital_signs')->nullable();
            $table->json('glasgow_coma_scale')->nullable();

            $table->text('special_instructions')->nullable();

            // Incident/Patient Disposition
            $table->string('disposition',100)->nullable();

            // Footer Info
            // Responders are retrieved relationally via dispatch -> crews / driver / emt
            $table->boolean('transported')->default(false);
            $table->string('transported_to',100)->nullable();
            $table->string('received_by',100)->nullable();
            $table->boolean('waiver_signed')->default(false);
            $table->string('witness_name',100)->nullable();
            $table->longText('patient_signature')->nullable();
            $table->longText('witness_signature')->nullable();
            $table->longText('waiver_signature')->nullable();

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
