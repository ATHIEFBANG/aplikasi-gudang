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
use Illuminate\Database\UniqueConstraintViolationException;

class TransaksiBarangMasukController extends Controller
{
    public function store(Request $request)
    {
        if ($request->has('items') && is_array($request->items)) {
            set_time_limit(120);

            try {
                $validated = $request->validate([
                    'items'                     => 'required|array|min:1',
                    'items.*.sub_jenis'         => 'required|string|in:PEMBELIAN,PEMINJAMAN,PENGEMBALIAN',
                    'items.*.tanggal'           => 'required|date',
                    'items.*.kondisi'           => 'required|string|max:50',
                    'items.*.nomor_imc'         => 'required|string|max:100',
                    'items.*.nomor_omc'         => 'nullable|string|max:100',
                    'items.*.pihak_asal'        => 'required|string|max:255',
                    'items.*.kode_projek'       => 'nullable|string|max:100',
                    'items.*.nama_customer'     => 'nullable|string|max:255',
                    'items.*.gudang_tujuan_id'  => 'required|exists:gudangs,id',
                    'items.*.barang_id'         => 'required|exists:barangs,id',
                    'items.*.qty'               => 'required|integer|min:1|max:50',
                    'items.*.harga'             => 'nullable|numeric|min:0',
                    'items.*.serials'           => 'nullable|array',
                    'items.*.serials.*'         => 'nullable|string|max:100',
                ]);

                // Ambil data barang secara kolektif untuk menghindari N+1 query
                $barangIds = array_unique(array_column($validated['items'], 'barang_id'));
                $barangs   = Barang::whereIn('id', $barangIds)->get()->keyBy('id');

                // 🔍 Validasi Pra-Transaksi: Cek duplikasi Serial Number sebelum query DB
                $seenSerials = [];
                foreach ($validated['items'] as $item) {
                    $serials = array_filter(array_map('trim', $item['serials'] ?? []));

                    foreach ($serials as $sn) {
                        if ($sn === '') continue;
                        $snLower = strtolower($sn);

                        // 1. Cek duplikat dalam payload request yang sama
                        if (in_array($snLower, $seenSerials)) {
                            return redirect()->back()->with('error', "Serial Number '{$sn}' terdeteksi ganda dalam inputan form ini.");
                        }
                        $seenSerials[] = $snLower;

                        // 2. Cek duplikat di database (tabel barang_serials)
                        $existsInDb = BarangSerial::whereRaw('LOWER(serial_number) = ?', [$snLower])->exists();
                        if ($existsInDb) {
                            return redirect()->back()->with('error', "Serial Number '{$sn}' sudah terdaftar di sistem.");
                        }
                    }
                }

                DB::transaction(function () use ($validated, $request, $barangs) {
                    $now = now();
                    $detailSerialsToInsert = [];
                    $stockLogsToInsert     = [];

                    foreach ($validated['items'] as $item) {
                        $subJenis = $item['sub_jenis'];
                        $prefix   = match($subJenis) {
                            'PEMBELIAN'    => 'TRX-IN-BUY',
                            'PEMINJAMAN'   => 'TRX-IN-BORROW',
                            'PENGEMBALIAN' => 'TRX-IN-RET',
                            default        => 'TRX-MASUK',
                        };

                        $randomSuffix = strtoupper(Str::random(4));
                        $noTransaksi  = $prefix . '-' . date('YmdHis') . '-' . $randomSuffix;
                        $kondisiFix   = ucfirst(strtolower($item['kondisi'] ?? 'Baru'));
                        $barangId     = (int) $item['barang_id'];
                        $qty          = (int) $item['qty'];
                        $harga        = $subJenis === 'PEMBELIAN' ? (float) ($item['harga'] ?? 0) : 0;
                        $serials      = array_filter(array_map('trim', $item['serials'] ?? []));

                        $barang = $barangs->get($barangId);
                        if ($barang && $barang->is_wajib_sn && count($serials) !== $qty) {
                            throw new \Exception("Jumlah Serial Number untuk barang '{$barang->nama_barang}' harus tepat {$qty} unit.");
                        }

                        // 1. Simpan Header Transaksi
                        $transaksi = Transaksi::create([
                            'no_transaksi'     => $noTransaksi,
                            'jenis_transaksi'  => 'MASUK',
                            'sub_jenis'        => $subJenis,
                            'tanggal'          => $item['tanggal'],
                            'kondisi'          => $kondisiFix,
                            'nomor_imc'        => $item['nomor_imc'],
                            'nomor_omc'        => $item['nomor_omc'] ?? null,
                            'pihak_asal'       => $item['pihak_asal'],
                            'kode_projek'      => !empty($item['kode_projek']) ? trim($item['kode_projek']) : null,
                            'nama_customer'    => !empty($item['nama_customer']) ? trim($item['nama_customer']) : null,
                            'gudang_asal_id'   => null,
                            'gudang_tujuan_id' => $item['gudang_tujuan_id'],
                            'pic_user_id'      => $request->user()->id,
                            'status'           => 'COMPLETED',
                        ]);

                        // 2. Simpan Detail Transaksi
                        $detail = TransaksiDetail::create([
                            'transaksi_id' => $transaksi->id,
                            'barang_id'    => $barangId,
                            'qty'          => $qty,
                            'harga'        => $harga,
                            'kondisi'      => $kondisiFix,
                        ]);

                        // 3. Proses Serial Number
                        if (!empty($serials)) {
                            foreach ($serials as $cleanSn) {
                                if ($cleanSn === '') continue;

                                $serialRecord = BarangSerial::create([
                                    'barang_id'     => $barangId,
                                    'serial_number' => $cleanSn,
                                    'status'        => 'IN_WAREHOUSE', 
                                    'gudang_id'     => $transaksi->gudang_tujuan_id,
                                    'kondisi'       => $kondisiFix,
                                    'nomer_imc'     => $transaksi->nomor_imc
                                ]);

                                $detailSerialsToInsert[] = [
                                    'transaksi_detail_id' => $detail->id,
                                    'barang_serial_id'    => $serialRecord->id,
                                    'created_at'          => $now,
                                    'updated_at'          => $now,
                                ];
                            }
                        }

                        // 4. Update Stok & Siapkan Stock Log
                        if ($transaksi->gudang_tujuan_id) {
                            $stokTujuan = Stok::firstOrCreate(
                                ['barang_id' => $barangId, 'gudang_id' => $transaksi->gudang_tujuan_id],
                                ['jumlah' => 0]
                            );
                            $stokTujuan->increment('jumlah', $qty);

                            $stockLogsToInsert[] = [
                                'barang_id'     => $barangId,
                                'gudang_id'     => $transaksi->gudang_tujuan_id,
                                'transaksi_id'  => $transaksi->id,
                                'user_id'       => $request->user()->id,
                                'qty_perubahan' => +$qty,
                                'qty_akhir'     => $stokTujuan->jumlah,
                                'keterangan'    => "Penerimaan Stok Masuk ({$transaksi->sub_jenis})",
                                'created_at'    => $now,
                                'updated_at'    => $now,
                            ];
                        }
                    }

                    // Batch insert untuk performa optimal
                    if (!empty($detailSerialsToInsert)) {
                        DB::table('transaksi_detail_serials')->insert($detailSerialsToInsert);
                    }

                    if (!empty($stockLogsToInsert)) {
                        StockLog::insert($stockLogsToInsert);
                    }
                });

                return redirect()->back()->with('success', count($validated['items']) . ' Data transaksi masuk berhasil dicatat.');

            } catch (UniqueConstraintViolationException $e) {
                return redirect()->back()->with('error', 'Gagal menyimpan: Terdeteksi Serial Number yang sudah terdaftar di sistem.');
            } catch (\Throwable $e) {
                return redirect()->back()->with('error', 'Gagal menyimpan: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('error', 'Format data tidak valid.');
    }

    public function update(Request $request, int $id)
    {
        $transaksi = Transaksi::with(['details.serials'])->findOrFail($id);

        $validated = $request->validate([
            'tanggal'          => 'required|date',
            'kondisi'          => 'nullable|string|max:50',
            'nomor_imc'        => 'nullable|string|max:100',
            'nomor_omc'        => 'nullable|string|max:100',
            'pihak_asal'       => 'nullable|string|max:255',
            'kode_projek'      => 'nullable|string|max:100',
            'nama_customer'    => 'nullable|string|max:255',
            'gudang_tujuan_id' => 'nullable|exists:gudangs,id',
            'qty'              => 'nullable|integer|min:1|max:50',
            'harga'            => 'nullable|numeric|min:0',
            'keterangan'       => 'nullable|string|max:500',
        ]);

        $kondisiFix = ucfirst(strtolower($validated['kondisi'] ?? 'Baru'));
        $hargaFix   = $transaksi->sub_jenis === 'PEMBELIAN' ? (float) ($validated['harga'] ?? 0) : 0;
        $newQty     = isset($validated['qty']) ? (int) $validated['qty'] : null;

        try {
            DB::transaction(function () use ($transaksi, $validated, $kondisiFix, $hargaFix, $newQty) {
                $oldGudangTujuanId = (int) $transaksi->gudang_tujuan_id;
                $newGudangTujuanId = isset($validated['gudang_tujuan_id']) ? (int) $validated['gudang_tujuan_id'] : $oldGudangTujuanId;

                foreach ($transaksi->details as $detail) {
                    $oldQty   = (int) $detail->qty;
                    $finalQty = $newQty !== null ? $newQty : $oldQty;

                    $detail->update([
                        'kondisi' => $kondisiFix,
                        'harga'   => $hargaFix,
                        'qty'     => $finalQty,
                    ]);

                    if ($newGudangTujuanId && $newGudangTujuanId !== $oldGudangTujuanId) {
                        $barangId = $detail->barang_id;
                        $stokLama = Stok::where('barang_id', $barangId)->where('gudang_id', $oldGudangTujuanId)->first();
                        if ($stokLama) {
                            $stokLama->decrement('jumlah', min($stokLama->jumlah, $oldQty));
                        }

                        $stokBaru = Stok::firstOrCreate(['barang_id' => $barangId, 'gudang_id' => $newGudangTujuanId], ['jumlah' => 0]);
                        $stokBaru->increment('jumlah', $finalQty);

                        foreach ($detail->serials as $serial) {
                            $serial->update([
                                'gudang_id' => $newGudangTujuanId,
                                'nomer_imc' => $validated['nomor_imc'] ?? $serial->nomer_imc,
                            ]);
                        }
                    }
                }

                $transaksi->update([
                    'tanggal'          => $validated['tanggal'],
                    'kondisi'          => $kondisiFix,
                    'nomor_imc'        => $validated['nomor_imc'] ?? $transaksi->nomor_imc,
                    'nomor_omc'        => $validated['nomor_omc'] ?? $transaksi->nomor_omc,
                    'pihak_asal'       => $validated['pihak_asal'] ?? $transaksi->pihak_asal,
                    'kode_projek'      => $validated['kode_projek'] ?? $transaksi->kode_projek,
                    'nama_customer'    => $validated['nama_customer'] ?? $transaksi->nama_customer,
                    'gudang_tujuan_id' => $newGudangTujuanId,
                    'keterangan'       => $validated['keterangan'] ?? $transaksi->keterangan,
                ]);
            });

            return redirect()->back()->with('success', 'Data transaksi masuk berhasil diperbarui.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui: ' . $e->getMessage());
        }
    }
}