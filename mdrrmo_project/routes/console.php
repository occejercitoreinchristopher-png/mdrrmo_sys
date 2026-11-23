<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\User;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-purge soft-deleted staff accounts older than 15 days
Schedule::call(function () {
    User::onlyTrashed()
        ->where('role', '!=', 'resident')
        ->where('deleted_at', '<=', now()->subDays(15))
        ->get()
        ->each(function ($user) {
            if ($user->responderProfile) {
                $user->responderProfile()->forceDelete();
            }
            $user->forceDelete();
        });
})->daily()->name('purge-archived-users')->withoutOverlapping();

// Auto-clean log files older than 14 days
Schedule::call(function () {
    $logPath = storage_path('logs');
    if (\Illuminate\Support\Facades\File::isDirectory($logPath)) {
        $threshold = now()->subDays(14)->timestamp;
        foreach (\Illuminate\Support\Facades\File::files($logPath) as $file) {
            if ($file->getExtension() === 'log' && $file->getMTime() < $threshold) {
                \Illuminate\Support\Facades\File::delete($file->getRealPath());
            }
        }
    }
})->daily()->name('purge-old-logs')->withoutOverlapping();

// Weekly automated database backup (keeping latest 12 archives)
Schedule::command('app:backup-db --keep=12')
    ->weeklyOn(0, '03:00')
    ->name('weekly-db-backup')
    ->withoutOverlapping();

// 3-Year Automated Historical Data Cold Archiving & Retention Policy
Schedule::command('app:archive-aged-records --years=3')
    ->monthlyOn(1, '02:00')
    ->name('monthly-3year-retention-archive')
    ->withoutOverlapping();
