<?php

namespace App\Console\Commands;

use App\Models\Patient;
use Illuminate\Console\Command;

class MergeDuplicatePatients extends Command
{
    protected $signature = 'patients:merge-duplicates';
    protected $description = 'Merge duplicate patient records with identical first and last names and consolidate their PCRs';

    public function handle()
    {
        $this->info("Scanning for duplicate patient records...");

        $result = Patient::consolidateDuplicates();

        if (!empty($result['details'])) {
            foreach ($result['details'] as $item) {
                $this->info("Merged duplicate(s) for '{$item['name']}': {$item['duplicates_removed']} redundant records removed, {$item['pcrs_relinked']} PCR(s) re-linked to Master Patient #{$item['master_id']}.");
            }
        }

        $this->info("Done! Successfully merged {$result['merged_patients']} duplicate patient records and consolidated {$result['relinked_pcrs']} care records.");

        return 0;
    }
}
