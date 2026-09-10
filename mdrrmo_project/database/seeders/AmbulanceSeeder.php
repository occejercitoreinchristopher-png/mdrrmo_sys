<?php

namespace Database\Seeders;

use App\Models\Ambulance;
use Illuminate\Database\Seeder;

class AmbulanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $units = [
            [
                'ambulance_code' => 'AMB-01',
                'plate_number' => 'SAB-101',
                'vehicle_name' => 'Toyota HiAce (Alpha 1)',
                'vehicle_type' => 'Type 1 Ambulance',
                'status' => 'available',
            ],
            [
                'ambulance_code' => 'AMB-02',
                'plate_number' => 'SAB-102',
                'vehicle_name' => 'Nissan NV350 (Bravo 2)',
                'vehicle_type' => 'Type 1 Ambulance',
                'status' => 'available',
            ],
            [
                'ambulance_code' => 'AMB-03',
                'plate_number' => 'SAB-103',
                'vehicle_name' => 'Hyundai Starex (Rescue 3)',
                'vehicle_type' => 'Advanced Life Support',
                'status' => 'available',
            ],
        ];

        foreach ($units as $unit) {
            Ambulance::firstOrCreate(
                ['ambulance_code' => $unit['ambulance_code']],
                $unit
            );
        }
    }
}
