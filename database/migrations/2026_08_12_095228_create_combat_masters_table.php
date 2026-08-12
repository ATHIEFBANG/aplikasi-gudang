<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('combat_masters', function (Blueprint $table) {
            $table->id();
            
            // Identifikasi Asset & Hardware
            $table->string('asset_name')->nullable()->index();
            $table->string('sn')->nullable()->index();
            $table->string('pic_data')->nullable();

            // Lokasi & Site
            $table->string('nama_site')->nullable();
            $table->text('lokasi_saat_ini')->nullable();
            $table->string('longitude')->nullable();
            $table->string('latitude')->nullable();

            // Kolom Kunci Pivot Chart (Filters, Columns, Rows)
            $table->string('status_combat')->nullable()->index();
            $table->string('type_combat')->nullable()->index();
            $table->string('ketinggian_combat')->nullable();

            // Informasi Tanggal & Remark
            $table->string('tanggal_ambil')->nullable();
            $table->string('tanggal_kembali')->nullable();
            $table->text('remark')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('combat_masters');
    }
};