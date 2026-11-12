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
        if (Schema::hasTable('incidents') && Schema::hasColumn('incidents', 'rejection_reason')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->text('rejection_reason')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('incidents') && Schema::hasColumn('incidents', 'rejection_reason')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->string('rejection_reason', 100)->nullable()->change();
            });
        }
    }
};

