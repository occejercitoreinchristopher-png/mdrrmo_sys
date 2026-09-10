<?php

use App\Http\Controllers\Admin\AmbulanceController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Dispatcher\DashboardController;
use App\Http\Controllers\Dispatcher\DispatchController;
use App\Http\Controllers\Dispatcher\IncidentController;
use App\Http\Controllers\Dispatcher\PatientCareRecordController;
use App\Http\Controllers\Dispatcher\PatientController;
use App\Http\Controllers\Dispatcher\ResponderController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

// Admin Routes
Route::prefix('admin')->name('admin.')->middleware(['auth', 'role:admin'])->group(function () {
    Route::inertia('/dashboard', 'admin/Dashboard')->name('dashboard');
    Route::get('/users', [UserController::class, 'index'])->name('users');
    Route::get('/residents', [UserController::class, 'residents'])->name('residents');

    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::get('/ambulances', [AmbulanceController::class, 'index'])->name('ambulances');
    Route::post('/ambulances', [AmbulanceController::class, 'store'])->name('ambulances.store');
    Route::patch('/ambulances/{ambulance}', [AmbulanceController::class, 'update'])->name('ambulances.update');
    Route::delete('/ambulances/{ambulance}', [AmbulanceController::class, 'destroy'])->name('ambulances.destroy');
    Route::inertia('/barangays', 'admin/Barangays')->name('barangays');
    Route::inertia('/reports', 'admin/Reports')->name('reports');
});

// Dispatcher Routes
Route::prefix('dispatcher')->name('dispatcher.')->middleware(['auth', 'role:dispatcher'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Incidents
    Route::get('/incidents/map', [IncidentController::class, 'map'])->name('incidents.map');
    Route::get('/incidents', [IncidentController::class, 'index'])->name('incidents');
    Route::post('/incidents/phone-call', [IncidentController::class, 'storePhoneCall'])->name('incidents.phone-call');
    Route::get('/location-markers/lookup', [IncidentController::class, 'lookupLocationMarker'])->name('location-markers.lookup');
    Route::get('/callers/lookup', [IncidentController::class, 'lookupCaller'])->name('callers.lookup');
    Route::get('/callers/search', [IncidentController::class, 'searchCallerPhoneNumbers'])->name('callers.search');
    Route::post('/incidents/{incident}/verify', [IncidentController::class, 'verify'])->name('incidents.verify');
    Route::post('/incidents/{incident}/reject', [IncidentController::class, 'reject'])->name('incidents.reject');
    Route::post('/incidents/{incident}/resolve', [IncidentController::class, 'resolve'])->name('incidents.resolve');

    // Dispatches
    Route::get('/dispatches', [DispatchController::class, 'index'])->name('dispatches');
    Route::post('/dispatches', [DispatchController::class, 'store'])->name('dispatches.store');
    Route::post('/dispatches/{dispatch}/resolve', [DispatchController::class, 'resolve'])->name('dispatches.resolve');
    Route::post('/dispatches/{dispatch}/cancel', [DispatchController::class, 'cancel'])->name('dispatches.cancel');

    // Responders
    Route::get('/responders', [ResponderController::class, 'index'])->name('responders');
    Route::patch('/responders/{user}/status', [ResponderController::class, 'updateStatus'])->name('responders.status');

    // Patients
    Route::get('/patients', [PatientController::class, 'index'])->name('patients');
    Route::get('/patients/search', [PatientController::class, 'search'])->name('patients.search');
    Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('patients.show');

    // PCRs
    Route::get('/patient-care-records', [PatientCareRecordController::class, 'index'])->name('patient-care-records');
    Route::get('/patient-care-records/{record}', [PatientCareRecordController::class, 'show'])->name('patient-care-records.show');
});

require __DIR__.'/settings.php';
