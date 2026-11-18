<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('heatmap_manual_pin_images')) {
            Schema::create('heatmap_manual_pin_images', function (Blueprint $table) {
                $table->id();
                $table->foreignId('heatmap_manual_pin_id')
                    ->constrained('heatmap_manual_pins')
                    ->cascadeOnDelete();
                $table->string('pin_image_path', 255);
                $table->boolean('is_grayscale')->default(false);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('heatmap_manual_pin_images');
    }
};
