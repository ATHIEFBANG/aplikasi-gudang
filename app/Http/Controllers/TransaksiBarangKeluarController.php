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
                'items.*.sub_jenis'         => 'required|string|in:BARANG_KE_SITE,PEMAKAIAN_INTERNAL',
                'items.*.tanggal'           => 'required|date',
                'items.*.kondisi'           => 'nullable|string|max:50',
                'items.*.nomor_omc'         => 'required|string|max:100',
                'items.*.nomor_imc'         => 'nullable|string|max:100',
                'items.*.pihak_asal'        => 'required|string|max:255',
                'items.*.gudang_asal_id'    => 'required|exists:gudangs,id',
                'items.*.barang_id'         => 'required|exists:barangs,id',
                'items.*.qty'               => 'required|integer|min:1|max:50',
                'items.*.serials'           => 'nullable|array',
                'items.*.serials.*'         => 'nullable|string|max:100',
            ]);

            DB::transaction(function () use ($validated, $request) {
                foreach ($validated['items'] as $item) {
                    $subJenis = $item['sub_jenis'];
                    $prefix = match($subJenis) {
                        'BARANG_KE_SITE'     => 'TRX-OUT-SITE',
                        'PEMAKAIAN_INTERNAL' => 'TRX-OUT-INT',
                        default              => 'TRX-KELUAR',
                    };

                    $randomSuffix = strtoupper(Str::random(4));
                    $noTransaksi  = $prefix . '-' . date('YmdHis') . '-' . $randomSuffix;
                    $barangId     = (int) $item['barang_id'];
                    $gudangAsalId = (int) $item['gudang_asal_id'];
                    $qty          = (int) $item['qty'];
                    $barang       = Barang::findOrFail($barangId);
                    $serials      = array_filter($item['serials'] ?? []);

                    $kondisiFix = !empty($item['kondisi']) && $item['kondisi'] !== '-' 
                        ? ucfirst(strtolower($item['kondisi'])) 
                        : 'Baru';

                    if ($barang->is_wajib_sn && !empty($serials)) {
                        $firstSn = BarangSerial::where('barang_id', $barangId)
                            ->where('serial_number', trim($serials[0]))
                            ->first();
                        if ($firstSn && !empty($firstSn->kondisi)) {
                            $kondisiFix = ucfirst(strtolower($firstSn->kondisi));
                        }
                    }

                    $stokAsal = Stok::where('barang_id', $barangId)
                        ->where('gudang_id', $gudangAsalId)
                        ->lockForUpdate()
                        ->first();

                    if (!$stokAsal || $stokAsal->jumlah < $qty) {
                        $stokTersedia = $stokAsal ? $stokAsal->jumlah : 0;
                        throw new \Exception("Stok barang '{$barang->nama_barang}' di gudang asal tidak mencukupi (Tersedia: {$stokTersedia}, Diminta: {$qty}).");
                    }

                    if ($barang->is_wajib_sn && count($serials) !== $qty) {
                        throw new \Exception("Jumlah Serial Number untuk barang '{$barang->nama_barang}' harus tepat {$qty} unit.");
                    }

                    // 2. Simpan Header Transaksi Keluar (nomor_imc dari batch barang masuk tersimpan)
                    $transaksi = Transaksi::create([
                        'no_transaksi'     => $noTransaksi,
                        'jenis_transaksi'  => 'KELUAR',
                        'sub_jenis'        => $subJenis,
                        'tanggal'          => $item['tanggal'],
                        'kondisi'          => $kondisiFix,
                        'nomor_omc'        => $item['nomor_omc'],
                        'nomor_imc'        => !empty($item['nomor_imc']) ? trim($item['nomor_imc']) : null,
                        'pihak_asal'       => $item['pihak_asal'],
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
                    $stokAsal->decrement('jumlah', $qty);
                    $stokAsal->refresh();

                    StockLog::create([
                        'barang_id'     => $barangId,
                        'gudang_id'     => $gudangAsalId,
                        'transaksi_id'  => $transaksi->id,
                        'user_id'       => $request->user()->id,
                        'qty_perubahan' => -$qty,
                        'qty_akhir'     => $stokAsal->jumlah,
                        'keterangan'    => "Pengeluaran Stok ({$subJenis}) ke {$transaksi->pihak_asal} [{$kondisiFix}]",
                    ]);

                    // 5. Update Status Serial Number
                    if (!empty($serials)) {
                        foreach ($serials as $sn) {
                            $cleanSn = trim($sn);
                            if ($cleanSn === '') continue;

                            $serialRecord = BarangSerial::where('barang_id', $barangId)
                                ->where('serial_number', $cleanSn)
                                ->first();

                            if ($serialRecord) {
                                $serialRecord->update([
                                    'gudang_id' => null,
                                    'status'    => 'IN_USE',
                                ]);

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
        $transaksi = Transaksi::with(['details'])->findOrFail($id);

        $validated = $request->validate([
            'tanggal'    => 'required|date',
            'kondisi'    => 'nullable|string|max:50',
            'nomor_omc'  => 'required|string|max:100',
            'nomor_imc'  => 'nullable|string|max:100',
            'pihak_asal' => 'required|string|max:255',
            'keterangan' => 'nullable|string|max:500',
        ]);

        $kondisiFix = !empty($validated['kondisi']) && $validated['kondisi'] !== '-' 
            ? ucfirst(strtolower($validated['kondisi'])) 
            : ($transaksi->kondisi !== '-' ? $transaksi->kondisi : 'Baru');

        DB::transaction(function () use ($transaksi, $validated, $kondisiFix) {
            $transaksi->update([
                'tanggal'    => $validated['tanggal'],
                'kondisi'    => $kondisiFix,
                'nomor_omc'  => $validated['nomor_omc'],
                'nomor_imc'  => $validated['nomor_imc'] ?? $transaksi->nomor_imc,
                'pihak_asal' => $validated['pihak_asal'],
                'keterangan' => $validated['keterangan'] ?? $transaksi->keterangan,
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