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
        Schema::table('patients', function (Blueprint $table) {
            if (! Schema::hasColumn('patients', 'house_no')) {
                $table->string('house_no')->nullable()->after('barangay_id');
            }
            if (! Schema::hasColumn('patients', 'street')) {
                $table->string('street')->nullable()->after('house_no');
            }
        });

        // Copy existing data from home_address to street if home_address column exists
        if (Schema::hasColumn('patients', 'home_address') && Schema::hasColumn('patients', 'street')) {
            DB::statement('UPDATE patients SET street = home_address WHERE street IS NULL AND home_address IS NOT NULL');
        }

        Schema::table('resident_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('resident_profiles', 'house_no')) {
                $table->string('house_no', 100)->nullable()->after('barangay_id');
            }
            if (! Schema::hasColumn('resident_profiles', 'street')) {
                $table->string('street', 100)->nullable()->after('house_no');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (Schema::hasColumn('patients', 'street')) {
                $table->dropColumn('street');
            }
            if (Schema::hasColumn('patients', 'house_no')) {
                $table->dropColumn('house_no');
            }
        });

        Schema::table('resident_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('resident_profiles', 'street')) {
                $table->dropColumn('street');
            }
            if (Schema::hasColumn('resident_profiles', 'house_no')) {
                $table->dropColumn('house_no');
            }
        });
    }
};
