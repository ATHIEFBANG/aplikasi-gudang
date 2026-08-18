<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CombatTrip extends Model
{
    use HasFactory;

    protected $table = 'combat_trips';

    protected $guarded = ['id'];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at'   => 'datetime',
    ];

    // Otomatis buat UUID tracking_token jika belum ada saat pembuatan trip baru
    protected static function booted(): void
    {
        static::creating(function ($trip) {
            if (empty($trip->tracking_token)) {
                $trip->tracking_token = (string) Str::uuid();
            }
        });
    }

    // Relasi ke Master COMBAT
    public function combat()
    {
        return $this->belongsTo(CombatMaster::class, 'combat_master_id');
    }

    // Relasi PIC (Wajib bernama 'pic' agar sesuai dengan AssetDashboardController)
    public function pic()
    {
        return $this->belongsTo(User::class, 'pic_user_id');
    }

    // Alias relasi untuk kompatibilitas
    public function picUser()
    {
        return $this->belongsTo(User::class, 'pic_user_id');
    }

    // Seluruh titik koordinat perjalanan
    public function coordinates()
    {
        return $this->hasMany(CombatTripCoordinate::class, 'combat_trip_id')
            ->orderBy('recorded_at', 'asc');
    }

    // Titik lokasi terakhir
    public function latestCoordinate()
    {
        return $this->hasOne(CombatTripCoordinate::class, 'combat_trip_id')
            ->latestOfMany('recorded_at');
    }
}