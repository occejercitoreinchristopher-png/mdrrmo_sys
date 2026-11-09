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
        // 1. Remove from resident_profiles table
        Schema::table('resident_profiles', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('resident_profiles', 'house_no')) {
                $columnsToDrop[] = 'house_no';
            }
            if (Schema::hasColumn('resident_profiles', 'street')) {
                $columnsToDrop[] = 'street';
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        // 2. Remove from patients table
        Schema::table('patients', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('patients', 'house_no')) {
                $columnsToDrop[] = 'house_no';
            }
            if (Schema::hasColumn('patients', 'street')) {
                $columnsToDrop[] = 'street';
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        // 3. Remove from users table if exists
        Schema::table('users', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('users', 'house_no')) {
                $columnsToDrop[] = 'house_no';
            }
            if (Schema::hasColumn('users', 'street')) {
                $columnsToDrop[] = 'street';
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resident_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('resident_profiles', 'house_no')) {
                $table->string('house_no', 100)->nullable()->after('barangay_id');
            }
            if (! Schema::hasColumn('resident_profiles', 'street')) {
                $table->string('street', 100)->nullable()->after('house_no');
            }
        });

        Schema::table('patients', function (Blueprint $table) {
            if (! Schema::hasColumn('patients', 'house_no')) {
                $table->string('house_no', 255)->nullable()->after('barangay_id');
            }
            if (! Schema::hasColumn('patients', 'street')) {
                $table->string('street', 255)->nullable()->after('house_no');
            }
        });
    }
};

