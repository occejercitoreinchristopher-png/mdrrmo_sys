<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('heatmap_manual_pins')) {
            Schema::create('heatmap_manual_pins', function (Blueprint $table) {
                $table->id();
                $table->foreignId('incident_type_id')->nullable()->constrained('incident_types')->nullOnDelete();
                $table->string('custom_pin_type', 100)->nullable();
                $table->foreignId('barangay_id')->nullable()->constrained('barangays')->nullOnDelete();
                $table->string('pin_address', 255);
                $table->decimal('pin_latitude', 10, 7);
                $table->decimal('pin_longitude', 10, 7);
                $table->string('pin_description', 255)->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('heatmap_manual_pins');
    }
};
