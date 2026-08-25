<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gudang extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function stoks()
    {
        return $this->hasMany(Stok::class);
    }

    public function serials()
    {
        return $this->hasMany(BarangSerial::class);
    }

    public function transaksiAsal()
    {
        return $this->hasMany(Transaksi::class, 'gudang_asal_id');
    }

    public function transaksiTujuan()
    {
        return $this->hasMany(Transaksi::class, 'gudang_tujuan_id');
    }
}