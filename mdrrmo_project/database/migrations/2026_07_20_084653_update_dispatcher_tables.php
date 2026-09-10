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
        // 1. Update Ambulances to include a default crew
        Schema::table('ambulances', function (Blueprint $table) {
            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('team_leader_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('emt_id')->nullable()->constrained('users')->nullOnDelete();
        });

        // 2. Update Dispatches to replace responder_id with a full crew and snapshot
        Schema::table('dispatches', function (Blueprint $table) {
            $table->dropForeign(['responder_id']);
            $table->dropColumn('responder_id');

            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('team_leader_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('emt_id')->nullable()->constrained('users')->nullOnDelete();

            $table->json('crew_snapshot')->nullable();
        });

        // 3. Update Incidents to add a rejection reason
        Schema::table('incidents', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable();
        });

        // 4. Note: Updating enum in SQLite is tricky, but Laravel 11 handles it mostly well or we can just change how we define it.
        // Actually, SQLite doesn't natively support ENUMs, so string columns are often used instead by Laravel, or check constraints.
        // If we can't easily alter enum, we might drop and recreate the column, or since it's SQLite maybe it's just a varchar.
        // Let's modify it to string to avoid Doctrine issues.
        Schema::table('responder_profiles', function (Blueprint $table) {
            // Drop enum constraint if it exists and change to string to allow more statuses
            // For sqlite, best way is to just let it be if it's stored as varchar, but we should alter it to string.
            $table->string('availability')->default('available')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('responder_profiles', function (Blueprint $table) {
            // Revert
        });

        Schema::table('incidents', function (Blueprint $table) {
            $table->dropColumn('rejection_reason');
        });

        Schema::table('dispatches', function (Blueprint $table) {
            $table->dropForeign(['driver_id']);
            $table->dropForeign(['team_leader_id']);
            $table->dropForeign(['emt_id']);
            $table->dropColumn(['driver_id', 'team_leader_id', 'emt_id', 'crew_snapshot']);
            $table->foreignId('responder_id')->nullable()->constrained('users');
        });

        Schema::table('ambulances', function (Blueprint $table) {
            $table->dropForeign(['driver_id']);
            $table->dropForeign(['team_leader_id']);
            $table->dropForeign(['emt_id']);
            $table->dropColumn(['driver_id', 'team_leader_id', 'emt_id']);
        });
    }
};
