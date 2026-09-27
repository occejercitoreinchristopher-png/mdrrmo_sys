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
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resident_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnDelete();
            
            $table->string('caller_phone_number',11)->nullable();
            $table->string('caller_name',100)->nullable();

            $table->foreignId('incident_type_id')
                ->constrained('incident_types')
                ->restrictOnDelete();
            
            $table->string('reported_chief_complaint', 100)->nullable();

            $table->string('incident_description', 150);

            $table->decimal('incident_latitude', 10, 7);
            $table->decimal('incident_longitude', 10, 7);
            // location_code is relationally tracked via location_code_id foreign key
            $table->string('place_of_incident',100)->nullable();
            $table->string('incident_address',150)->nullable();
            $table->string('location_source',100)->default('resident_gps');
            $table->string('report_source',100)->default('resident_app');

            $table->decimal('reporter_latitude', 10, 7)->nullable();
            $table->decimal('reporter_longitude', 10, 7)->nullable();
            $table->boolean('has_location_accuracy')->default(false);

            $table->enum('incident_status', [
                'pending',
                'verified',
                'assigned',
                'responding',
                'resolved',
                'rejected',
                'cancelled',
            ])->default('pending');
            
            $table->enum('priority', ['Critical', 'High', 'Moderate'])->default('Moderate');

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('verification_remarks',100)->nullable();
            $table->string('rejection_reason',100)->nullable();
            $table->string('rejection_category',100)->nullable();
            $table->boolean('is_prank')->default(false)->index();

            $table->timestamp('reported_at');
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
