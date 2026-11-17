<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $types = [
            1 => [
                'incident_type_name' => 'Medical Emergency',
                'type_description' => 'Acute illness, cardiac arrest, difficulty breathing, stroke, trauma, allergic reactions, medical distress.',
            ],
            2 => [
                'incident_type_name' => 'Fire Emergency',
                'type_description' => 'Structural fire, residential fire, forest/grass fire, electrical fire, chemical fire, explosion.',
            ],
            3 => [
                'incident_type_name' => 'Severe Weather / Flood',
                'type_description' => 'Flash flood, storm surge, severe typhoon, river overflow, landslide danger, weather calamity.',
            ],
            4 => [
                'incident_type_name' => 'Crime & Security',
                'type_description' => 'Physical assault, armed robbery, domestic dispute, civil disturbance, security threat, violence.',
            ],
            5 => [
                'incident_type_name' => 'Search & Rescue',
                'type_description' => 'Drowning, river sweep, trapped individuals, collapsed structure, lost wilderness hikers, retrieval.',
            ],
        ];

        foreach ($types as $id => $data) {
            DB::table('incident_types')->updateOrInsert(
                ['id' => $id],
                [
                    'incident_type_name' => $data['incident_type_name'],
                    'type_description' => $data['type_description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }

    public function down(): void
    {
        // Keep non-destructive
    }
};
