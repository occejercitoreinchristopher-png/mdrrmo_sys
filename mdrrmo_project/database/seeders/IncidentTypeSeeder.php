<?php

namespace Database\Seeders;

use App\Models\IncidentType;
use Illuminate\Database\Seeder;

class IncidentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'id' => 1,
                'incident_type_name' => 'Medical Emergency',
                'type_description' => 'Acute illness, cardiac arrest, difficulty breathing, stroke, trauma, allergic reactions, medical distress.',
            ],
            [
                'id' => 2,
                'incident_type_name' => 'Fire Emergency',
                'type_description' => 'Structural fire, residential fire, forest/grass fire, electrical fire, chemical fire, explosion.',
            ],
            [
                'id' => 3,
                'incident_type_name' => 'Vehicular Accident',
                'type_description' => 'Motor vehicle collision, motorcycle crash, pedestrian hit-and-run, road rollover, highway trauma.',
            ],
            [
                'id' => 4,
                'incident_type_name' => 'Crime & Violence',
                'type_description' => 'Physical assault, armed robbery, domestic dispute, civil disturbance, stabbing, shooting incident.',
            ],
            [
                'id' => 5,
                'incident_type_name' => 'Search and Rescue',
                'type_description' => 'Drowning, river current sweep, trapped individuals, landslide rescue, lost wilderness hikers, collapsed structure.',
            ],
        ];

        foreach ($types as $type) {
            IncidentType::updateOrCreate(
                ['id' => $type['id']],
                [
                    'incident_type_name' => $type['incident_type_name'],
                    'type_description' => $type['type_description'],
                ]
            );
        }
    }
}

