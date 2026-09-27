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
        if (Schema::hasTable('patient_care_records') && Schema::hasColumn('patient_care_records', 'responders')) {
            Schema::table('patient_care_records', function (Blueprint $table) {
                $table->dropColumn('responders');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('patient_care_records') && ! Schema::hasColumn('patient_care_records', 'responders')) {
            Schema::table('patient_care_records', function (Blueprint $table) {
                $table->string('responders', 100)->nullable()->after('disposition');
            });
        }
    }
};
