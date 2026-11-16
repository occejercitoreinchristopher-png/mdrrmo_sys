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
        Schema::table('dispatches', function (Blueprint $table) {
            if (!Schema::hasColumn('dispatches', 'acknowledgment_status')) {
                $table->string('acknowledgment_status', 30)->default('pending')->after('dispatch_status');
            }
            if (!Schema::hasColumn('dispatches', 'acknowledged_at')) {
                $table->timestamp('acknowledged_at')->nullable()->after('acknowledgment_status');
            }
            if (!Schema::hasColumn('dispatches', 'acknowledged_by')) {
                $table->foreignId('acknowledged_by')->nullable()->after('acknowledged_at')->constrained('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dispatches', function (Blueprint $table) {
            if (Schema::hasColumn('dispatches', 'acknowledged_by')) {
                $table->dropForeign(['acknowledged_by']);
                $table->dropColumn('acknowledged_by');
            }
            if (Schema::hasColumn('dispatches', 'acknowledged_at')) {
                $table->dropColumn('acknowledged_at');
            }
            if (Schema::hasColumn('dispatches', 'acknowledgment_status')) {
                $table->dropColumn('acknowledgment_status');
            }
        });
    }
};
