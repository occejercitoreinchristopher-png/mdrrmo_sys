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
        Schema::table('resident_profiles', function (Blueprint $table) {
            // Modify existing columns to be nullable if needed
            $table->foreignId('barangay_id')->nullable()->change();
            $table->date('birthdate')->nullable()->change();
            $table->string('gender')->nullable()->change();

            // Add Emergency Information fields
            $table->string('emergency_contact_name')->nullable()->after('gender');
            $table->string('emergency_contact_number')->nullable()->after('emergency_contact_name');
            $table->string('emergency_contact_relationship')->nullable()->after('emergency_contact_number');
            $table->string('blood_type', 10)->nullable()->after('emergency_contact_relationship');
            $table->text('allergies')->nullable()->after('blood_type');
            $table->text('medical_notes')->nullable()->after('allergies');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resident_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'emergency_contact_name',
                'emergency_contact_number',
                'emergency_contact_relationship',
                'blood_type',
                'allergies',
                'medical_notes',
            ]);
        });
    }
};
