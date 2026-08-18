<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DataManagementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AssetDashboardController;
use App\Http\Controllers\AssetDataManagementController;
use App\Http\Controllers\Api\CombatTripController;
use App\Models\CombatTrip;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// =========================================================================
// 1. PUBLIC ROUTES (Tanpa Login)
// =========================================================================

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
})->name('welcome');

// --- HALAMAN UI DRIVER (Load combat & latestCoordinate agar Mode Pantau langsung ada titiknya di awal) ---
Route::get('/track/{token}', function ($token) {
    $trip = CombatTrip::with(['combat', 'latestCoordinate'])->where('tracking_token', $token)->first();

    if (!$trip) {
        abort(404, 'Link tracking tidak valid atau sudah kadaluarsa.');
    }

    return Inertia::render('Track/DrivePage', [
        'trip' => $trip
    ]);
})->name('track.driver');

// --- API TRACKING DRIVER (Aman di Vercel: Menggunakan prefix track-api & api/track) ---
Route::prefix('track-api')->group(function () {
    Route::get('/{token}/status', [CombatTripController::class, 'getDriverLiveStatus']); // 👉 Endpoint Polling Mode Pantau
    Route::post('/{token}/start', [CombatTripController::class, 'startTrip']);
    Route::post('/{token}/ping', [CombatTripController::class, 'ping']);
    Route::post('/{token}/complete', [CombatTripController::class, 'completeTrip']);
});

Route::prefix('api/track')->group(function () {
    Route::get('/{token}/status', [CombatTripController::class, 'getDriverLiveStatus']);
    Route::post('/{token}/start', [CombatTripController::class, 'startTrip']);
    Route::post('/{token}/ping', [CombatTripController::class, 'ping']);
    Route::post('/{token}/complete', [CombatTripController::class, 'completeTrip']);
});


// =========================================================================
// 2. AUTHENTICATED ROUTES (Wajib Login)
// =========================================================================
Route::middleware(['auth'])->group(function () {
    
    // HOME
    Route::get('/home', [DashboardController::class, 'index'])->name('home');

    // PROFIL
    Route::controller(ProfileController::class)->prefix('profile')->name('profile.')->group(function () {
        Route::get('/', 'edit')->name('edit');
        Route::patch('/', 'update')->name('update');
        Route::delete('/', 'destroy')->name('destroy');
    });

    // ADMIN USERS
    Route::prefix('admin')->name('admin.users.')->controller(UserController::class)->group(function () {
        Route::get('/users', 'index')->name('index');
        Route::post('/users', 'store')->name('store');
        Route::put('/users/{user}', 'update')->name('update');
        Route::delete('/users/{user}', 'destroy')->name('destroy');
        Route::post('/users/bulk-delete', 'bulkDelete')->name('bulk-delete');
    });

    // MODUL MAINTENANCE
    Route::prefix('maintenance')->name('maintenance.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'maintenance'])->name('dashboard');
        Route::prefix('data-management')->name('data-management.')->controller(DataManagementController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/rpm', 'storeRpm')->name('store-rpm');
            Route::put('/rpm/{id}', 'updateRpm')->name('update-rpm');
            Route::delete('/rpm/{id?}', 'destroyRpm')->name('destroy-rpm');
            Route::post('/rpm/bulk-delete', 'bulkDestroyRpm')->name('bulk-destroy-rpm');
            Route::post('/rpm/reset', 'resetRpm')->name('reset-rpm');
            Route::get('/rpm/export', 'exportRpm')->name('export-rpm');
            
            Route::post('/smartkey', 'storeSmartkey')->name('store-smartkey');
            Route::put('/smartkey/{id}', 'updateSmartkey')->name('update-smartkey');
            Route::delete('/smartkey/{id?}', 'destroySmartkey')->name('destroy-smartkey');
            Route::post('/smartkey/bulk-delete', 'bulkDestroySmartkey')->name('bulk-destroy-smartkey');
            Route::post('/smartkey/reset', 'resetSmartkey')->name('reset-smartkey');
            Route::get('/smartkey/export', 'exportSmartkey')->name('export-smartkey');
        });
    });

    // MODUL ASSETS
    Route::prefix('assets')->name('assets.')->group(function () {
        Route::get('/dashboard', [AssetDashboardController::class, 'index'])->name('dashboard');
        Route::prefix('data-management')->name('data-management.')->controller(AssetDataManagementController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/combat', 'storeCombat')->name('store-combat');
            Route::put('/combat/{id}', 'updateCombat')->name('update-combat');
            Route::delete('/combat/{id?}', 'destroyCombat')->name('destroy-combat');
            Route::post('/combat/bulk-delete', 'bulkDestroyCombat')->name('bulk-destroy-combat');
            Route::post('/combat/reset', 'resetCombat')->name('reset-combat');
            Route::get('/combat/export', 'exportCombat')->name('export-combat');
        });
    });

    // =========================================================================
    // 3. API COMBAT DASHBOARD & MANAGEMENT (Prefix: combat-api)
    // =========================================================================
    Route::prefix('combat-api')->group(function () {
        Route::get('/active', [CombatTripController::class, 'getActiveTrip']);
        Route::get('/trips/active', [CombatTripController::class, 'getActiveTrip']);
        Route::get('/live-positions', [CombatTripController::class, 'getLivePositions']);
        Route::get('/history', [CombatTripController::class, 'getAllTripsHistory']);
        Route::get('/trips/history', [CombatTripController::class, 'getAllTripsHistory']);
        Route::get('/trips/{id}/route', [CombatTripController::class, 'getTripRoute']);

        Route::post('/dispatch', [CombatTripController::class, 'createTrip']);
        Route::post('/trips', [CombatTripController::class, 'createTrip']);
        Route::put('/trips/{id}', [CombatTripController::class, 'updateTrip']);
        Route::post('/trips/{id}/cancel', [CombatTripController::class, 'cancelTrip']);
        Route::delete('/trips/{id}', [CombatTripController::class, 'destroyTrip']);
    });

    // Alias /api/combat jika dipanggil lokal
    Route::prefix('api/combat')->group(function () {
        Route::get('/active', [CombatTripController::class, 'getActiveTrip']);
        Route::get('/trips/active', [CombatTripController::class, 'getActiveTrip']);
        Route::get('/live-positions', [CombatTripController::class, 'getLivePositions']);
        Route::get('/history', [CombatTripController::class, 'getAllTripsHistory']);
        Route::get('/trips/history', [CombatTripController::class, 'getAllTripsHistory']);
        Route::get('/trips/{id}/route', [CombatTripController::class, 'getTripRoute']);
        Route::post('/dispatch', [CombatTripController::class, 'createTrip']);
        Route::post('/trips', [CombatTripController::class, 'createTrip']);
        Route::put('/trips/{id}', [CombatTripController::class, 'updateTrip']);
        Route::post('/trips/{id}/cancel', [CombatTripController::class, 'cancelTrip']);
        Route::delete('/trips/{id}', [CombatTripController::class, 'destroyTrip']);
    });
});

require __DIR__ . '/auth.php';