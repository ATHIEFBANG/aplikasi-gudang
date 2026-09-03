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
        set_time_limit(120);

        $bulan    = (int) $request->input('bulan', date('n'));
        $tahun    = (int) $request->input('tahun', date('Y'));
        $gudangId = $request->input('gudang_id', 'ALL');
        $kondisi  = $request->input('kondisi', 'ALL');
        $search   = $request->input('search', '');

        $startDate = Carbon::create($tahun, $bulan, 1)->startOfMonth()->toDateString();
        $endDate   = Carbon::create($tahun, $bulan, 1)->endOfMonth()->toDateString();

        // 1. DATA MASTER BARANG DENGAN EAGER LOADING SERIALS AKTIF
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

        // 2. QUERY AGREGASI MUTASI LALU (< startDate)
        $mutasiLalu = TransaksiDetail::select(
                'td.barang_id',
                DB::raw("SUM(CASE 
                    WHEN t.tanggal < '{$startDate}' 
                    AND t.gudang_tujuan_id " . ($gudangId !== 'ALL' ? "= " . (int)$gudangId : "IS NOT NULL") . " 
                    AND (t.jenis_transaksi != 'MASUK' OR UPPER(COALESCE(t.kondisi, 'BARU')) NOT LIKE '%RUSAK%')
                    THEN td.qty ELSE 0 
                END) as masuk_lalu"),
                DB::raw("SUM(CASE 
                    WHEN t.tanggal < '{$startDate}' 
                    AND t.gudang_asal_id " . ($gudangId !== 'ALL' ? "= " . (int)$gudangId : "IS NOT NULL") . " 
                    THEN td.qty ELSE 0 
                END) as keluar_lalu")
            )
            ->from('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])
                  ->orWhereNull('t.status');
            })
            ->whereIn('td.barang_id', $barangIds)
            ->where('t.tanggal', '<', $startDate)
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        // 3. QUERY AGREGASI MUTASI BULAN BERJALAN (between startDate & endDate)
        // Hanya menghitung transaksi MASUK murni (Pembelian, Peminjaman, Pengembalian) KECUALI Rusak
        $mutasiBulan = TransaksiDetail::select(
                'td.barang_id',
                DB::raw("SUM(CASE 
                    WHEN t.jenis_transaksi = 'MASUK' 
                    AND UPPER(COALESCE(t.kondisi, 'BARU')) NOT LIKE '%RUSAK%' " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int)$gudangId : "") . " 
                    THEN td.qty ELSE 0 
                END) as masuk_bulan"),
                DB::raw("SUM(CASE 
                    WHEN t.jenis_transaksi = 'KELUAR' " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int)$gudangId : "") . " 
                    THEN td.qty ELSE 0 
                END) as keluar_bulan"),
                DB::raw("SUM(CASE 
                    WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int)$gudangId : "") . " 
                    THEN td.qty ELSE 0 
                END) as trf_in"),
                DB::raw("SUM(CASE 
                    WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int)$gudangId : "") . " 
                    THEN td.qty ELSE 0 
                END) as trf_out")
            )
            ->from('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])
                  ->orWhereNull('t.status');
            })
            ->whereIn('td.barang_id', $barangIds)
            ->whereBetween('t.tanggal', [$startDate, $endDate])
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        // 4. QUERY AGREGASI KONDISI KELUAR BULAN BERJALAN (Baru, Bekas, Rusak)
        $kondisiKeluar = DB::table('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])
                  ->orWhereNull('t.status');
            })
            ->whereIn('td.barang_id', $barangIds)
            ->whereBetween('t.tanggal', [$startDate, $endDate])
            ->where('t.jenis_transaksi', 'KELUAR')
            ->when($gudangId !== 'ALL', function ($q) use ($gudangId) {
                $q->where('t.gudang_asal_id', (int) $gudangId);
            })
            ->selectRaw("
                td.barang_id,
                SUM(CASE WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) = 'BARU' OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) = 'BAIK' THEN td.qty ELSE 0 END) as keluar_baru,
                SUM(CASE WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%BEKAS%' OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%SECOND%' THEN td.qty ELSE 0 END) as keluar_bekas,
                SUM(CASE WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%' THEN td.qty ELSE 0 END) as keluar_rusak
            ")
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        // 5. QUERY AGREGASI SISA FISIK KONDISI DARI TRANSAKSI (UNTUK BARANG NON-SN)
        $kondisiNonSn = DB::table('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])
                  ->orWhereNull('t.status');
            })
            ->whereIn('td.barang_id', $barangIds)
            ->where('t.tanggal', '<=', $endDate)
            ->selectRaw("
                td.barang_id,
                SUM(CASE 
                    WHEN (t.jenis_transaksi = 'MASUK' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int)$gudangId : "") . " 
                    AND (UPPER(COALESCE(t.kondisi, 'BARU')) = 'BARU' OR UPPER(COALESCE(t.kondisi, 'BARU')) = 'BAIK') 
                    THEN td.qty 
                    WHEN (t.jenis_transaksi = 'KELUAR' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int)$gudangId : "") . " 
                    AND (UPPER(COALESCE(t.kondisi, 'BARU')) NOT LIKE '%BEKAS%' AND UPPER(COALESCE(t.kondisi, 'BARU')) NOT LIKE '%RUSAK%')
                    THEN -td.qty 
                    ELSE 0 
                END) as net_baru,
                SUM(CASE 
                    WHEN (t.jenis_transaksi = 'MASUK' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int)$gudangId : "") . " 
                    AND (UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%BEKAS%' OR UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%SECOND%') 
                    THEN td.qty 
                    WHEN (t.jenis_transaksi = 'KELUAR' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int)$gudangId : "") . " 
                    AND (UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%BEKAS%' OR UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%SECOND%')
                    THEN -td.qty
                    ELSE 0 
                END) as net_bekas,
                SUM(CASE 
                    WHEN (t.jenis_transaksi = 'MASUK' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int)$gudangId : "") . " 
                    AND UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%RUSAK%' 
                    THEN td.qty 
                    WHEN (t.jenis_transaksi = 'KELUAR' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int)$gudangId : "") . " 
                    AND UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%RUSAK%'
                    THEN -td.qty
                    ELSE 0 
                END) as net_rusak
            ")
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        // 6. MAPPING LAPORAN REKONSILIASI STOK
        $laporanStok = $barangs->map(function ($b) use ($mutasiLalu, $mutasiBulan, $kondisiNonSn, $kondisiKeluar, $gudangId, $kondisi) {
            $lalu        = $mutasiLalu->get($b->id);
            $bulanData   = $mutasiBulan->get($b->id);
            $kNonSn      = $kondisiNonSn->get($b->id);
            $kKeluarData = $kondisiKeluar->get($b->id);

            $masukLalu   = (int) ($lalu?->masuk_lalu ?? 0);
            $keluarLalu  = (int) ($lalu?->keluar_lalu ?? 0);
            $stokAwal    = max(0, $masukLalu - $keluarLalu);

            $masukBulan  = (int) ($bulanData?->masuk_bulan ?? 0);
            $keluarBulan = (int) ($bulanData?->keluar_bulan ?? 0);
            $trfIn       = (int) ($bulanData?->trf_in ?? 0);
            $trfOut      = ($gudangId !== 'ALL') ? (int) ($bulanData?->trf_out ?? 0) : $trfIn;
            
            $transferNet = ($gudangId !== 'ALL') ? ($trfIn - $trfOut) : 0;
            $stokAkhir   = max(0, $stokAwal + $masukBulan - $keluarBulan + $transferNet);

            // Rincian sisa fisik unit di gudang
            if ($b->is_wajib_sn) {
                $serials = $b->serials;
                $kBaru   = $serials->filter(fn($s) => in_array(strtoupper($s->kondisi ?? ''), ['BARU', 'BAIK']))->count();
                $kBekas  = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'BEKAS'))->count();
                $kRusak  = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'RUSAK'))->count();
            } else {
                $kBaru   = max(0, (int) ($kNonSn?->net_baru ?? 0));
                $kBekas  = max(0, (int) ($kNonSn?->net_bekas ?? 0));
                $kRusak  = max(0, (int) ($kNonSn?->net_rusak ?? 0));

                if ($kBaru === 0 && $kBekas === 0 && $stokAkhir > 0) {
                    $kBaru = $stokAkhir;
                }
            }

            // Rincian mutasi keluar bulan berjalan
            $keluarBaru  = (int) ($kKeluarData?->keluar_baru ?? 0);
            $keluarBekas = (int) ($kKeluarData?->keluar_bekas ?? 0);
            $keluarRusak = (int) ($kKeluarData?->keluar_rusak ?? 0);

            if ($kondisi && $kondisi !== 'ALL') {
                $kondisiUpper = strtoupper($kondisi);
                if ($kondisiUpper === 'BARU') {
                    $kBekas = 0;
                    $kRusak = 0;
                } elseif (str_contains($kondisiUpper, 'BEKAS')) {
                    $kBaru  = 0;
                    $kRusak = 0;
                } elseif (str_contains($kondisiUpper, 'RUSAK')) {
                    $kBaru  = 0;
                    $kBekas = 0;
                }
            }

            $grandTotalFisik = $kBaru + $kBekas + $kRusak;
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
                'keluar_baru'   => $keluarBaru,
                'keluar_bekas'  => $keluarBekas,
                'keluar_rusak'  => $keluarRusak,
                'transfer_in'   => $trfIn,
                'transfer_out'  => $trfOut,
                'transfer_net'  => $transferNet,
                'stok_akhir'    => $stokAkhir,
                'kondisi_baru'  => $kBaru,
                'kondisi_bekas' => $kBekas,
                'kondisi_rusak' => $kRusak,
                'grand_total'   => $grandTotalFisik,
            ];
        });

        if ($kondisi && $kondisi !== 'ALL') {
            $kUpper = strtoupper($kondisi);
            $laporanStok = $laporanStok->filter(function ($item) use ($kUpper) {
                if ($kUpper === 'BARU') return $item['kondisi_baru'] > 0 || $item['masuk'] > 0;
                if (str_contains($kUpper, 'BEKAS')) return $item['kondisi_bekas'] > 0;
                if (str_contains($kUpper, 'RUSAK')) return $item['kondisi_rusak'] > 0;
                return true;
            })->values();
        }

        // 7. BUKU JURNAL MUTASI DETAIL
        $ledgerQuery = Transaksi::with([
            'gudangAsal:id,nama_gudang',
            'gudangTujuan:id,nama_gudang',
            'supplier:id,nama_supplier',
            'details.barang',
            'details.serials'
        ])
            ->where(function ($q) {
                $q->whereIn('status', ['COMPLETED', 'completed'])
                  ->orWhereNull('status');
            })
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->orderBy('tanggal', 'asc')
            ->orderBy('id', 'asc');

        if ($gudangId && $gudangId !== 'ALL') {
            $ledgerQuery->where(function ($q) use ($gudangId) {
                $q->where('gudang_asal_id', $gudangId)
                  ->orWhere('gudang_tujuan_id', $gudangId);
            });
        }

        if ($kondisi && $kondisi !== 'ALL') {
            $kUpper = strtoupper($kondisi);
            if ($kUpper === 'BARU') {
                $ledgerQuery->whereIn(DB::raw("UPPER(COALESCE(kondisi, 'BARU'))"), ['BARU', 'BAIK']);
            } else {
                $ledgerQuery->where('kondisi', 'like', "%{$kondisi}%");
            }
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
                'kondisi'       => $t->kondisi ?: 'Baru',
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
                'kondisi'   => $kondisi,
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
        $kondisi  = $request->input('kondisi', 'ALL');

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

        $mutasiLalu = TransaksiDetail::select(
                'td.barang_id',
                DB::raw("SUM(CASE 
                    WHEN t.tanggal < '{$startDate}' 
                    AND t.gudang_tujuan_id " . ($gudangId !== 'ALL' ? "= " . (int)$gudangId : "IS NOT NULL") . " 
                    AND (t.jenis_transaksi != 'MASUK' OR UPPER(COALESCE(t.kondisi, 'BARU')) NOT LIKE '%RUSAK%')
                    THEN td.qty ELSE 0 
                END) as masuk_lalu"),
                DB::raw("SUM(CASE 
                    WHEN t.tanggal < '{$startDate}' 
                    AND t.gudang_asal_id " . ($gudangId !== 'ALL' ? "= " . (int)$gudangId : "IS NOT NULL") . " 
                    THEN td.qty ELSE 0 
                END) as keluar_lalu")
            )
            ->from('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])
                  ->orWhereNull('t.status');
            })
            ->whereIn('td.barang_id', $barangIds)
            ->where('t.tanggal', '<', $startDate)
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        $mutasiBulan = TransaksiDetail::select(
                'td.barang_id',
                DB::raw("SUM(CASE 
                    WHEN t.jenis_transaksi = 'MASUK' 
                    AND UPPER(COALESCE(t.kondisi, 'BARU')) NOT LIKE '%RUSAK%' " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int)$gudangId : "") . " 
                    THEN td.qty ELSE 0 
                END) as masuk_bulan"),
                DB::raw("SUM(CASE 
                    WHEN t.jenis_transaksi = 'KELUAR' " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int)$gudangId : "") . " 
                    THEN td.qty ELSE 0 
                END) as keluar_bulan"),
                DB::raw("SUM(CASE 
                    WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int)$gudangId : "") . " 
                    THEN td.qty ELSE 0 
                END) as trf_in"),
                DB::raw("SUM(CASE 
                    WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int)$gudangId : "") . " 
                    THEN td.qty ELSE 0 
                END) as trf_out")
            )
            ->from('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])
                  ->orWhereNull('t.status');
            })
            ->whereIn('td.barang_id', $barangIds)
            ->whereBetween('t.tanggal', [$startDate, $endDate])
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        $kondisiNonSn = DB::table('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])
                  ->orWhereNull('t.status');
            })
            ->whereIn('td.barang_id', $barangIds)
            ->where('t.tanggal', '<=', $endDate)
            ->selectRaw("
                td.barang_id,
                SUM(CASE 
                    WHEN (t.jenis_transaksi = 'MASUK' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int)$gudangId : "") . " 
                    AND (UPPER(COALESCE(t.kondisi, 'BARU')) = 'BARU' OR UPPER(COALESCE(t.kondisi, 'BARU')) = 'BAIK') 
                    THEN td.qty 
                    WHEN (t.jenis_transaksi = 'KELUAR' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int)$gudangId : "") . " 
                    AND (UPPER(COALESCE(t.kondisi, 'BARU')) NOT LIKE '%BEKAS%' AND UPPER(COALESCE(t.kondisi, 'BARU')) NOT LIKE '%RUSAK%')
                    THEN -td.qty 
                    ELSE 0 
                END) as net_baru,
                SUM(CASE 
                    WHEN (t.jenis_transaksi = 'MASUK' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int)$gudangId : "") . " 
                    AND (UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%BEKAS%' OR UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%SECOND%') 
                    THEN td.qty 
                    WHEN (t.jenis_transaksi = 'KELUAR' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int)$gudangId : "") . " 
                    AND (UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%BEKAS%' OR UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%SECOND%')
                    THEN -td.qty
                    ELSE 0 
                END) as net_bekas,
                SUM(CASE 
                    WHEN (t.jenis_transaksi = 'MASUK' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int)$gudangId : "") . " 
                    AND UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%RUSAK%' 
                    THEN td.qty 
                    WHEN (t.jenis_transaksi = 'KELUAR' OR t.jenis_transaksi = 'TRANSFER') " . 
                    ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int)$gudangId : "") . " 
                    AND UPPER(COALESCE(t.kondisi, 'BARU')) LIKE '%RUSAK%'
                    THEN -td.qty
                    ELSE 0 
                END) as net_rusak
            ")
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

        $callback = function () use ($barangs, $mutasiLalu, $mutasiBulan, $kondisiNonSn, $gudangId, $kondisi, $bulan, $tahun, $gudangName, $monthNames) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");

            fputcsv($file, ["LAPORAN REKONSILIASI MUTASI STOK BULANAN"], ';');
            fputcsv($file, ["Periode", "{$monthNames[$bulan]} {$tahun}"], ';');
            fputcsv($file, ["Lokasi Gudang", $gudangName], ';');
            fputcsv($file, ["Kondisi", $kondisi === 'ALL' ? 'Semua Kondisi' : $kondisi], ';');
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
                'Kondisi Fisik (Baru / Bekas / Rusak)',
                'Grand Total Fisik'
            ], ';');

            $no = 1;
            foreach ($barangs as $b) {
                $lalu      = $mutasiLalu->get($b->id);
                $bulanData = $mutasiBulan->get($b->id);
                $kNonSn    = $kondisiNonSn->get($b->id);

                $masukLalu  = (int) ($lalu?->masuk_lalu ?? 0);
                $keluarLalu = (int) ($lalu?->keluar_lalu ?? 0);
                $stokAwal   = max(0, $masukLalu - $keluarLalu);

                $masukBulan  = (int) ($bulanData?->masuk_bulan ?? 0);
                $keluarBulan = (int) ($bulanData?->keluar_bulan ?? 0);
                $trfIn       = (int) ($bulanData?->trf_in ?? 0);
                $trfOut      = ($gudangId !== 'ALL') ? (int) ($bulanData?->trf_out ?? 0) : $trfIn;
                
                $transferNet = ($gudangId !== 'ALL') ? ($trfIn - $trfOut) : 0;
                $stokAkhir   = max(0, $stokAwal + $masukBulan - $keluarBulan + $transferNet);

                if ($b->is_wajib_sn) {
                    $serials = $b->serials;
                    $kBaru   = $serials->filter(fn($s) => in_array(strtoupper($s->kondisi ?? ''), ['BARU', 'BAIK']))->count();
                    $kBekas  = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'BEKAS'))->count();
                    $kRusak  = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'RUSAK'))->count();
                } else {
                    $kBaru   = max(0, (int) ($kNonSn?->net_baru ?? 0));
                    $kBekas  = max(0, (int) ($kNonSn?->net_bekas ?? 0));
                    $kRusak  = max(0, (int) ($kNonSn?->net_rusak ?? 0));

                    if ($kBaru === 0 && $kBekas === 0 && $stokAkhir > 0) {
                        $kBaru = $stokAkhir;
                    }
                }

                if ($kondisi && $kondisi !== 'ALL') {
                    $kondisiUpper = strtoupper($kondisi);
                    if ($kondisiUpper === 'BARU') {
                        $kBekas = 0;
                        $kRusak = 0;
                    } elseif (str_contains($kondisiUpper, 'BEKAS')) {
                        $kBaru  = 0;
                        $kRusak = 0;
                    } elseif (str_contains($kondisiUpper, 'RUSAK')) {
                        $kBaru  = 0;
                        $kBekas = 0;
                    }
                }

                $grandTotalFisik = $kBaru + $kBekas + $kRusak;
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
                    $kondisiRincian,
                    $grandTotalFisik
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}