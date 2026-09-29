<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CleanDuplicateUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:clean-duplicates';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove duplicated users by email to enforce uniqueness.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $duplicates = User::withTrashed()
            ->select('email', DB::raw('count(*) as total'))
            ->groupBy('email')
            ->having('total', '>', 1)
            ->get();
            
        if ($duplicates->isEmpty()) {
            $this->info("No duplicate users found.");
            return;
        }

        $count = 0;

        foreach ($duplicates as $duplicate) {
            $this->info("Found {$duplicate->total} users for: {$duplicate->email}");
            
            // Order so that active users (deleted_at IS NULL) come first.
            // Then order by newest first to keep the most recent profile.
            $users = User::withTrashed()
                ->where('email', $duplicate->email)
                ->orderByRaw('deleted_at IS NOT NULL')
                ->orderBy('id', 'desc')
                ->get();
                
            $keep = $users->first();
            
            foreach ($users as $u) {
                if ($u->id !== $keep->id) {
                    $this->line(" - Removing user ID: {$u->id}");
                    try {
                        $u->forceDelete();
                    } catch (\Exception $e) {
                        $this->line("   - Force delete failed due to constraints. Anonymizing email and soft-deleting...");
                        $u->email = 'deleted_' . $u->id . '_' . uniqid() . '_' . $u->email;
                        $u->save();
                        $u->delete();
                    }
                    $count++;
                }
            }
            $this->info(" - Kept user ID: {$keep->id}");
        }
        
        $this->info("Completed. Removed {$count} duplicate users.");
    }
}
