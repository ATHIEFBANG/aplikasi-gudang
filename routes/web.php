<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\BarangController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HistoryMovingController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProyekController;
use App\Http\Controllers\RincianAsetController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\TransaksiBarangMasukController;
use App\Http\Controllers\TransaksiBarangKeluarController;
use App\Http\Controllers\TransaksiTransferController;
use App\Http\Middleware\RoleAccessMiddleware;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
})->name('welcome');

Route::middleware(['auth'])->group(function () {
    // DASHBOARD
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/home', fn() => redirect()->route('dashboard'))->name('home');

    // MASTER GUDANG / LOKASI
    // Hanya Admin yang boleh menambahkan lokasi gudang.
    Route::post('/gudang', [DashboardController::class, 'storeGudang'])
        ->middleware(RoleAccessMiddleware::class . ':admin')
        ->name('gudang.store');

    // Supervisi boleh mengedit/menghapus lokasi yang sudah ada; Pelaksana tidak.
    Route::prefix('gudang')->name('gudang.')->middleware(RoleAccessMiddleware::class . ':admin-supervisi')->group(function () {
        Route::put('/{id}', [DashboardController::class, 'updateGudang'])->name('update');
        Route::delete('/{id}', [DashboardController::class, 'destroyGudang'])->name('destroy');
    });

    // MASTER DATA PROYEK
    Route::prefix('proyek')->name('proyek.')->controller(ProyekController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->middleware(RoleAccessMiddleware::class . ':operational')->name('store');
        Route::put('/{proyek}', 'update')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('update');
        Route::delete('/{proyek}', 'destroy')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('destroy');
    });

    // MASTER BARANG
    Route::prefix('barang')->name('barang.')->controller(BarangController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/export', 'export')->name('export');
        Route::post('/reset', 'reset')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('reset');
        Route::post('/bulk-delete', 'bulkDelete')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('bulk-delete');
        Route::post('/', 'store')->middleware(RoleAccessMiddleware::class . ':operational')->name('store');
        Route::put('/{id}', 'update')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('update');
        Route::delete('/{id}', 'destroy')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('destroy');
    });

    // ACTION: BARANG MASUK (INBOUND)
    Route::prefix('transaksi-masuk')->name('transaksi.masuk.')->controller(TransaksiBarangMasukController::class)->group(function () {
        // Pelaksana boleh membuat transaksi inbound, tetapi tidak boleh melakukan
        // Pengembalian Manual. Pemeriksaan dilakukan lagi di middleware.
        Route::post('/', 'store')->middleware(RoleAccessMiddleware::class . ':inbound-create')->name('store');
        Route::put('/{id}', 'update')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('update');
    });

    // ACTION: BARANG KELUAR (OUTBOUND)
    Route::prefix('transaksi-keluar')->name('transaksi.keluar.')->controller(TransaksiBarangKeluarController::class)->group(function () {
        Route::post('/', 'store')->middleware(RoleAccessMiddleware::class . ':operational')->name('store');
        Route::put('/{id}', 'update')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('update');
        Route::post('/{id}/cancel', 'cancel')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('cancel');
    });

    // ACTION: TRANSFER GUDANG
    Route::prefix('transaksi-transfer')->name('transaksi.transfer.')->controller(TransaksiTransferController::class)->group(function () {
        Route::post('/', 'store')->middleware(RoleAccessMiddleware::class . ':operational')->name('store');
        Route::put('/{id}', 'update')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('update');
        Route::post('/{id}/cancel', 'cancel')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('cancel');
    });

    // HALAMAN UTAMA TRANSAKSI STOK & MANAGEMENT
    Route::prefix('transaksi')->name('transaksi.')->controller(TransaksiController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/barangs/{barangId}/serials', 'getSerialsByBarang')->name('barangs.serials');
        Route::get('/export', 'export')->name('export');
        Route::post('/reset', 'reset')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('reset');
        Route::post('/bulk-delete', 'bulkDelete')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('bulk-delete');
        Route::delete('/{id}', 'destroy')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('destroy');
    });

    // RINCIAN ASET BARANG KELUAR
    Route::get('/rincian-aset', [RincianAsetController::class, 'index'])
        ->name('rincian-aset.index');

    // HISTORY MOVING
    Route::prefix('history-moving')->name('history-moving.')->controller(HistoryMovingController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/export', 'export')->name('export');
    });

    // LAPORAN BULANAN
    Route::prefix('laporan')->name('laporan.')->controller(LaporanController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/export', 'export')->name('export');
    });

    // PROFILE
    // Profile GET tetap bisa dibuka semua role. Perubahan/hapus profil dibatasi
    // untuk Admin dan Supervisi, sesuai aturan "Pelaksana tidak bisa edit/hapus".
    Route::prefix('profile')->name('profile.')->controller(ProfileController::class)->group(function () {
        Route::get('/', 'edit')->name('edit');
        Route::patch('/', 'update')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('update');
        Route::delete('/', 'destroy')->middleware(RoleAccessMiddleware::class . ':no-pelaksana')->name('destroy');
    });

    // ADMIN PANEL & MANAJEMEN PENGGUNA: hanya Admin (juga terlindungi bila URL dibuka langsung)
    Route::prefix('admin/users')->name('admin.users.')
        ->middleware(RoleAccessMiddleware::class . ':admin')
        ->controller(UserController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::post('/bulk-delete', 'bulkDelete')->name('bulk-delete');
            // Kompatibilitas untuk link lama yang membuka /admin/users/{id} via GET.
            // Controller akan mengarahkan ke halaman index dan membuka modal edit.
            Route::get('/{user}', 'show')->name('show');
            Route::put('/{user}', 'update')->name('update');
            Route::delete('/{user}', 'destroy')->name('destroy');
        });
});

require __DIR__ . '/auth.php';
