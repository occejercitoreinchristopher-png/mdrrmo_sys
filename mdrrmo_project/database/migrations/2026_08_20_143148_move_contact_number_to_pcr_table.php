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
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn('contact_number');
        });

        Schema::table('patient_care_records', function (Blueprint $table) {
            $table->string('contact_number')->nullable()->after('gender'); // or any logical place
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_care_records', function (Blueprint $table) {
            $table->dropColumn('contact_number');
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->string('contact_number')->nullable();
        });
    }
};
