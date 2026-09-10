<?php

namespace Database\Seeders;

use App\Models\ResponderProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ResponderSeeder extends Seeder
{
    public function run(): void
    {
        $responders = [
            // Team Alpha
            [
                'first_name' => 'Juan',
                'last_name' => 'Perez',
                'email' => 'juan.perez@mdrrmo.gov.ph',
                'phone_number' => '09111111111',
                'role' => 'responder',
                'team' => 'Alpha',
                'position' => 'team_leader',
                'availability' => 'available',
                'badge' => 'RSP-ALP01',
            ],
            [
                'first_name' => 'Mark',
                'last_name' => 'Cruz',
                'email' => 'mark.cruz@mdrrmo.gov.ph',
                'phone_number' => '09111111112',
                'role' => 'responder',
                'team' => 'Alpha',
                'position' => 'driver',
                'availability' => 'off_duty', // Absent initially
                'badge' => 'RSP-ALP02',
            ],
            [
                'first_name' => 'Carlo',
                'last_name' => 'Santos',
                'email' => 'carlo.santos@mdrrmo.gov.ph',
                'phone_number' => '09111111113',
                'role' => 'responder',
                'team' => 'Alpha',
                'position' => 'emt',
                'availability' => 'available',
                'badge' => 'RSP-ALP03',
            ],

            // Team Bravo
            [
                'first_name' => 'Carlos',
                'last_name' => 'Reyes',
                'email' => 'carlos.reyes@mdrrmo.gov.ph',
                'phone_number' => '09222222221',
                'role' => 'responder',
                'team' => 'Bravo',
                'position' => 'driver',
                'availability' => 'available',
                'badge' => 'RSP-BRV01',
            ],
            [
                'first_name' => 'Roberto',
                'last_name' => 'Gomez',
                'email' => 'roberto.gomez@mdrrmo.gov.ph',
                'phone_number' => '09222222222',
                'role' => 'responder',
                'team' => 'Bravo',
                'position' => 'team_leader',
                'availability' => 'available',
                'badge' => 'RSP-BRV02',
            ],
            [
                'first_name' => 'Elena',
                'last_name' => 'Ramos',
                'email' => 'elena.ramos@mdrrmo.gov.ph',
                'phone_number' => '09222222223',
                'role' => 'responder',
                'team' => 'Bravo',
                'position' => 'emt',
                'availability' => 'available',
                'badge' => 'RSP-BRV03',
            ],
        ];

        foreach ($responders as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'phone_number' => $data['phone_number'],
                    'role' => $data['role'],
                    'status' => 'active',
                    'password' => Hash::make('password'),
                ]
            );

            ResponderProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'badge_number' => $data['badge'],
                    'team' => $data['team'],
                    'position' => $data['position'],
                    'availability' => $data['availability'],
                ]
            );
        }
    }
}
