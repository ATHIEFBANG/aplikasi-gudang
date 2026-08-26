<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Gudang extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function stoks(): HasMany
    {
        return $this->hasMany(Stok::class);
    }

    public function serials(): HasMany
    {
        return $this->hasMany(BarangSerial::class);
    }

    public function transaksiAsal(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'gudang_asal_id');
    }

    public function transaksiTujuan(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'gudang_tujuan_id');
    }

    public function stockLogs(): HasMany
    {
        return $this->hasMany(StockLog::class);
    }
}