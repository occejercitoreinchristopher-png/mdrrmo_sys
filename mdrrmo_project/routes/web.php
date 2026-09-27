<?php

use App\Http\Controllers\Admin\AmbulanceController;
use App\Http\Controllers\Admin\BarangayController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\LocationCodeController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\PasswordChangeController;
use App\Http\Controllers\Dispatcher\DashboardController;
use App\Http\Controllers\Dispatcher\DispatchController;
use App\Http\Controllers\Dispatcher\IncidentController;
use App\Http\Controllers\Dispatcher\PatientCareRecordController;
use App\Http\Controllers\Dispatcher\PatientController;
use App\Http\Controllers\Dispatcher\ResidentController;
use App\Http\Controllers\Dispatcher\ResponderController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

Route::get('/download/app', function () {
    $downloadUrl = env('MOBILE_APP_DOWNLOAD_URL');
    if (! empty($downloadUrl) && $downloadUrl !== url('/download/app')) {
        return redirect()->away($downloadUrl);
    }
    return redirect()->to(url('/#mobile-app'));
})->name('app.download');

Route::middleware(['auth'])->group(function () {
    Route::get('/change-password', [PasswordChangeController::class, 'show'])->name('password.change');
    Route::post('/change-password', [PasswordChangeController::class, 'update'])->name('password.change.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        $user = auth()->user();
        if ($user?->role === 'admin') {
            return redirect()->route('admin.dashboard');
        }
        if ($user?->role === 'dispatcher') {
            return redirect()->route('dispatcher.dashboard');
        }

        if ($user?->role === 'responder') {
            auth()->logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Responder accounts can only access the MDRRMO mobile application. Please use the Responder mobile app to continue.',
            ]);
        }

        if ($user?->role === 'resident') {
            auth()->logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Resident accounts can only access the MDRRMO mobile application. Please use the Resident mobile app to continue.',
            ]);
        }

        auth()->logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect()->route('login')->withErrors([
            'email' => 'This account is not authorized to access the web application.',
        ]);
    })->name('dashboard');
});

// Profile Routes (Restricted strictly to Admin and Dispatcher only)
Route::middleware(['auth', 'role:admin,dispatcher'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('admin.profile');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('admin.profile.update');
    Route::post('/profile/photo', [ProfileController::class, 'updatePhoto'])->name('admin.profile.photo.update');
    Route::delete('/profile/photo', [ProfileController::class, 'deletePhoto'])->name('admin.profile.photo.destroy');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('admin.profile.password.update');
});

// Admin Routes
Route::prefix('admin')->name('admin.')->middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/', fn () => redirect()->route('admin.dashboard'));
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/users', [UserController::class, 'index'])->name('users');
    Route::get('/residents', [UserController::class, 'residents'])->name('residents');

    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
    Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::get('/ambulances', [AmbulanceController::class, 'index'])->name('ambulances');
    Route::post('/ambulances', [AmbulanceController::class, 'store'])->name('ambulances.store');
    Route::patch('/ambulances/{ambulance}', [AmbulanceController::class, 'update'])->name('ambulances.update');
    Route::get('/barangays', [BarangayController::class, 'index'])->name('barangays');
    Route::get('/barangays/{barangay}/location-codes', [LocationCodeController::class, 'index'])->name('barangays.location-codes.index');
    Route::post('/barangays/{barangay}/location-codes', [LocationCodeController::class, 'store'])->name('barangays.location-codes.store');
    Route::patch('/location-codes/{locationCode}', [LocationCodeController::class, 'update'])->name('location-codes.update');
    Route::delete('/location-codes/{locationCode}', [LocationCodeController::class, 'destroy'])->name('location-codes.destroy');
    Route::get('/reports', [ReportController::class, 'index'])->name('reports');

    // Dispatch Logs (Admin)
    Route::get('/dispatch-logs/api/fetch', [\App\Http\Controllers\Admin\DispatchLogController::class, 'fetchLogs'])->name('admin.dispatch-logs.fetch');
    Route::get('/dispatch-logs', [\App\Http\Controllers\Admin\DispatchLogController::class, 'index'])->name('admin.dispatch-logs.index');
    Route::get('/dispatch-logs/{incident}', [\App\Http\Controllers\Admin\DispatchLogController::class, 'show'])->name('admin.dispatch-logs.show');
});

// Dispatcher Routes
Route::prefix('dispatcher')->name('dispatcher.')->middleware(['auth', 'role:dispatcher'])->group(function () {
    Route::get('/', fn () => redirect()->route('dispatcher.dashboard'));
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Incidents
    Route::get('/incidents/map', [IncidentController::class, 'map'])->name('incidents.map');
    Route::get('/incidents', [IncidentController::class, 'index'])->name('incidents');
    Route::post('/incidents/phone-call', [IncidentController::class, 'storePhoneCall'])->name('incidents.phone-call');
    Route::get('/location-markers/lookup', [IncidentController::class, 'lookupLocationMarker'])->name('location-markers.lookup');
    Route::get('/location-codes/search', [IncidentController::class, 'searchLocationCodes'])->name('location-codes.search');
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

    // Responders & Users
    Route::get('/responders', [ResponderController::class, 'index'])->name('responders');
    Route::patch('/responders/{user}/status', [ResponderController::class, 'updateStatus'])->name('responders.status');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');

    // Patients
    Route::get('/patients', [PatientController::class, 'index'])->name('patients');
    Route::get('/patients/search', [PatientController::class, 'search'])->name('patients.search');
    Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('patients.show');

    // Residents
    Route::get('/residents', [ResidentController::class, 'index'])->name('residents');
    Route::get('/residents/{resident}', [ResidentController::class, 'show'])->name('residents.show');

    // PCRs
    Route::get('/patient-care-records', [PatientCareRecordController::class, 'index'])->name('patient-care-records');
    Route::get('/patient-care-records/{record}', [PatientCareRecordController::class, 'show'])->name('patient-care-records.show');

    // Dispatch Logs
    Route::get('/dispatch-logs/api/fetch', [\App\Http\Controllers\Admin\DispatchLogController::class, 'fetchLogs'])->name('dispatch-logs.fetch');
    Route::get('/dispatch-logs', [\App\Http\Controllers\Admin\DispatchLogController::class, 'index'])->name('dispatch-logs.index');
    Route::get('/dispatch-logs/{incident}', [\App\Http\Controllers\Admin\DispatchLogController::class, 'show'])->name('dispatch-logs.show');
});

require __DIR__.'/settings.php';
