<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangSerial;
use App\Models\Gudang;
use App\Models\Stok;
use App\Models\StockLog;
use App\Models\Supplier;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransaksiController extends Controller
{
    public function index(Request $request): Response
    {
        // 1. Tambahkan batas waktu toleransi eksekusi
        set_time_limit(120);

        $jenis    = $request->input('jenis_transaksi', 'MASUK');
        $search   = $request->input('search');
        $perPage  = (int) $request->input('per_page', 10);
        
        $rawOrder = strtolower((string) $request->input('order', 'desc'));
        $order    = in_array($rawOrder, ['asc', 'desc'], true) ? $rawOrder : 'desc';

        // 2. Query Transaksi Utama (Optimasi kolom select pada eager load)
        $query = Transaksi::with([
            'gudangAsal:id,nama_gudang',
            'gudangTujuan:id,nama_gudang',
            'supplier:id,nama_supplier',
            'picUser:id,name',
            'details' => function ($q) {
                $q->select('id', 'transaksi_id', 'barang_id', 'qty', 'harga', 'kondisi');
            },
            'details.barang:id,kode_barang,nama_barang,brand,tipe,kategori,part_number,deskripsi,is_wajib_sn,is_wajib_pn',
            'details.serials:id,serial_number,kondisi'
        ])
            ->orderBy('tanggal', $order)
            ->orderBy('id', $order);

        if ($jenis === 'TRANSFER') {
            $query->where(function ($q) {
                $q->where('jenis_transaksi', 'TRANSFER')
                  ->orWhere('sub_jenis', 'TRANSFER_GUDANG');
            });
        } elseif ($jenis === 'KELUAR') {
            $query->where('jenis_transaksi', 'KELUAR')
                  ->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } else {
            $query->where('jenis_transaksi', 'MASUK')
                  ->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        }

        // 3. Optimasi Pencarian (Menggunakan single EXISTS JOIN menggantikan double nested whereHas)
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "%{$search}%")
                  ->orWhere('nomor_imc', 'like', "%{$search}%")
                  ->orWhere('nomor_omc', 'like', "%{$search}%")
                  ->orWhere('pihak_asal', 'like', "%{$search}%")
                  ->orWhereExists(function ($sub) use ($search) {
                      $sub->select(DB::raw(1))
                          ->from('transaksi_details')
                          ->join('barangs', 'transaksi_details.barang_id', '=', 'barangs.id')
                          ->whereColumn('transaksi_details.transaksi_id', 'transaksis.id')
                          ->where(function ($qb) use ($search) {
                              $qb->where('barangs.nama_barang', 'like', "%{$search}%")
                                 ->orWhere('barangs.kode_barang', 'like', "%{$search}%")
                                 ->orWhere('barangs.brand', 'like', "%{$search}%")
                                 ->orWhere('barangs.tipe', 'like', "%{$search}%")
                                 ->orWhere('barangs.kategori', 'like', "%{$search}%")
                                 ->orWhere('barangs.part_number', 'like', "%{$search}%");
                          });
                  });
            });
        }

        // 4. Ringkasan Stok Gudang
        $snStats = BarangSerial::where('status', 'IN_WAREHOUSE')
            ->selectRaw("
                gudang_id,
                SUM(CASE WHEN UPPER(COALESCE(kondisi, 'BARU')) IN ('BARU', 'BAIK') THEN 1 ELSE 0 END) as sn_baru,
                SUM(CASE WHEN UPPER(COALESCE(kondisi, 'BARU')) LIKE '%BEKAS%' OR UPPER(COALESCE(kondisi, 'BARU')) LIKE '%SECOND%' THEN 1 ELSE 0 END) as sn_bekas,
                SUM(CASE WHEN UPPER(COALESCE(kondisi, 'BARU')) LIKE '%RUSAK%' THEN 1 ELSE 0 END) as sn_rusak
            ")
            ->groupBy('gudang_id')
            ->get()
            ->keyBy('gudang_id');

        $nonSnMasuk = DB::table('transaksi_details')
            ->join('transaksis', 'transaksi_details.transaksi_id', '=', 'transaksis.id')
            ->join('barangs', 'transaksi_details.barang_id', '=', 'barangs.id')
            ->where(function ($q) {
                $q->whereIn('transaksis.status', ['COMPLETED', 'completed'])
                  ->orWhereNull('transaksis.status');
            })
            ->where(function ($q) {
                $q->where('barangs.is_wajib_sn', false)
                  ->orWhere('barangs.is_wajib_sn', 0);
            })
            ->whereNotNull('transaksis.gudang_tujuan_id')
            ->selectRaw("
                transaksis.gudang_tujuan_id,
                SUM(CASE WHEN (UPPER(COALESCE(transaksis.kondisi, 'BARU')) = 'BARU' OR UPPER(COALESCE(transaksis.kondisi, 'BARU')) = 'BAIK') THEN transaksi_details.qty ELSE 0 END) as baru,
                SUM(CASE WHEN (UPPER(COALESCE(transaksis.kondisi, 'BARU')) LIKE '%BEKAS%' OR UPPER(COALESCE(transaksis.kondisi, 'BARU')) LIKE '%SECOND%') THEN transaksi_details.qty ELSE 0 END) as bekas,
                SUM(CASE WHEN UPPER(COALESCE(transaksis.kondisi, 'BARU')) LIKE '%RUSAK%' THEN transaksi_details.qty ELSE 0 END) as rusak
            ")
            ->groupBy('transaksis.gudang_tujuan_id')
            ->get()
            ->keyBy('gudang_tujuan_id');

        $nonSnKeluar = DB::table('transaksi_details')
            ->join('transaksis', 'transaksi_details.transaksi_id', '=', 'transaksis.id')
            ->join('barangs', 'transaksi_details.barang_id', '=', 'barangs.id')
            ->where(function ($q) {
                $q->whereIn('transaksis.status', ['COMPLETED', 'completed'])
                  ->orWhereNull('transaksis.status');
            })
            ->where(function ($q) {
                $q->where('barangs.is_wajib_sn', false)
                  ->orWhere('barangs.is_wajib_sn', 0);
            })
            ->whereNotNull('transaksis.gudang_asal_id')
            ->selectRaw("
                transaksis.gudang_asal_id,
                SUM(transaksi_details.qty) as total_keluar
            ")
            ->groupBy('transaksis.gudang_asal_id')
            ->pluck('total_keluar', 'transaksis.gudang_asal_id');

        $gudangList = Gudang::where('is_active', true)
            ->get(['id', 'nama_gudang', 'kode_gudang'])
            ->map(function ($g) use ($snStats, $nonSnMasuk, $nonSnKeluar) {
                $sn = $snStats->get($g->id);
                $snBaru  = (int) ($sn?->sn_baru ?? 0);
                $snBekas = (int) ($sn?->sn_bekas ?? 0);
                $snRusak = (int) ($sn?->sn_rusak ?? 0);

                $ns = $nonSnMasuk->get($g->id);
                $nsKeluar = (int) ($nonSnKeluar[$g->id] ?? 0);
                $nsBaru   = max(0, ((int) ($ns?->baru ?? 0)) - $nsKeluar);
                $nsBekas  = (int) ($ns?->bekas ?? 0);
                $nsRusak  = (int) ($ns?->rusak ?? 0);

                $g->stok_baru  = $snBaru + $nsBaru;
                $g->stok_bekas = $snBekas + $nsBekas;
                $g->stok_rusak = $snRusak + $nsRusak;
                $g->total_stok = $g->stok_baru + $g->stok_bekas + $g->stok_rusak;
                return $g;
            });

        // 5. Query Master Barang Cepat & Ringan (Tanpa Subquery whereHas yang memicu timeout)
        $barangList = Barang::select([
            'id', 
            'kode_barang', 
            'nama_barang', 
            'part_number', 
            'brand', 
            'tipe', 
            'kategori', 
            'deskripsi', 
            'is_wajib_sn', 
            'is_wajib_pn'
        ])->with([
            'stoks' => function ($q) {
                $q->select('id', 'barang_id', 'gudang_id', 'jumlah');
            },
            'serials' => function ($q) {
                $q->select('id', 'barang_id', 'gudang_id', 'serial_number', 'kondisi', 'status')
                  ->where('status', 'IN_WAREHOUSE');
            },
            'transaksiDetails' => function ($q) {
                $q->select('id', 'transaksi_id', 'barang_id', 'qty', 'kondisi')
                  ->with(['transaksi:id,no_transaksi,nomor_imc,nomor_omc,kondisi,gudang_tujuan_id,tanggal,status,jenis_transaksi,sub_jenis']);
            }
        ])->get();

        return Inertia::render('Transaksi/Index', [
            'transaksis' => $query->paginate($perPage)->withQueryString(),
            'gudangs'    => $gudangList,
            'suppliers'  => Supplier::all(['id', 'nama_supplier']),
            'barangs'    => $barangList,
            'filters'    => [
                'jenis_transaksi' => $jenis,
                'search'          => $search ?? '',
                'order'           => $order,
                'per_page'        => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        if ($request->has('items') && is_array($request->items)) {
            $validated = $request->validate([
                'items'                     => 'required|array|min:1',
                'items.*.sub_jenis'         => 'required|string|in:PEMBELIAN,PEMINJAMAN,PENGEMBALIAN',
                'items.*.tanggal'           => 'required|date',
                'items.*.kondisi'           => 'required|string|max:50',
                'items.*.nomor_imc'         => 'required|string|max:100',
                'items.*.nomor_omc'         => 'nullable|string|max:100',
                'items.*.pihak_asal'        => 'required|string|max:255',
                'items.*.gudang_tujuan_id'  => 'required|exists:gudangs,id',
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
                        'PEMBELIAN'    => 'TRX-IN-BUY',
                        'PEMINJAMAN'   => 'TRX-IN-BORROW',
                        'PENGEMBALIAN' => 'TRX-IN-RET',
                        default        => 'TRX-MASUK',
                    };

                    $randomSuffix = strtoupper(Str::random(4));
                    $noTransaksi  = $prefix . '-' . date('YmdHis') . '-' . $randomSuffix;
                    $kondisiFix   = ucfirst(strtolower($item['kondisi'] ?? 'Baru'));

                    $transaksi = Transaksi::create([
                        'no_transaksi'     => $noTransaksi,
                        'jenis_transaksi'  => 'MASUK',
                        'sub_jenis'        => $subJenis,
                        'tanggal'          => $item['tanggal'],
                        'kondisi'          => $kondisiFix,
                        'nomor_imc'        => $item['nomor_imc'],
                        'nomor_omc'        => $item['nomor_omc'] ?? null,
                        'pihak_asal'       => $item['pihak_asal'],
                        'gudang_asal_id'   => null,
                        'gudang_tujuan_id' => $item['gudang_tujuan_id'],
                        'pic_user_id'      => $request->user()->id,
                        'status'           => 'COMPLETED',
                    ]);

                    $barangId = $item['barang_id'];
                    $qty      = (int) $item['qty'];
                    $harga    = $subJenis === 'PEMBELIAN' ? (float) ($item['harga'] ?? 0) : 0;
                    $serials  = array_filter($item['serials'] ?? []);

                    $barang = Barang::findOrFail($barangId);
                    if ($barang->is_wajib_sn && count($serials) !== $qty) {
                        throw new \Exception("Jumlah Serial Number untuk barang '{$barang->nama_barang}' harus tepat {$qty} unit.");
                    }

                    $detail = TransaksiDetail::create([
                        'transaksi_id' => $transaksi->id,
                        'barang_id'    => $barangId,
                        'qty'          => $qty,
                        'harga'        => $harga,
                        'kondisi'      => $kondisiFix,
                    ]);

                    if (!empty($serials)) {
                        foreach ($serials as $sn) {
                            $cleanSn = trim($sn);
                            if ($cleanSn === '') continue;

                            $serialRecord = BarangSerial::firstOrCreate(
                                ['barang_id' => $barangId, 'serial_number' => $cleanSn],
                                [
                                    'status'    => 'IN_WAREHOUSE', 
                                    'gudang_id' => $transaksi->gudang_tujuan_id,
                                    'kondisi'   => $kondisiFix,
                                    'nomer_imc' => $transaksi->nomor_imc
                                ]
                            );

                            $serialRecord->update([
                                'status'    => 'IN_WAREHOUSE',
                                'gudang_id' => $transaksi->gudang_tujuan_id,
                                'kondisi'   => $kondisiFix,
                                'nomer_imc' => $transaksi->nomor_imc,
                            ]);

                            DB::table('transaksi_detail_serials')->insert([
                                'transaksi_detail_id' => $detail->id,
                                'barang_serial_id'    => $serialRecord->id,
                                'created_at'          => now(),
                                'updated_at'          => now(),
                            ]);
                        }
                    }

                    if ($transaksi->gudang_tujuan_id) {
                        $stokTujuan = Stok::firstOrCreate(
                            ['barang_id' => $barangId, 'gudang_id' => $transaksi->gudang_tujuan_id],
                            ['jumlah' => 0]
                        );
                        $stokTujuan->increment('jumlah', $qty);
                        $stokTujuan->refresh();

                        StockLog::create([
                            'barang_id'     => $barangId,
                            'gudang_id'     => $transaksi->gudang_tujuan_id,
                            'transaksi_id'  => $transaksi->id,
                            'user_id'       => $request->user()->id,
                            'qty_perubahan' => +$qty,
                            'qty_akhir'     => $stokTujuan->jumlah,
                            'keterangan'    => "Penerimaan Stok Masuk ({$transaksi->sub_jenis})",
                        ]);
                    }
                }
            });

            return redirect()->back()->with('success', count($validated['items']) . ' Data transaksi masuk berhasil dicatat.');
        }

        return redirect()->back()->with('error', 'Format data tidak valid.');
    }

    public function storeTransfer(Request $request)
    {
        $validated = $request->validate([
            'items'                    => 'required|array|min:1',
            'items.*.tanggal'          => 'required|date',
            'items.*.nomor_omc'        => 'required|string|max:100',
            'items.*.nomor_imc'        => 'nullable|string|max:100',
            'items.*.gudang_asal_id'   => 'required|exists:gudangs,id',
            'items.*.gudang_tujuan_id' => 'required|exists:gudangs,id',
            'items.*.barang_id'        => 'required|exists:barangs,id',
            'items.*.qty'              => 'required|integer|min:1|max:50',
            'items.*.serials'          => 'nullable|array',
            'items.*.serials.*'        => 'nullable|string|max:100',
        ]);

        DB::transaction(function () use ($validated, $request) {
            foreach ($validated['items'] as $item) {
                $randomSuffix = strtoupper(Str::random(4));
                $noTransaksi  = 'TRX-TRF-' . date('YmdHis') . '-' . $randomSuffix;
                $barangId     = (int) $item['barang_id'];
                $gudangAsalId = (int) $item['gudang_asal_id'];
                $gudangTujuanId = (int) $item['gudang_tujuan_id'];
                $qty          = (int) $item['qty'];

                $barang       = Barang::findOrFail($barangId);
                $serials      = array_filter($item['serials'] ?? []);

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

                if ($barang->is_wajib_sn && count($serials) !== $qty) {
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
                $stokAsal->refresh();

                StockLog::create([
                    'barang_id'     => $barangId,
                    'gudang_id'     => $gudangAsalId,
                    'transaksi_id'  => $transaksi->id,
                    'user_id'       => $request->user()->id,
                    'qty_perubahan' => -$qty,
                    'qty_akhir'     => $stokAsal->jumlah,
                    'keterangan'    => "Transfer Keluar ke Gudang #{$gudangTujuanId}",
                ]);

                $stokTujuan = Stok::firstOrCreate(
                    ['barang_id' => $barangId, 'gudang_id' => $gudangTujuanId],
                    ['jumlah' => 0]
                );
                $stokTujuan->increment('jumlah', $qty);
                $stokTujuan->refresh();

                StockLog::create([
                    'barang_id'     => $barangId,
                    'gudang_id'     => $gudangTujuanId,
                    'transaksi_id'  => $transaksi->id,
                    'user_id'       => $request->user()->id,
                    'qty_perubahan' => +$qty,
                    'qty_akhir'     => $stokTujuan->jumlah,
                    'keterangan'    => "Penerimaan Transfer dari Gudang #{$gudangAsalId}",
                ]);

                if (!empty($serials)) {
                    foreach ($serials as $sn) {
                        $serialRecord = BarangSerial::where('barang_id', $barangId)
                            ->where('serial_number', trim($sn))
                            ->first();

                        if ($serialRecord) {
                            $serialRecord->update([
                                'gudang_id' => $gudangTujuanId,
                                'status'    => 'IN_WAREHOUSE',
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

        return redirect()->back()->with('success', 'Transfer antar-gudang berhasil dicatat.');
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
            'gudang_tujuan_id' => 'nullable|exists:gudangs,id',
            'qty'              => 'nullable|integer|min:1|max:50',
            'harga'            => 'nullable|numeric|min:0',
            'keterangan'       => 'nullable|string|max:500',
        ]);

        $kondisiFix = ucfirst(strtolower($validated['kondisi'] ?? 'Baru'));
        $hargaFix   = $transaksi->sub_jenis === 'PEMBELIAN' ? (float) ($validated['harga'] ?? 0) : 0;
        $newQty     = isset($validated['qty']) ? (int) $validated['qty'] : null;

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
                'gudang_tujuan_id' => $newGudangTujuanId,
                'keterangan'       => $validated['keterangan'] ?? $transaksi->keterangan,
            ]);
        });

        return redirect()->back()->with('success', 'Data transaksi berhasil diperbarui.');
    }

    public function destroy(int $id)
    {
        $transaksi = Transaksi::findOrFail($id);
        $transaksi->delete();
        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:transaksis,id',
        ]);

        Transaksi::destroy($request->ids);
        return redirect()->back()->with('success', count($request->ids) . ' transaksi terpilih berhasil dihapus.');
    }

    public function export(Request $request): StreamedResponse
    {
        set_time_limit(180);

        $jenis    = $request->input('jenis_transaksi', 'MASUK');
        $rawOrder = strtolower((string) $request->input('order', 'desc'));
        $order    = in_array($rawOrder, ['asc', 'desc'], true) ? $rawOrder : 'desc';

        $query = Transaksi::with(['gudangAsal', 'gudangTujuan', 'details.barang', 'details.serials'])
            ->orderBy('tanggal', $order);

        if ($jenis === 'TRANSFER') {
            $query->where(fn($q) => $q->where('jenis_transaksi', 'TRANSFER')->orWhere('sub_jenis', 'TRANSFER_GUDANG'));
        } elseif ($jenis === 'KELUAR') {
            $query->where('jenis_transaksi', 'KELUAR')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } else {
            $query->where('jenis_transaksi', 'MASUK')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        }

        $transaksis = $query->get();
        $csvFileName = 'Transaksi_' . $jenis . '_' . date('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$csvFileName}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $columns = [
            'No Transaksi', 
            'Jenis Transaksi', 
            'Kode PPL', 
            'Nama Barang', 
            'Part Number', 
            'Satuan', 
            'Tanggal', 
            'QTY', 
            'Harga Satuan (Rp)',
            'Total Nilai (Rp)',
            'Kondisi', 
            'Nomor IMC', 
            'Nomor OMC', 
            'Gudang Asal / Pihak Asal', 
            'Gudang Tujuan / Site', 
            'Serial Numbers'
        ];

        $callback = function () use ($transaksis, $columns) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns, ';');

            foreach ($transaksis as $t) {
                $detail = $t->details->first();
                $barang = $detail?->barang;
                $snList = $detail ? $detail->serials->map(fn($s) => "{$s->serial_number} ({$s->kondisi})")->implode(', ') : '-';
                $namaLengkap = $barang ? trim("{$barang->brand} {$barang->tipe} {$barang->kategori}") : '-';
                $hargaSatuan = $detail?->harga ?? 0;
                $totalNilai = ($detail?->qty ?? 0) * $hargaSatuan;

                fputcsv($file, [
                    $t->no_transaksi,
                    $t->sub_jenis ?? $t->jenis_transaksi,
                    $barang?->kode_barang ?? '-',
                    $namaLengkap ?: ($barang?->nama_barang ?? '-'),
                    $barang?->part_number ?? '-',
                    $barang?->deskripsi ?? 'Unit',
                    $t->tanggal ? date('Y-m-d', strtotime($t->tanggal)) : '-',
                    $detail?->qty ?? 0,
                    $hargaSatuan > 0 ? number_format($hargaSatuan, 0, ',', '.') : '-',
                    $totalNilai > 0 ? number_format($totalNilai, 0, ',', '.') : '-',
                    $t->kondisi ?? '-',
                    $t->nomor_imc ?? '-',
                    $t->nomor_omc ?? '-',
                    $t->gudangAsal?->nama_gudang ?? ($t->pihak_asal ?? '-'),
                    $t->gudangTujuan?->nama_gudang ?? ($t->pihak_asal ?? '-'),
                    $snList ?: '-',
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function reset(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Hanya Admin yang dapat mengosongkan data transaksi.');
        }

        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::table('transaksi_detail_serials')->truncate();
            TransaksiDetail::truncate();
            StockLog::truncate();
            Transaksi::truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } else {
            DB::table('transaksi_detail_serials')->delete();
            TransaksiDetail::query()->delete();
            StockLog::query()->delete();
            Transaksi::query()->delete();
        }

        return redirect()->back()->with('success', 'Seluruh Riwayat Transaksi berhasil dikosongkan.');
    }
}