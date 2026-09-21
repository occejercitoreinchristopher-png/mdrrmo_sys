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
        // 1. Update responder_profiles table to support relievers and nullable team
        Schema::table('responder_profiles', function (Blueprint $table) {
            $table->boolean('is_reliever')->default(false)->after('badge_number');
            $table->string('team')->nullable()->change();
        });

        // 2. Create dispatch_crews table to track all assigned crew members per mission
        Schema::create('dispatch_crews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispatch_id')->constrained('dispatches')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('role', ['driver', 'emt'])->default('emt');
            $table->boolean('is_reliever')->default(false);
            $table->timestamps();

            $table->unique(['dispatch_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dispatch_crews');

        Schema::table('responder_profiles', function (Blueprint $table) {
            $table->dropColumn('is_reliever');
            $table->string('team')->nullable(false)->change();
        });
    }
};
