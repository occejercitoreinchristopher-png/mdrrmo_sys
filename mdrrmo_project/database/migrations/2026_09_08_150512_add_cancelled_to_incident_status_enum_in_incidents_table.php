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
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE incidents MODIFY COLUMN incident_status ENUM('pending', 'verified', 'assigned', 'responding', 'resolved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE incidents MODIFY COLUMN incident_status ENUM('pending', 'verified', 'assigned', 'responding', 'resolved', 'rejected') NOT NULL DEFAULT 'pending'");
        }
    }
};
