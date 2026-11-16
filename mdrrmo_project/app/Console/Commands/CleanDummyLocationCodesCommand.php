<?php

namespace App\Console\Commands;

use App\Models\Barangay;
use App\Models\LocationCode;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CleanDummyLocationCodesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mdrrmo:clean-dummy-location-codes
                            {--force : Run without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove legacy dummy location codes (POST-*, BRG-*, SL-*, MKR-*, etc.) and test barangays';

    /**
     * Official 14 Barangays of Opol, Misamis Oriental.
     */
    protected array $officialBarangays = [
        'awang', 'bagocboc', 'barra', 'bonbon', 'cauyonan',
        'igpit', 'limonda', 'luyongbonbon', 'luyong bonbon', 'malanang',
        'nangcaon', 'patag', 'poblacion', 'taboc', 'tingalan'
    ];

    /**
     * Known dummy barangays seeded in early development.
     */
    protected array $dummyBarangayNames = [
        'Baybay', 'Lumbo', 'Calatcat', 'Sungay'
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('====================================================');
        $this->info('   MDRRMO DUMMY LOCATION CODES CLEANUP TOOL');
        $this->info('====================================================');

        if (! Schema::hasTable('location_codes')) {
            $this->warn('Table location_codes does not exist. Nothing to clean.');
            return 0;
        }

        // 1. Identify dummy location codes
        $dummyQuery = LocationCode::with('barangay')->where(function ($q) {
            $q->where('location_code', 'LIKE', 'POST-%')
              ->orWhere('location_code', 'LIKE', 'BRG-%')
              ->orWhere('location_code', 'LIKE', 'SL-%')
              ->orWhere('location_code', 'LIKE', 'MKR-%')
              ->orWhere('location_code', 'LIKE', 'TEST%')
              ->orWhere('location_code', 'LIKE', 'DUMMY%')
              ->orWhere('location_name', 'LIKE', 'Streetlight 00%')
              ->orWhere('location_name', 'LIKE', 'Post 10%')
              ->orWhere('location_name', 'LIKE', 'Emergency Marker 00%')
              ->orWhereHas('barangay', function ($b) {
                  $b->whereIn('barangay_name', ['Baybay', 'Lumbo', 'Calatcat', 'Sungay']);
              });
        });

        $dummyRecords = $dummyQuery->get();

        if ($dummyRecords->isEmpty()) {
            $this->info('No dummy location codes found in the database. Clean!');
        } else {
            $this->warn("Found {$dummyRecords->count()} dummy location codes to remove:");

            $tableData = [];
            foreach ($dummyRecords->take(20) as $rec) {
                $tableData[] = [
                    'ID' => $rec->id,
                    'Code' => $rec->location_code,
                    'Name' => $rec->location_name,
                    'Type' => $rec->location_type,
                    'Barangay' => $rec->barangay?->barangay_name ?? 'N/A',
                ];
            }
            $this->table(['ID', 'Code', 'Name', 'Type', 'Barangay'], $tableData);

            if ($dummyRecords->count() > 20) {
                $this->line("... and " . ($dummyRecords->count() - 20) . " more.");
            }

            $dummyIds = $dummyRecords->pluck('id')->all();
            $dummyCodes = $dummyRecords->pluck('location_code')->all();

            // Unlink any incidents that point to these dummy codes
            if (Schema::hasColumn('incidents', 'location_code_id')) {
                $unlinkedCount = DB::table('incidents')
                    ->whereIn('location_code_id', $dummyIds)
                    ->update(['location_code_id' => null]);

                if ($unlinkedCount > 0) {
                    $this->info("Safely unlinked {$unlinkedCount} incident(s) from dummy location codes.");
                }
            }

            // Delete from location_codes
            $deletedCount = LocationCode::whereIn('id', $dummyIds)->delete();
            $this->info("Successfully deleted {$deletedCount} dummy records from location_codes.");

            // Also clean legacy location_markers table if it still exists
            if (Schema::hasTable('location_markers')) {
                $legacyDeleted = DB::table('location_markers')
                    ->whereIn('code', $dummyCodes)
                    ->delete();

                if ($legacyDeleted > 0) {
                    $this->info("Deleted {$legacyDeleted} records from legacy location_markers table.");
                }
            }
        }

        // 2. Remove fake dummy barangays (Baybay, Lumbo, Calatcat, Sungay) if empty
        $this->newLine();
        $this->info('Checking for legacy dummy barangays...');
        $dummyBarangays = Barangay::whereIn('barangay_name', $this->dummyBarangayNames)->get();

        foreach ($dummyBarangays as $b) {
            $hasUsers = Schema::hasTable('resident_profiles') && DB::table('resident_profiles')->where('barangay_id', $b->id)->exists();
            $hasPatients = Schema::hasTable('patients') && DB::table('patients')->where('barangay_id', $b->id)->exists();
            $hasCodes = DB::table('location_codes')->where('barangay_id', $b->id)->exists();

            if (! $hasUsers && ! $hasPatients && ! $hasCodes) {
                $b->delete();
                $this->info("Removed unused dummy barangay: {$b->barangay_name}");
            } else {
                $this->warn("Kept barangay {$b->barangay_name} because it has associated records.");
            }
        }

        $this->newLine();
        $this->info('Dummy location codes cleanup completed successfully!');
        return 0;
    }
}
