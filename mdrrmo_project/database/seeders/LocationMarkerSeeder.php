<?php

namespace Database\Seeders;

use App\Models\IncidentType;
use App\Models\LocationMarker;
use Illuminate\Database\Seeder;

class LocationMarkerSeeder extends Seeder
{
    public function run(): void
    {
        $markers = [
            [
                'code' => 'SL-001',
                'marker_name' => 'Streetlight 001',
                'barangay' => 'Poblacion',
                'latitude' => 8.5312000,
                'longitude' => 124.5695000,
                'description' => 'Near Barangay Hall & Town Plaza',
                'is_active' => true,
            ],
            [
                'code' => 'SL-002',
                'marker_name' => 'Streetlight 002',
                'barangay' => 'Poblacion',
                'latitude' => 8.5325000,
                'longitude' => 124.5710000,
                'description' => 'Near Public Market & Bus Terminal',
                'is_active' => true,
            ],
            [
                'code' => 'POST-101',
                'marker_name' => 'Post 101',
                'barangay' => 'Baybay',
                'latitude' => 8.5380000,
                'longitude' => 124.5650000,
                'description' => 'Near Coastal Port & Fish Landing',
                'is_active' => true,
            ],
            [
                'code' => 'POST-102',
                'marker_name' => 'Post 102',
                'barangay' => 'Lumbo',
                'latitude' => 8.5250000,
                'longitude' => 124.5730000,
                'description' => 'In front of Lumbo Elementary School',
                'is_active' => true,
            ],
            [
                'code' => 'MKR-001',
                'marker_name' => 'Emergency Marker 001',
                'barangay' => 'Calatcat',
                'latitude' => 8.5410000,
                'longitude' => 124.5580000,
                'description' => 'National Highway Junction & Gas Station',
                'is_active' => true,
            ],
            [
                'code' => 'MKR-002',
                'marker_name' => 'Emergency Marker 002',
                'barangay' => 'Sungay',
                'latitude' => 8.5150000,
                'longitude' => 124.5800000,
                'description' => 'Near Health Center & Barangay Chapel',
                'is_active' => true,
            ],
        ];

        foreach ($markers as $marker) {
            LocationMarker::updateOrCreate(['code' => $marker['code']], $marker);
        }

        // Also seed standard incident types if missing
        $types = [
            ['name' => 'Medical Emergency', 'description' => 'Critical or acute medical conditions'],
            ['name' => 'Vehicular Accident', 'description' => 'Road crash or vehicular collision'],
            ['name' => 'Fire Emergency', 'description' => 'Structural or brush fire'],
            ['name' => 'Trauma / Physical Injury', 'description' => 'Severe injury, fall, or assault'],
            ['name' => 'Severe Weather / Flood', 'description' => 'Natural disaster, flash flood, landslide'],
        ];

        foreach ($types as $t) {
            IncidentType::firstOrCreate(['name' => $t['name']], $t);
        }
    }
}
