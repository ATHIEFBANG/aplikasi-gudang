<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BarangSerial extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function barang(): BelongsTo
    {
        return $this->belongsTo(Barang::class);
    }

    public function gudang(): BelongsTo
    {
        return $this->belongsTo(Gudang::class);
    }

    public function transaksiDetails(): BelongsToMany
    {
        return $this->belongsToMany(
            TransaksiDetail::class,
            'transaksi_detail_serials',
            'barang_serial_id',
            'transaksi_detail_id'
        )->withTimestamps();
    }
}