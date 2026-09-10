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

            $table->foreignId('responder_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('ambulance_id')
                ->constrained('ambulances')
                ->restrictOnDelete();

            $table->enum('dispatch_status', [
                'assigned',
                'accepted',
                'en_route',
                'arrived_on_scene',
                'completed',
                'cancelled',
            ])->default('assigned');

            $table->timestamp('assigned_at');

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
