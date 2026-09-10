<?php

namespace App\Http\Controllers\Dispatcher;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function responders()
    {
        return Inertia::render('dispatcher/Responders', [
            'users' => User::where('role', 'responder')->get(),
            'pagination' => null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->whereNull('deleted_at')],
            'phone_number' => ['required', 'string', 'max:255', Rule::unique('users')->whereNull('deleted_at')],
            'password' => 'required|string|min:8|confirmed',
            'role' => ['required', Rule::in(['responder'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return back()->with('success', 'Responder created successfully.');
    }

    public function update(Request $request, User $user)
    {
        // Dispatchers can only manage responders
        if ($user->role !== 'responder') {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)->whereNull('deleted_at')],
            'phone_number' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)->whereNull('deleted_at')],
            'role' => ['required', Rule::in(['responder'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return back()->with('success', 'Responder updated successfully.');
    }

    public function destroy(User $user)
    {
        if ($user->role !== 'responder') {
            abort(403, 'Unauthorized action.');
        }

        $user->delete();

        return back()->with('success', 'Responder deleted successfully.');
    }
}
