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
        Schema::table('incidents', function (Blueprint $table) {
            $table->index(['incident_status', 'reported_at'], 'incidents_status_reported_at_index');
            $table->index('reported_at', 'incidents_reported_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->dropIndex('incidents_status_reported_at_index');
            $table->dropIndex('incidents_reported_at_index');
        });
    }
};
