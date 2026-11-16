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
        if (!Schema::hasTable('system_notifications')) {
            Schema::create('system_notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
                $table->foreignId('incident_id')->nullable()->constrained('incidents')->nullOnDelete();
                $table->foreignId('dispatch_id')->nullable()->constrained('dispatches')->nullOnDelete();
                $table->string('title');
                $table->text('message');
                $table->string('type')->default('dispatch_assigned'); // dispatch_assigned, incident_verified, system
                $table->string('status')->default('unread'); // unread, read, accepted, declined, expired
                $table->json('data')->nullable(); // metadata: coordinates, barangay, incident_type, etc.
                $table->timestamp('read_at')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'status']);
                $table->index(['dispatch_id', 'user_id']);
            });
        }

        if (!Schema::hasTable('fcm_device_tokens')) {
            Schema::create('fcm_device_tokens', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('token', 500)->unique();
                $table->string('device_type')->default('android'); // android, ios, web
                $table->string('device_name')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamp('last_used_at')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'is_active']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fcm_device_tokens');
        Schema::dropIfExists('system_notifications');
    }
};
