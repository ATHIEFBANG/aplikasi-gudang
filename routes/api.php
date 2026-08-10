<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DataManagementController; // 🟢 Import Controller

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// 🟢 Route Endpoint Sync Bulk RPM dari Google Apps Script
Route::post('/rpm/sync-bulk', [DataManagementController::class, 'syncBulkRpm']);