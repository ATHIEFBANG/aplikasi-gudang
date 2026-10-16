<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\Gudang;
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
        $bulan = (int) $request->input('bulan', date('n'));
        $tahun = (int) $request->input('tahun', date('Y'));
        $gudangId = $request->input('gudang_id', 'ALL');
        $kondisi = $request->input('kondisi', 'ALL');
        $search = $request->input('search', '');
        $hanyaAdaTransaksi = filter_var($request->input('hanya_ada_transaksi', false), FILTER_VALIDATE_BOOLEAN);

        $startDate = Carbon::create($tahun, $bulan, 1)->startOfMonth()->toDateString();
        $endDate = Carbon::create($tahun, $bulan, 1)->endOfMonth()->toDateString();

        $barangQuery = Barang::with([
            'serials' => function ($q) use ($gudangId) {
                $q->where(function ($sq) {
                    $sq->whereIn('status', ['IN_WAREHOUSE', 'READY', 'AVAILABLE', 'AKTIF', 'TERSEDIA', 'ADA'])
                        ->orWhereNull('status');
                });

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
        $gudangList = Gudang::where('is_active', true)->get(['id', 'nama_gudang', 'kode_gudang']);

        $mutasiLalu = TransaksiDetail::select(
            'td.barang_id',
            DB::raw("SUM(CASE
                WHEN t.tanggal < '{$startDate}'
                AND t.gudang_tujuan_id " . ($gudangId !== 'ALL' ? "= " . (int) $gudangId : "IS NOT NULL") . "
                AND (t.jenis_transaksi != 'MASUK' OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%')
                THEN td.qty ELSE 0
            END) as masuk_lalu"),
            DB::raw("SUM(CASE
                WHEN t.tanggal < '{$startDate}'
                AND t.gudang_asal_id " . ($gudangId !== 'ALL' ? "= " . (int) $gudangId : "IS NOT NULL") . "
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
                AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%' " .
                ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int) $gudangId : "") . "
                THEN td.qty ELSE 0
            END) as masuk_bulan"),
            DB::raw("SUM(CASE
                WHEN t.jenis_transaksi = 'MASUK'
                AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%' " .
                ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int) $gudangId : "") . "
                THEN td.qty ELSE 0
            END) as masuk_rusak"),
            DB::raw("SUM(CASE
                WHEN t.jenis_transaksi = 'KELUAR' " .
                ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int) $gudangId : "") . "
                THEN td.qty ELSE 0
            END) as keluar_bulan"),
            DB::raw("SUM(CASE
                WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " .
                ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int) $gudangId : "") . "
                THEN td.qty ELSE 0
            END) as trf_in"),
            DB::raw("SUM(CASE
                WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " .
                ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int) $gudangId : "") . "
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
                SUM(CASE
                    WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%BEKAS%'
                      OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%SECOND%'
                    THEN td.qty ELSE 0
                END) as keluar_bekas,
                SUM(CASE
                    WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%'
                    THEN td.qty ELSE 0
                END) as keluar_rusak,
                SUM(CASE
                    WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%BEKAS%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%SECOND%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%'
                    THEN td.qty ELSE 0
                END) as keluar_baru
            ")
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        $gudangIdInt = $gudangId !== 'ALL' ? (int) $gudangId : null;
        $tujuanCond = $gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = {$gudangIdInt}" : "";
        $asalCond = $gudangId !== 'ALL' ? "AND t.gudang_asal_id = {$gudangIdInt}" : "";
        $trfCase = $gudangId !== 'ALL'
            ? "CASE WHEN t.gudang_tujuan_id = {$gudangIdInt} THEN td.qty WHEN t.gudang_asal_id = {$gudangIdInt} THEN -td.qty ELSE 0 END"
            : "0";

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
                    WHEN t.jenis_transaksi = 'MASUK' {$tujuanCond}
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%BEKAS%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%SECOND%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%'
                    THEN td.qty
                    WHEN t.jenis_transaksi = 'KELUAR' {$asalCond}
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%BEKAS%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%SECOND%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%'
                    THEN -td.qty
                    WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG')
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%BEKAS%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%SECOND%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%'
                    THEN {$trfCase}
                    ELSE 0
                END) as net_baru,
                SUM(CASE
                    WHEN t.jenis_transaksi = 'MASUK' {$tujuanCond}
                     AND (UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%BEKAS%'
                      OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%SECOND%')
                    THEN td.qty
                    WHEN t.jenis_transaksi = 'KELUAR' {$asalCond}
                     AND (UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%BEKAS%'
                      OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%SECOND%')
                    THEN -td.qty
                    WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG')
                     AND (UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%BEKAS%'
                      OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%SECOND%')
                    THEN {$trfCase}
                    ELSE 0
                END) as net_bekas,
                SUM(CASE
                    WHEN t.jenis_transaksi = 'MASUK' {$tujuanCond}
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%'
                    THEN td.qty
                    WHEN t.jenis_transaksi = 'KELUAR' {$asalCond}
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%'
                    THEN -td.qty
                    WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG')
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%'
                    THEN {$trfCase}
                    ELSE 0
                END) as net_rusak
            ")
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        // Distribusi kondisi per gudang hanya diperlukan saat Semua Gudang.
        $kondisiPerGudangRows = collect();

        if ($gudangId === 'ALL') {
            $conditionSql = function ($sign = 1) {
                $baru = $sign === 1
                    ? "SUM(CASE WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%BEKAS%' AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%SECOND%' AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%' THEN td.qty ELSE 0 END)"
                    : "SUM(CASE WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%BEKAS%' AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%SECOND%' AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%' THEN -td.qty ELSE 0 END)";
                $bekas = $sign === 1
                    ? "SUM(CASE WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%BEKAS%' OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%SECOND%' THEN td.qty ELSE 0 END)"
                    : "SUM(CASE WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%BEKAS%' OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%SECOND%' THEN -td.qty ELSE 0 END)";
                $rusak = $sign === 1
                    ? "SUM(CASE WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%' THEN td.qty ELSE 0 END)"
                    : "SUM(CASE WHEN UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%' THEN -td.qty ELSE 0 END)";

                return [$baru, $bekas, $rusak];
            };

            [$masukBaruSql, $masukBekasSql, $masukRusakSql] = $conditionSql(1);
            [$keluarBaruSql, $keluarBekasSql, $keluarRusakSql] = $conditionSql(-1);

            $masukPerGudang = DB::table('transaksi_details as td')
                ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
                ->where('t.jenis_transaksi', 'MASUK')
                ->whereNotNull('t.gudang_tujuan_id')
                ->where(function ($q) {
                    $q->whereIn('t.status', ['COMPLETED', 'completed'])->orWhereNull('t.status');
                })
                ->whereIn('td.barang_id', $barangIds)
                ->where('t.tanggal', '<=', $endDate)
                ->selectRaw("td.barang_id, t.gudang_tujuan_id as gudang_id, {$masukBaruSql} as net_baru, {$masukBekasSql} as net_bekas, {$masukRusakSql} as net_rusak")
                ->groupBy('td.barang_id', 't.gudang_tujuan_id');

            $keluarPerGudang = DB::table('transaksi_details as td')
                ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
                ->where('t.jenis_transaksi', 'KELUAR')
                ->whereNotNull('t.gudang_asal_id')
                ->where(function ($q) {
                    $q->whereIn('t.status', ['COMPLETED', 'completed'])->orWhereNull('t.status');
                })
                ->whereIn('td.barang_id', $barangIds)
                ->where('t.tanggal', '<=', $endDate)
                ->selectRaw("td.barang_id, t.gudang_asal_id as gudang_id, {$keluarBaruSql} as net_baru, {$keluarBekasSql} as net_bekas, {$keluarRusakSql} as net_rusak")
                ->groupBy('td.barang_id', 't.gudang_asal_id');

            $transferInPerGudang = DB::table('transaksi_details as td')
                ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
                ->where(function ($q) {
                    $q->where('t.jenis_transaksi', 'TRANSFER')->orWhere('t.sub_jenis', 'TRANSFER_GUDANG');
                })
                ->whereNotNull('t.gudang_tujuan_id')
                ->where(function ($q) {
                    $q->whereIn('t.status', ['COMPLETED', 'completed'])->orWhereNull('t.status');
                })
                ->whereIn('td.barang_id', $barangIds)
                ->where('t.tanggal', '<=', $endDate)
                ->selectRaw("td.barang_id, t.gudang_tujuan_id as gudang_id, {$masukBaruSql} as net_baru, {$masukBekasSql} as net_bekas, {$masukRusakSql} as net_rusak")
                ->groupBy('td.barang_id', 't.gudang_tujuan_id');

            $transferOutPerGudang = DB::table('transaksi_details as td')
                ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
                ->where(function ($q) {
                    $q->where('t.jenis_transaksi', 'TRANSFER')->orWhere('t.sub_jenis', 'TRANSFER_GUDANG');
                })
                ->whereNotNull('t.gudang_asal_id')
                ->where(function ($q) {
                    $q->whereIn('t.status', ['COMPLETED', 'completed'])->orWhereNull('t.status');
                })
                ->whereIn('td.barang_id', $barangIds)
                ->where('t.tanggal', '<=', $endDate)
                ->selectRaw("td.barang_id, t.gudang_asal_id as gudang_id, {$keluarBaruSql} as net_baru, {$keluarBekasSql} as net_bekas, {$keluarRusakSql} as net_rusak")
                ->groupBy('td.barang_id', 't.gudang_asal_id');

            $union = $masukPerGudang
                ->unionAll($keluarPerGudang)
                ->unionAll($transferInPerGudang)
                ->unionAll($transferOutPerGudang);

            $kondisiPerGudangRows = DB::query()
                ->fromSub($union, 'm')
                ->select('barang_id', 'gudang_id')
                ->selectRaw('SUM(net_baru) as net_baru, SUM(net_bekas) as net_bekas, SUM(net_rusak) as net_rusak')
                ->groupBy('barang_id', 'gudang_id')
                ->get()
                ->groupBy('barang_id');
        }

        $laporanStok = $barangs->map(function ($b) use (
            $mutasiLalu,
            $mutasiBulan,
            $kondisiNonSn,
            $kondisiKeluar,
            $gudangId,
            $kondisi,
            $gudangList,
            $kondisiPerGudangRows
        ) {
            $lalu = $mutasiLalu->get($b->id);
            $bulanData = $mutasiBulan->get($b->id);
            $kNonSn = $kondisiNonSn->get($b->id);
            $kKeluarData = $kondisiKeluar->get($b->id);

            $masukLalu = (int) ($lalu?->masuk_lalu ?? 0);
            $keluarLalu = (int) ($lalu?->keluar_lalu ?? 0);
            $stokAwal = max(0, $masukLalu - $keluarLalu);

            $masukBulan = (int) ($bulanData?->masuk_bulan ?? 0);
            $masukRusak = (int) ($bulanData?->masuk_rusak ?? 0);
            $keluarBulan = (int) ($bulanData?->keluar_bulan ?? 0);
            $trfIn = (int) ($bulanData?->trf_in ?? 0);
            $trfOut = $gudangId !== 'ALL' ? (int) ($bulanData?->trf_out ?? 0) : $trfIn;

            $transferNet = $gudangId !== 'ALL' ? $trfIn - $trfOut : 0;
            $stokAkhir = max(0, $stokAwal + $masukBulan - $keluarBulan + $transferNet);

            if ($b->is_wajib_sn) {
                $serials = $b->serials;
                $kBaru = $serials->filter(fn($s) => in_array(strtoupper($s->kondisi ?? ''), ['BARU', 'BAIK', '-']) || empty($s->kondisi))->count();
                $kBekas = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'BEKAS') || str_contains(strtoupper($s->kondisi ?? ''), 'SECOND'))->count();
                $kRusak = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'RUSAK'))->count();
            } else {
                $kBaru = max(0, (int) ($kNonSn?->net_baru ?? 0));
                $kBekas = max(0, (int) ($kNonSn?->net_bekas ?? 0));
                $kRusak = max(0, (int) ($kNonSn?->net_rusak ?? 0));
            }

            $usableFisik = $kBaru + $kBekas;
            if ($stokAkhir !== $usableFisik) {
                if ($stokAkhir > $usableFisik) {
                    $kBaru += $stokAkhir - $usableFisik;
                } else {
                    $selisih = $usableFisik - $stokAkhir;
                    if ($kBaru >= $selisih) {
                        $kBaru -= $selisih;
                    } else {
                        $selisih -= $kBaru;
                        $kBaru = 0;
                        $kBekas = max(0, $kBekas - $selisih);
                    }
                }
            }

            $keluarBekas = (int) ($kKeluarData?->keluar_bekas ?? 0);
            $keluarRusak = (int) ($kKeluarData?->keluar_rusak ?? 0);
            $keluarBaru = (int) ($kKeluarData?->keluar_baru ?? 0);

            $totalKondisiKeluar = $keluarBaru + $keluarBekas + $keluarRusak;
            if ($keluarBulan > $totalKondisiKeluar) {
                $keluarBaru += $keluarBulan - $totalKondisiKeluar;
            }

            if ($kondisi && $kondisi !== 'ALL') {
                $kondisiUpper = strtoupper($kondisi);

                if ($kondisiUpper === 'BARU') {
                    $kBekas = 0;
                    $kRusak = 0;
                } elseif (str_contains($kondisiUpper, 'BEKAS')) {
                    $kBaru = 0;
                    $kRusak = 0;
                } elseif (str_contains($kondisiUpper, 'RUSAK')) {
                    $kBaru = 0;
                    $kBekas = 0;
                }
            }

            $grandTotalFisik = $kBaru + $kBekas + $kRusak;
            $namaLengkap = trim("{$b->brand} {$b->tipe} {$b->kategori}") ?: $b->nama_barang;

            $kondisiPerGudang = $gudangId === 'ALL'
                ? $gudangList->map(function ($g) use ($b, $kondisiPerGudangRows, $kondisi) {
                    if ($b->is_wajib_sn) {
                        $serials = $b->serials->where('gudang_id', $g->id);
                        $baru = $serials->filter(fn($s) => in_array(strtoupper($s->kondisi ?? ''), ['BARU', 'BAIK', '-']) || empty($s->kondisi))->count();
                        $bekas = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'BEKAS') || str_contains(strtoupper($s->kondisi ?? ''), 'SECOND'))->count();
                        $rusak = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'RUSAK'))->count();
                    } else {
                        $row = $kondisiPerGudangRows->get($b->id, collect())->firstWhere('gudang_id', $g->id);
                        $baru = max(0, (int) ($row?->net_baru ?? 0));
                        $bekas = max(0, (int) ($row?->net_bekas ?? 0));
                        $rusak = max(0, (int) ($row?->net_rusak ?? 0));
                    }

                    $kUpper = strtoupper((string) $kondisi);
                    if ($kUpper === 'BARU') {
                        $bekas = 0;
                        $rusak = 0;
                    } elseif (str_contains($kUpper, 'BEKAS')) {
                        $baru = 0;
                        $rusak = 0;
                    } elseif (str_contains($kUpper, 'RUSAK')) {
                        $baru = 0;
                        $bekas = 0;
                    }

                    return [
                        'gudang_id' => $g->id,
                        'kode_gudang' => $g->kode_gudang,
                        'nama_gudang' => $g->nama_gudang,
                        'baru' => $baru,
                        'bekas' => $bekas,
                        'rusak' => $rusak,
                        'total' => $baru + $bekas + $rusak,
                    ];
                })->values()->all()
                : [];

            return [
                'id' => $b->id,
                'kode_barang' => $b->kode_barang,
                'nama_barang' => $namaLengkap,
                'part_number' => $b->part_number ?: '-',
                'satuan' => $b->deskripsi ?: ($b->satuan ?: 'Unit'),
                'is_wajib_sn' => $b->is_wajib_sn,
                'stok_awal' => $stokAwal,
                'masuk' => $masukBulan,
                'masuk_rusak' => $masukRusak,
                'keluar' => $keluarBulan,
                'keluar_baru' => $keluarBaru,
                'keluar_bekas' => $keluarBekas,
                'keluar_rusak' => $keluarRusak,
                'transfer_in' => $trfIn,
                'transfer_out' => $trfOut,
                'transfer_net' => $transferNet,
                'stok_akhir' => $stokAkhir,
                'kondisi_baru' => $kBaru,
                'kondisi_bekas' => $kBekas,
                'kondisi_rusak' => $kRusak,
                'grand_total' => $grandTotalFisik,
                'kondisi_per_gudang' => $kondisiPerGudang,
            ];
        });

        if ($kondisi && $kondisi !== 'ALL') {
            $kUpper = strtoupper($kondisi);
            $laporanStok = $laporanStok->filter(function ($item) use ($kUpper) {
                if ($kUpper === 'BARU') return $item['kondisi_baru'] > 0 || $item['masuk'] > 0;
                if (str_contains($kUpper, 'BEKAS')) return $item['kondisi_bekas'] > 0;
                if (str_contains($kUpper, 'RUSAK')) return $item['kondisi_rusak'] > 0 || $item['masuk_rusak'] > 0;
                return true;
            })->values();
        }

        if ($hanyaAdaTransaksi) {
            $laporanStok = $laporanStok->filter(function ($item) {
                return ($item['masuk'] > 0)
                    || ($item['masuk_rusak'] > 0)
                    || ($item['keluar'] > 0)
                    || ($item['transfer_in'] > 0)
                    || ($item['transfer_out'] > 0);
            })->values();
        }

        return Inertia::render('Laporan/Index', [
            'laporanStok' => $laporanStok,
            'gudangs' => $gudangList,
            'filters' => [
                'bulan' => $bulan,
                'tahun' => $tahun,
                'gudang_id' => $gudangId,
                'kondisi' => $kondisi,
                'search' => $search,
                'hanya_ada_transaksi' => $hanyaAdaTransaksi,
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        set_time_limit(180);
        $bulan = (int) $request->input('bulan', date('n'));
        $tahun = (int) $request->input('tahun', date('Y'));
        $gudangId = $request->input('gudang_id', 'ALL');
        $kondisi = $request->input('kondisi', 'ALL');
        $hanyaAdaTransaksi = filter_var($request->input('hanya_ada_transaksi', false), FILTER_VALIDATE_BOOLEAN);

        $startDate = Carbon::create($tahun, $bulan, 1)->startOfMonth()->toDateString();
        $endDate = Carbon::create($tahun, $bulan, 1)->endOfMonth()->toDateString();

        $gudangName = 'Semua Gudang';
        if ($gudangId && $gudangId !== 'ALL') {
            $g = Gudang::find($gudangId);
            if ($g) $gudangName = $g->nama_gudang;
        }

        $barangs = Barang::with([
            'serials' => function ($q) use ($gudangId) {
                $q->where(function ($sq) {
                    $sq->whereIn('status', ['IN_WAREHOUSE', 'READY', 'AVAILABLE', 'AKTIF', 'TERSEDIA', 'ADA'])
                        ->orWhereNull('status');
                });

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
                AND t.gudang_tujuan_id " . ($gudangId !== 'ALL' ? "= " . (int) $gudangId : "IS NOT NULL") . "
                AND (t.jenis_transaksi != 'MASUK' OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%')
                THEN td.qty ELSE 0
            END) as masuk_lalu"),
            DB::raw("SUM(CASE
                WHEN t.tanggal < '{$startDate}'
                AND t.gudang_asal_id " . ($gudangId !== 'ALL' ? "= " . (int) $gudangId : "IS NOT NULL") . "
                THEN td.qty ELSE 0
            END) as keluar_lalu")
        )
            ->from('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])->orWhereNull('t.status');
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
                AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%' " .
                ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int) $gudangId : "") . "
                THEN td.qty ELSE 0
            END) as masuk_bulan"),
            DB::raw("SUM(CASE
                WHEN t.jenis_transaksi = 'MASUK'
                AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%' " .
                ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int) $gudangId : "") . "
                THEN td.qty ELSE 0
            END) as masuk_rusak"),
            DB::raw("SUM(CASE
                WHEN t.jenis_transaksi = 'KELUAR' " .
                ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int) $gudangId : "") . "
                THEN td.qty ELSE 0
            END) as keluar_bulan"),
            DB::raw("SUM(CASE
                WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " .
                ($gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = " . (int) $gudangId : "") . "
                THEN td.qty ELSE 0
            END) as trf_in"),
            DB::raw("SUM(CASE
                WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG') " .
                ($gudangId !== 'ALL' ? "AND t.gudang_asal_id = " . (int) $gudangId : "") . "
                THEN td.qty ELSE 0
            END) as trf_out")
        )
            ->from('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])->orWhereNull('t.status');
            })
            ->whereIn('td.barang_id', $barangIds)
            ->whereBetween('t.tanggal', [$startDate, $endDate])
            ->groupBy('td.barang_id')
            ->get()
            ->keyBy('barang_id');

        $gudangIdInt = $gudangId !== 'ALL' ? (int) $gudangId : null;
        $tujuanCond = $gudangId !== 'ALL' ? "AND t.gudang_tujuan_id = {$gudangIdInt}" : "";
        $asalCond = $gudangId !== 'ALL' ? "AND t.gudang_asal_id = {$gudangIdInt}" : "";
        $trfCase = $gudangId !== 'ALL'
            ? "CASE WHEN t.gudang_tujuan_id = {$gudangIdInt} THEN td.qty WHEN t.gudang_asal_id = {$gudangIdInt} THEN -td.qty ELSE 0 END"
            : "0";

        $kondisiNonSn = DB::table('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])->orWhereNull('t.status');
            })
            ->whereIn('td.barang_id', $barangIds)
            ->where('t.tanggal', '<=', $endDate)
            ->selectRaw("
                td.barang_id,
                SUM(CASE
                    WHEN t.jenis_transaksi = 'MASUK' {$tujuanCond}
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%BEKAS%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%SECOND%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%'
                    THEN td.qty
                    WHEN t.jenis_transaksi = 'KELUAR' {$asalCond}
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%BEKAS%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%SECOND%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%'
                    THEN -td.qty
                    WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG')
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%BEKAS%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%SECOND%'
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) NOT LIKE '%RUSAK%'
                    THEN {$trfCase}
                    ELSE 0
                END) as net_baru,
                SUM(CASE
                    WHEN t.jenis_transaksi = 'MASUK' {$tujuanCond}
                     AND (UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%BEKAS%'
                      OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%SECOND%')
                    THEN td.qty
                    WHEN t.jenis_transaksi = 'KELUAR' {$asalCond}
                     AND (UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%BEKAS%'
                      OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%SECOND%')
                    THEN -td.qty
                    WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG')
                     AND (UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%BEKAS%'
                      OR UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%SECOND%')
                    THEN {$trfCase}
                    ELSE 0
                END) as net_bekas,
                SUM(CASE
                    WHEN t.jenis_transaksi = 'MASUK' {$tujuanCond}
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%'
                    THEN td.qty
                    WHEN t.jenis_transaksi = 'KELUAR' {$asalCond}
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%'
                    THEN -td.qty
                    WHEN (t.jenis_transaksi = 'TRANSFER' OR t.sub_jenis = 'TRANSFER_GUDANG')
                     AND UPPER(COALESCE(td.kondisi, t.kondisi, 'BARU')) LIKE '%RUSAK%'
                    THEN {$trfCase}
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
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$csvFileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use (
            $barangs,
            $mutasiLalu,
            $mutasiBulan,
            $kondisiNonSn,
            $gudangId,
            $kondisi,
            $hanyaAdaTransaksi,
            $bulan,
            $tahun,
            $gudangName,
            $monthNames
        ) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");

            fputcsv($file, ['LAPORAN REKONSILIASI MUTASI STOK BULANAN'], ';');
            fputcsv($file, ['Periode', "{$monthNames[$bulan]} {$tahun}"], ';');
            fputcsv($file, ['Lokasi Gudang', $gudangName], ';');
            fputcsv($file, ['Kondisi', $kondisi === 'ALL' ? 'Semua Kondisi' : $kondisi], ';');
            fputcsv($file, ['Filter Transaksi', $hanyaAdaTransaksi ? 'Hanya Ada Transaksi' : 'Semua Barang'], ';');
            fputcsv($file, ['Tanggal Cetak', date('Y-m-d H:i:s')], ';');
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
                $lalu = $mutasiLalu->get($b->id);
                $bulanData = $mutasiBulan->get($b->id);
                $kNonSn = $kondisiNonSn->get($b->id);

                $masukLalu = (int) ($lalu?->masuk_lalu ?? 0);
                $keluarLalu = (int) ($lalu?->keluar_lalu ?? 0);
                $stokAwal = max(0, $masukLalu - $keluarLalu);

                $masukBulan = (int) ($bulanData?->masuk_bulan ?? 0);
                $masukRusak = (int) ($bulanData?->masuk_rusak ?? 0);
                $keluarBulan = (int) ($bulanData?->keluar_bulan ?? 0);
                $trfIn = (int) ($bulanData?->trf_in ?? 0);
                $trfOut = $gudangId !== 'ALL' ? (int) ($bulanData?->trf_out ?? 0) : $trfIn;

                $transferNet = $gudangId !== 'ALL' ? $trfIn - $trfOut : 0;
                $stokAkhir = max(0, $stokAwal + $masukBulan - $keluarBulan + $transferNet);

                if ($hanyaAdaTransaksi && $masukBulan === 0 && $masukRusak === 0 && $keluarBulan === 0 && $trfIn === 0 && $trfOut === 0) {
                    continue;
                }

                if ($b->is_wajib_sn) {
                    $serials = $b->serials;
                    $kBaru = $serials->filter(fn($s) => in_array(strtoupper($s->kondisi ?? ''), ['BARU', 'BAIK', '-']) || empty($s->kondisi))->count();
                    $kBekas = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'BEKAS') || str_contains(strtoupper($s->kondisi ?? ''), 'SECOND'))->count();
                    $kRusak = $serials->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'RUSAK'))->count();
                } else {
                    $kBaru = max(0, (int) ($kNonSn?->net_baru ?? 0));
                    $kBekas = max(0, (int) ($kNonSn?->net_bekas ?? 0));
                    $kRusak = max(0, (int) ($kNonSn?->net_rusak ?? 0));
                }

                $usableFisik = $kBaru + $kBekas;
                if ($stokAkhir !== $usableFisik) {
                    if ($stokAkhir > $usableFisik) {
                        $kBaru += $stokAkhir - $usableFisik;
                    } else {
                        $selisih = $usableFisik - $stokAkhir;
                        if ($kBaru >= $selisih) {
                            $kBaru -= $selisih;
                        } else {
                            $selisih -= $kBaru;
                            $kBaru = 0;
                            $kBekas = max(0, $kBekas - $selisih);
                        }
                    }
                }

                if ($kondisi && $kondisi !== 'ALL') {
                    $kondisiUpper = strtoupper($kondisi);

                    if ($kondisiUpper === 'BARU') {
                        $kBekas = 0;
                        $kRusak = 0;
                    } elseif (str_contains($kondisiUpper, 'BEKAS')) {
                        $kBaru = 0;
                        $kRusak = 0;
                    } elseif (str_contains($kondisiUpper, 'RUSAK')) {
                        $kBaru = 0;
                        $kBekas = 0;
                    }
                }

                $grandTotalFisik = $kBaru + $kBekas + $kRusak;
                $kondisiRincian = "{$kBaru} Baru   {$kBekas} Bekas   {$kRusak} Rusak";
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