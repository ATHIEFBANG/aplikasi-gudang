<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CombatMaster extends Model
{
    use HasFactory;

    protected $table = 'combat_masters';

    // Mengizinkan semua kolom diisi secara massal
    protected $guarded = [];
}