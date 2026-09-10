<?php

namespace App\Http\Controllers\Api\Responder;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CrewController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $profile = $user->responderProfile;

        if (! $profile) {
            return response()->json(['message' => 'No responder profile found.'], 404);
        }

        $team = $profile->team;

        $crewMembers = User::whereHas('responderProfile', function ($query) use ($team) {
            $query->where('team', $team);
        })->with('responderProfile')->get();

        $formattedCrew = $crewMembers->map(function ($member) {
            return [
                'id' => $member->id,
                'name' => trim($member->first_name.' '.$member->last_name),
                'role' => $member->responderProfile->position ?? 'Responder',
                'availability' => $member->responderProfile->availability ?? 'offline',
            ];
        });

        return response()->json([
            'team' => $team,
            'data' => $formattedCrew,
        ]);
    }
}
