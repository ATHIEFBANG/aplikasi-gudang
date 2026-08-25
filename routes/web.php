<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\BarangController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

// 1. PUBLIC ROUTE
Route::get('/', function () {
    return redirect()->route('login');
})->name('welcome');

// 2. AUTHENTICATED ROUTES
Route::middleware(['auth'])->group(function () {

    // DASHBOARD UTAMA
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/home', fn() => redirect()->route('dashboard'))->name('home');

    // MASTER BARANG
    Route::prefix('barang')->name('barang.')->controller(BarangController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/export', 'export')->name('export');
        Route::post('/reset', 'reset')->name('reset');
        Route::post('/', 'store')->name('store');
        Route::put('/{id}', 'update')->name('update');
        Route::delete('/{id}', 'destroy')->name('destroy');
        Route::post('/bulk-delete', 'bulkDelete')->name('bulk-delete');
    });

    // TRANSAKSI STOK (IN, OUT, MUTASI)
    Route::prefix('transaksi')->name('transaksi.')->controller(TransaksiController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
    });

    // PROFILE
    Route::controller(ProfileController::class)->prefix('profile')->name('profile.')->group(function () {
        Route::get('/', 'edit')->name('edit');
        Route::patch('/', 'update')->name('update');
        Route::delete('/', 'destroy')->name('destroy');
    });

    // ADMIN: KELOLA ANGGOTA / USER
    Route::prefix('admin')->name('admin.users.')->controller(UserController::class)->group(function () {
        Route::get('/users', 'index')->name('index');
        Route::post('/users', 'store')->name('store');
        Route::put('/users/{user}', 'update')->name('update');
        Route::delete('/users/{user}', 'destroy')->name('destroy');
        Route::post('/users/bulk-delete', 'bulkDelete')->name('bulk-delete');
    });
});

require __DIR__ . '/auth.php';