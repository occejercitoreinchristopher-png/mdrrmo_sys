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
        if (Schema::hasTable('ambulances') && Schema::hasColumn('ambulances', 'team_leader_id')) {
            Schema::table('ambulances', function (Blueprint $table) {
                $table->dropForeign(['team_leader_id']);
                $table->dropColumn('team_leader_id');
            });
        }

        if (Schema::hasTable('dispatches') && Schema::hasColumn('dispatches', 'team_leader_id')) {
            Schema::table('dispatches', function (Blueprint $table) {
                $table->dropForeign(['team_leader_id']);
                $table->dropColumn('team_leader_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('ambulances') && ! Schema::hasColumn('ambulances', 'team_leader_id')) {
            Schema::table('ambulances', function (Blueprint $table) {
                $table->foreignId('team_leader_id')->nullable()->after('driver_id')->constrained('users')->nullOnDelete();
            });
        }

        if (Schema::hasTable('dispatches') && ! Schema::hasColumn('dispatches', 'team_leader_id')) {
            Schema::table('dispatches', function (Blueprint $table) {
                $table->foreignId('team_leader_id')->nullable()->after('driver_id')->constrained('users')->nullOnDelete();
            });
        }
    }
};
