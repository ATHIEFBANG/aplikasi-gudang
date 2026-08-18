<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CombatTripCoordinate extends Model
{
    use HasFactory;

    protected $table = 'combat_trip_coordinates';

    protected $guarded = ['id'];

    // Kita menggunakan recorded_at sebagai timestamp tunggal
    public $timestamps = false;

    protected $casts = [
        'latitude'    => 'float',
        'longitude'   => 'float',
        'speed'       => 'float',
        'accuracy'    => 'float',
        'recorded_at' => 'datetime',
    ];

    // Relasi balik ke trip
    public function trip()
    {
        return $this->belongsTo(CombatTrip::class, 'combat_trip_id');
    }
}