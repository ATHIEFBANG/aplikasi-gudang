<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Transaksi Utama (Menyatukan Masuk, Keluar, Mutasi, Peminjaman)
        Schema::create('transaksis', function (Blueprint $table) {
            $table->id();
            $table->string('no_transaksi')->unique();
            $table->enum('jenis_transaksi', ['MASUK', 'KELUAR', 'TRANSFER', 'PINJAM', 'KEMBALI']);
            $table->date('tanggal');
            
            // Relasi Opsional tergantung jenis transaksi
            $table->foreignId('gudang_asal_id')->nullable()->constrained('gudangs')->nullOnDelete();
            $table->foreignId('gudang_tujuan_id')->nullable()->constrained('gudangs')->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('pic_user_id')->nullable()->constrained('users')->nullOnDelete(); // Siapa yang ngurus / minjam
            
            $table->text('keterangan')->nullable();
            $table->enum('status', ['DRAFT', 'COMPLETED', 'CANCELLED'])->default('COMPLETED');
            $table->timestamps();
        });

        // 2. Detail Item Transaksi (Bisa banyak barang dalam 1 transaksi)
        Schema::create('transaksi_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaksi_id')->constrained('transaksis')->cascadeOnDelete();
            $table->foreignId('barang_id')->constrained('barangs')->cascadeOnDelete();
            $table->integer('qty');
            $table->enum('kondisi', ['BAIK', 'RUSAK'])->default('BAIK');
            $table->timestamps();
        });

        // 3. Log Audit Stok (Siapa, mengubah apa, jam berapa)
        Schema::create('stock_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barang_id')->constrained('barangs')->cascadeOnDelete();
            $table->foreignId('gudang_id')->constrained('gudangs')->cascadeOnDelete();
            $table->foreignId('transaksi_id')->nullable()->constrained('transaksis')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->integer('qty_perubahan'); // Misal: +5 atau -2
            $table->integer('qty_akhir'); // Sisa stok setelah perubahan
            $table->text('keterangan')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_logs');
        Schema::dropIfExists('transaksi_details');
        Schema::dropIfExists('transaksis');
    }
};