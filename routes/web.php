<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DataManagementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// ==========================================
// 0. DIAGNOSTIK / CEK DATABASE
// ==========================================
Route::get('/cek-db', function () {
    try {
        DB::connection('pgsql')->getPdo();
        return response()->json([
            'status'   => 'SUCCESS 🎉',
            'message'  => 'Terhubung ke Aiven PostgreSQL!',
            'database' => DB::connection('pgsql')->getDatabaseName(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status'  => 'ERROR ❌',
            'message' => $e->getMessage(),
        ], 500);
    }
});

// ==========================================
// 1. PUBLIC LANDING PAGE (Guest Access)
// ==========================================
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
})->name('welcome');

// ==========================================
// 2. AUTHENTICATED ROUTES (Wajib Login)
// ==========================================
Route::middleware(['auth', 'verified'])->group(function () {

    // 🟢 UTAMA: DASHBOARD MONITORING MITRATEL (Menggunakan /home & name('home'))
    Route::get('/home', [DashboardController::class, 'index'])->name('home');

    // --- MANAJEMEN PROFIL ---
    Route::controller(ProfileController::class)->prefix('profile')->name('profile.')->group(function () {
        Route::get('/', 'edit')->name('edit');
        Route::patch('/', 'update')->name('update');
        Route::delete('/', 'destroy')->name('destroy');
    });

    // --- ADMIN USER MANAGEMENT ---
    Route::prefix('admin')
        ->name('admin.users.')
        ->controller(UserController::class)
        ->group(function () {
            Route::get('/users', 'index')->name('index');
            Route::post('/users', 'store')->name('store');
            Route::put('/users/{user}', 'update')->name('update');
            Route::delete('/users/{user}', 'destroy')->name('destroy');
            Route::post('/users/bulk-delete', 'bulkDelete')->name('bulk-delete');
        });

    // --- MODUL MAINTENANCE & OPERATIONAL ---
    Route::prefix('maintenance')->name('maintenance.')->group(function () {

        // Dashboard khusus operasional perbaikan
        Route::get('/dashboard', [DashboardController::class, 'maintenance'])->name('dashboard');

        // Data Management (RPM & SmartKey)
        Route::prefix('data-management')
            ->name('data-management.')
            ->controller(DataManagementController::class)
            ->group(function () {
                Route::get('/', 'index')->name('index');

                // Master RPM
                Route::post('/rpm', 'storeRpm')->name('store-rpm');
                Route::put('/rpm/{id}', 'updateRpm')->name('update-rpm');
                Route::delete('/rpm/{id?}', 'destroyRpm')->name('destroy-rpm');
                Route::post('/rpm/bulk-delete', 'bulkDestroyRpm')->name('bulk-destroy-rpm');
                Route::post('/rpm/reset', 'resetRpm')->name('reset-rpm');
                Route::post('/rpm/bulk-paste', 'bulkPasteRpm')->name('bulk-paste-rpm');
                Route::get('/rpm/export', 'exportRpm')->name('export-rpm');
                Route::post('/rpm/process', 'processRpm')->name('process-rpm');

                // Master Smart Key
                Route::post('/smartkey', 'storeSmartkey')->name('store-smartkey');
                Route::put('/smartkey/{id}', 'updateSmartkey')->name('update-smartkey');
                Route::delete('/smartkey/{id?}', 'destroySmartkey')->name('destroy-smartkey');
                Route::post('/smartkey/bulk-delete', 'bulkDestroySmartkey')->name('bulk-destroy-smartkey');
                Route::post('/smartkey/reset', 'resetSmartkey')->name('reset-smartkey');
                Route::post('/smartkey/bulk-paste', 'bulkPasteSmartkey')->name('bulk-paste-smartkey');
                Route::get('/smartkey/export', 'exportSmartkey')->name('export-smartkey');
                Route::post('/smartkey/process', 'processSmartkey')->name('process-smartkey');
            });
    });
});

require __DIR__ . '/auth.php';