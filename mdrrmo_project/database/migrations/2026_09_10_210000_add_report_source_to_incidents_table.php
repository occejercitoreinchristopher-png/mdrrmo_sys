<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->string('report_source')->default('resident_app')->after('location_source');
        });

        // Backfill existing incidents based on recorded metadata
        // 1. Walk-In incidents
        DB::table('incidents')
            ->where('description', 'like', '%Walk-In%')
            ->orWhere('place_of_incident', 'like', '%Walk-In%')
            ->update(['report_source' => 'walk_in']);

        // 2. Dispatcher phone-in reports
        DB::table('incidents')
            ->where('report_source', '!=', 'walk_in')
            ->where(function ($query) {
                $query->whereNotNull('caller_phone_number')
                    ->orWhereIn('location_source', ['location_code', 'search_pinpoint', 'phone_call'])
                    ->orWhere('description', 'like', 'Reported via Phone%');
            })
            ->update(['report_source' => 'dispatcher']);

        // 3. All remaining default to resident_app
        DB::table('incidents')
            ->whereNull('report_source')
            ->update(['report_source' => 'resident_app']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->dropColumn('report_source');
        });
    }
};
