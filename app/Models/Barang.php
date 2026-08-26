<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Barang extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'is_wajib_sn' => 'boolean',
        'is_wajib_pn' => 'boolean',
        'min_stock'   => 'integer',
    ];

    protected $appends = ['total_stok'];

    public function stoks(): HasMany
    {
        return $this->hasMany(Stok::class);
    }

    public function getTotalStokAttribute(): int
    {
        return (int) $this->stoks()->sum('jumlah');
    }

    public function serials(): HasMany
    {
        return $this->hasMany(BarangSerial::class);
    }

    public function transaksiDetails(): HasMany
    {
        return $this->hasMany(TransaksiDetail::class);
    }

    public function stockLogs(): HasMany
    {
        return $this->hasMany(StockLog::class);
    }
}