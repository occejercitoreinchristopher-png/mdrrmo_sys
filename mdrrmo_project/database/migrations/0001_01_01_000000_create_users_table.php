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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name',100);
            $table->string('middle_name',100)->nullable();
            $table->string('last_name',100);
            $table->enum('gender', ['Male', 'Female', 'Other'])->nullable();
            $table->date('birthdate')->nullable();
            $table->integer('age')->nullable();

            $table->string('email',100);
            $table->string('profile_photo_path', 255)->nullable();
            $table->timestamp('email_verified_at')->nullable();

            $table->string('phone_number', 20)->nullable();
            $table->string('address',150)->nullable();
            $table->string('zip_code',10)->nullable();

            $table->string('password',100);
            $table->boolean('password_change_required')->default(false);
            $table->timestamp('temporary_password_expires_at')->nullable();

            $table->enum('role', [
                'admin',
                'dispatcher',
                'responder',
                'resident',
            ]);

            $table->enum('status', [
                'active',
                'inactive',
                'suspended',
            ])->default('active');

            $table->rememberToken();
            $table->string('expo_push_token')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email',100)->primary();
            $table->string('token',100);
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
