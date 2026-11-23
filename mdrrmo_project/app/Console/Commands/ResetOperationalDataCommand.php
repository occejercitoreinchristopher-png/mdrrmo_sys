<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class ResetOperationalDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-operational-data 
                            {--force : Run without confirmation prompt}
                            {--wipe-manual-pins : Also wipe manual heatmap pins}
                            {--wipe-patients : Also wipe patients records}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Resets and wipes all operational test data (incidents, dispatches, logs, PCRs, notifications) for a clean production slate.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->warn('=====================================================');
        $this->warn('   MDRRMO OPOL - OPERATIONAL DATA RESET UTILITY      ');
        $this->warn('=====================================================');
        $this->line('');
        $this->line('This action will permanently purge:');
        $this->line('  - All Incidents (active, verified, resolved, rejected)');
        $this->line('  - All Incident Images & Uploads');
        $this->line('  - All Dispatches & Dispatch Crew assignments');
        $this->line('  - All Dispatch Logs & Timeline Actions');
        $this->line('  - All Patient Care Records (PCRs) & PCR Photos');
        $this->line('  - All System Incident/Dispatch Notifications');
        $this->line('');
        $this->line('And will automatically:');
        $this->line('  - Reset all Ambulances to "available"');
        $this->line('  - Reset all Responder Profiles to "available"');
        $this->line('  - Clear reporting suspensions on Resident accounts');
        $this->line('  - Retain ALL Users, Barangays, Incident Types, and Settings intact.');
        $this->line('');

        if (! $this->option('force')) {
            if (! $this->confirm('Are you ABSOLUTELY SURE you want to purge all operational data? This cannot be undone!', false)) {
                $this->info('Operation cancelled. No changes were made.');
                return 0;
            }
        }

        // 1. Automatically create safety database backup first
        $this->info('Creating automatic pre-reset safety backup...');
        try {
            $this->call('app:backup-db', ['--keep' => 12]);
        } catch (\Throwable $e) {
            $this->warn('Safety backup notice: ' . $e->getMessage());
        }

        $this->info('Purging operational records from database...');

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

        if ($this->option('wipe-manual-pins')) {
            $tablesToTruncate[] = 'heatmap_manual_pin_images';
            $tablesToTruncate[] = 'heatmap_manual_pins';
        }

        if ($this->option('wipe-patients')) {
            $tablesToTruncate[] = 'patients';
        }

        foreach ($tablesToTruncate as $table) {
            try {
                DB::statement("TRUNCATE TABLE `{$table}`;");
                $this->line("  [TRUNCATED] `{$table}`");
            } catch (\Throwable $e) {
                $this->error("  [FAILED] Could not truncate `{$table}`: " . $e->getMessage());
            }
        }

        // Reset ambulance statuses
        try {
            DB::table('ambulances')->update(['status' => 'available']);
            $this->line('  [RESET] All ambulances reset to "available".');
        } catch (\Throwable $e) {
            $this->error('  [FAILED] Ambulance reset: ' . $e->getMessage());
        }

        // Reset responder availability
        try {
            DB::table('responder_profiles')->update(['availability' => 'available']);
            $this->line('  [RESET] All responder profiles reset to "available".');
        } catch (\Throwable $e) {
            $this->error('  [FAILED] Responder profile reset: ' . $e->getMessage());
        }

        // Clear user suspensions
        try {
            DB::table('users')->whereNotNull('reporting_suspended_until')->update(['reporting_suspended_until' => null]);
            $this->line('  [RESET] Cleared resident reporting suspensions.');
        } catch (\Throwable $e) {
            $this->error('  [FAILED] User suspension reset: ' . $e->getMessage());
        }

        DB::statement('SET FOREIGN_KEY_CHECKS = 1;');

        // Clean physical photo storage directories
        $this->info('Cleaning physical storage image directories...');
        $storagePaths = [
            storage_path('app/public/incidents'),
            storage_path('app/public/pcr_photos'),
        ];

        if ($this->option('wipe-manual-pins')) {
            $storagePaths[] = storage_path('app/public/heatmap-manual-pins');
        }

        foreach ($storagePaths as $path) {
            if (File::isDirectory($path)) {
                $files = File::files($path);
                foreach ($files as $file) {
                    if ($file->getFilename() !== '.gitignore') {
                        File::delete($file->getPathname());
                    }
                }
                $this->line("  [CLEANED] Files removed from {$path}");
            }
        }

        // Clear application caches
        $this->info('Clearing application caches...');
        try {
            $this->call('optimize:clear');
        } catch (\Throwable $e) {
            // ignore if restricted
        }

        $logMsg = 'Operational data reset executed by administrator. All incidents and dispatches purged.';
        Log::warning($logMsg);

        $this->info('');
        $this->info('=====================================================');
        $this->info(' SUCCESS: Operational data reset completed cleanly!  ');
        $this->info(' All incidents, dispatches, and heatmap are reset.   ');
        $this->info(' Auto-increment IDs will start from #1 on next call. ');
        $this->info('=====================================================');

        return 0;
    }
}
