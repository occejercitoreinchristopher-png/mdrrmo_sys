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
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('incident_type_id')
                ->constrained('incident_types')
                ->restrictOnDelete();

            $table->text('description');

            $table->decimal('incident_latitude', 10, 7);
            $table->decimal('incident_longitude', 10, 7);

            $table->decimal('reporter_latitude', 10, 7);
            $table->decimal('reporter_longitude', 10, 7);

            $table->enum('incident_status', [
                'pending',
                'verified',
                'assigned',
                'responding',
                'resolved',
                'rejected',
            ])->default('pending');

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('verification_remarks')->nullable();

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
