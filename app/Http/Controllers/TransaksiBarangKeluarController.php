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
            $validated = $request->validate([
                'items'                     => 'required|array|min:1',
                'items.*.sub_jenis'         => 'required|string|in:BARANG_KE_SITE,TRANSFER_GUDANG,PEMAKAIAN_INTERNAL',
                'items.*.tanggal'           => 'required|date',
                'items.*.kondisi'           => 'nullable|string|max:50',
                'items.*.nomor_omc'         => 'required|string|max:100',
                'items.*.nomor_imc'         => 'nullable|string|max:100',
                'items.*.pihak_asal'        => 'nullable|string|max:255', // Site Tujuan / Teknisi / PIC Pemakai
                'items.*.gudang_asal_id'    => 'required|exists:gudangs,id',
                'items.*.gudang_tujuan_id'  => 'nullable|exists:gudangs,id',
                'items.*.barang_id'         => 'required|exists:barangs,id',
                'items.*.qty'               => 'required|integer|min:1|max:50',
                'items.*.harga'             => 'nullable|numeric|min:0',
                'items.*.serials'           => 'nullable|array',
                'items.*.serials.*'         => 'nullable|string|max:100',
            ]);

            DB::transaction(function () use ($validated, $request) {
                foreach ($validated['items'] as $item) {
                    $subJenis = $item['sub_jenis'];
                    $prefix = match($subJenis) {
                        'BARANG_KE_SITE'     => 'TRX-OUT-SITE',
                        'TRANSFER_GUDANG'    => 'TRX-TRF-OUT',
                        'PEMAKAIAN_INTERNAL' => 'TRX-OUT-INT',
                        default              => 'TRX-KELUAR',
                    };

                    $randomSuffix = strtoupper(Str::random(4));
                    $noTransaksi  = $prefix . '-' . date('YmdHis') . '-' . $randomSuffix;
                    $kondisiFix   = $subJenis === 'TRANSFER_GUDANG' ? '-' : ucfirst(strtolower($item['kondisi'] ?? 'Baru'));
                    $barangId     = (int) $item['barang_id'];
                    $gudangAsalId = (int) $item['gudang_asal_id'];
                    $qty          = (int) $item['qty'];
                    $barang       = Barang::findOrFail($barangId);
                    $serials      = array_filter($item['serials'] ?? []);

                    // 1. Validasi Kecukupan Stok di Gudang Asal
                    $stokAsal = Stok::where('barang_id', $barangId)
                        ->where('gudang_id', $gudangAsalId)
                        ->lockForUpdate()
                        ->first();

                    if (!$stokAsal || $stokAsal->jumlah < $qty) {
                        $stokTersedia = $stokAsal ? $stokAsal->jumlah : 0;
                        throw new \Exception("Stok barang '{$barang->nama_barang}' di gudang asal tidak mencukupi (Tersedia: {$stokTersedia}, Diminta: {$qty}).");
                    }

                    // 2. Validasi Serial Number jika Wajib SN
                    if ($barang->is_wajib_sn && count($serials) !== $qty) {
                        throw new \Exception("Jumlah Serial Number untuk barang '{$barang->nama_barang}' harus tepat {$qty} unit.");
                    }

                    // 3. Simpan Header Transaksi Keluar
                    $transaksi = Transaksi::create([
                        'no_transaksi'     => $noTransaksi,
                        'jenis_transaksi'  => 'KELUAR',
                        'sub_jenis'        => $subJenis,
                        'tanggal'          => $item['tanggal'],
                        'kondisi'          => $kondisiFix,
                        'nomor_omc'        => $item['nomor_omc'],
                        'nomor_imc'        => $item['nomor_imc'] ?? null,
                        'pihak_asal'       => $item['pihak_asal'] ?? null,
                        'gudang_asal_id'   => $gudangAsalId,
                        'gudang_tujuan_id' => $subJenis === 'TRANSFER_GUDANG' ? $item['gudang_tujuan_id'] : null,
                        'pic_user_id'      => $request->user()->id,
                        'status'           => 'COMPLETED',
                    ]);

                    // 4. Simpan Detail Transaksi
                    $detail = TransaksiDetail::create([
                        'transaksi_id' => $transaksi->id,
                        'barang_id'    => $barangId,
                        'qty'          => $qty,
                        'harga'        => (float) ($item['harga'] ?? 0),
                        'kondisi'      => $kondisiFix,
                    ]);

                    // 5. Potong Stok Gudang Asal
                    $stokAsal->decrement('jumlah', $qty);
                    $stokAsal->refresh();

                    StockLog::create([
                        'barang_id'     => $barangId,
                        'gudang_id'     => $gudangAsalId,
                        'transaksi_id'  => $transaksi->id,
                        'user_id'       => $request->user()->id,
                        'qty_perubahan' => -$qty,
                        'qty_akhir'     => $stokAsal->jumlah,
                        'keterangan'    => "Pengeluaran Stok ({$subJenis}) - " . ($transaksi->pihak_asal ?: 'Gudang Tujuan'),
                    ]);

                    // 6. Jika Transfer Gudang, Tambah Stok Gudang Penerima
                    if ($subJenis === 'TRANSFER_GUDANG' && !empty($item['gudang_tujuan_id'])) {
                        $stokTujuan = Stok::firstOrCreate(
                            ['barang_id' => $barangId, 'gudang_id' => $item['gudang_tujuan_id']],
                            ['jumlah' => 0]
                        );
                        $stokTujuan->increment('jumlah', $qty);
                        $stokTujuan->refresh();

                        StockLog::create([
                            'barang_id'     => $barangId,
                            'gudang_id'     => $item['gudang_tujuan_id'],
                            'transaksi_id'  => $transaksi->id,
                            'user_id'       => $request->user()->id,
                            'qty_perubahan' => +$qty,
                            'qty_akhir'     => $stokTujuan->jumlah,
                            'keterangan'    => "Penerimaan Transfer dari Gudang #{$gudangAsalId}",
                        ]);
                    }

                    // 7. Update Status Serial Number
                    if (!empty($serials)) {
                        foreach ($serials as $sn) {
                            $cleanSn = trim($sn);
                            if ($cleanSn === '') continue;

                            $serialRecord = BarangSerial::where('barang_id', $barangId)
                                ->where('serial_number', $cleanSn)
                                ->first();

                            if ($serialRecord) {
                                if ($subJenis === 'TRANSFER_GUDANG') {
                                    $serialRecord->update([
                                        'gudang_id' => $item['gudang_tujuan_id'],
                                        'status'    => 'IN_WAREHOUSE',
                                    ]);
                                } else {
                                    $serialRecord->update([
                                        'gudang_id' => null,
                                        'status'    => 'IN_USE',
                                    ]);
                                }

                                DB::table('transaksi_detail_serials')->insert([
                                    'transaksi_detail_id' => $detail->id,
                                    'barang_serial_id'    => $serialRecord->id,
                                    'created_at'          => now(),
                                    'updated_at'          => now(),
                                ]);
                            }
                        }
                    }
                }
            });

            return redirect()->back()->with('success', count($validated['items']) . ' Data pengeluaran barang berhasil dicatat.');
        }

        return redirect()->back()->with('error', 'Format data tidak valid.');
    }

    public function update(Request $request, int $id)
    {
        $transaksi = Transaksi::with(['details.serials'])->findOrFail($id);

        $validated = $request->validate([
            'tanggal'          => 'required|date',
            'kondisi'          => 'nullable|string|max:50',
            'nomor_omc'        => 'required|string|max:100',
            'nomor_imc'        => 'nullable|string|max:100',
            'pihak_asal'       => 'nullable|string|max:255',
            'gudang_tujuan_id' => 'nullable|exists:gudangs,id',
            'keterangan'       => 'nullable|string|max:500',
        ]);

        $kondisiFix = $transaksi->sub_jenis === 'TRANSFER_GUDANG' ? '-' : ucfirst(strtolower($validated['kondisi'] ?? 'Baru'));

        DB::transaction(function () use ($transaksi, $validated, $kondisiFix) {
            $transaksi->update([
                'tanggal'          => $validated['tanggal'],
                'kondisi'          => $kondisiFix,
                'nomor_omc'        => $validated['nomor_omc'],
                'nomor_imc'        => $validated['nomor_imc'] ?? $transaksi->nomor_imc,
                'pihak_asal'       => $validated['pihak_asal'] ?? $transaksi->pihak_asal,
                'gudang_tujuan_id' => $validated['gudang_tujuan_id'] ?? $transaksi->gudang_tujuan_id,
                'keterangan'       => $validated['keterangan'] ?? $transaksi->keterangan,
            ]);

            foreach ($transaksi->details as $detail) {
                $detail->update(['kondisi' => $kondisiFix]);
            }
        });

        return redirect()->back()->with('success', 'Data transaksi keluar berhasil diperbarui.');
    }
}