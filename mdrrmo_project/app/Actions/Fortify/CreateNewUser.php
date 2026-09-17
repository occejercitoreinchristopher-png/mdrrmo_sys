<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function create(array $input): User
    {
        if (isset($input['name']) && ! isset($input['first_name'])) {
            $parts = explode(' ', trim($input['name']), 2);
            $input['first_name'] = $parts[0] ?? 'User';
            $input['last_name'] = $parts[1] ?? 'User';
        }
        if (! isset($input['phone_number'])) {
            $input['phone_number'] = '09'.rand(100000000, 999999999);
        }

        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $birthdate = $input['birthdate'] ?? $input['birthday'] ?? null;
        $age = ! empty($input['age']) ? (int) $input['age'] : null;
        if ($birthdate && empty($age)) {
            $age = \Illuminate\Support\Carbon::parse($birthdate)->age;
        }

        return User::create([
            'first_name' => $input['first_name'],
            'middle_name' => $input['middle_name'] ?? null,
            'last_name' => $input['last_name'],
            'phone_number' => $input['phone_number'] ?? null,
            'birthdate' => $birthdate,
            'age' => $age,
            'email' => $input['email'],
            'password' => $input['password'],
            'role' => 'resident',
            'status' => 'active',
        ]);
    }
}
