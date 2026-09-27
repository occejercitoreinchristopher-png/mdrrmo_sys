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
        Schema::create('location_markers', function (Blueprint $table) {
            $table->id();
            $table->string('code',50)->unique()->index();
            $table->string('marker_name',100);
            $table->string('barangay_name',100);
            $table->decimal('marker_latitude', 10, 7);
            $table->decimal('marker_longitude', 10, 7);
            $table->string('marker_description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('location_markers');
    }
};
