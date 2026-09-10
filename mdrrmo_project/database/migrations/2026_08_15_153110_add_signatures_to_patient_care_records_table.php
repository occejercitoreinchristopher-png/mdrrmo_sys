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
        Schema::table('patient_care_records', function (Blueprint $table) {
            $table->longText('patient_signature')->nullable()->after('witness_name');
            $table->longText('witness_signature')->nullable()->after('patient_signature');
            $table->longText('waiver_signature')->nullable()->after('witness_signature');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_care_records', function (Blueprint $table) {
            $table->dropColumn(['patient_signature', 'witness_signature', 'waiver_signature']);
        });
    }
};
