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
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransaksiController extends Controller
{
    public function index(Request $request): Response
    {
        $jenis    = $request->input('jenis_transaksi', 'MASUK');
        $search   = $request->input('search');
        $perPage  = (int) $request->input('per_page', 10);

        $rawOrder = strtolower((string) $request->input('order', 'desc'));
        $order    = in_array($rawOrder, ['asc', 'desc'], true) ? $rawOrder : 'desc';

        // 1. Query Transaksi Utama (Paginated & Ringan)
        $query = Transaksi::with([
            'gudangAsal:id,nama_gudang',
            'gudangTujuan:id,nama_gudang',
            'supplier:id,nama_supplier',
            'picUser:id,name',
            'details.barang:id,kode_barang,nama_barang,brand,tipe,kategori,part_number,deskripsi,is_wajib_sn,is_wajib_pn',
            'details.serials'
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

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "%{$search}%")
                  ->orWhere('nomor_imc', 'like', "%{$search}%")
                  ->orWhere('nomor_omc', 'like', "%{$search}%")
                  ->orWhere('pihak_asal', 'like', "%{$search}%")
                  ->orWhere('kode_projek', 'like', "%{$search}%")
                  ->orWhere('nama_customer', 'like', "%{$search}%")
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

        // 2. Ringkasan Stok Gudang Cepat (Aggregated Query)
        $snRaw = BarangSerial::where('status', 'IN_WAREHOUSE')
            ->whereNotNull('gudang_id')
            ->select('gudang_id', 'kondisi', DB::raw('COUNT(*) as total'))
            ->groupBy('gudang_id', 'kondisi')
            ->get();

        $snByGudang = [];
        foreach ($snRaw as $row) {
            $gId = $row->gudang_id;
            $k   = strtoupper(trim($row->kondisi ?? 'BARU'));
            if (!isset($snByGudang[$gId])) {
                $snByGudang[$gId] = ['baru' => 0, 'bekas' => 0, 'rusak' => 0];
            }
            if (str_contains($k, 'RUSAK')) {
                $snByGudang[$gId]['rusak'] += $row->total;
            } elseif (str_contains($k, 'BEKAS') || str_contains($k, 'SECOND')) {
                $snByGudang[$gId]['bekas'] += $row->total;
            } else {
                $snByGudang[$gId]['baru'] += $row->total;
            }
        }

        $stokNonSnRaw = Stok::join('barangs', 'stoks.barang_id', '=', 'barangs.id')
            ->where('barangs.is_wajib_sn', false)
            ->select('stoks.gudang_id', DB::raw('SUM(stoks.jumlah) as total_qty'))
            ->groupBy('stoks.gudang_id')
            ->pluck('total_qty', 'gudang_id');

        $gudangList = Gudang::where('is_active', true)
            ->get(['id', 'nama_gudang', 'kode_gudang'])
            ->map(function ($g) use ($snByGudang, $stokNonSnRaw) {
                $snData = $snByGudang[$g->id] ?? ['baru' => 0, 'bekas' => 0, 'rusak' => 0];
                $nonSn  = (int) ($stokNonSnRaw[$g->id] ?? 0);

                $g->stok_baru  = $snData['baru'] + $nonSn;
                $g->stok_bekas = $snData['bekas'];
                $g->stok_rusak = $snData['rusak'];
                $g->total_stok = $g->stok_baru + $g->stok_bekas + $g->stok_rusak;
                return $g;
            });

        // 3. Master Barang Ringan untuk Modal (Transformasi ke Plain Array Mematikan N+1 Query)
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
        ])
        ->with(['stoks:id,barang_id,gudang_id,jumlah'])
        ->get()
        ->map(fn($b) => [
            'id'          => $b->id,
            'kode_barang' => $b->kode_barang,
            'nama_barang' => $b->nama_barang,
            'part_number' => $b->part_number,
            'brand'       => $b->brand,
            'tipe'        => $b->tipe,
            'kategori'    => $b->kategori,
            'deskripsi'   => $b->deskripsi,
            'is_wajib_sn' => (bool) $b->is_wajib_sn,
            'is_wajib_pn' => (bool) $b->is_wajib_pn,
            'stoks'       => $b->stoks->map(fn($s) => [
                'id'        => $s->id,
                'barang_id' => $s->barang_id,
                'gudang_id' => $s->gudang_id,
                'jumlah'    => $s->jumlah,
            ]),
        ]);

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

    // API On-Demand untuk mengambil serial number per barang
    public function getSerialsByBarang(Request $request, int $barangId)
    {
        $gudangId = $request->input('gudang_id');

        $query = BarangSerial::select('id', 'barang_id', 'gudang_id', 'serial_number', 'kondisi', 'status')
            ->where('barang_id', $barangId)
            ->where('status', 'IN_WAREHOUSE');

        if ($gudangId) {
            $query->where('gudang_id', $gudangId);
        }

        return response()->json($query->get());
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

        $transaksis  = $query->get();
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
            'Kode Projek', 
            'Nama Customer', 
            'Gudang Asal / Pihak Asal', 
            'Gudang Tujuan / Site', 
            'Serial Numbers'
        ];

        $callback = function () use ($transaksis, $columns) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns, ';');

            foreach ($transaksis as $t) {
                $detail      = $t->details->first();
                $barang      = $detail?->barang;
                $snList      = $detail ? $detail->serials->map(fn($s) => "{$s->serial_number} ({$s->kondisi})")->implode(', ') : '-';
                $namaLengkap = $barang ? trim("{$barang->brand} {$barang->tipe} {$barang->kategori}") : '-';
                $hargaSatuan = $detail?->harga ?? 0;
                $totalNilai  = ($detail?->qty ?? 0) * $hargaSatuan;

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
                    $t->kode_projek ?? '-',
                    $t->nama_customer ?? '-',
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