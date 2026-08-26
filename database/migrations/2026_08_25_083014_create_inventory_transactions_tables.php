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
            $table->date('tanggal')->index();
            
            // Relasi Gudang, Supplier, PIC
            $table->foreignId('gudang_asal_id')->nullable()->constrained('gudangs')->nullOnDelete();
            $table->foreignId('gudang_tujuan_id')->nullable()->constrained('gudangs')->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('pic_user_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->text('keterangan')->nullable();
            $table->enum('status', ['DRAFT', 'COMPLETED', 'CANCELLED'])->default('COMPLETED')->index();
            $table->timestamps();

            $table->index(['jenis_transaksi', 'tanggal']);
        });

        // 2. Detail Item Transaksi
        Schema::create('transaksi_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaksi_id')->constrained('transaksis')->cascadeOnDelete();
            $table->foreignId('barang_id')->constrained('barangs')->cascadeOnDelete();
            $table->integer('qty');
            $table->enum('kondisi', ['BAIK', 'RUSAK'])->default('BAIK');
            $table->timestamps();
        });

        // 3. Detail Serial Number Transaksi (Relasi SN ke Transaksi Detail)
        Schema::create('transaksi_detail_serials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaksi_detail_id')->constrained('transaksi_details')->cascadeOnDelete();
            $table->foreignId('barang_serial_id')->constrained('barang_serials')->cascadeOnDelete();
            $table->timestamps();
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