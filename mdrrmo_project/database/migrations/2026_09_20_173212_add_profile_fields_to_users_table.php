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
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'gender')) {
                $table->string('gender')->nullable()->after('last_name');
            }
            if (! Schema::hasColumn('users', 'address')) {
                $table->string('address')->nullable()->after('phone_number');
            }
            if (! Schema::hasColumn('users', 'zip_code')) {
                $table->string('zip_code')->nullable()->after('address');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $drop = [];
            if (Schema::hasColumn('users', 'gender')) {
                $drop[] = 'gender';
            }
            if (Schema::hasColumn('users', 'address')) {
                $drop[] = 'address';
            }
            if (Schema::hasColumn('users', 'zip_code')) {
                $drop[] = 'zip_code';
            }
            if (! empty($drop)) {
                $table->dropColumn($drop);
            }
        });
    }
};
