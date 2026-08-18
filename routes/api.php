<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CombatTripController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// =========================================================================
// 1. API TRACKING DRIVER (URL Publik menggunakan Tracking Token)
// =========================================================================
Route::post('/track/{token}/start', [CombatTripController::class, 'startTrip']);
Route::post('/track/{token}/ping', [CombatTripController::class, 'ping']);
Route::post('/track/{token}/complete', [CombatTripController::class, 'completeTrip']);

// =========================================================================
// 2. API DASHBOARD & MANAGEMENT (Menggunakan middleware web agar session login terbaca)
// =========================================================================
Route::middleware(['web'])->group(function () {
    Route::prefix('combat')->group(function () {
        // Polling Data Peta Dashboard & Active Trip
        Route::get('/active', [CombatTripController::class, 'getActiveTrip']);
        Route::get('/trips/active', [CombatTripController::class, 'getActiveTrip']);
        Route::get('/live-positions', [CombatTripController::class, 'getLivePositions']);

        // Management Dispatch & Pembatalan
        Route::post('/dispatch', [CombatTripController::class, 'createTrip']);
        Route::post('/trips', [CombatTripController::class, 'createTrip']);
        Route::post('/trips/{id}/cancel', [CombatTripController::class, 'cancelTrip']);

        // Aksi Update dan Delete untuk Riwayat
        Route::put('/trips/{id}', [CombatTripController::class, 'updateTrip']);
        Route::delete('/trips/{id}', [CombatTripController::class, 'destroyTrip']);

        // Riwayat & Lintasan Rute Peta
        Route::get('/history', [CombatTripController::class, 'getAllTripsHistory']);
        Route::get('/trips/history', [CombatTripController::class, 'getAllTripsHistory']);
        Route::get('/trips/{id}/route', [CombatTripController::class, 'getTripRoute']);
    });
});