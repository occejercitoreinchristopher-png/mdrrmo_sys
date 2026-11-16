<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class ElectricPostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info("Starting import of Electric Post & Bridge Locations...");
        Artisan::call('mdrrmo:import-electric-posts', [], $this->command->getOutput());
    }
}
