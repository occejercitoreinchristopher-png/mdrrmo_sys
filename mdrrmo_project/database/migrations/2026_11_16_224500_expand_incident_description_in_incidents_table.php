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
    }
};
