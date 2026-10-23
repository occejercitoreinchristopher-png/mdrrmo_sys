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
        Schema::table('patients', function (Blueprint $table) {
            if (! Schema::hasColumn('patients', 'is_unidentified')) {
                $table->boolean('is_unidentified')->default(false)->after('street');
            }
            if (! Schema::hasColumn('patients', 'identified_at')) {
                $table->timestamp('identified_at')->nullable()->after('is_unidentified');
            }
            if (! Schema::hasColumn('patients', 'identified_by_role')) {
                $table->string('identified_by_role', 50)->nullable()->after('identified_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (Schema::hasColumn('patients', 'identified_by_role')) {
                $table->dropColumn('identified_by_role');
            }
            if (Schema::hasColumn('patients', 'identified_at')) {
                $table->dropColumn('identified_at');
            }
            if (Schema::hasColumn('patients', 'is_unidentified')) {
                $table->dropColumn('is_unidentified');
            }
        });
    }
};
