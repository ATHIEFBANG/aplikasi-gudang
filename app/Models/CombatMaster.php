<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CombatMaster extends Model
{
    use HasFactory;

    protected $table = 'combat_masters';

    protected $guarded = ['id'];

    public function trips()
    {
        return $this->hasMany(CombatTrip::class, 'combat_master_id')->latest();
    }

    public function activeTrip()
    {
        return $this->hasOne(CombatTrip::class, 'combat_master_id')
            ->whereIn('status', ['ASSIGNED', 'IN_TRANSIT'])
            ->latestOfMany();
    }
}