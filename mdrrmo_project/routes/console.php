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
