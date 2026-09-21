<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangSerial;
use App\Models\Stok;
use App\Models\StockLog;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransaksiTransferController extends Controller
{
    public function store(Request $request)
    {
        set_time_limit(120);

        $validated = $request->validate([
            'items'                    => 'required|array|min:1',
            'items.*.tanggal'          => 'required|date',
            'items.*.nomor_omc'        => 'required|string|max:100',
            'items.*.nomor_imc'        => 'nullable|string|max:100',
            'items.*.kode_projek'      => 'nullable|string|max:100',
            'items.*.nama_customer'    => 'nullable|string|max:255',
            'items.*.gudang_asal_id'   => 'required|exists:gudangs,id',
            'items.*.gudang_tujuan_id' => 'required|exists:gudangs,id',
            'items.*.barang_id'        => 'required|exists:barangs,id',
            'items.*.qty'              => 'required|integer|min:1|max:50',
            'items.*.serials'          => 'nullable|array',
            'items.*.serials.*'        => 'nullable|string|max:100',
        ]);

        $barangIds   = array_unique(array_column($validated['items'], 'barang_id'));
        $barangs     = Barang::whereIn('id', $barangIds)->get()->keyBy('id');
        $allCleanSns = [];

        foreach ($validated['items'] as $item) {
            if (!empty($item['serials']) && is_array($item['serials'])) {
                foreach ($item['serials'] as $s) {
                    $clean = trim($s);
                    if ($clean !== '') {
                        $allCleanSns[] = $clean;
                    }
                }
            }
        }
        $allCleanSns = array_unique($allCleanSns);

        DB::transaction(function () use ($validated, $request, $barangs, $barangIds, $allCleanSns) {
            $now = now();

            $serialsMap = collect();
            if (!empty($allCleanSns)) {
                $serialsMap = BarangSerial::whereIn('barang_id', $barangIds)
                    ->whereIn('serial_number', $allCleanSns)
                    ->get()
                    ->keyBy(fn($s) => $s->barang_id . '_' . trim($s->serial_number));
            }

            $detailSerialsToInsert = [];
            $serialsToUpdate       = [];
            $stockLogsToInsert     = [];

            foreach ($validated['items'] as $item) {
                $randomSuffix   = strtoupper(Str::random(4));
                $noTransaksi    = 'TRX-TRF-' . date('YmdHis') . '-' . $randomSuffix;
                $barangId       = (int) $item['barang_id'];
                $gudangAsalId   = (int) $item['gudang_asal_id'];
                $gudangTujuanId = (int) $item['gudang_tujuan_id'];
                $qty            = (int) $item['qty'];
                $serials        = array_filter(array_map('trim', $item['serials'] ?? []));

                $barang = $barangs->get($barangId);

                if ($gudangAsalId === $gudangTujuanId) {
                    throw new \Exception("Gudang Asal dan Gudang Tujuan tidak boleh sama.");
                }

                $stokAsal = Stok::where('barang_id', $barangId)
                    ->where('gudang_id', $gudangAsalId)
                    ->lockForUpdate()
                    ->first();

                if (!$stokAsal || $stokAsal->jumlah < $qty) {
                    $stokTersedia = $stokAsal ? $stokAsal->jumlah : 0;
                    throw new \Exception("Stok barang '{$barang->nama_barang}' di gudang asal tidak mencukupi (Tersedia: {$stokTersedia}, Diminta: {$qty}).");
                }

                if ($barang && $barang->is_wajib_sn && count($serials) !== $qty) {
                    throw new \Exception("Pilih Serial Number untuk barang '{$barang->nama_barang}' tepat {$qty} unit.");
                }

                $transaksi = Transaksi::create([
                    'no_transaksi'     => $noTransaksi,
                    'jenis_transaksi'  => 'TRANSFER',
                    'sub_jenis'        => 'TRANSFER_GUDANG',
                    'tanggal'          => $item['tanggal'],
                    'kondisi'          => '-',
                    'nomor_omc'        => $item['nomor_omc'],
                    'nomor_imc'        => $item['nomor_imc'] ?? null,
                    'kode_projek'      => !empty($item['kode_projek']) ? trim($item['kode_projek']) : null,
                    'nama_customer'    => !empty($item['nama_customer']) ? trim($item['nama_customer']) : null,
                    'gudang_asal_id'   => $gudangAsalId,
                    'gudang_tujuan_id' => $gudangTujuanId,
                    'pic_user_id'      => $request->user()->id,
                    'status'           => 'COMPLETED',
                ]);

                $detail = TransaksiDetail::create([
                    'transaksi_id' => $transaksi->id,
                    'barang_id'    => $barangId,
                    'qty'          => $qty,
                    'harga'        => 0,
                    'kondisi'      => '-',
                ]);

                $stokAsal->decrement('jumlah', $qty);

                $stockLogsToInsert[] = [
                    'barang_id'     => $barangId,
                    'gudang_id'     => $gudangAsalId,
                    'transaksi_id'  => $transaksi->id,
                    'user_id'       => $request->user()->id,
                    'qty_perubahan' => -$qty,
                    'qty_akhir'     => $stokAsal->jumlah,
                    'keterangan'    => "Transfer Keluar ke Gudang #{$gudangTujuanId}",
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];

                $stokTujuan = Stok::firstOrCreate(
                    ['barang_id' => $barangId, 'gudang_id' => $gudangTujuanId],
                    ['jumlah' => 0]
                );
                $stokTujuan->increment('jumlah', $qty);

                $stockLogsToInsert[] = [
                    'barang_id'     => $barangId,
                    'gudang_id'     => $gudangTujuanId,
                    'transaksi_id'  => $transaksi->id,
                    'user_id'       => $request->user()->id,
                    'qty_perubahan' => +$qty,
                    'qty_akhir'     => $stokTujuan->jumlah,
                    'keterangan'    => "Penerimaan Transfer dari Gudang #{$gudangAsalId}",
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];

                if (!empty($serials)) {
                    foreach ($serials as $sn) {
                        $snKey        = $barangId . '_' . $sn;
                        $serialRecord = $serialsMap->get($snKey);

                        if ($serialRecord) {
                            $serialsToUpdate[$gudangTujuanId][] = $serialRecord->id;

                            $detailSerialsToInsert[] = [
                                'transaksi_detail_id' => $detail->id,
                                'barang_serial_id'    => $serialRecord->id,
                                'created_at'          => $now,
                                'updated_at'          => $now,
                            ];
                        }
                    }
                }
            }

            foreach ($serialsToUpdate as $targetGudangId => $sIds) {
                BarangSerial::whereIn('id', $sIds)->update([
                    'gudang_id'  => $targetGudangId,
                    'status'     => 'IN_WAREHOUSE',
                    'updated_at' => $now,
                ]);
            }

            if (!empty($detailSerialsToInsert)) {
                DB::table('transaksi_detail_serials')->insert($detailSerialsToInsert);
            }

            if (!empty($stockLogsToInsert)) {
                StockLog::insert($stockLogsToInsert);
            }
        });

        return redirect()->back()->with('success', 'Transfer antar-gudang berhasil dicatat.');
    }
}