<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Resident\IncidentController as ResidentIncidentController;
use App\Http\Controllers\Api\Responder\CrewController;
use App\Http\Controllers\Api\Responder\DispatchController as ResponderDispatchController;
use App\Http\Controllers\Api\Responder\HistoryController;
use App\Http\Controllers\Api\Responder\PatientCareRecordController;
use App\Http\Controllers\Api\Responder\PatientController;
use App\Http\Controllers\Api\Responder\ProfileController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Broadcast::routes(['middleware' => ['auth:sanctum']]);

    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/push-token', [AuthController::class, 'updatePushToken']);

    // Resident Routes
    Route::middleware('role:resident')->prefix('resident')->group(function () {
        Route::get('/incidents', [ResidentIncidentController::class, 'index']);
        Route::post('/incidents', [ResidentIncidentController::class, 'store']);
        Route::put('/incidents/{incident}/location', [ResidentIncidentController::class, 'updateLocation']);
        Route::post('/incidents/{incident}/call-responder', [ResidentIncidentController::class, 'callResponder']);
        Route::post('/hotline/call', [ResidentIncidentController::class, 'callHotline']);
    });

    // Responder Routes
    Route::middleware('role:responder')->prefix('responder')->group(function () {
        Route::get('/crew', [CrewController::class, 'index']);
        Route::post('/status', [ProfileController::class, 'updateStatus']);
        Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto']);
        Route::get('/patients/search', [PatientController::class, 'search']);
        Route::post('/patients', [PatientController::class, 'store']);
        Route::get('/history', [HistoryController::class, 'index']);

        Route::get('/dispatches', [ResponderDispatchController::class, 'index']);
        Route::post('/dispatches/walk-in', [ResponderDispatchController::class, 'walkIn']);
        Route::post('/dispatches/{dispatch}/accept', [ResponderDispatchController::class, 'accept']);
        Route::post('/dispatches/{dispatch}/status', [ResponderDispatchController::class, 'updateStatus']);
        Route::post('/dispatches/{dispatch}/location', [ResponderDispatchController::class, 'updateLocation']);

        Route::post('/dispatches/{dispatch}/pcr', [PatientCareRecordController::class, 'update']);
        Route::post('/dispatches/{dispatch}/pcr/submit', [PatientCareRecordController::class, 'submit']);
    });
});
