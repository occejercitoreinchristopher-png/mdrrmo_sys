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
        if (Schema::hasTable('incidents') && Schema::hasColumn('incidents', 'incident_description')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->text('incident_description')->change();
            });
        }

        if (Schema::hasTable('patient_care_records')) {
            Schema::table('patient_care_records', function (Blueprint $table) {
                if (Schema::hasColumn('patient_care_records', 'place_of_incident')) {
                    $table->string('place_of_incident', 255)->nullable()->change();
                }
                if (Schema::hasColumn('patient_care_records', 'clinical_chief_complaint')) {
                    $table->string('clinical_chief_complaint', 255)->nullable()->change();
                }
                if (Schema::hasColumn('patient_care_records', 'contact_number')) {
                    $table->string('contact_number', 30)->nullable()->change();
                }
                if (Schema::hasColumn('patient_care_records', 'disposition')) {
                    $table->string('disposition', 255)->nullable()->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('incidents') && Schema::hasColumn('incidents', 'incident_description')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->string('incident_description', 150)->change();
            });
        }

        if (Schema::hasTable('patient_care_records')) {
            Schema::table('patient_care_records', function (Blueprint $table) {
                if (Schema::hasColumn('patient_care_records', 'place_of_incident')) {
                    $table->string('place_of_incident', 100)->nullable()->change();
                }
                if (Schema::hasColumn('patient_care_records', 'clinical_chief_complaint')) {
                    $table->string('clinical_chief_complaint', 100)->nullable()->change();
                }
                if (Schema::hasColumn('patient_care_records', 'contact_number')) {
                    $table->string('contact_number', 11)->nullable()->change();
                }
                if (Schema::hasColumn('patient_care_records', 'disposition')) {
                    $table->string('disposition', 100)->nullable()->change();
                }
            });
        }
    }
};
