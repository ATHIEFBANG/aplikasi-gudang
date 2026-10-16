<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proyek extends Model
{
    protected $table = 'proyeks';

    protected $fillable = [
        'kode_projek',
        'nama_projek',
        'nama_customer',
        'lokasi',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
