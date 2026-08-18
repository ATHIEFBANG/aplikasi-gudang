<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('combat_trips', function (Blueprint $table) {
            $table->id();
            
            // 1. TOKEN AKSES LINK WHATSAPP (Aman & Tanpa Login)
            $table->uuid('tracking_token')->unique()->index();
            
            // 2. Relasi ke Unit COMBAT & Pembuat Tugas (Admin/Staff)
            $table->foreignId('combat_master_id')->constrained('combat_masters')->onDelete('cascade');
            $table->foreignId('pic_user_id')->nullable()->constrained('users')->onDelete('set null');
            
            // 3. Info Driver & Titik Rute
            $table->string('pic_name');
            $table->string('pic_phone')->default('-');
            $table->string('ip_gps')->nullable(); // Jenis Rute (DEPLOY, PENARIKAN, RELOKASI, MAINTENANCE)
            $table->string('device_token')->nullable(); // 🛡️ Kunci ID Perangkat Driver (Anti Driver Ganda)
            $table->string('origin_name')->default('Gudang / Basecamp');
            $table->string('destination_name');
            
            // ---> KOORDINAT TUJUAN <---
            $table->decimal('destination_lat', 11, 8)->nullable();
            $table->decimal('destination_lng', 11, 8)->nullable();
            
            // 4. Status Siklus Perjalanan
            $table->enum('status', ['ASSIGNED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'])->default('ASSIGNED')->index();
            
            // 5. Waktu Mulai & Tiba
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('combat_trips');
    }
};