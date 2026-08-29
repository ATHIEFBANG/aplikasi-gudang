<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Gudang / Lokasi
        Schema::create('gudangs', function (Blueprint $table) {
            $table->id();
            $table->string('kode_gudang')->unique();
            $table->string('nama_gudang');
            $table->string('lokasi')->nullable();
            $table->string('lat_long')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Tabel Supplier
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('nama_supplier');
            $table->string('kontak')->nullable();
            $table->text('alamat')->nullable();
            $table->timestamps();
        });

        // 3. Tabel Master Barang
        Schema::create('barangs', function (Blueprint $table) {
            $table->id();
            $table->string('kode_barang')->unique();
            $table->string('nama_barang')->index();
            $table->string('part_number')->nullable()->index();
            $table->string('kategori')->nullable()->index();
            $table->string('brand')->nullable();
            $table->string('tipe')->nullable();
            $table->integer('min_stock')->default(0);
            $table->boolean('is_wajib_sn')->default(false);
            $table->boolean('is_wajib_pn')->default(false);
            $table->text('deskripsi')->nullable();
            $table->string('foto')->nullable();
            $table->timestamps();
        });

        // 4. Tabel Real-Time Stok
        Schema::create('stoks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barang_id')->constrained('barangs')->cascadeOnDelete();
            $table->foreignId('gudang_id')->constrained('gudangs')->cascadeOnDelete();
            $table->integer('jumlah')->default(0);
            $table->timestamps();
            $table->unique(['barang_id', 'gudang_id']);
        });

        // 5. Tabel Serial Number
        Schema::create('barang_serials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barang_id')->constrained('barangs')->cascadeOnDelete();
            $table->foreignId('gudang_id')->nullable()->constrained('gudangs')->nullOnDelete();
            $table->string('serial_number')->unique();
            $table->string('nomer_imc')->nullable();
            $table->string('kondisi')->default('Baru'); // <-- Mendukung Baru, Bekas, Rusak
            $table->enum('status', ['IN_WAREHOUSE', 'IN_USE', 'RETURNED'])->default('IN_WAREHOUSE');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barang_serials');
        Schema::dropIfExists('stoks');
        Schema::dropIfExists('barangs');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('gudangs');
    }
};