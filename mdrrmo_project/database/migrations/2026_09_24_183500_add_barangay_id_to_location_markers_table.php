<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('location_markers')) {
            return;
        }

        // 1. Add barangay_id foreign key column
        if (! Schema::hasColumn('location_markers', 'barangay_id')) {
            Schema::table('location_markers', function (Blueprint $table) {
                $table->foreignId('barangay_id')->nullable()->after('marker_name')->constrained('barangays')->cascadeOnDelete();
            });
        }

        // 2. Map existing records from barangay_name to barangay_id
        if (Schema::hasColumn('location_markers', 'barangay_name')) {
            $barangays = DB::table('barangays')->get();
            $barangayMap = $barangays->keyBy(function ($item) {
                return strtolower(preg_replace('/[^a-z0-9]/', '', $item->barangay_name));
            });

            $defaultBarangayId = $barangays->firstWhere('barangay_name', 'Poblacion')?->id ?? $barangays->first()?->id;

            $markers = DB::table('location_markers')->get();
            foreach ($markers as $marker) {
                $nameKey = strtolower(preg_replace('/[^a-z0-9]/', '', $marker->barangay_name ?? ''));
                $matched = $barangayMap->get($nameKey);
                $bId = $matched?->id ?? $defaultBarangayId;

                if ($bId) {
                    DB::table('location_markers')
                        ->where('id', $marker->id)
                        ->update(['barangay_id' => $bId]);
                }
            }

            // 3. Drop redundant barangay_name column
            Schema::table('location_markers', function (Blueprint $table) {
                $table->dropColumn('barangay_name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('location_markers')) {
            return;
        }

        if (! Schema::hasColumn('location_markers', 'barangay_name')) {
            Schema::table('location_markers', function (Blueprint $table) {
                $table->string('barangay_name', 100)->nullable()->after('marker_name');
            });

            // Backfill barangay_name from barangays table
            if (Schema::hasColumn('location_markers', 'barangay_id')) {
                $markers = DB::table('location_markers')
                    ->join('barangays', 'location_markers.barangay_id', '=', 'barangays.id')
                    ->select('location_markers.id', 'barangays.barangay_name')
                    ->get();

                foreach ($markers as $marker) {
                    DB::table('location_markers')
                        ->where('id', $marker->id)
                        ->update(['barangay_name' => $marker->barangay_name]);
                }

                Schema::table('location_markers', function (Blueprint $table) {
                    $table->dropForeign(['barangay_id']);
                    $table->dropColumn('barangay_id');
                });
            }
        }
    }
};
