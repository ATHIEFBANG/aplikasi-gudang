<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Transaksi Utama
        Schema::create('transaksis', function (Blueprint $table) {
            $table->id();
            $table->string('no_transaksi', 50)->unique();
            $table->enum('jenis_transaksi', ['MASUK', 'KELUAR', 'TRANSFER', 'PINJAM', 'KEMBALI']);
            $table->string('sub_jenis')->nullable()->index();
            $table->date('tanggal')->index();
            $table->string('kondisi')->nullable()->default('Baru')->index();
            $table->string('nomor_imc')->nullable()->index();
            $table->string('nomor_omc')->nullable()->index();
            $table->string('pihak_asal')->nullable()->index();
            
            // --- Kolom Tambahan Baru ---
            $table->string('kode_projek')->nullable()->index();
            $table->string('nama_customer')->nullable()->index();
            
            $table->foreignId('gudang_asal_id')->nullable()->constrained('gudangs')->nullOnDelete();
            $table->foreignId('gudang_tujuan_id')->nullable()->constrained('gudangs')->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('pic_user_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->text('keterangan')->nullable();
            $table->enum('status', ['DRAFT', 'COMPLETED', 'CANCELLED'])->default('COMPLETED')->index();
            $table->timestamps();
            
            // Indeks Komposit untuk Pengurutan & Filter Rentang Tanggal Cepat
            $table->index(['tanggal', 'id']);
            $table->index(['jenis_transaksi', 'tanggal']);
            $table->index(['gudang_asal_id', 'gudang_tujuan_id']);
        });

        // 2. Detail Item Transaksi
        Schema::create('transaksi_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaksi_id')->constrained('transaksis')->cascadeOnDelete();
            $table->foreignId('barang_id')->constrained('barangs')->cascadeOnDelete();
            $table->integer('qty');
            $table->decimal('harga', 15, 2)->nullable()->default(0);
            $table->string('kondisi')->default('Baru')->index();
            $table->timestamps();

            // Indeks Komposit untuk JOIN & Filter Detail
            $table->index(['transaksi_id', 'barang_id']);
            $table->index(['barang_id', 'kondisi']);
        });

        // 3. Detail Serial Number Transaksi
        Schema::create('transaksi_detail_serials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaksi_detail_id')->constrained('transaksi_details')->cascadeOnDelete();
            $table->foreignId('barang_serial_id')->constrained('barang_serials')->cascadeOnDelete();
            $table->timestamps();

            // Indeks Komposit Pencocokan SN
            $table->index(['transaksi_detail_id', 'barang_serial_id']);
        });

        // 4. Log Audit Stok
        Schema::create('stock_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barang_id')->constrained('barangs')->cascadeOnDelete();
            $table->foreignId('gudang_id')->constrained('gudangs')->cascadeOnDelete();
            $table->foreignId('transaksi_id')->nullable()->constrained('transaksis')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->integer('qty_perubahan');
            $table->integer('qty_akhir');
            $table->text('keterangan')->nullable();
            $table->timestamps();
            
            $table->index(['barang_id', 'gudang_id']);
            $table->index(['transaksi_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_logs');
        Schema::dropIfExists('transaksi_detail_serials');
        Schema::dropIfExists('transaksi_details');
        Schema::dropIfExists('transaksis');
    }
};