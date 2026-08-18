<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CombatTripController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Laravel otomatis menambahkan prefix "/api" di depan rute-rute ini.
*/

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// =========================================================================
// 1. API TRACKING DRIVER (Publik - Tanpa Login)
// Diakses dari Frontend via: /api/track/{token}/...
// =========================================================================
Route::post('/track/{token}/start', [CombatTripController::class, 'startTrip']);
Route::post('/track/{token}/ping', [CombatTripController::class, 'ping']);
Route::post('/track/{token}/complete', [CombatTripController::class, 'completeTrip']);