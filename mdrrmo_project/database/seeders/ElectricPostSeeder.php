<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Barangay;
use App\Models\LocationCode;

class ElectricPostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $csvFile = __DIR__ . '/Opol_Electric_Post_Location_Codes_Updated.csv';

        if (!file_exists($csvFile)) {
            $this->command->error("CSV file not found: {$csvFile}");
            return;
        }

        $this->command->info("Starting import of Electric Post Locations...");

        $handle = fopen($csvFile, 'r');
        $header = fgetcsv($handle);

        $count = 0;
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 8) continue;

            $barangayName = trim($row[0]);
            $locationCode = trim($row[1]);
            $poleDesc = trim($row[4]);
            $lat = (float) trim($row[5]);
            $lng = (float) trim($row[6]);

            if (!$barangayName || !$locationCode) continue;

            $barangay = Barangay::firstOrCreate(['barangay_name' => $barangayName]);

            LocationCode::updateOrCreate(
                [
                    'location_code' => $locationCode,
                ],
                [
                    'barangay_id' => $barangay->id,
                    'location_type' => 'Pole',
                    'location_name' => $locationCode,
                    'location_description' => $poleDesc,
                    'location_latitude' => $lat,
                    'location_longitude' => $lng,
                ]
            );

            $count++;
            if ($count % 500 == 0) {
                $this->command->info("Processed {$count} records...");
            }
        }

        fclose($handle);
        $this->command->info("Import complete! Total records: {$count}");
    }
}
