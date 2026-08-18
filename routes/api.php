<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CombatTripController;

/*
|--------------------------------------------------------------------------
| API Routes (Dioptimalkan untuk Vercel Serverless)
|--------------------------------------------------------------------------
*/

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// =========================================================================
// 1. API TRACKING DRIVER (Publik - Tanpa Login)
// Di Vercel, otomatis terbaca sebagai: /api/track/...
// =========================================================================
Route::post('/track/{token}/start', [CombatTripController::class, 'startTrip']);
Route::post('/track/{token}/ping', [CombatTripController::class, 'ping']);
Route::post('/track/{token}/complete', [CombatTripController::class, 'completeTrip']);


// =========================================================================
// 2. API DASHBOARD & MANAGEMENT (Butuh Login Admin)
// Di Vercel, otomatis terbaca sebagai: /api/combat/...
// Kita bungkus pakai middleware 'web' dan 'auth' agar Session Login terbaca!
// =========================================================================
Route::middleware(['web', 'auth'])->prefix('combat')->group(function () {
    // Menarik Data
    Route::get('/active', [CombatTripController::class, 'getActiveTrip']);
    Route::get('/trips/active', [CombatTripController::class, 'getActiveTrip']);
    Route::get('/live-positions', [CombatTripController::class, 'getLivePositions']);
    
    // Riwayat & Peta
    Route::get('/history', [CombatTripController::class, 'getAllTripsHistory']);
    Route::get('/trips/history', [CombatTripController::class, 'getAllTripsHistory']);
    Route::get('/trips/{id}/route', [CombatTripController::class, 'getTripRoute']);

    // Aksi CRUD (Buat, Edit, Batal, Hapus)
    Route::post('/dispatch', [CombatTripController::class, 'createTrip']);
    Route::post('/trips', [CombatTripController::class, 'createTrip']);
    Route::put('/trips/{id}', [CombatTripController::class, 'updateTrip']);
    Route::post('/trips/{id}/cancel', [CombatTripController::class, 'cancelTrip']);
    Route::delete('/trips/{id}', [CombatTripController::class, 'destroyTrip']);
});