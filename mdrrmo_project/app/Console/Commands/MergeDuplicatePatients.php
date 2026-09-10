<?php

namespace App\Console\Commands;

use App\Models\Patient;
use App\Models\PatientCareRecord;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MergeDuplicatePatients extends Command
{
    protected $signature = 'patients:merge-duplicates';
    protected $description = 'Merge duplicate patient records with identical first and last names';

    public function handle()
    {
        $allPatients = Patient::all();
        $grouped = $allPatients->groupBy(function ($p) {
            return strtolower(trim($p->first_name)).' '.strtolower(trim($p->last_name));
        });

        $mergedCount = 0;

        foreach ($grouped as $key => $records) {
            if ($records->count() <= 1) {
                continue;
            }

            $this->info("Merging duplicates for: {$key} ({$records->count()} records)");

            // Sort: prioritize records with most filled attributes (birthdate, street, etc.)
            $sorted = $records->sortByDesc(function ($p) {
                $score = 0;
                if ($p->registered_user_id) {
                    $score += 10;
                }
                if ($p->birthdate) {
                    $score += 5;
                }
                if ($p->street) {
                    $score += 4;
                }
                if ($p->barangay_id) {
                    $score += 3;
                }
                if ($p->gender) {
                    $score += 2;
                }
                if ($p->house_no) {
                    $score += 1;
                }

                return $score;
            })->values();

            $master = $sorted->first();
            $duplicates = $sorted->slice(1);

            DB::transaction(function () use ($master, $duplicates, &$mergedCount) {
                $updates = [];
                foreach ($duplicates as $dup) {
                    if (empty($master->birthdate) && ! empty($dup->birthdate)) {
                        $master->birthdate = $dup->birthdate;
                        $updates['birthdate'] = $dup->birthdate;
                    }
                    if (empty($master->street) && ! empty($dup->street)) {
                        $master->street = $dup->street;
                        $updates['street'] = $dup->street;
                    }
                    if (empty($master->gender) && ! empty($dup->gender)) {
                        $master->gender = $dup->gender;
                        $updates['gender'] = $dup->gender;
                    }
                    if (empty($master->house_no) && ! empty($dup->house_no)) {
                        $master->house_no = $dup->house_no;
                        $updates['house_no'] = $dup->house_no;
                    }
                    if (empty($master->barangay_id) && ! empty($dup->barangay_id)) {
                        $master->barangay_id = $dup->barangay_id;
                        $updates['barangay_id'] = $dup->barangay_id;
                    }
                    if (empty($master->registered_user_id) && ! empty($dup->registered_user_id)) {
                        $master->registered_user_id = $dup->registered_user_id;
                        $updates['registered_user_id'] = $dup->registered_user_id;
                    }

                    // Re-link any PCRs pointing to the duplicate
                    PatientCareRecord::where('patient_id', $dup->id)->update([
                        'patient_id' => $master->id,
                    ]);

                    // Delete the duplicate record
                    $dup->delete();
                    $mergedCount++;
                }

                if (! empty($updates)) {
                    $master->save();
                }
            });
        }

        $this->info("Successfully merged {$mergedCount} duplicate patient records.");

        return 0;
    }
}
