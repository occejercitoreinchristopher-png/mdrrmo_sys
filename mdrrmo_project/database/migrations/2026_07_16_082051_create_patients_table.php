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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registered_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('patient_first_name', 100);
            $table->string('patient_middle_name', 100)->nullable();
            $table->string('patient_last_name', 100);

            $table->date('patient_birthdate')->nullable();

            $table->enum('patient_gender', [
                'male',
                'female',
            ])->nullable();

            $table->foreignId('barangay_id')
                ->nullable()
                ->constrained('barangays')
                ->nullOnDelete();

            $table->string('house_no')->nullable();
            $table->string('street')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
