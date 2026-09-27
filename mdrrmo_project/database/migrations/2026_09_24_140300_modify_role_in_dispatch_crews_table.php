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
        Schema::table('dispatch_crews', function (Blueprint $table) {
            $table->string('role', 50)->default('emt')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dispatch_crews', function (Blueprint $table) {
            $table->enum('role', ['driver', 'emt'])->default('emt')->change();
        });
    }
};
