<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('name') && ! $this->has('first_name')) {
            $parts = explode(' ', trim($this->input('name')), 2);
            $this->merge([
                'first_name' => $parts[0] ?? 'User',
                'last_name' => $parts[1] ?? 'User',
            ]);
        }
        if (! $this->has('phone_number')) {
            $this->merge([
                'phone_number' => $this->user()?->phone_number ?? '09123456789',
            ]);
        }
    }

    public function rules(): array
    {
        return $this->profileRules($this->user()->id);
    }
}
