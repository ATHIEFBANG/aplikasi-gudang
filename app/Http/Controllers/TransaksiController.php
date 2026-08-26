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
            'gudangs'    => Gudang::where('is_active', true)->get(['id', 'nama_gudang']),
            'suppliers'  => Supplier::all(['id', 'nama_supplier']),
            'barangs'    => Barang::all([
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
        $validated = $request->validate([
            'jenis_transaksi'   => 'required|in:MASUK,KELUAR,TRANSFER,PINJAM,KEMBALI',
            'sub_jenis'         => 'nullable|string|in:PEMBELIAN,PEMINJAMAN,PENGEMBALIAN,TRANSFER_GUDANG',
            'tanggal'           => 'required|date',
            'kondisi'           => 'nullable|string|max:50',
            'nomor_imc'         => 'nullable|string|max:100',
            'nomor_omc'         => 'nullable|string|max:100',
            'pihak_asal'        => 'nullable|string|max:255',
            'gudang_asal_id'    => 'nullable|exists:gudangs,id',
            'gudang_tujuan_id'  => 'nullable|required_if:jenis_transaksi,MASUK|exists:gudangs,id',
            'supplier_id'       => 'nullable|exists:suppliers,id',
            'keterangan'        => 'nullable|string|max:500',
            'items'             => 'required|array|min:1',
            'items.*.barang_id' => 'required|exists:barangs,id',
            'items.*.qty'       => 'required|integer|min:1|max:10',
            'items.*.kondisi'   => 'nullable|string|max:50',
            'items.*.serials'   => 'nullable|array',
            'items.*.serials.*' => 'nullable|string|max:100',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $prefix = match($validated['sub_jenis'] ?? $validated['jenis_transaksi']) {
                'PEMBELIAN'       => 'TRX-IN-BUY',
                'PEMINJAMAN'      => 'TRX-IN-BORROW',
                'PENGEMBALIAN'    => 'TRX-IN-RET',
                'TRANSFER_GUDANG', 'TRANSFER' => 'TRX-TRF',
                default           => 'TRX-' . $validated['jenis_transaksi'],
            };

            $randomSuffix = strtoupper(Str::random(4));
            $noTransaksi  = $prefix . '-' . date('YmdHis') . '-' . $randomSuffix;

            $transaksi = Transaksi::create([
                'no_transaksi'     => $noTransaksi,
                'jenis_transaksi'  => $validated['jenis_transaksi'],
                'sub_jenis'        => $validated['sub_jenis'] ?? null,
                'tanggal'          => $validated['tanggal'],
                'kondisi'          => $validated['kondisi'] ?? 'Baru',
                'nomor_imc'        => $validated['nomor_imc'] ?? null,
                'nomor_omc'        => $validated['nomor_omc'] ?? null,
                'pihak_asal'       => $validated['pihak_asal'] ?? null,
                'gudang_asal_id'   => $validated['gudang_asal_id'] ?? null,
                'gudang_tujuan_id' => $validated['gudang_tujuan_id'] ?? null,
                'supplier_id'      => $validated['supplier_id'] ?? null,
                'pic_user_id'      => $request->user()->id,
                'keterangan'       => $validated['keterangan'] ?? null,
                'status'           => 'COMPLETED',
            ]);

            foreach ($validated['items'] as $item) {
                $barangId = $item['barang_id'];
                $qty      = (int) $item['qty'];
                $kondisi  = strtoupper($item['kondisi'] ?? 'BAIK');
                $serials  = array_filter($item['serials'] ?? []);

                $barang = Barang::findOrFail($barangId);

                if ($barang->is_wajib_sn && count($serials) !== $qty) {
                    throw new \Exception("Jumlah Serial Number untuk barang '{$barang->nama_barang}' harus tepat {$qty} unit.");
                }

                // 1. Simpan Transaksi Detail
                $detail = TransaksiDetail::create([
                    'transaksi_id' => $transaksi->id,
                    'barang_id'    => $barangId,
                    'qty'          => $qty,
                    'kondisi'      => in_array($kondisi, ['RUSAK']) ? 'RUSAK' : 'BAIK',
                ]);

                // 2. Pemrosesan Serial Number
                if (!empty($serials)) {
                    foreach ($serials as $sn) {
                        $cleanSn = trim($sn);
                        if ($cleanSn === '') continue;

                        $serialRecord = BarangSerial::firstOrCreate(
                            ['barang_id' => $barangId, 'serial_number' => $cleanSn],
                            [
                                'status'    => 'IN_WAREHOUSE', 
                                'gudang_id' => $transaksi->gudang_tujuan_id,
                                'kondisi'   => in_array($kondisi, ['RUSAK']) ? 'RUSAK' : 'BAIK',
                                'nomer_imc' => $transaksi->nomor_imc
                            ]
                        );

                        $serialRecord->update([
                            'status'    => 'IN_WAREHOUSE',
                            'gudang_id' => $transaksi->gudang_tujuan_id,
                            'kondisi'   => in_array($kondisi, ['RUSAK']) ? 'RUSAK' : 'BAIK',
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

                // 3. Mutasi Stok Fisik & Logging
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
                        throw new \Exception("Stok di gudang asal tidak mencukupi untuk transfer.");
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

        return redirect()->back()->with('success', 'Transaksi stok masuk berhasil dicatat dan stok fisik telah diperbarui.');
    }

    public function update(Request $request, int $id)
    {
        $transaksi = Transaksi::findOrFail($id);

        $validated = $request->validate([
            'tanggal'          => 'required|date',
            'kondisi'          => 'nullable|string|max:50',
            'nomor_imc'        => 'nullable|string|max:100',
            'nomor_omc'        => 'nullable|string|max:100',
            'pihak_asal'       => 'nullable|string|max:255',
            'gudang_tujuan_id' => 'nullable|exists:gudangs,id',
            'keterangan'       => 'nullable|string|max:500',
        ]);

        $transaksi->update([
            'tanggal'          => $validated['tanggal'],
            'kondisi'          => $validated['kondisi'] ?? $transaksi->kondisi,
            'nomor_imc'        => $validated['nomor_imc'] ?? $transaksi->nomor_imc,
            'nomor_omc'        => $validated['nomor_omc'] ?? $transaksi->nomor_omc,
            'pihak_asal'       => $validated['pihak_asal'] ?? $transaksi->pihak_asal,
            'gudang_tujuan_id' => $validated['gudang_tujuan_id'] ?? $transaksi->gudang_tujuan_id,
            'keterangan'       => $validated['keterangan'] ?? $transaksi->keterangan,
        ]);

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

                fputcsv($file, [
                    $t->no_transaksi,
                    $t->sub_jenis ?? $t->jenis_transaksi,
                    $barang?->kode_barang ?? '-',
                    $namaLengkap ?: ($barang?->nama_barang ?? '-'),
                    $barang?->part_number ?? '-',
                    $barang?->deskripsi ?? 'Unit',
                    $t->tanggal ? date('Y-m-d', strtotime($t->tanggal)) : '-',
                    $detail?->qty ?? 0,
                    $t->kondisi ?? 'Baru',
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