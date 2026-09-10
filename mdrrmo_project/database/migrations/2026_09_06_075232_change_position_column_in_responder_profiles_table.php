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
        Schema::table('responder_profiles', function (Blueprint $table) {
            $table->string('position')->default('driver')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('responder_profiles', function (Blueprint $table) {
            $table->enum('position', ['driver', 'emt'])->default('driver')->change();
        });
    }
};
