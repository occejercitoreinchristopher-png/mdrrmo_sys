<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('emergency_complaints')) {
            Schema::create('emergency_complaints', function (Blueprint $table) {
                $table->id();
                $table->string('category', 100);
                $table->string('complaint_name', 150);
                $table->text('description')->nullable();
                $table->timestamps();

                $table->unique(['category', 'complaint_name']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('emergency_complaints');
    }
};
