<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'occ.ejercito.reinchristopher@gmail.com'],
            [
                'first_name' => 'Rein Christopher',
                'middle_name' => '',
                'last_name' => 'Ejercito',
                'role' => 'admin',
                'status' => 'active',
                'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                'email_verified_at' => now(),
                'password_change_required' => false,
            ]
        );

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'first_name' => 'Test',
                'last_name' => 'User',
                'role' => 'resident',
                'status' => 'active',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $this->call([
            AmbulanceSeeder::class,
            ResponderSeeder::class,
            LocationMarkerSeeder::class,
        ]);
    }
}
