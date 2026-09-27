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
        Schema::create('dispatches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')
                ->constrained('incidents')
                ->cascadeOnDelete();

            $table->foreignId('dispatcher_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('ambulance_id')
                ->constrained('ambulances')
                ->restrictOnDelete();

            $table->string('team',50)->nullable();

            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('emt_id')->nullable()->constrained('users')->nullOnDelete();

            $table->json('crew_snapshot')->nullable();

            $table->enum('dispatch_status', [
                'assigned',
                'accepted',
                'en_route',
                'arrived_on_scene',
                'completed',
                'cancelled',
            ])->default('assigned');

            $table->decimal('last_latitude', 10, 7)->nullable();
            $table->decimal('last_longitude', 10, 7)->nullable();
            $table->decimal('last_heading', 6, 2)->nullable();
            $table->decimal('last_accuracy', 8, 2)->nullable();
            $table->timestamp('last_location_updated_at')->nullable();

            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('en_route_at')->nullable();
            $table->timestamp('arrived_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dispatches');
    }
};
