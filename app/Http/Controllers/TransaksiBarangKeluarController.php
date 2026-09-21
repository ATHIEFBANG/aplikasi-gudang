<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangSerial;
use App\Models\Gudang;
use App\Models\Stok;
use App\Models\StockLog;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransaksiBarangKeluarController extends Controller
{
    public function store(Request $request)
    {
        if ($request->has('items') && is_array($request->items)) {
            set_time_limit(120);

            $validated = $request->validate([
                'items'                     => 'required|array|min:1',
                'items.*.sub_jenis'         => 'required|string|in:BARANG_KE_SITE,PEMAKAIAN_INTERNAL',
                'items.*.tanggal'           => 'required|date',
                'items.*.kondisi'           => 'nullable|string|max:50',
                'items.*.nomor_omc'         => 'required|string|max:100',
                'items.*.nomor_imc'         => 'nullable|string|max:100',
                'items.*.pihak_asal'        => 'required|string|max:255',
                'items.*.kode_projek'       => 'nullable|string|max:100',
                'items.*.nama_customer'     => 'nullable|string|max:255',
                'items.*.gudang_asal_id'    => 'required|exists:gudangs,id',
                'items.*.barang_id'         => 'required|exists:barangs,id',
                'items.*.qty'               => 'required|integer|min:1|max:50',
                'items.*.serials'           => 'nullable|array',
                'items.*.serials.*'         => 'nullable|string|max:100',
            ]);

            // 1. Pre-fetch Data secara Kolektif untuk Memangkas Query (Mencegah N+1)
            $barangIds    = array_unique(array_column($validated['items'], 'barang_id'));
            $gudangIds    = array_unique(array_column($validated['items'], 'gudang_asal_id'));
            $allCleanSns  = [];

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

            $barangs = Barang::whereIn('id', $barangIds)->get()->keyBy('id');

            DB::transaction(function () use ($validated, $request, $barangs, $barangIds, $gudangIds, $allCleanSns) {
                // Pre-lock semua Stok yang terdampak
                $stoks = Stok::whereIn('barang_id', $barangIds)
                    ->whereIn('gudang_id', $gudangIds)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy(fn($s) => $s->barang_id . '_' . $s->gudang_id);

                // Pre-fetch semua Serial Number yang relevan
                $serialsMap = collect();
                if (!empty($allCleanSns)) {
                    $serialsMap = BarangSerial::whereIn('barang_id', $barangIds)
                        ->whereIn('serial_number', $allCleanSns)
                        ->get()
                        ->keyBy(fn($s) => $s->barang_id . '_' . trim($s->serial_number));
                }

                $now = now();
                $detailSerialsToInsert = [];
                $serialsToUpdateIds    = [];
                $stockLogsToInsert     = [];

                foreach ($validated['items'] as $item) {
                    $subJenis     = $item['sub_jenis'];
                    $prefix       = match($subJenis) {
                        'BARANG_KE_SITE'     => 'TRX-OUT-SITE',
                        'PEMAKAIAN_INTERNAL' => 'TRX-OUT-INT',
                        default              => 'TRX-KELUAR',
                    };
                    $randomSuffix = strtoupper(Str::random(4));
                    $noTransaksi  = $prefix . '-' . date('YmdHis') . '-' . $randomSuffix;
                    $barangId     = (int) $item['barang_id'];
                    $gudangAsalId = (int) $item['gudang_asal_id'];
                    $qty          = (int) $item['qty'];
                    $serials      = array_filter(array_map('trim', $item['serials'] ?? []));

                    $barang = $barangs->get($barangId);
                    if (!$barang) {
                        throw new \Exception("Data barang dengan ID {$barangId} tidak ditemukan.");
                    }

                    $kondisiFix = !empty($item['kondisi']) && $item['kondisi'] !== '-' 
                        ? ucfirst(strtolower($item['kondisi'])) 
                        : 'Baru';

                    if ($barang->is_wajib_sn && !empty($serials)) {
                        $firstSnKey = $barangId . '_' . $serials[0];
                        $firstSn    = $serialsMap->get($firstSnKey);

                        if ($firstSn && !empty($firstSn->kondisi)) {
                            $kondisiFix = ucfirst(strtolower($firstSn->kondisi));
                        }
                    }

                    $stokKey  = $barangId . '_' . $gudangAsalId;
                    $stokAsal = $stoks->get($stokKey);

                    if (!$stokAsal || $stokAsal->jumlah < $qty) {
                        $stokTersedia = $stokAsal ? $stokAsal->jumlah : 0;
                        throw new \Exception("Stok barang '{$barang->nama_barang}' di gudang asal tidak mencukupi (Tersedia: {$stokTersedia}, Diminta: {$qty}).");
                    }

                    if ($barang->is_wajib_sn && count($serials) !== $qty) {
                        throw new \Exception("Jumlah Serial Number untuk barang '{$barang->nama_barang}' harus tepat {$qty} unit.");
                    }

                    // 2. Simpan Header Transaksi Keluar
                    $transaksi = Transaksi::create([
                        'no_transaksi'     => $noTransaksi,
                        'jenis_transaksi'  => 'KELUAR',
                        'sub_jenis'        => $subJenis,
                        'tanggal'          => $item['tanggal'],
                        'kondisi'          => $kondisiFix,
                        'nomor_omc'        => $item['nomor_omc'],
                        'nomor_imc'        => !empty($item['nomor_imc']) ? trim($item['nomor_imc']) : null,
                        'pihak_asal'       => $item['pihak_asal'],
                        'kode_projek'      => !empty($item['kode_projek']) ? trim($item['kode_projek']) : null,
                        'nama_customer'    => !empty($item['nama_customer']) ? trim($item['nama_customer']) : null,
                        'gudang_asal_id'   => $gudangAsalId,
                        'gudang_tujuan_id' => null,
                        'pic_user_id'      => $request->user()->id,
                        'status'           => 'COMPLETED',
                    ]);

                    // 3. Simpan Detail Transaksi
                    $detail = TransaksiDetail::create([
                        'transaksi_id' => $transaksi->id,
                        'barang_id'    => $barangId,
                        'qty'          => $qty,
                        'harga'        => 0,
                        'kondisi'      => $kondisiFix,
                    ]);

                    // 4. Potong Stok Fisik Gudang Asal
                    $stokAsal->jumlah -= $qty;
                    $stokAsal->save();

                    $stockLogsToInsert[] = [
                        'barang_id'     => $barangId,
                        'gudang_id'     => $gudangAsalId,
                        'transaksi_id'  => $transaksi->id,
                        'user_id'       => $request->user()->id,
                        'qty_perubahan' => -$qty,
                        'qty_akhir'     => $stokAsal->jumlah,
                        'keterangan'    => "Pengeluaran Stok ({$subJenis}) ke {$transaksi->pihak_asal} [{$kondisiFix}]",
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ];

                    // 5. Kumpulkan Serial Numbers untuk Batch Update
                    if (!empty($serials)) {
                        foreach ($serials as $sn) {
                            $snKey        = $barangId . '_' . $sn;
                            $serialRecord = $serialsMap->get($snKey);

                            if ($serialRecord) {
                                $serialsToUpdateIds[] = $serialRecord->id;

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

                // Execute Bulk SQL Operations (Sangat Cepat)
                if (!empty($serialsToUpdateIds)) {
                    BarangSerial::whereIn('id', $serialsToUpdateIds)->update([
                        'gudang_id'  => null,
                        'status'     => 'IN_USE',
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

            return redirect()->back()->with('success', count($validated['items']) . ' Data pengeluaran barang berhasil dicatat.');
        }

        return redirect()->back()->with('error', 'Format data tidak valid.');
    }

    public function update(Request $request, int $id)
    {
        $transaksi = Transaksi::with(['details'])->findOrFail($id);

        $validated = $request->validate([
            'tanggal'       => 'required|date',
            'kondisi'       => 'nullable|string|max:50',
            'nomor_omc'     => 'required|string|max:100',
            'nomor_imc'     => 'nullable|string|max:100',
            'pihak_asal'    => 'required|string|max:255',
            'kode_projek'   => 'nullable|string|max:100',
            'nama_customer' => 'nullable|string|max:255',
            'keterangan'    => 'nullable|string|max:500',
        ]);

        $kondisiFix = !empty($validated['kondisi']) && $validated['kondisi'] !== '-' 
            ? ucfirst(strtolower($validated['kondisi'])) 
            : ($transaksi->kondisi !== '-' ? $transaksi->kondisi : 'Baru');

        DB::transaction(function () use ($transaksi, $validated, $kondisiFix) {
            $transaksi->update([
                'tanggal'       => $validated['tanggal'],
                'kondisi'       => $kondisiFix,
                'nomor_omc'     => $validated['nomor_omc'],
                'nomor_imc'     => $validated['nomor_imc'] ?? $transaksi->nomor_imc,
                'pihak_asal'    => $validated['pihak_asal'],
                'kode_projek'   => $validated['kode_projek'] ?? $transaksi->kode_projek,
                'nama_customer' => $validated['nama_customer'] ?? $transaksi->nama_customer,
                'keterangan'    => $validated['keterangan'] ?? $transaksi->keterangan,
            ]);

            foreach ($transaksi->details as $detail) {
                $detail->update([
                    'kondisi' => $kondisiFix,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Data transaksi keluar berhasil diperbarui.');
    }
}