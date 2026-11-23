<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class ResetOperationalDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-operational-data {--force : Force deletion without interactive confirmation} {--clear-storage : Delete uploaded incident and PCR photos from storage}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely wipe all operational test data (incidents, dispatches, dispatch logs, PCRs) without deleting master records';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->warn('*****************************************************************');
        $this->warn('* CAUTION: This will permanently delete ALL Incidents, Dispatches,');
        $this->warn('* Dispatch Logs, PCR records, and Heatmap incident points!      *');
        $this->warn('*****************************************************************');

        if (! $this->option('force')) {
            if (! $this->confirm('Are you ABSOLUTELY sure you want to wipe all operational data?', false)) {
                $this->info('Operation cancelled.');
                return self::SUCCESS;
            }
        }

        $this->info('Disabling foreign key constraints...');
        DB::statement('SET FOREIGN_KEY_CHECKS = 0;');

        $tablesToTruncate = [
            'dispatch_log_actions',
            'dispatch_logs',
            'patient_care_records',
            'dispatch_crews',
            'dispatches',
            'incident_images',
            'incidents',
            'system_notifications',
        ];

        foreach ($tablesToTruncate as $table) {
            if (Schema::hasTable($table)) {
                $this->line("  - Truncating table: <comment>{$table}</comment>");
                DB::table($table)->truncate();
            }
        }

        // Reset ambulance statuses
        if (Schema::hasTable('ambulances')) {
            $this->line('  - Resetting ambulances status to "available"...');
            DB::table('ambulances')->update(['status' => 'available']);
        }

        // Reset responder profiles availability
        if (Schema::hasTable('responder_profiles')) {
            $this->line('  - Resetting responder profiles to "available"...');
            DB::table('responder_profiles')->update(['availability' => 'available']);
        }

        // Reset any resident reporting suspension
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'reporting_suspended_until')) {
            $this->line('  - Clearing resident reporting suspensions...');
            DB::table('users')
                ->whereNotNull('reporting_suspended_until')
                ->update(['reporting_suspended_until' => null]);
        }

        DB::statement('SET FOREIGN_KEY_CHECKS = 1;');
        $this->info('Re-enabled foreign key constraints.');

        // Optionally clear uploaded test photos
        if ($this->option('clear-storage')) {
            $incidentPath = storage_path('app/public/incidents');
            $pcrPath = storage_path('app/public/pcr_photos');

            if (File::isDirectory($incidentPath)) {
                File::cleanDirectory($incidentPath);
                $this->line('  - Cleared storage/app/public/incidents directory.');
            }

            if (File::isDirectory($pcrPath)) {
                File::cleanDirectory($pcrPath);
                $this->line('  - Cleared storage/app/public/pcr_photos directory.');
            }
        }

        $this->call('optimize:clear');

        $this->newLine();
        $this->info('All operational incident and dispatch data has been successfully wiped!');
        $this->info('Your system is now clean and ready for live emergency operations.');

        return self::SUCCESS;
    }
}
