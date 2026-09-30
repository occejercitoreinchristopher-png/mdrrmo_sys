<?php

use App\Models\Barangay;
use App\Models\LocationCode;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$csvFile = 'C:\laragon\www\CAPSTONE_PROJECT\Opol_Electric_Post_Location_Codes_Updated.csv';

if (!file_exists($csvFile)) {
    echo "File not found: $csvFile\n";
    exit(1);
}

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
    if ($count % 100 == 0) {
        echo "Imported $count records...\n";
    }
}

fclose($handle);
echo "Import complete! Total records: $count\n";
