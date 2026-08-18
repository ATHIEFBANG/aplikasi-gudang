<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('combat_trip_coordinates', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke sesi Trip
            $table->foreignId('combat_trip_id')->constrained('combat_trips')->onDelete('cascade');
            
            // Koordinat Geospasial
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            
            // Kecepatan & Akurasi (meter)
            $table->float('speed')->nullable();
            $table->float('accuracy')->nullable();
            
            $table->timestamp('recorded_at')->useCurrent();
            
            // Index komposit agar query rute di peta super cepat
            $table->index(['combat_trip_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('combat_trip_coordinates');
    }
};