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
            $table->decimal('last_latitude', 10, 7)->nullable()->after('dispatch_status');
            $table->decimal('last_longitude', 10, 7)->nullable()->after('last_latitude');
            $table->decimal('last_heading', 6, 2)->nullable()->after('last_longitude');
            $table->decimal('last_accuracy', 8, 2)->nullable()->after('last_heading');
            $table->timestamp('last_location_updated_at')->nullable()->after('last_accuracy');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dispatches', function (Blueprint $table) {
            $table->dropColumn([
                'last_latitude',
                'last_longitude',
                'last_heading',
                'last_accuracy',
                'last_location_updated_at',
            ]);
        });
    }
};
