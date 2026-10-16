<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proyeks', function (Blueprint $table) {
            $table->id();
            $table->string('kode_projek', 100)->unique();
            $table->string('nama_projek', 255);
            $table->string('nama_customer', 255)->nullable();
            $table->string('lokasi', 255)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        if (!Schema::hasColumn('barang_serials', 'kode_projek')) {
            Schema::table('barang_serials', function (Blueprint $table) {
                $table->string('kode_projek', 100)->nullable()->index();
            });
        }

        // Konversi pengembalian dari implementasi transfer lama ke transaksi Barang Masuk.
        // Stok dan SN sudah diperbarui oleh transaksi lama; kita hanya menormalkan klasifikasi historis.
        if (Schema::hasTable('transaksis')) {
            DB::table('transaksis')
                ->where('jenis_transaksi', 'TRANSFER')
                ->where('sub_jenis', 'PENGEMBALIAN_PROYEK')
                ->update([
                    'jenis_transaksi' => 'MASUK',
                    'sub_jenis' => 'PENGEMBALIAN',
                    'gudang_asal_id' => null,
                    'updated_at' => now(),
                ]);

            // Migrasi awal: data kode proyek lama dipindahkan dari riwayat transaksi ke master.
            $codes = DB::table('transaksis')
                ->whereNotNull('kode_projek')
                ->where('kode_projek', '!=', '')
                ->where(function ($query) {
                    $query->where(function ($outbound) {
                        $outbound->where('jenis_transaksi', 'KELUAR')
                            ->where('sub_jenis', 'BARANG_KE_SITE');
                    })->orWhere(function ($transfer) {
                        $transfer->where(function ($kind) {
                            $kind->where('jenis_transaksi', 'TRANSFER')
                                ->orWhere('sub_jenis', 'TRANSFER_GUDANG');
                        })->whereNull('gudang_tujuan_id');
                    })->orWhere(function ($return) {
                        $return->where('jenis_transaksi', 'MASUK')->where('sub_jenis', 'PENGEMBALIAN');
                    });
                })
                ->select('kode_projek', DB::raw('MAX(nama_customer) as nama_customer'))
                ->groupBy('kode_projek')
                ->get();

            foreach ($codes as $code) {
                DB::table('proyeks')->insertOrIgnore([
                    'kode_projek' => $code->kode_projek,
                    'nama_projek' => $code->kode_projek,
                    'nama_customer' => $code->nama_customer,
                    'lokasi' => null,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Backfill kode_projek SN berdasarkan pergerakan terakhir yang masih valid.
            // Outbound biasa, transfer antar-gudang, atau pengembalian harus menghapus asosiasi proyek.
            if (Schema::hasTable('transaksi_detail_serials') && Schema::hasTable('transaksi_details')) {
                DB::table('barang_serials')
                    ->where('status', 'IN_USE')
                    ->whereNull('gudang_id')
                    ->update(['kode_projek' => null, 'updated_at' => now()]);

                $movementRows = DB::table('transaksi_detail_serials as link')
                    ->join('transaksi_details as detail', 'detail.id', '=', 'link.transaksi_detail_id')
                    ->join('transaksis as trx', 'trx.id', '=', 'detail.transaksi_id')
                    ->join('barang_serials as serial', 'serial.id', '=', 'link.barang_serial_id')
                    ->where('serial.status', 'IN_USE')
                    ->whereNull('serial.gudang_id')
                    ->where(function ($query) {
                        $query->whereIn('trx.status', ['COMPLETED', 'completed'])
                            ->orWhereNull('trx.status');
                    })
                    ->orderBy('trx.tanggal')
                    ->orderBy('trx.id')
                    ->orderBy('link.id')
                    ->get([
                        'serial.id as serial_id',
                        'trx.jenis_transaksi',
                        'trx.sub_jenis',
                        'trx.gudang_tujuan_id',
                        'trx.kode_projek',
                    ]);

                $latestProjectBySerial = [];
                foreach ($movementRows as $movement) {
                    $isProjectTransfer = (
                        $movement->jenis_transaksi === 'TRANSFER' ||
                        $movement->sub_jenis === 'TRANSFER_GUDANG'
                    ) && $movement->gudang_tujuan_id === null
                        && trim((string) $movement->kode_projek) !== '';

                    $latestProjectBySerial[(int) $movement->serial_id] = $isProjectTransfer
                        ? trim((string) $movement->kode_projek)
                        : null;
                }

                foreach ($latestProjectBySerial as $serialId => $projectCode) {
                    if ($projectCode === null) continue;
                    DB::table('barang_serials')
                        ->where('id', $serialId)
                        ->where('status', 'IN_USE')
                        ->whereNull('gudang_id')
                        ->update(['kode_projek' => $projectCode, 'updated_at' => now()]);
                }
            }
        }
    }

    public function down(): void
    {
        // Balikkan klasifikasi hanya untuk pengembalian yang terhubung ke proyek.
        if (Schema::hasTable('transaksis')) {
            DB::table('transaksis')
                ->where('jenis_transaksi', 'MASUK')
                ->where('sub_jenis', 'PENGEMBALIAN')
                ->whereNotNull('kode_projek')
                ->where('kode_projek', '!=', '')
                ->update([
                    'jenis_transaksi' => 'TRANSFER',
                    'sub_jenis' => 'PENGEMBALIAN_PROYEK',
                    'gudang_asal_id' => null,
                    'updated_at' => now(),
                ]);
        }

        if (Schema::hasColumn('barang_serials', 'kode_projek')) {
            Schema::table('barang_serials', function (Blueprint $table) {
                $table->dropIndex(['kode_projek']);
                $table->dropColumn('kode_projek');
            });
        }

        Schema::dropIfExists('proyeks');
    }
};
