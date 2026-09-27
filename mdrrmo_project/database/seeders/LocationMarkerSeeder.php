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
                'barangay_name' => 'Poblacion',
                'marker_latitude' => 8.5312000,
                'marker_longitude' => 124.5695000,
                'marker_description' => 'Near Barangay Hall & Town Plaza',
                'is_active' => true,
            ],
            [
                'code' => 'SL-002',
                'marker_name' => 'Streetlight 002',
                'barangay_name' => 'Poblacion',
                'marker_latitude' => 8.5325000,
                'marker_longitude' => 124.5710000,
                'marker_description' => 'Near Public Market & Bus Terminal',
                'is_active' => true,
            ],
            [
                'code' => 'POST-101',
                'marker_name' => 'Post 101',
                'barangay_name' => 'Baybay',
                'marker_latitude' => 8.5380000,
                'marker_longitude' => 124.5650000,
                'marker_description' => 'Near Coastal Port & Fish Landing',
                'is_active' => true,
            ],
            [
                'code' => 'POST-102',
                'marker_name' => 'Post 102',
                'barangay_name' => 'Lumbo',
                'marker_latitude' => 8.5250000,
                'marker_longitude' => 124.5730000,
                'marker_description' => 'In front of Lumbo Elementary School',
                'is_active' => true,
            ],
            [
                'code' => 'MKR-001',
                'marker_name' => 'Emergency Marker 001',
                'barangay_name' => 'Calatcat',
                'marker_latitude' => 8.5410000,
                'marker_longitude' => 124.5580000,
                'marker_description' => 'National Highway Junction & Gas Station',
                'is_active' => true,
            ],
            [
                'code' => 'MKR-002',
                'marker_name' => 'Emergency Marker 002',
                'barangay_name' => 'Sungay',
                'marker_latitude' => 8.5150000,
                'marker_longitude' => 124.5800000,
                'marker_description' => 'Near Health Center & Barangay Chapel',
                'is_active' => true,
            ],
        ];

        $barangays = \App\Models\Barangay::all()->keyBy('barangay_name');

        foreach ($markers as $marker) {
            $bName = $marker['barangay_name'];
            unset($marker['barangay_name']);
            $marker['barangay_id'] = $barangays->get($bName)?->id ?? $barangays->first()?->id;

            LocationMarker::updateOrCreate(['code' => $marker['code']], $marker);
        }

        // Also seed standard incident types matching mobile app IDs
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
