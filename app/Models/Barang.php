<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barang extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'is_wajib_sn' => 'boolean',
        'is_wajib_pn' => 'boolean',
        'min_stock'   => 'integer',
    ];

    // Relasi stok di seluruh gudang
    public function stoks()
    {
        return $this->hasMany(Stok::class);
    }

    // Helper untuk hitung total seluruh stok fisik di semua gudang
    public function getTotalStokAttribute(): int
    {
        return (int) $this->stoks()->sum('jumlah');
    }

    public function serials()
    {
        return $this->hasMany(BarangSerial::class);
    }

    public function transaksiDetails()
    {
        return $this->hasMany(TransaksiDetail::class);
    }
}