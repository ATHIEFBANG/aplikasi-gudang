<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\Gudang;
use App\Models\Stok;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedGudang  = $request->input('gudang_id');
        $selectedKondisi = $request->input('kondisi', 'ALL');

        $driverName = DB::connection()->getDriverName();
        $isSqlite   = $driverName === 'sqlite';
        $monthField = $isSqlite 
            ? "CAST(strftime('%m', transaksis.tanggal) AS INTEGER)" 
            : "EXTRACT(MONTH FROM transaksis.tanggal)";

        // 1. STATISTIK KPI
        $totalBarang = Barang::count();
        $totalGudang = Gudang::where('is_active', true)->count();

        // Base Query Transaksi Sesuai Filter
        $trxDetailsQuery = TransaksiDetail::whereHas('transaksi', function ($q) use ($selectedGudang, $selectedKondisi) {
            $q->where('status', 'COMPLETED');

            if ($selectedGudang && $selectedGudang !== 'ALL') {
                $q->where(function ($qb) use ($selectedGudang) {
                    $qb->where('gudang_asal_id', $selectedGudang)
                       ->orWhere('gudang_tujuan_id', $selectedGudang);
                });
            }

            if ($selectedKondisi && $selectedKondisi !== 'ALL') {
                $kondisiUpper = strtoupper($selectedKondisi);
                if ($kondisiUpper === 'BARU') {
                    $q->where(function ($qb) {
                        $qb->where('kondisi', 'Baru')
                           ->orWhere('kondisi', 'BAIK');
                    });
                } elseif ($kondisiUpper === 'BEKAS') {
                    $q->where('kondisi', 'like', '%Bekas%');
                } elseif ($kondisiUpper === 'RUSAK') {
                    $q->where('kondisi', 'like', '%Rusak%');
                }
            }
        });

        // Total Barang Masuk (Murni jumlah Qty dari transaksi masuk)
        $totalBarangMasuk = (int) (clone $trxDetailsQuery)->whereHas('transaksi', function ($q) {
            $q->where('jenis_transaksi', 'MASUK');
        })->sum('qty');

        // Total Barang Keluar
        $totalBarangKeluar = (int) (clone $trxDetailsQuery)->whereHas('transaksi', function ($q) {
            $q->where('jenis_transaksi', 'KELUAR');
        })->sum('qty');

        // Total Transfer Gudang
        $totalTransfer = (int) (clone $trxDetailsQuery)->whereHas('transaksi', function ($q) {
            $q->where(function ($qb) {
                $qb->where('jenis_transaksi', 'TRANSFER')
                   ->orWhere('sub_jenis', 'TRANSFER_GUDANG');
            });
        })->sum('qty');

        // Total Nilai Pembelian (Rp)
        $totalNilaiPembelian = (float) (clone $trxDetailsQuery)->whereHas('transaksi', function ($q) {
            $q->where('sub_jenis', 'PEMBELIAN');
        })->selectRaw('SUM(qty * COALESCE(harga, 0)) as total_beli')->value('total_beli') ?? 0;

        // Distribusi Jenis Penerimaan untuk Grafik Donut
        $donutPenerimaan = [
            'Pembelian'       => (int) (clone $trxDetailsQuery)->whereHas('transaksi', fn($q) => $q->where('sub_jenis', 'PEMBELIAN'))->sum('qty'),
            'Peminjaman'      => (int) (clone $trxDetailsQuery)->whereHas('transaksi', fn($q) => $q->where('sub_jenis', 'PEMINJAMAN'))->sum('qty'),
            'Pengembalian'    => (int) (clone $trxDetailsQuery)->whereHas('transaksi', fn($q) => $q->where('sub_jenis', 'PENGEMBALIAN'))->sum('qty'),
            'Transfer Gudang' => (int) (clone $trxDetailsQuery)->whereHas('transaksi', fn($q) => $q->where(fn($qb) => $qb->where('sub_jenis', 'TRANSFER_GUDANG')->orWhere('jenis_transaksi', 'TRANSFER')))->sum('qty'),
        ];

        // 2. DATA PETA & TABEL SEBARAN GUDANG
        $warehouseMapData = Gudang::where('is_active', true)
            ->whereNotNull('lat_long')
            ->where('lat_long', '!=', '')
            ->get()
            ->map(function ($g) {
                $raw = trim($g->lat_long);
                $parts = preg_split('/[\s,;\/]+/', $raw);
                if (count($parts) < 2) return null;
                $v1 = (float) str_replace(',', '.', $parts[0]);
                $v2 = (float) str_replace(',', '.', $parts[1]);
                if ($v1 == 0 && $v2 == 0) return null;
                $lat = abs($v1) <= 90 ? $v1 : $v2;
                $lng = abs($v1) <= 90 ? $v2 : $v1;

                $masukQty = (int) TransaksiDetail::whereHas('transaksi', function ($q) use ($g) {
                    $q->where('status', 'COMPLETED')->where('gudang_tujuan_id', $g->id);
                })->sum('qty');

                $keluarQty = (int) TransaksiDetail::whereHas('transaksi', function ($q) use ($g) {
                    $q->where('status', 'COMPLETED')->where('gudang_asal_id', $g->id);
                })->sum('qty');

                $qtyAktual = max(0, $masukQty - $keluarQty);

                return [
                    'id'          => $g->id,
                    'kode_gudang' => $g->kode_gudang,
                    'nama_gudang' => $g->nama_gudang,
                    'lokasi'      => $g->lokasi ?? '-',
                    'latitude'    => $lat,
                    'longitude'   => $lng,
                    'total_item'  => $qtyAktual > 0 ? 1 : 0,
                    'total_qty'   => $qtyAktual,
                    'status'      => 'ACTIVE'
                ];
            })
            ->filter()
            ->values();

        // 3. GRAFIK BULANAN LOGISTIK & KONDISI FISIK
        $monthlyQuery = DB::table('transaksi_details')
            ->join('transaksis', 'transaksi_details.transaksi_id', '=', 'transaksis.id')
            ->where('transaksis.status', 'COMPLETED');

        if ($selectedGudang && $selectedGudang !== 'ALL') {
            $monthlyQuery->where(function ($qb) use ($selectedGudang) {
                $qb->where('transaksis.gudang_asal_id', $selectedGudang)
                   ->orWhere('transaksis.gudang_tujuan_id', $selectedGudang);
            });
        }

        if ($selectedKondisi && $selectedKondisi !== 'ALL') {
            $kondisiUpper = strtoupper($selectedKondisi);
            if ($kondisiUpper === 'BARU') {
                $monthlyQuery->where(function ($qb) {
                    $qb->where('transaksis.kondisi', 'Baru')
                       ->orWhere('transaksis.kondisi', 'BAIK');
                });
            } else {
                $monthlyQuery->where('transaksis.kondisi', 'like', "%{$selectedKondisi}%");
            }
        }

        $monthlyRaw = (clone $monthlyQuery)
            ->selectRaw("
                {$monthField} as bulan,
                SUM(CASE WHEN transaksis.jenis_transaksi = 'MASUK' THEN transaksi_details.qty ELSE 0 END) as masuk,
                SUM(CASE WHEN transaksis.jenis_transaksi = 'KELUAR' THEN transaksi_details.qty ELSE 0 END) as keluar,
                SUM(CASE WHEN (transaksis.jenis_transaksi = 'TRANSFER' OR transaksis.sub_jenis = 'TRANSFER_GUDANG') THEN transaksi_details.qty ELSE 0 END) as transfer
            ")
            ->groupBy(DB::raw($monthField))
            ->get()
            ->keyBy(fn($item) => (int) $item->bulan);

        $kondisiMonthlyRaw = (clone $monthlyQuery)
            ->selectRaw("
                {$monthField} as bulan,
                SUM(CASE WHEN (UPPER(COALESCE(transaksis.kondisi, 'BARU')) = 'BARU' OR UPPER(COALESCE(transaksis.kondisi, 'BARU')) = 'BAIK') THEN transaksi_details.qty ELSE 0 END) as baru,
                SUM(CASE WHEN (UPPER(COALESCE(transaksis.kondisi, 'BARU')) LIKE '%BEKAS%' OR UPPER(COALESCE(transaksis.kondisi, 'BARU')) LIKE '%SECOND%') THEN transaksi_details.qty ELSE 0 END) as bekas,
                SUM(CASE WHEN UPPER(COALESCE(transaksis.kondisi, 'BARU')) LIKE '%RUSAK%' THEN transaksi_details.qty ELSE 0 END) as rusak
            ")
            ->groupBy(DB::raw($monthField))
            ->get()
            ->keyBy(fn($item) => (int) $item->bulan);

        $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $monthFullNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        $chartData = [];
        $kondisiChartData = [];
        for ($m = 1; $m <= 12; $m++) {
            $rowLogistik = $monthlyRaw->get($m);
            $chartData[] = [
                'name'     => $monthNames[$m - 1],
                'fullName' => $monthFullNames[$m - 1],
                'MASUK'    => (int) ($rowLogistik->masuk ?? 0),
                'KELUAR'   => (int) ($rowLogistik->keluar ?? 0),
                'TRANSFER' => (int) ($rowLogistik->transfer ?? 0),
            ];

            $rowKondisi = $kondisiMonthlyRaw->get($m);
            $baru  = (int) ($rowKondisi->baru ?? 0);
            $bekas = (int) ($rowKondisi->bekas ?? 0);
            $rusak = (int) ($rowKondisi->rusak ?? 0);
            $totalKondisi = $baru + $bekas + $rusak;

            $kondisiChartData[] = [
                'name'      => $monthNames[$m - 1],
                'fullMonth' => $monthFullNames[$m - 1],
                'monthNum'  => $m,
                'total'     => $totalKondisi,
                'Baru'      => $baru,
                'Bekas'     => $bekas,
                'Rusak'     => $rusak,
                'pctBaru'   => $totalKondisi > 0 ? (float) number_format(($baru / $totalKondisi) * 100, 1, '.', '') : 0.0,
                'pctBekas'  => $totalKondisi > 0 ? (float) number_format(($bekas / $totalKondisi) * 100, 1, '.', '') : 0.0,
                'pctRusak'  => $totalKondisi > 0 ? (float) number_format(($rusak / $totalKondisi) * 100, 1, '.', '') : 0.0,
            ];
        }

        $recentTransactions = Transaksi::with(['gudangAsal', 'gudangTujuan', 'supplier', 'picUser', 'details.barang'])
            ->latest('tanggal')
            ->latest('id')
            ->take(6)
            ->get();

        $teamMembers = User::select(['id', 'name', 'email', 'role', 'created_at'])
            ->orderBy('name', 'asc')
            ->get();

        $allGudangs = Gudang::where('is_active', true)->get(['id', 'nama_gudang', 'kode_gudang']);

        return Inertia::render('Dashboard/Index', [
            'kpi' => [
                'totalBarang'         => $totalBarang,
                'totalBarangMasuk'    => $totalBarangMasuk,
                'totalBarangKeluar'   => $totalBarangKeluar,
                'totalTransfer'       => $totalTransfer,
                'totalGudang'         => $totalGudang,
                'totalNilaiPembelian' => $totalNilaiPembelian,
            ],
            'donutPenerimaan' => $donutPenerimaan,
            'filters' => [
                'gudang_id' => $selectedGudang ?? 'ALL',
                'kondisi'   => $selectedKondisi ?? 'ALL',
            ],
            'options' => [
                'gudangs'   => $allGudangs,
                'kondisis'  => ['ALL', 'Baru', 'Bekas', 'Rusak'],
            ],
            'mapData'            => $warehouseMapData,
            'chartData'          => $chartData,
            'kondisiChartData'   => $kondisiChartData,
            'recentTransactions' => $recentTransactions,
            'teamMembers'        => $teamMembers,
        ]);
    }
}