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
            
            // Identitas Asset
            $table->string('asset_name')->index();
            $table->string('sn')->nullable()->index();
            $table->string('type_combat')->nullable()->index();
            $table->string('ketinggian_combat')->nullable();
            
            // Lokasi & Site
            $table->string('nama_site')->nullable();
            $table->text('lokasi_saat_ini')->nullable();
            
            // Kolom Gabungan Koordinat (Mendukung "-6.5641;107.47459" dan "#N/A")
            $table->text('long_lat')->nullable();
            
            // Status Operasional
            $table->string('status_combat')->default('READY TO USE')->index();
            
            // PIC & Catatan
            $table->string('pic_data')->nullable();
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