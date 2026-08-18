<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Catatan:
| Semua endpoint /api/combat dan /api/track sekarang sudah dipusatkan
| di dalam routes/web.php agar session login Inertia & CSRF bekerja 100% lancar.
|
*/

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');