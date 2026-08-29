<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TransaksiDetail extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'qty'   => 'integer',
        'harga' => 'float',
    ];

    public function transaksi(): BelongsTo
    {
        return $this->belongsTo(Transaksi::class);
    }

    public function barang(): BelongsTo
    {
        return $this->belongsTo(Barang::class);
    }

    public function serials(): BelongsToMany
    {
        return $this->belongsToMany(
            BarangSerial::class,
            'transaksi_detail_serials',
            'transaksi_detail_id',
            'barang_serial_id'
        )->withTimestamps();
    }
}