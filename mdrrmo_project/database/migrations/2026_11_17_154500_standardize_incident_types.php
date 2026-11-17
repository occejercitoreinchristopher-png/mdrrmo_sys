<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $standards = [
            'Medical Emergency' => 'Acute illness, cardiac arrest, difficulty breathing, stroke, trauma, allergic reactions, medical distress.',
            'Fire Emergency' => 'Structural fire, residential fire, forest/grass fire, electrical fire, chemical fire, explosion.',
            'Severe Weather / Flood' => 'Flash flood, storm surge, severe typhoon, river overflow, landslide danger, weather calamity.',
            'Crime & Security' => 'Physical assault, armed robbery, domestic dispute, civil disturbance, security threat, violence.',
            'Search & Rescue' => 'Drowning, river sweep, trapped individuals, collapsed structure, lost wilderness hikers, retrieval.',
        ];

        // 1. Harmonize variant names first if target name doesn't exist yet
        $hasSearchRescue = DB::table('incident_types')
            ->whereIn('incident_type_name', ['Search & Rescue', 'Search and Rescue'])
            ->exists();
        
        if (! DB::table('incident_types')->where('incident_type_name', 'Search & Rescue')->exists()) {
            DB::table('incident_types')
                ->where('incident_type_name', 'Search and Rescue')
                ->update(['incident_type_name' => 'Search & Rescue', 'updated_at' => now()]);
        }

        if (! DB::table('incident_types')->where('incident_type_name', 'Crime & Security')->exists()) {
            DB::table('incident_types')
                ->where('incident_type_name', 'Crime & Violence')
                ->update(['incident_type_name' => 'Crime & Security', 'updated_at' => now()]);
        }

        // 2. Handle 'Vehicular Accident' replacement by assigning whichever of the 5 standard types is missing
        $vehicularRow = DB::table('incident_types')->where('incident_type_name', 'Vehicular Accident')->first();
        if ($vehicularRow) {
            $currentNames = DB::table('incident_types')->pluck('incident_type_name')->toArray();
            $missingTarget = null;
            foreach (array_keys($standards) as $target) {
                if (! in_array($target, $currentNames)) {
                    $missingTarget = $target;
                    break;
                }
            }

            if ($missingTarget) {
                DB::table('incident_types')
                    ->where('id', $vehicularRow->id)
                    ->update([
                        'incident_type_name' => $missingTarget,
                        'type_description' => $standards[$missingTarget],
                        'updated_at' => now(),
                    ]);
            }
        }

        // 3. Ensure all 5 standard types exist and have updated descriptions
        foreach ($standards as $name => $desc) {
            $row = DB::table('incident_types')->where('incident_type_name', $name)->first();
            if ($row) {
                DB::table('incident_types')->where('id', $row->id)->update([
                    'type_description' => $desc,
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('incident_types')->insert([
                    'incident_type_name' => $name,
                    'type_description' => $desc,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
    }
};
