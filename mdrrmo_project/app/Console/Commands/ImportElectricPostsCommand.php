<?php

namespace App\Console\Commands;

use App\Models\Barangay;
use App\Models\LocationCode;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportElectricPostsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mdrrmo:import-electric-posts
                            {--file= : Specific path to the CSV file}
                            {--fresh : Remove existing Post / Streetlight records before importing}
                            {--update-csv : Update the original CSV file so Location Code column matches the real pole ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import 4,500+ electric posts into location_codes using physical Existing Pole IDs';

    /**
     * Official 14 Barangays of Opol with their standard 3-letter abbreviations.
     */
    protected array $barangayAbbr = [
        'awang' => 'AWG',
        'bagocboc' => 'BGC',
        'barra' => 'BRA',
        'bonbon' => 'BBN',
        'cauyonan' => 'CYN',
        'igpit' => 'IGP',
        'limonda' => 'LMD',
        'luyongbonbon' => 'LBB',
        'malanang' => 'MLN',
        'nangcaon' => 'NGN',
        'patag' => 'PTG',
        'poblacion' => 'POB',
        'taboc' => 'TBC',
        'tingalan' => 'TNG',
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('====================================================');
        $this->info('  MDRRMO ELECTRIC POST LOCATION CODE IMPORTER');
        $this->info('====================================================');

        // 1. Locate the CSV file
        $filePath = $this->option('file');
        if (! $filePath) {
            $candidates = [
                'c:/laragon/www/CAPSTONE_PROJECT/Opol_Electric_Post_Location_Codes.csv',
                base_path('../Opol_Electric_Post_Location_Codes.csv'),
                base_path('Opol_Electric_Post_Location_Codes.csv'),
            ];
            foreach ($candidates as $candidate) {
                if (file_exists($candidate)) {
                    $filePath = $candidate;
                    break;
                }
            }
        }

        if (! $filePath || ! file_exists($filePath)) {
            $this->error("CSV file not found! Checked default paths. Please provide --file=/path/to/file.csv");
            return 1;
        }

        $this->info("Loading CSV from: {$filePath}");

        // 2. Ensure all 14 official barangays exist in DB
        $officialBarangays = [
            'Awang', 'Bagocboc', 'Barra', 'Bonbon', 'Cauyonan',
            'Igpit', 'Limonda', 'Luyongbonbon', 'Malanang', 'Nangcaon',
            'Patag', 'Poblacion', 'Taboc', 'Tingalan'
        ];

        foreach ($officialBarangays as $bName) {
            $exists = Barangay::where('barangay_name', $bName)
                ->orWhere('barangay_name', str_replace('Luyongbonbon', 'Luyong Bonbon', $bName))
                ->first();

            if (! $exists) {
                Barangay::create(['barangay_name' => $bName]);
                $this->line("Created missing barangay: {$bName}");
            }
        }

        // Cache barangay models indexed by normalized key
        $barangayMap = [];
        foreach (Barangay::all() as $b) {
            $key = strtolower(str_replace(' ', '', $b->barangay_name));
            $barangayMap[$key] = $b;
        }

        // 3. Option: fresh import
        if ($this->option('fresh')) {
            $deleted = LocationCode::where('location_type', 'Post / Streetlight')->delete();
            $this->warn("Cleared {$deleted} previous 'Post / Streetlight' records.");
        }

        // 4. Preload already-used location codes in DB to avoid any collisions
        $usedCodes = LocationCode::pluck('location_code')->flip()->toArray();

        // 5. Read CSV
        $handle = fopen($filePath, 'r');
        if (! $handle) {
            $this->error("Could not open file: {$filePath}");
            return 1;
        }

        $header = fgetcsv($handle);
        if (! $header) {
            $this->error("Empty CSV file!");
            fclose($handle);
            return 1;
        }

        $this->info("Parsing CSV rows and resolving real physical pole IDs...");

        $rowsToInsert = [];
        $updatedCsvRows = [];
        $updatedCsvRows[] = $header; // keep header

        $totalRead = 0;
        $skipped = 0;
        $modifiedCodesCount = 0;
        $mergedDuplicatesCount = 0;
        $now = now()->format('Y-m-d H:i:s');

        // Track poles per coordinates to merge exact duplicates (e.g. pole + transformer lines)
        $postsByCoord = [];

        while (($data = fgetcsv($handle)) !== false) {
            $totalRead++;

            $barangayName = trim($data[0] ?? '');
            $origLocCode = trim($data[1] ?? '');
            $postNumber = trim($data[2] ?? '');
            $existingPoleId = trim($data[3] ?? '');
            $poleDescription = trim($data[4] ?? '');
            $latitude = floatval(trim($data[5] ?? '0'));
            $longitude = floatval(trim($data[6] ?? '0'));
            $classification = trim($data[7] ?? 'Nearest barangay reference point');

            if (empty($barangayName) || $latitude == 0 || $longitude == 0) {
                $skipped++;
                continue;
            }

            $normBKey = strtolower(str_replace(' ', '', $barangayName));
            $barangay = $barangayMap[$normBKey] ?? null;

            if (! $barangay) {
                $this->warn("Row {$totalRead}: Unknown barangay '{$barangayName}', skipping.");
                $skipped++;
                continue;
            }

            $bAbbr = $this->barangayAbbr[$normBKey] ?? strtoupper(substr($barangayName, 0, 3));

            // Determine the REAL location code:
            // If Existing Pole ID is "Opol", use the Sitio/Purok from description + post number
            $finalCode = $existingPoleId;
            if (strtoupper($existingPoleId) === 'OPOL') {
                $cleanDesc = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $poleDescription));
                $finalCode = "OPOL-" . ($cleanDesc ?: "POST") . "-{$postNumber}";
                $modifiedCodesCount++;
            } elseif (empty($finalCode)) {
                $finalCode = "POST-{$bAbbr}-{$postNumber}";
                $modifiedCodesCount++;
            }

            // Check if this exact post already exists at the same coordinate in this batch
            $coordKey = sprintf("%s_%.6f_%.6f", $normBKey, $latitude, $longitude);
            if (isset($postsByCoord[$coordKey])) {
                // Exact same location already processed!
                $prevIndex = $postsByCoord[$coordKey];
                $prevDesc = $rowsToInsert[$prevIndex]['location_description'];
                if ($poleDescription && ! str_contains($prevDesc, $poleDescription)) {
                    $rowsToInsert[$prevIndex]['location_description'] .= " | Also: {$poleDescription} (#{$postNumber})";
                }
                $mergedDuplicatesCount++;

                // Keep updated CSV row
                $data[1] = $rowsToInsert[$prevIndex]['location_code'];
                $updatedCsvRows[] = $data;
                continue;
            }

            // Disambiguate if code was already used
            if (isset($usedCodes[$finalCode])) {
                // Disambiguation strategy: append Barangay abbreviation or counter
                $candidate = "{$finalCode}-{$bAbbr}";
                if (isset($usedCodes[$candidate])) {
                    $counter = 2;
                    while (isset($usedCodes["{$candidate}-{$counter}"])) {
                        $counter++;
                    }
                    $candidate = "{$candidate}-{$counter}";
                }
                $finalCode = $candidate;
                $modifiedCodesCount++;
            }

            $usedCodes[$finalCode] = true;

            // Formulate clean name & description
            $locationName = (strtoupper($existingPoleId) === 'OPOL')
                ? "Pole: {$poleDescription} (#{$postNumber})"
                : "Pole {$existingPoleId}";

            $cleanDesc = "Post #{$postNumber}, {$poleDescription}. Brgy. {$barangayName}";
            if ($origLocCode && $origLocCode !== $finalCode) {
                $cleanDesc .= " (Ref: {$origLocCode})";
            }

            $currentIndex = count($rowsToInsert);
            $postsByCoord[$coordKey] = $currentIndex;

            $rowsToInsert[] = [
                'barangay_id' => $barangay->id,
                'location_code' => $finalCode,
                'location_type' => 'Post / Streetlight',
                'location_name' => $locationName,
                'location_description' => $cleanDesc,
                'location_latitude' => $latitude,
                'location_longitude' => $longitude,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // Update column 1 (Location Code) in CSV data to reflect the real code
            $data[1] = $finalCode;
            $updatedCsvRows[] = $data;
        }

        fclose($handle);

        $this->info("Total rows scanned: {$totalRead}");
        $this->info("Unique physical post markers prepared: " . count($rowsToInsert));
        $this->info("Duplicate co-located lines consolidated: {$mergedDuplicatesCount}");
        $this->info("Codes modified for uniqueness/clarity: {$modifiedCodesCount}");

        // 6. Insert in chunks of 500
        $chunks = array_chunk($rowsToInsert, 500);
        $totalInserted = 0;
        $bar = $this->output->createProgressBar(count($chunks));
        $bar->start();

        foreach ($chunks as $chunk) {
            DB::table('location_codes')->upsert(
                $chunk,
                ['location_code'],
                ['barangay_id', 'location_type', 'location_name', 'location_description', 'location_latitude', 'location_longitude', 'updated_at']
            );
            $totalInserted += count($chunk);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Successfully inserted/updated {$totalInserted} electric post location codes in the database!");

        // 7. Update CSV file if requested or by default
        $targetCsv = $filePath;
        $writeHandle = @fopen($targetCsv, 'w');
        if (! $writeHandle) {
            $targetCsv = str_replace('.csv', '_Updated.csv', $filePath);
            $writeHandle = @fopen($targetCsv, 'w');
        }

        if ($writeHandle) {
            foreach ($updatedCsvRows as $row) {
                fputcsv($writeHandle, $row);
            }
            fclose($writeHandle);
            $this->info("Updated CSV file created: {$targetCsv} with real physical location codes!");
        } else {
            $this->warn("Could not write updated CSV (file may be open in Excel or another program).");
        }

        // Print breakdown per barangay
        $this->newLine();
        $this->info("=== Posts Imported per Barangay ===");
        $counts = LocationCode::where('location_type', 'Post / Streetlight')
            ->select('barangay_id', DB::raw('count(*) as count'))
            ->groupBy('barangay_id')
            ->with('barangay')
            ->get();

        $tableRows = [];
        foreach ($counts as $item) {
            $tableRows[] = [
                'Barangay' => $item->barangay?->barangay_name ?? 'Unknown',
                'Posts Count' => $item->count,
            ];
        }
        $this->table(['Barangay', 'Posts Count'], $tableRows);

        $this->info("Import completed successfully!");
        return 0;
    }
}
