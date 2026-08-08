<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rpm_masters', function (Blueprint $table) {
            $table->id();
            
            // Identifikasi Data Utama
            $table->string('rpm_id')->nullable(); 
            $table->string('site_id')->index();
            $table->string('mitra')->nullable();

            // Kolom Kunci Pivot Chart (Filters, Columns, Rows)
            $table->string('rtp')->nullable()->index();       // Filter Wilayah (TO Bogor, Cikarang, dll)
            $table->string('bulan')->nullable()->index();     // Sumbu Grafik Bulanan (1-12)
            $table->string('tahun')->nullable()->index();     // Filter Tahun (2025, 2026)
            $table->string('approve')->nullable()->index();   // Status Approval (OK, Belum, Reject, dll)

            // Tanggal Informasi
            $table->string('tanggal_submit')->nullable();
            $table->string('tanggal_approve')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rpm_masters');
    }
};