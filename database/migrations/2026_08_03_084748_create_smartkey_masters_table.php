<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('smartkey_masters', function (Blueprint $table) {
            $table->id();
            
            // Identifikasi Hardware & Lokasi
            $table->string('serial_number')->nullable()->index();
            $table->string('new_sn')->nullable();
            $table->string('tower_id')->nullable();
            $table->string('site_name')->nullable();
            $table->string('kota_kab')->nullable();
            $table->text('long_lat')->nullable();                    // Pengganti DMT Jabo (Untuk Peta Dashboard)

            // Kolom Kunci Pivot Chart (Filters, Columns, Rows, Values)
            $table->string('infrako')->nullable()->index();          // Filter Cluster/Region Infrako
            $table->string('status')->nullable()->index();           // Filter Status Unit (Aktif, Rusak, Hilang)
            $table->string('status_aktifitas')->nullable()->index(); // Columns Kondisi Kunci (Locked, Unlocked, #N/A)
            $table->string('ksm')->nullable()->index();              // Rows Personil KSM
            $table->string('posisi_unit')->nullable()->index();      // Rows Sub-lokasi (Site, HB, RO)
            $table->string('batch')->nullable();                     // Values Aggregation Total

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('smartkey_masters');
    }
};