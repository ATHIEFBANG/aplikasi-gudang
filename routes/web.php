<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\BarangController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\TransaksiBarangKeluarController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
})->name('welcome');

Route::middleware(['auth'])->group(function () {
    // DASHBOARD & LOKASI GUDANG
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/home', fn() => redirect()->route('dashboard'))->name('home');
    Route::prefix('gudang')->name('gudang.')->group(function () {
        Route::post('/', [DashboardController::class, 'storeGudang'])->name('store');
        Route::put('/{id}', [DashboardController::class, 'updateGudang'])->name('update');
        Route::delete('/{id}', [DashboardController::class, 'destroyGudang'])->name('destroy');
    });

    // MASTER BARANG
    Route::prefix('barang')->name('barang.')->controller(BarangController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/export', 'export')->name('export');
        Route::post('/reset', 'reset')->name('reset');
        Route::post('/bulk-delete', 'bulkDelete')->name('bulk-delete');
        Route::post('/', 'store')->name('store');
        Route::put('/{id}', 'update')->name('update');
        Route::delete('/{id}', 'destroy')->name('destroy');
    });

    // TRANSAKSI BARANG MASUK & GLOBAL
    Route::prefix('transaksi')->name('transaksi.')->controller(TransaksiController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/export', 'export')->name('export');
        Route::post('/reset', 'reset')->name('reset');
        Route::post('/bulk-delete', 'bulkDelete')->name('bulk-delete');
        Route::post('/', 'store')->name('store');
        Route::post('/transfer', 'storeTransfer')->name('transfer.store');
        Route::put('/{id}', 'update')->name('update');
        Route::delete('/{id}', 'destroy')->name('destroy');
    });

    // TRANSAKSI BARANG KELUAR (OUTBOUND)
    Route::prefix('transaksi-keluar')->name('transaksi.keluar.')->controller(TransaksiBarangKeluarController::class)->group(function () {
        Route::post('/', 'store')->name('store');
        Route::put('/{id}', 'update')->name('update');
    });

    // PROFILE
    Route::prefix('profile')->name('profile.')->controller(ProfileController::class)->group(function () {
        Route::get('/', 'edit')->name('edit');
        Route::patch('/', 'update')->name('update');
        Route::delete('/', 'destroy')->name('destroy');
    });

    // ADMIN USER MANAGEMENT
    Route::prefix('admin/users')->name('admin.users.')->controller(UserController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::post('/bulk-delete', 'bulkDelete')->name('bulk-delete');
        Route::put('/{user}', 'update')->name('update');
        Route::delete('/{user}', 'destroy')->name('destroy');
    });
});

require __DIR__ . '/auth.php';