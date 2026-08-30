<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangSerial;
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
        $bulan    = (int) $request->input('bulan', date('n'));
        $tahun    = (int) $request->input('tahun', date('Y'));
        $gudangId = $request->input('gudang_id', 'ALL');
        $search   = $request->input('search', '');

        // Batas rentang tanggal bulan terpilih
        $startDate = Carbon::create($tahun, $bulan, 1)->startOfMonth()->toDateString();
        $endDate   = Carbon::create($tahun, $bulan, 1)->endOfMonth()->toDateString();

        // 1. REKONSILIASI SALDO MUTASI STOK PER SKU (BALANCE SHEET)
        $barangQuery = Barang::with(['serials', 'stoks']);
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

        $laporanStok = $barangs->map(function ($b) use ($startDate, $endDate, $gudangId) {
            $barangId = $b->id;

            // A. STOK AWAL (Sebelum Start Date)
            if ($gudangId && $gudangId !== 'ALL') {
                $masukLalu = (int) TransaksiDetail::where('barang_id', $barangId)
                    ->whereHas('transaksi', function ($q) use ($startDate, $gudangId) {
                        $q->where('status', 'COMPLETED')
                          ->where('tanggal', '<', $startDate)
                          ->where('gudang_tujuan_id', $gudangId);
                    })->sum('qty');

                $keluarLalu = (int) TransaksiDetail::where('barang_id', $barangId)
                    ->whereHas('transaksi', function ($q) use ($startDate, $gudangId) {
                        $q->where('status', 'COMPLETED')
                          ->where('tanggal', '<', $startDate)
                          ->where('gudang_asal_id', $gudangId);
                    })->sum('qty');

                $stokAwal = max(0, $masukLalu - $keluarLalu);
            } else {
                $masukLalu = (int) TransaksiDetail::where('barang_id', $barangId)
                    ->whereHas('transaksi', function ($q) use ($startDate) {
                        $q->where('status', 'COMPLETED')
                          ->where('tanggal', '<', $startDate)
                          ->where('jenis_transaksi', 'MASUK');
                    })->sum('qty');

                $keluarLalu = (int) TransaksiDetail::where('barang_id', $barangId)
                    ->whereHas('transaksi', function ($q) use ($startDate) {
                        $q->where('status', 'COMPLETED')
                          ->where('tanggal', '<', $startDate)
                          ->where('jenis_transaksi', 'KELUAR');
                    })->sum('qty');

                $stokAwal = max(0, $masukLalu - $keluarLalu);
            }

            // B. MUTASI BULAN BERJALAN (Between Start Date & End Date)
            if ($gudangId && $gudangId !== 'ALL') {
                $masukBulan = (int) TransaksiDetail::where('barang_id', $barangId)
                    ->whereHas('transaksi', function ($q) use ($startDate, $endDate, $gudangId) {
                        $q->where('status', 'COMPLETED')
                          ->where('jenis_transaksi', 'MASUK')
                          ->where('gudang_tujuan_id', $gudangId)
                          ->whereBetween('tanggal', [$startDate, $endDate]);
                    })->sum('qty');

                $keluarBulan = (int) TransaksiDetail::where('barang_id', $barangId)
                    ->whereHas('transaksi', function ($q) use ($startDate, $endDate, $gudangId) {
                        $q->where('status', 'COMPLETED')
                          ->where('jenis_transaksi', 'KELUAR')
                          ->where('gudang_asal_id', $gudangId)
                          ->whereBetween('tanggal', [$startDate, $endDate]);
                    })->sum('qty');

                $trfIn = (int) TransaksiDetail::where('barang_id', $barangId)
                    ->whereHas('transaksi', function ($q) use ($startDate, $endDate, $gudangId) {
                        $q->where('status', 'COMPLETED')
                          ->where(fn($qb) => $qb->where('jenis_transaksi', 'TRANSFER')->orWhere('sub_jenis', 'TRANSFER_GUDANG'))
                          ->where('gudang_tujuan_id', $gudangId)
                          ->whereBetween('tanggal', [$startDate, $endDate]);
                    })->sum('qty');

                $trfOut = (int) TransaksiDetail::where('barang_id', $barangId)
                    ->whereHas('transaksi', function ($q) use ($startDate, $endDate, $gudangId) {
                        $q->where('status', 'COMPLETED')
                          ->where(fn($qb) => $qb->where('jenis_transaksi', 'TRANSFER')->orWhere('sub_jenis', 'TRANSFER_GUDANG'))
                          ->where('gudang_asal_id', $gudangId)
                          ->whereBetween('tanggal', [$startDate, $endDate]);
                    })->sum('qty');

                $transferNet = $trfIn - $trfOut;
                $stokAkhir   = max(0, $stokAwal + $masukBulan - $keluarBulan + $transferNet);
            } else {
                $masukBulan = (int) TransaksiDetail::where('barang_id', $barangId)
                    ->whereHas('transaksi', function ($q) use ($startDate, $endDate) {
                        $q->where('status', 'COMPLETED')
                          ->where('jenis_transaksi', 'MASUK')
                          ->whereBetween('tanggal', [$startDate, $endDate]);
                    })->sum('qty');

                $keluarBulan = (int) TransaksiDetail::where('barang_id', $barangId)
                    ->whereHas('transaksi', function ($q) use ($startDate, $endDate) {
                        $q->where('status', 'COMPLETED')
                          ->where('jenis_transaksi', 'KELUAR')
                          ->whereBetween('tanggal', [$startDate, $endDate]);
                    })->sum('qty');

                $trfIn = (int) TransaksiDetail::where('barang_id', $barangId)
                    ->whereHas('transaksi', function ($q) use ($startDate, $endDate) {
                        $q->where('status', 'COMPLETED')
                          ->where(fn($qb) => $qb->where('jenis_transaksi', 'TRANSFER')->orWhere('sub_jenis', 'TRANSFER_GUDANG'))
                          ->whereBetween('tanggal', [$startDate, $endDate]);
                    })->sum('qty');

                $trfOut      = $trfIn;
                $transferNet = 0;
                $stokAkhir   = max(0, $stokAwal + $masukBulan - $keluarBulan);
            }

            // C. RINCIAN KONDISI FISIK UNIT SAAT INI
            $serialsQuery = $b->serials->where('status', 'IN_WAREHOUSE');
            if ($gudangId && $gudangId !== 'ALL') {
                $serialsQuery = $serialsQuery->where('gudang_id', (int) $gudangId);
            }

            $kondisiBaru  = $serialsQuery->filter(fn($s) => in_array(strtoupper($s->kondisi ?? ''), ['BARU', 'BAIK']))->count();
            $kondisiBekas = $serialsQuery->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'BEKAS'))->count();
            $kondisiRusak = $serialsQuery->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'RUSAK'))->count();

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

        // 2. BUKU JURNAL MUTASI DETAIL (AUDIT LEDGER)
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

            $listSn = $detail ? $detail->serials->map(function ($s) {
                return [
                    'serial_number' => $s->serial_number,
                    'kondisi'       => $s->kondisi ?: 'Baru'
                ];
            }) : [];

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

        $barangs = Barang::with(['serials', 'stoks'])->orderBy('kode_barang', 'asc')->get();

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

        $callback = function () use ($barangs, $startDate, $endDate, $gudangId, $bulan, $tahun, $gudangName, $monthNames) {
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
                $barangId = $b->id;

                if ($gudangId && $gudangId !== 'ALL') {
                    $masukLalu = (int) TransaksiDetail::where('barang_id', $barangId)
                        ->whereHas('transaksi', fn($q) => $q->where('status', 'COMPLETED')->where('tanggal', '<', $startDate)->where('gudang_tujuan_id', $gudangId))->sum('qty');
                    $keluarLalu = (int) TransaksiDetail::where('barang_id', $barangId)
                        ->whereHas('transaksi', fn($q) => $q->where('status', 'COMPLETED')->where('tanggal', '<', $startDate)->where('gudang_asal_id', $gudangId))->sum('qty');
                    $stokAwal = max(0, $masukLalu - $keluarLalu);

                    $masukBulan = (int) TransaksiDetail::where('barang_id', $barangId)
                        ->whereHas('transaksi', fn($q) => $q->where('status', 'COMPLETED')->where('jenis_transaksi', 'MASUK')->where('gudang_tujuan_id', $gudangId)->whereBetween('tanggal', [$startDate, $endDate]))->sum('qty');
                    $keluarBulan = (int) TransaksiDetail::where('barang_id', $barangId)
                        ->whereHas('transaksi', fn($q) => $q->where('status', 'COMPLETED')->where('jenis_transaksi', 'KELUAR')->where('gudang_asal_id', $gudangId)->whereBetween('tanggal', [$startDate, $endDate]))->sum('qty');
                    
                    $trfIn = (int) TransaksiDetail::where('barang_id', $barangId)
                        ->whereHas('transaksi', fn($q) => $q->where('status', 'COMPLETED')->where(fn($qb) => $qb->where('jenis_transaksi', 'TRANSFER')->orWhere('sub_jenis', 'TRANSFER_GUDANG'))->where('gudang_tujuan_id', $gudangId)->whereBetween('tanggal', [$startDate, $endDate]))->sum('qty');
                    $trfOut = (int) TransaksiDetail::where('barang_id', $barangId)
                        ->whereHas('transaksi', fn($q) => $q->where('status', 'COMPLETED')->where(fn($qb) => $qb->where('jenis_transaksi', 'TRANSFER')->orWhere('sub_jenis', 'TRANSFER_GUDANG'))->where('gudang_asal_id', $gudangId)->whereBetween('tanggal', [$startDate, $endDate]))->sum('qty');
                    
                    $transferNet = $trfIn - $trfOut;
                    $stokAkhir   = max(0, $stokAwal + $masukBulan - $keluarBulan + $transferNet);
                } else {
                    $masukLalu = (int) TransaksiDetail::where('barang_id', $barangId)
                        ->whereHas('transaksi', fn($q) => $q->where('status', 'COMPLETED')->where('tanggal', '<', $startDate)->where('jenis_transaksi', 'MASUK'))->sum('qty');
                    $keluarLalu = (int) TransaksiDetail::where('barang_id', $barangId)
                        ->whereHas('transaksi', fn($q) => $q->where('status', 'COMPLETED')->where('tanggal', '<', $startDate)->where('jenis_transaksi', 'KELUAR'))->sum('qty');
                    $stokAwal = max(0, $masukLalu - $keluarLalu);

                    $masukBulan = (int) TransaksiDetail::where('barang_id', $barangId)
                        ->whereHas('transaksi', fn($q) => $q->where('status', 'COMPLETED')->where('jenis_transaksi', 'MASUK')->whereBetween('tanggal', [$startDate, $endDate]))->sum('qty');
                    $keluarBulan = (int) TransaksiDetail::where('barang_id', $barangId)
                        ->whereHas('transaksi', fn($q) => $q->where('status', 'COMPLETED')->where('jenis_transaksi', 'KELUAR')->whereBetween('tanggal', [$startDate, $endDate]))->sum('qty');
                    
                    $transferNet = 0;
                    $stokAkhir   = max(0, $stokAwal + $masukBulan - $keluarBulan);
                }

                $serialsQuery = $b->serials->where('status', 'IN_WAREHOUSE');
                if ($gudangId && $gudangId !== 'ALL') {
                    $serialsQuery = $serialsQuery->where('gudang_id', (int) $gudangId);
                }
                $kBaru  = $serialsQuery->filter(fn($s) => in_array(strtoupper($s->kondisi ?? ''), ['BARU', 'BAIK']))->count();
                $kBekas = $serialsQuery->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'BEKAS'))->count();
                $kRusak = $serialsQuery->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'RUSAK'))->count();

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