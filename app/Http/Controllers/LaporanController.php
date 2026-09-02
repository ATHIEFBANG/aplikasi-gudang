<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\Gudang;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanController extends Controller
{
    public function index(Request $request): Response
    {
        // Set waktu eksekusi maksimal jadi 2 menit untuk keamanan data besar
        set_time_limit(120);

        $bulan    = (int) $request->input('bulan', date('n'));
        $tahun    = (int) $request->input('tahun', date('Y'));
        $gudangId = $request->input('gudang_id', 'ALL');
        $search   = $request->input('search', '');

        $startDate = Carbon::create($tahun, $bulan, 1)->startOfMonth()->toDateString();
        $endDate   = Carbon::create($tahun, $bulan, 1)->endOfMonth()->toDateString();

        // 1. AMBIL DATA BARANG DENGAN EAGER LOADING SERILS & STOK (CEGAH N+1)
        $barangQuery = Barang::with([
            'serials' => function ($q) use ($gudangId) {
                $q->where('status', 'IN_WAREHOUSE');
                if ($gudangId && $gudangId !== 'ALL') {
                    $q->where('gudang_id', (int) $gudangId);
                }
            }
        ]);

        if ($search) {
            $barangQuery->where(function ($q) use ($search) {
                $q->where('kode_barang', 'like', "%{$search}%")
                  ->orWhere('nama_barang', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhere('tipe', 'like', "%{$search}%")
                  ->orWhere('kategori', 'like', "%{$search}%")
                  ->orWhere('part_number', 'like', "%{$search}%");
            });
        }
        $barangs = $barangQuery->orderBy('kode_barang', 'asc')->get();
        $barangIds = $barangs->pluck('id');

        // 2. QUERY AGREGASI SATU KALI (BATCH QUERY) UNTUK SEMUA BARANG
        // Mengambil data transaksi lalu (< startDate) dan bulan berjalan (between startDate & endDate)
        $mutasiLalu = TransaksiDetail::select('barang_id', 
                DB::raw("SUM(CASE WHEN t.tanggal < '{$startDate}' AND t.gudang_tujuan_id " . ($gudangId !== 'ALL' ? "= {$gudangId}" : "IS NOT NULL") . " THEN qty ELSE 0 END) as masuk_lalu"),
                DB::raw("SUM(CASE WHEN t.tanggal < '{$startDate}' AND t.gudang_asal_id " . ($gudangId !== 'ALL' ? "= {$gudangId}" : "IS NOT NULL") . " THEN qty ELSE 0 END) as keluar_lalu")
            )
            ->from('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where('t.status', 'COMPLETED')
            ->whereIn('td.barang_id', $barangIds)
            ->where('t.tanggal', '<', $startDate)
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        $mutasiBulan = TransaksiDetail::select('barang_id',
                DB::raw("SUM(CASE WHEN t.jenis_transaksi = 'MASUK' " . ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = {$gudangId}" : "") . " THEN qty ELSE 0 END) as masuk_bulan"),
                DB::raw("SUM(CASE WHEN t.jenis_transaksi = 'KELUAR' " . ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = {$gudangId}" : "") . " THEN qty ELSE 0 END) as keluar_bulan"),
                DB::raw("SUM(CASE WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " . ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = {$gudangId}" : "") . " THEN qty ELSE 0 END) as trf_in"),
                DB::raw("SUM(CASE WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " . ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = {$gudangId}" : "") . " THEN qty ELSE 0 END) as trf_out")
            )
            ->from('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where('t.status', 'COMPLETED')
            ->whereIn('td.barang_id', $barangIds)
            ->whereBetween('t.tanggal', [$startDate, $endDate])
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        // 3. MAPPING DATA KE FORMAT LAPORAN DENGAN PERHITUNGAN BERSIH
        $laporanStok = $barangs->map(function ($b) use ($mutasiLalu, $mutasiBulan, $gudangId) {
            $lalu = $mutasiLalu->get($b->id);
            $bulan = $mutasiBulan->get($b->id);

            $masukLalu  = (int) ($lalu?->masuk_lalu ?? 0);
            $keluarLalu = (int) ($lalu?->keluar_lalu ?? 0);
            $stokAwal   = max(0, $masukLalu - $keluarLalu);

            $masukBulan  = (int) ($bulan?->masuk_bulan ?? 0);
            $keluarBulan = (int) ($bulan?->keluar_bulan ?? 0);
            $trfIn       = (int) ($bulan?->trf_in ?? 0);
            $trfOut      = ($gudangId !== 'ALL') ? (int) ($bulan?->trf_out ?? 0) : $trfIn;
            
            $transferNet = ($gudangId !== 'ALL') ? ($trfIn - $trfOut) : 0;
            $stokAkhir   = max(0, $stokAwal + $masukBulan - $keluarBulan + $transferNet);

            // Rincian kondisi fisik dari relasi serials yang sudah di-load
            $serials = $b->serials;
            $kondisiBaru  = $serials->filter(fn($s) => in_array(strtoupper($s->kondisi ?? ''), ['BARU', 'BAIK']))->count();
            $kondisiBekas = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'BEKAS'))->count();
            $kondisiRusak = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'RUSAK'))->count();

            if (!$b->is_wajib_sn) {
                $kondisiBaru = $stokAkhir;
            }

            $namaLengkap = trim("{$b->brand} {$b->tipe} {$b->kategori}") ?: $b->nama_barang;

            return [
                'id'            => $b->id,
                'kode_barang'   => $b->kode_barang,
                'nama_barang'   => $namaLengkap,
                'part_number'   => $b->part_number ?: '-',
                'satuan'        => $b->deskripsi ?: ($b->satuan ?: 'Unit'),
                'is_wajib_sn'   => $b->is_wajib_sn,
                'stok_awal'     => $stokAwal,
                'masuk'         => $masukBulan,
                'keluar'        => $keluarBulan,
                'transfer_in'   => $trfIn,
                'transfer_out'  => $trfOut,
                'transfer_net'  => $transferNet,
                'stok_akhir'    => $stokAkhir,
                'kondisi_baru'  => $kondisiBaru,
                'kondisi_bekas' => $kondisiBekas,
                'kondisi_rusak' => $kondisiRusak,
            ];
        });

        // 4. BUKU JURNAL MUTASI DETAIL (AUDIT LEDGER)
        $ledgerQuery = Transaksi::with([
            'gudangAsal:id,nama_gudang',
            'gudangTujuan:id,nama_gudang',
            'supplier:id,nama_supplier',
            'details.barang',
            'details.serials'
        ])
            ->where('status', 'COMPLETED')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->orderBy('tanggal', 'asc')
            ->orderBy('id', 'asc');

        if ($gudangId && $gudangId !== 'ALL') {
            $ledgerQuery->where(function ($q) use ($gudangId) {
                $q->where('gudang_asal_id', $gudangId)
                  ->orWhere('gudang_tujuan_id', $gudangId);
            });
        }

        $jurnalMutasi = $ledgerQuery->get()->map(function ($t) {
            $detail = $t->details->first();
            $barang = $detail?->barang;
            $namaLengkap = $barang ? trim("{$barang->brand} {$barang->tipe} {$barang->kategori}") : ($barang?->nama_barang ?? '-');

            $listSn = $detail ? $detail->serials->map(fn($s) => [
                'serial_number' => $s->serial_number,
                'kondisi'       => $s->kondisi ?: 'Baru'
            ]) : [];

            return [
                'id'            => $t->id,
                'no_transaksi'  => $t->no_transaksi,
                'jenis'         => $t->jenis_transaksi,
                'sub_jenis'     => $t->sub_jenis,
                'tanggal'       => $t->tanggal ? date('Y-m-d', strtotime($t->tanggal)) : '-',
                'nomor_dokumen' => $t->nomor_omc ?: ($t->nomor_imc ?: '-'),
                'nomor_imc'     => $t->nomor_imc ?: '-',
                'nomor_omc'     => $t->nomor_omc ?: '-',
                'asal'          => $t->gudangAsal?->nama_gudang ?: ($t->pihak_asal ?: '-'),
                'tujuan'        => $t->gudangTujuan?->nama_gudang ?: ($t->pihak_asal ?: '-'),
                'kode_barang'   => $barang?->kode_barang ?? '-',
                'nama_barang'   => $namaLengkap,
                'part_number'   => $barang?->part_number ?? '-',
                'qty'           => $detail?->qty ?? 0,
                'serials'       => $listSn,
            ];
        });

        return Inertia::render('Laporan/Index', [
            'laporanStok'  => $laporanStok,
            'jurnalMutasi' => $jurnalMutasi,
            'gudangs'      => Gudang::where('is_active', true)->get(['id', 'nama_gudang', 'kode_gudang']),
            'filters'      => [
                'bulan'     => $bulan,
                'tahun'     => $tahun,
                'gudang_id' => $gudangId,
                'search'    => $search,
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        set_time_limit(180);

        $bulan    = (int) $request->input('bulan', date('n'));
        $tahun    = (int) $request->input('tahun', date('Y'));
        $gudangId = $request->input('gudang_id', 'ALL');

        $startDate = Carbon::create($tahun, $bulan, 1)->startOfMonth()->toDateString();
        $endDate   = Carbon::create($tahun, $bulan, 1)->endOfMonth()->toDateString();

        $gudangName = 'Semua Gudang';
        if ($gudangId && $gudangId !== 'ALL') {
            $g = Gudang::find($gudangId);
            if ($g) $gudangName = $g->nama_gudang;
        }

        $barangs = Barang::with([
            'serials' => function ($q) use ($gudangId) {
                $q->where('status', 'IN_WAREHOUSE');
                if ($gudangId && $gudangId !== 'ALL') {
                    $q->where('gudang_id', (int) $gudangId);
                }
            }
        ])->orderBy('kode_barang', 'asc')->get();

        $barangIds = $barangs->pluck('id');

        $mutasiLalu = TransaksiDetail::select('barang_id', 
                DB::raw("SUM(CASE WHEN t.tanggal < '{$startDate}' AND t.gudang_tujuan_id " . ($gudangId !== 'ALL' ? "= {$gudangId}" : "IS NOT NULL") . " THEN qty ELSE 0 END) as masuk_lalu"),
                DB::raw("SUM(CASE WHEN t.tanggal < '{$startDate}' AND t.gudang_asal_id " . ($gudangId !== 'ALL' ? "= {$gudangId}" : "IS NOT NULL") . " THEN qty ELSE 0 END) as keluar_lalu")
            )
            ->from('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where('t.status', 'COMPLETED')
            ->whereIn('td.barang_id', $barangIds)
            ->where('t.tanggal', '<', $startDate)
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        $mutasiBulan = TransaksiDetail::select('barang_id',
                DB::raw("SUM(CASE WHEN t.jenis_transaksi = 'MASUK' " . ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = {$gudangId}" : "") . " THEN qty ELSE 0 END) as masuk_bulan"),
                DB::raw("SUM(CASE WHEN t.jenis_transaksi = 'KELUAR' " . ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = {$gudangId}" : "") . " THEN qty ELSE 0 END) as keluar_bulan"),
                DB::raw("SUM(CASE WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " . ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = {$gudangId}" : "") . " THEN qty ELSE 0 END) as trf_in"),
                DB::raw("SUM(CASE WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " . ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = {$gudangId}" : "") . " THEN qty ELSE 0 END) as trf_out")
            )
            ->from('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where('t.status', 'COMPLETED')
            ->whereIn('td.barang_id', $barangIds)
            ->whereBetween('t.tanggal', [$startDate, $endDate])
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        $csvFileName = "Laporan_Logistik_{$monthNames[$bulan]}_{$tahun}_" . date('His') . ".csv";

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$csvFileName}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($barangs, $mutasiLalu, $mutasiBulan, $gudangId, $bulan, $tahun, $gudangName, $monthNames) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");

            fputcsv($file, ["LAPORAN REKONSILIASI MUTASI STOK BULANAN"], ';');
            fputcsv($file, ["Periode", "{$monthNames[$bulan]} {$tahun}"], ';');
            fputcsv($file, ["Lokasi Gudang", $gudangName], ';');
            fputcsv($file, ["Tanggal Cetak", date('Y-m-d H:i:s')], ';');
            fputcsv($file, [], ';');

            fputcsv($file, [
                'No',
                'Kode PPL',
                'Nama & Deskripsi Barang',
                'Part Number',
                'Satuan',
                'Stok Awal',
                'Total Masuk (+)',
                'Total Keluar (-)',
                'Transfer Net',
                'Stok Akhir',
                'Kondisi Fisik (Baru / Bekas / Rusak)'
            ], ';');

            $no = 1;
            foreach ($barangs as $b) {
                $lalu = $mutasiLalu->get($b->id);
                $bulanData = $mutasiBulan->get($b->id);

                $masukLalu  = (int) ($lalu?->masuk_lalu ?? 0);
                $keluarLalu = (int) ($lalu?->keluar_lalu ?? 0);
                $stokAwal   = max(0, $masukLalu - $keluarLalu);

                $masukBulan  = (int) ($bulanData?->masuk_bulan ?? 0);
                $keluarBulan = (int) ($bulanData?->keluar_bulan ?? 0);
                $trfIn       = (int) ($bulanData?->trf_in ?? 0);
                $trfOut      = ($gudangId !== 'ALL') ? (int) ($bulanData?->trf_out ?? 0) : $trfIn;
                
                $transferNet = ($gudangId !== 'ALL') ? ($trfIn - $trfOut) : 0;
                $stokAkhir   = max(0, $stokAwal + $masukBulan - $keluarBulan + $transferNet);

                $serials = $b->serials;
                $kBaru  = $serials->filter(fn($s) => in_array(strtoupper($s->kondisi ?? ''), ['BARU', 'BAIK']))->count();
                $kBekas = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'BEKAS'))->count();
                $kRusak = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'RUSAK'))->count();

                if (!$b->is_wajib_sn) {
                    $kBaru = $stokAkhir;
                }

                $kondisiRincian = "{$kBaru} Baru • {$kBekas} Bekas • {$kRusak} Rusak";
                $namaLengkap = trim("{$b->brand} {$b->tipe} {$b->kategori}") ?: $b->nama_barang;

                fputcsv($file, [
                    $no++,
                    $b->kode_barang,
                    $namaLengkap,
                    $b->part_number ?: '-',
                    $b->deskripsi ?: 'Unit',
                    $stokAwal,
                    $masukBulan,
                    $keluarBulan,
                    $transferNet >= 0 ? "+{$transferNet}" : "{$transferNet}",
                    $stokAkhir,
                    $kondisiRincian
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}