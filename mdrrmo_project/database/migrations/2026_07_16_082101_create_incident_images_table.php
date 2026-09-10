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
        Schema::create('incident_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')
                ->constrained('incidents')
                ->cascadeOnDelete();

            $table->string('image_path');

            $table->enum('capture_method', [
                'camera',
            ])->default('camera');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incident_images');
    }
};
