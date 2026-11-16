<?php

namespace Database\Seeders;

use App\Models\IncidentType;
use Illuminate\Database\Seeder;

class LocationMarkerSeeder extends Seeder
{
    public function run(): void
    {
        // Dummy markers (SL-001, POST-101, MKR-001, etc.) have been removed.
        // Location markers are populated directly from official Opol Electric Post & Bridge data via ElectricPostSeeder.

        // Seed standard incident types matching mobile app IDs
        $types = [
            1 => ['incident_type_name' => 'Medical Emergency', 'type_description' => 'Critical or acute medical conditions'],
            2 => ['incident_type_name' => 'Fire Emergency', 'type_description' => 'Structural, domestic, or brush fire'],
            3 => ['incident_type_name' => 'Vehicular Accident', 'type_description' => 'Road crash, motorcycle, or vehicular collision'],
            4 => ['incident_type_name' => 'Crime & Security', 'type_description' => 'Severe assault, theft, disturbance, or violence'],
            5 => ['incident_type_name' => 'Severe Weather / Flood', 'type_description' => 'Natural disaster, flash flood, landslide'],
        ];

        foreach ($types as $id => $t) {
            IncidentType::updateOrCreate(['id' => $id], $t);
        }
    }
}
