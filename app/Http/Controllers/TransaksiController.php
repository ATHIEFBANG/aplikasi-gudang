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
        $jenis    = $request->input('jenis_transaksi', 'MASUK');
        $subJenis = $request->input('sub_jenis');
        $search   = $request->input('search');
        $perPage  = (int) $request->input('per_page', 10);
        
        $rawOrder = strtolower((string) $request->input('order', 'desc'));
        $order    = in_array($rawOrder, ['asc', 'desc'], true) ? $rawOrder : 'desc';

        $query = Transaksi::with([
            'gudangAsal:id,nama_gudang',
            'gudangTujuan:id,nama_gudang',
            'supplier:id,nama_supplier',
            'picUser:id,name',
            'details.barang',
            'details.serials'
        ])
            ->orderBy('tanggal', $order)
            ->orderBy('id', $order);

        if ($jenis && $jenis !== 'ALL') {
            $query->where('jenis_transaksi', $jenis);
        }

        if ($subJenis && $subJenis !== 'ALL') {
            $query->where('sub_jenis', $subJenis);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "%{$search}%")
                  ->orWhere('nomor_imc', 'like', "%{$search}%")
                  ->orWhere('nomor_omc', 'like', "%{$search}%")
                  ->orWhere('pihak_asal', 'like', "%{$search}%")
                  ->orWhereHas('details.barang', function ($qb) use ($search) {
                      $qb->where('nama_barang', 'like', "%{$search}%")
                         ->orWhere('kode_barang', 'like', "%{$search}%")
                         ->orWhere('brand', 'like', "%{$search}%")
                         ->orWhere('tipe', 'like', "%{$search}%")
                         ->orWhere('kategori', 'like', "%{$search}%")
                         ->orWhere('part_number', 'like', "%{$search}%");
                  });
            });
        }

        return Inertia::render('Transaksi/Index', [
            'transaksis' => $query->paginate($perPage)->withQueryString(),
            'gudangs'    => Gudang::where('is_active', true)->get(['id', 'nama_gudang', 'kode_gudang']),
            'suppliers'  => Supplier::all(['id', 'nama_supplier']),
            'barangs'    => Barang::with([
                'stoks',
                'serials' => function ($q) {
                    $q->where('status', 'IN_WAREHOUSE');
                }
            ])->get([
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
            ]),
            'filters'    => [
                'jenis_transaksi' => $jenis,
                'sub_jenis'       => $subJenis ?? 'ALL',
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
                'items.*.sub_jenis'         => 'required|string|in:PEMBELIAN,PEMINJAMAN,PENGEMBALIAN,TRANSFER_GUDANG',
                'items.*.tanggal'           => 'required|date',
                'items.*.kondisi'           => 'nullable|string|max:50',
                'items.*.nomor_imc'         => 'required|string|max:100',
                'items.*.nomor_omc'         => 'nullable|string|max:100',
                'items.*.pihak_asal'        => 'nullable|string|max:255',
                'items.*.gudang_asal_id'    => 'nullable|exists:gudangs,id',
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
                        'PEMBELIAN'       => 'TRX-IN-BUY',
                        'PEMINJAMAN'      => 'TRX-IN-BORROW',
                        'PENGEMBALIAN'    => 'TRX-IN-RET',
                        'TRANSFER_GUDANG' => 'TRX-TRF',
                        default           => 'TRX-MASUK',
                    };

                    $randomSuffix = strtoupper(Str::random(4));
                    $noTransaksi  = $prefix . '-' . date('YmdHis') . '-' . $randomSuffix;
                    $kondisiFix   = $subJenis === 'TRANSFER_GUDANG' ? '-' : ucfirst(strtolower($item['kondisi'] ?? 'Baru'));

                    $transaksi = Transaksi::create([
                        'no_transaksi'     => $noTransaksi,
                        'jenis_transaksi'  => 'MASUK',
                        'sub_jenis'        => $subJenis,
                        'tanggal'          => $item['tanggal'],
                        'kondisi'          => $kondisiFix,
                        'nomor_imc'        => $item['nomor_imc'] ?? null,
                        'nomor_omc'        => $item['nomor_omc'] ?? null,
                        'pihak_asal'       => $item['pihak_asal'] ?? null,
                        'gudang_asal_id'   => $item['gudang_asal_id'] ?? null,
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
                                    'kondisi'   => 'Baru',
                                    'nomer_imc' => $transaksi->nomor_imc
                                ]
                            );

                            $serialRecord->update([
                                'status'    => 'IN_WAREHOUSE',
                                'gudang_id' => $transaksi->gudang_tujuan_id,
                                'kondisi'   => $subJenis === 'TRANSFER_GUDANG' ? ($serialRecord->kondisi ?? 'Baru') : $kondisiFix,
                                'nomer_imc' => $transaksi->nomor_imc ?? $serialRecord->nomer_imc,
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

                    if ($transaksi->sub_jenis === 'TRANSFER_GUDANG' && $transaksi->gudang_asal_id) {
                        $stokAsal = Stok::where('barang_id', $barangId)
                            ->where('gudang_id', $transaksi->gudang_asal_id)
                            ->lockForUpdate()
                            ->first();

                        if (!$stokAsal || $stokAsal->jumlah < $qty) {
                            throw new \Exception("Stok di gudang asal tidak mencukupi untuk transfer barang '{$barang->nama_barang}'.");
                        }

                        $stokAsal->decrement('jumlah', $qty);
                        $stokAsal->refresh();

                        StockLog::create([
                            'barang_id'     => $barangId,
                            'gudang_id'     => $transaksi->gudang_asal_id,
                            'transaksi_id'  => $transaksi->id,
                            'user_id'       => $request->user()->id,
                            'qty_perubahan' => -$qty,
                            'qty_akhir'     => $stokAsal->jumlah,
                            'keterangan'    => "Transfer Keluar ke Gudang #{$transaksi->gudang_tujuan_id}",
                        ]);
                    }
                }
            });

            return redirect()->back()->with('success', count($validated['items']) . ' Data transaksi berhasil ditambahkan.');
        }

        $validated = $request->validate([
            'sub_jenis'        => 'required|string|in:PEMBELIAN,PEMINJAMAN,PENGEMBALIAN,TRANSFER_GUDANG',
            'tanggal'          => 'required|date',
            'kondisi'          => 'nullable|string|max:50',
            'nomor_imc'        => 'required|string|max:100',
            'nomor_omc'        => 'nullable|string|max:100',
            'pihak_asal'       => 'nullable|string|max:255',
            'gudang_asal_id'   => 'nullable|exists:gudangs,id',
            'gudang_tujuan_id' => 'required|exists:gudangs,id',
            'barang_id'        => 'required|exists:barangs,id',
            'qty'              => 'required|integer|min:1|max:50',
            'harga'            => 'nullable|numeric|min:0',
            'serials'          => 'nullable|array',
            'serials.*'        => 'nullable|string|max:100',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $prefix = match($validated['sub_jenis']) {
                'PEMBELIAN'       => 'TRX-IN-BUY',
                'PEMINJAMAN'      => 'TRX-IN-BORROW',
                'PENGEMBALIAN'    => 'TRX-IN-RET',
                'TRANSFER_GUDANG' => 'TRX-TRF',
                default           => 'TRX-MASUK',
            };

            $randomSuffix = strtoupper(Str::random(4));
            $noTransaksi  = $prefix . '-' . date('YmdHis') . '-' . $randomSuffix;
            $kondisiFix   = $validated['sub_jenis'] === 'TRANSFER_GUDANG' ? '-' : ucfirst(strtolower($validated['kondisi'] ?? 'Baru'));

            $transaksi = Transaksi::create([
                'no_transaksi'     => $noTransaksi,
                'jenis_transaksi'  => 'MASUK',
                'sub_jenis'        => $validated['sub_jenis'],
                'tanggal'          => $validated['tanggal'],
                'kondisi'          => $kondisiFix,
                'nomor_imc'        => $validated['nomor_imc'] ?? null,
                'nomor_omc'        => $validated['nomor_omc'] ?? null,
                'pihak_asal'       => $validated['pihak_asal'] ?? null,
                'gudang_asal_id'   => $validated['gudang_asal_id'] ?? null,
                'gudang_tujuan_id' => $validated['gudang_tujuan_id'],
                'pic_user_id'      => $request->user()->id,
                'status'           => 'COMPLETED',
            ]);

            $barangId = $validated['barang_id'];
            $qty      = (int) $validated['qty'];
            $harga    = $validated['sub_jenis'] === 'PEMBELIAN' ? (float) ($validated['harga'] ?? 0) : 0;
            $serials  = array_filter($validated['serials'] ?? []);

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
                            'kondisi'   => 'Baru',
                            'nomer_imc' => $transaksi->nomor_imc
                        ]
                    );

                    $serialRecord->update([
                        'status'    => 'IN_WAREHOUSE',
                        'gudang_id' => $transaksi->gudang_tujuan_id,
                        'kondisi'   => $validated['sub_jenis'] === 'TRANSFER_GUDANG' ? ($serialRecord->kondisi ?? 'Baru') : $kondisiFix,
                        'nomer_imc' => $transaksi->nomor_imc ?? $serialRecord->nomer_imc,
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
        });

        return redirect()->back()->with('success', 'Transaksi stok masuk berhasil dicatat.');
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
            'qty'              => 'nullable|integer|min:1|max:50', // Menerima perubahan Qty saat edit
            'harga'            => 'nullable|numeric|min:0',        // Menerima perubahan Harga Satuan saat edit
            'keterangan'       => 'nullable|string|max:500',
        ]);

        $kondisiFix = $transaksi->sub_jenis === 'TRANSFER_GUDANG' ? '-' : ucfirst(strtolower($validated['kondisi'] ?? 'Baru'));
        $hargaFix   = $transaksi->sub_jenis === 'PEMBELIAN' ? (float) ($validated['harga'] ?? 0) : 0;
        $newQty     = isset($validated['qty']) ? (int) $validated['qty'] : null;

        DB::transaction(function () use ($transaksi, $validated, $kondisiFix, $hargaFix, $newQty, $request) {
            $oldGudangTujuanId = (int) $transaksi->gudang_tujuan_id;
            $newGudangTujuanId = isset($validated['gudang_tujuan_id']) ? (int) $validated['gudang_tujuan_id'] : $oldGudangTujuanId;

            foreach ($transaksi->details as $detail) {
                $oldQty   = (int) $detail->qty;
                $finalQty = $newQty !== null ? $newQty : $oldQty;

                // 1. Update harga, kondisi, dan qty pada tabel transaksi_details
                $detail->update([
                    'kondisi' => $kondisiFix,
                    'harga'   => $hargaFix,
                    'qty'     => $finalQty,
                ]);

                // 2. Sinkronisasi stok gudang
                if ($newGudangTujuanId && $newGudangTujuanId !== $oldGudangTujuanId) {
                    $barangId = $detail->barang_id;

                    $stokLama = Stok::where('barang_id', $barangId)
                        ->where('gudang_id', $oldGudangTujuanId)
                        ->lockForUpdate()
                        ->first();

                    if ($stokLama) {
                        $stokLama->decrement('jumlah', min($stokLama->jumlah, $oldQty));
                        $stokLama->refresh();

                        StockLog::create([
                            'barang_id'     => $barangId,
                            'gudang_id'     => $oldGudangTujuanId,
                            'transaksi_id'  => $transaksi->id,
                            'user_id'       => $request->user()->id,
                            'qty_perubahan' => -$oldQty,
                            'qty_akhir'     => $stokLama->jumlah,
                            'keterangan'    => "Penyesuaian Edit Transaksi: Pindah ke Gudang #{$newGudangTujuanId}",
                        ]);
                    }

                    $stokBaru = Stok::firstOrCreate(
                        ['barang_id' => $barangId, 'gudang_id' => $newGudangTujuanId],
                        ['jumlah' => 0]
                    );
                    $stokBaru->increment('jumlah', $finalQty);
                    $stokBaru->refresh();

                    StockLog::create([
                        'barang_id'     => $barangId,
                        'gudang_id'     => $newGudangTujuanId,
                        'transaksi_id'  => $transaksi->id,
                        'user_id'       => $request->user()->id,
                        'qty_perubahan' => +$finalQty,
                        'qty_akhir'     => $stokBaru->jumlah,
                        'keterangan'    => "Penyesuaian Edit Transaksi: Masuk dari Gudang #{$oldGudangTujuanId}",
                    ]);

                    foreach ($detail->serials as $serial) {
                        $serial->update([
                            'gudang_id' => $newGudangTujuanId,
                            'nomer_imc' => $validated['nomor_imc'] ?? $serial->nomer_imc,
                        ]);
                    }
                } else if ($finalQty !== $oldQty) {
                    $diff = $finalQty - $oldQty;
                    $stok = Stok::firstOrCreate(['barang_id' => $detail->barang_id, 'gudang_id' => $oldGudangTujuanId], ['jumlah' => 0]);
                    if ($diff > 0) {
                        $stok->increment('jumlah', $diff);
                    } else {
                        $stok->decrement('jumlah', min($stok->jumlah, abs($diff)));
                    }
                    $stok->refresh();

                    StockLog::create([
                        'barang_id'     => $detail->barang_id,
                        'gudang_id'     => $oldGudangTujuanId,
                        'transaksi_id'  => $transaksi->id,
                        'user_id'       => $request->user()->id,
                        'qty_perubahan' => $diff,
                        'qty_akhir'     => $stok->jumlah,
                        'keterangan'    => "Penyesuaian Qty Edit Transaksi",
                    ]);
                }

                if ($transaksi->sub_jenis !== 'TRANSFER_GUDANG') {
                    foreach ($detail->serials as $serial) {
                        $serial->update(['kondisi' => $kondisiFix]);
                    }
                }
            }

            // 3. Update header transaksi utama
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

        return redirect()->back()->with('success', 'Data transaksi, kuantitas, dan harga berhasil diperbarui.');
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
        $jenis    = $request->input('jenis_transaksi', 'MASUK');
        $rawOrder = strtolower((string) $request->input('order', 'desc'));
        $order    = in_array($rawOrder, ['asc', 'desc'], true) ? $rawOrder : 'desc';

        $query = Transaksi::with(['gudangAsal', 'gudangTujuan', 'details.barang', 'details.serials'])
            ->where('jenis_transaksi', $jenis)
            ->orderBy('tanggal', $order);

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
            'Jenis Penerimaan', 
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
            'Asal / Pengirim', 
            'Gudang Tujuan', 
            'Serial Numbers'
        ];

        $callback = function () use ($transaksis, $columns) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns, ';');
            foreach ($transaksis as $t) {
                $detail = $t->details->first();
                $barang = $detail?->barang;
                $snList = $detail ? $detail->serials->pluck('serial_number')->implode(', ') : '-';
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
                    $t->pihak_asal ?? $t->gudangAsal?->nama_gudang ?? '-',
                    $t->gudangTujuan?->nama_gudang ?? '-',
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