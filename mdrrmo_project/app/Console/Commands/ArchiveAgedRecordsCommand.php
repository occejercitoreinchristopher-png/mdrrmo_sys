<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ArchiveAgedRecordsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:archive-aged-records {--years=3 : Age threshold in years} {--force : Run without interactive prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically exports and archives records older than 3 years to compressed cold storage.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $years = (int) $this->option('years') ?: 3;
        $cutoff = Carbon::now()->subYears($years);

        $this->info("Evaluating records older than {$years} years (created before {$cutoff->toDateTimeString()})...");

        $backupDir = storage_path('app/backups/archives_3yr');
        if (! File::isDirectory($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        // Count aged records across historical tables
        $tables = [
            'incidents' => 'created_at',
            'dispatches' => 'created_at',
            'dispatch_logs' => 'created_at',
            'patient_care_records' => 'created_at',
            'system_notifications' => 'created_at',
        ];

        $counts = [];
        $totalAged = 0;

        foreach ($tables as $tbl => $col) {
            try {
                $c = DB::table($tbl)->where($col, '<=', $cutoff)->count();
                $counts[$tbl] = $c;
                $totalAged += $c;
            } catch (\Throwable $e) {
                $counts[$tbl] = 0;
            }
        }

        if ($totalAged === 0) {
            $msg = "3-Year Data Retention Check: No records found older than {$years} years (before {$cutoff->toDateString()}). All data is currently within active lifecycle.";
            $this->info($msg);
            Log::info($msg);

            // Also ensure a standard safety backup is generated
            $this->call('app:backup-db', ['--keep' => 12]);
            return 0;
        }

        $dateStr = Carbon::now()->format('Y-m-d_His');
        $archiveFile = "{$backupDir}/mdrrmo_archive_{$years}yr_{$dateStr}.sql.gz";

        $this->info("Archiving {$totalAged} records to: {$archiveFile}...");

        $gz = gzopen($archiveFile, 'w9');
        if (! $gz) {
            $err = "Failed to open archive file for writing: {$archiveFile}";
            $this->error($err);
            Log::error($err);
            return 1;
        }

        gzwrite($gz, "-- ========================================================\n");
        gzwrite($gz, "-- MDRRMO OPOL 3-YEAR HISTORICAL DATA COLD ARCHIVE\n");
        gzwrite($gz, "-- Retention Cutoff: Records created on or before {$cutoff->toDateTimeString()}\n");
        gzwrite($gz, "-- Generated At: " . Carbon::now()->toDateTimeString() . "\n");
        gzwrite($gz, "-- Total Archived Records: {$totalAged}\n");
        gzwrite($gz, "-- ========================================================\n\n");
        gzwrite($gz, "SET FOREIGN_KEY_CHECKS=0;\n\n");

        foreach ($tables as $tbl => $col) {
            $cnt = $counts[$tbl];
            if ($cnt === 0) {
                continue;
            }

            gzwrite($gz, "-- --------------------------------------------------------\n");
            gzwrite($gz, "-- Table: `{$tbl}` ({$cnt} records)\n");
            gzwrite($gz, "-- --------------------------------------------------------\n");

            DB::table($tbl)
                ->where($col, '<=', $cutoff)
                ->orderBy('id')
                ->chunk(100, function ($chunk) use ($gz, $tbl) {
                    $insertValues = [];
                    foreach ($chunk as $row) {
                        $vals = array_map(function ($val) {
                            if ($val === null) return 'NULL';
                            return "'" . addslashes((string) $val) . "'";
                        }, (array) $row);
                        $insertValues[] = '(' . implode(', ', $vals) . ')';
                    }

                    if (! empty($insertValues)) {
                        $firstRowCols = array_keys((array) $chunk[0]);
                        $colList = implode('`, `', $firstRowCols);
                        $sql = "INSERT INTO `{$tbl}` (`{$colList}`) VALUES\n" . implode(",\n", $insertValues) . ";\n";
                        gzwrite($gz, $sql);
                    }
                });

            gzwrite($gz, "\n");
        }

        gzwrite($gz, "SET FOREIGN_KEY_CHECKS=1;\n");
        gzclose($gz);

        $fileSize = File::size($archiveFile);
        $fileSizeKb = round($fileSize / 1024, 2);

        $successMsg = "Automated 3-Year Archive Completed: {$totalAged} records archived into {$archiveFile} ({$fileSizeKb} KB).";
        $this->info($successMsg);
        Log::info($successMsg);

        // Also run regular weekly backup
        $this->call('app:backup-db', ['--keep' => 12]);

        return 0;
    }
}
