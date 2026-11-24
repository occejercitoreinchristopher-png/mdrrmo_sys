<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('emergency_hotlines', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('short_label')->nullable();
            $table->string('phone_number');
            $table->string('description')->nullable();
            $table->string('icon_type')->default('siren');
            $table->string('accent_color')->default('#208AEF');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Seed initial default hotlines so existing resident numbers are preserved
        DB::table('emergency_hotlines')->insert([
            [
                'name' => 'Police',
                'short_label' => 'PNP',
                'phone_number' => '09358056370',
                'description' => 'Emergency & crime response',
                'icon_type' => 'police',
                'accent_color' => '#1D4ED8',
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Fire Dept.',
                'short_label' => 'BFP',
                'phone_number' => '09758429491',
                'description' => 'Fire & rescue operations',
                'icon_type' => 'fire',
                'accent_color' => '#C2410C',
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Health Dept.',
                'short_label' => 'RHU / DOH',
                'phone_number' => '0953678760',
                'description' => 'Medical & health emergencies',
                'icon_type' => 'medical',
                'accent_color' => '#059669',
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'OPOL RESQ',
                'short_label' => 'MDRRMO',
                'phone_number' => '0881234567',
                'description' => '24/7 disaster & emergency response',
                'icon_type' => 'siren',
                'accent_color' => '#208AEF',
                'is_active' => true,
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emergency_hotlines');
    }
};
