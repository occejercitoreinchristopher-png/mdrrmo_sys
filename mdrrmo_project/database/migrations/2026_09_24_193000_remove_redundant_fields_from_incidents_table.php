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
        if (! Schema::hasTable('incidents')) {
            return;
        }

        // 1. Expand incident_address length to 255 to comfortably hold merged location & landmark
        if (Schema::hasColumn('incidents', 'incident_address')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->string('incident_address', 255)->nullable()->change();
            });
        }

        // 2. Merge existing place_of_incident data into incident_address so no data is lost
        if (Schema::hasColumn('incidents', 'place_of_incident') && Schema::hasColumn('incidents', 'incident_address')) {
            $incidents = DB::table('incidents')->get();
            foreach ($incidents as $inc) {
                $place = trim($inc->place_of_incident ?? '');
                $addr = trim($inc->incident_address ?? '');

                if ($place !== '' && $addr === '') {
                    $merged = $place;
                } elseif ($place !== '' && $addr !== '' && stripos($addr, $place) === false) {
                    $merged = $place . ', ' . $addr;
                } else {
                    $merged = $addr !== '' ? $addr : ($place !== '' ? $place : null);
                }

                if ($merged !== $inc->incident_address) {
                    DB::table('incidents')->where('id', $inc->id)->update([
                        'incident_address' => $merged,
                    ]);
                }
            }
        }

        // 3. Drop redundant columns from incidents table
        Schema::table('incidents', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('incidents', 'reported_chief_complaint')) {
                $columnsToDrop[] = 'reported_chief_complaint';
            }
            if (Schema::hasColumn('incidents', 'place_of_incident')) {
                $columnsToDrop[] = 'place_of_incident';
            }

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('incidents')) {
            return;
        }

        Schema::table('incidents', function (Blueprint $table) {
            if (! Schema::hasColumn('incidents', 'reported_chief_complaint')) {
                $table->string('reported_chief_complaint', 100)->nullable()->after('incident_type_id');
            }
            if (! Schema::hasColumn('incidents', 'place_of_incident')) {
                $table->string('place_of_incident', 100)->nullable()->after('location_code');
            }
        });

        // Copy incident_address back into place_of_incident
        if (Schema::hasColumn('incidents', 'place_of_incident') && Schema::hasColumn('incidents', 'incident_address')) {
            DB::table('incidents')->update([
                'place_of_incident' => DB::raw('incident_address'),
            ]);
        }
    }
};
