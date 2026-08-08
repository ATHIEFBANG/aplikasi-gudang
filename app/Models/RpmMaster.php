<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RpmMaster extends Model
{
    use HasFactory;

    protected $table = 'rpm_masters';

    // Menggunakan guarded kosong agar semua field diizinkan untuk di-insert/update
    protected $guarded = [];
}