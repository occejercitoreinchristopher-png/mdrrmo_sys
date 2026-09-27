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
        if (Schema::hasColumn('dispatches', 'borrowed_crew')) {
            Schema::table('dispatches', function (Blueprint $table) {
                $table->dropColumn('borrowed_crew');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('dispatches', 'borrowed_crew')) {
            Schema::table('dispatches', function (Blueprint $table) {
                $table->json('borrowed_crew')->nullable()->after('crew_snapshot');
            });
        }
    }
};
