<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangSerial;
use App\Models\Gudang;
use App\Models\Transaksi;
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

        // 1. STATISTIK KPI & TOTAL UNIT
        $totalBarang = Barang::count();
        $totalGudang = Gudang::where('is_active', true)->count();

        // Base Query Transaksi Sesuai Filter
        $baseDetailQuery = DB::table('transaksi_details')
            ->join('transaksis', 'transaksi_details.transaksi_id', '=', 'transaksis.id')
            ->where(function ($q) {
                $q->whereIn('transaksis.status', ['COMPLETED', 'completed'])
                  ->orWhereNull('transaksis.status');
            });

        if ($selectedGudang && $selectedGudang !== 'ALL') {
            $baseDetailQuery->where(function ($qb) use ($selectedGudang) {
                $qb->where('transaksis.gudang_asal_id', $selectedGudang)
                   ->orWhere('transaksis.gudang_tujuan_id', $selectedGudang);
            });
        }

        if ($selectedKondisi && $selectedKondisi !== 'ALL') {
            if (strtoupper($selectedKondisi) === 'BARU') {
                $baseDetailQuery->where(fn($q) => $q->where('transaksis.kondisi', 'Baru')->orWhere('transaksis.kondisi', 'BAIK'));
            } else {
                $baseDetailQuery->where('transaksis.kondisi', 'like', "%{$selectedKondisi}%");
            }
        }

        $kpiTotals = (clone $baseDetailQuery)
            ->selectRaw("
                SUM(CASE WHEN transaksis.jenis_transaksi = 'MASUK' THEN transaksi_details.qty ELSE 0 END) as total_masuk,
                SUM(CASE WHEN transaksis.jenis_transaksi = 'KELUAR' THEN transaksi_details.qty ELSE 0 END) as total_keluar,
                SUM(CASE WHEN (transaksis.jenis_transaksi = 'TRANSFER' OR transaksis.sub_jenis = 'TRANSFER_GUDANG') THEN transaksi_details.qty ELSE 0 END) as total_transfer,
                SUM(CASE WHEN transaksis.sub_jenis = 'PEMBELIAN' THEN transaksi_details.qty * COALESCE(transaksi_details.harga, 0) ELSE 0 END) as total_beli
            ")
            ->first();

        $totalBarangMasuk    = (int) ($kpiTotals->total_masuk ?? 0);
        $totalBarangKeluar   = (int) ($kpiTotals->total_keluar ?? 0);
        $totalTransfer       = (int) ($kpiTotals->total_transfer ?? 0);
        $totalNilaiPembelian = (float) ($kpiTotals->total_beli ?? 0);

        // Distribusi Kategori Donut Chart
        $donutRaw = (clone $baseDetailQuery)
            ->selectRaw("
                transaksis.sub_jenis,
                SUM(transaksi_details.qty) as total_qty
            ")
            ->groupBy('transaksis.sub_jenis')
            ->pluck('total_qty', 'sub_jenis');

        $proyekQty = (int) (
            $donutRaw['BARANG_KE_SITE'] ?? 
            $donutRaw['PROYEK'] ?? 
            $donutRaw['Proyek'] ?? 
            0
        );

        $nonProyekQty = (int) (
            $donutRaw['PEMAKAIAN_INTERNAL'] ?? 
            $donutRaw['NON_PROYEK'] ?? 
            $donutRaw['Non Proyek'] ?? 
            0
        );

        $donutPenerimaan = [
            'Pembelian'          => (int) ($donutRaw['PEMBELIAN'] ?? $donutRaw['Pembelian'] ?? 0),
            'Peminjaman'         => (int) ($donutRaw['PEMINJAMAN'] ?? $donutRaw['Peminjaman'] ?? 0),
            'Pengembalian'       => (int) ($donutRaw['PENGEMBALIAN'] ?? $donutRaw['Pengembalian'] ?? 0),
            'Proyek'             => $proyekQty,
            'Non Proyek'         => $nonProyekQty,
            'Barang ke Site'     => $proyekQty,
            'Pemakaian Internal' => $nonProyekQty,
        ];

        // 2. DATA PETA & TABEL TITIK GUDANG OPERASIONAL
        $gudangsAktif = Gudang::where('is_active', true)
            ->whereNotNull('lat_long')
            ->where('lat_long', '!=', '')
            ->get();

        // A. Ambil seluruh stok fisik barang Wajib SN aktif per gudang
        $serialStatsByGudang = BarangSerial::where('status', 'IN_WAREHOUSE')
            ->selectRaw("
                gudang_id,
                COUNT(*) as total_sn,
                SUM(CASE WHEN UPPER(COALESCE(kondisi, '')) IN ('BARU', 'BAIK') THEN 1 ELSE 0 END) as sn_baru,
                SUM(CASE WHEN UPPER(COALESCE(kondisi, '')) LIKE '%BEKAS%' OR UPPER(COALESCE(kondisi, '')) LIKE '%SECOND%' THEN 1 ELSE 0 END) as sn_bekas,
                SUM(CASE WHEN UPPER(COALESCE(kondisi, '')) LIKE '%RUSAK%' THEN 1 ELSE 0 END) as sn_rusak
            ")
            ->groupBy('gudang_id')
            ->get()
            ->keyBy('gudang_id');

        // B. Ambil mutasi masuk khusus barang Non-SN (is_wajib_sn = false / 0)
        $masukNonSnByGudang = DB::table('transaksi_details')
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
                SUM(CASE WHEN UPPER(COALESCE(transaksis.kondisi, 'BARU')) LIKE '%RUSAK%' THEN transaksi_details.qty ELSE 0 END) as rusak,
                SUM(transaksi_details.qty) as total_masuk
            ")
            ->groupBy('transaksis.gudang_tujuan_id')
            ->get()
            ->keyBy('gudang_tujuan_id');

        // C. Ambil mutasi keluar khusus barang Non-SN (is_wajib_sn = false / 0)
        $keluarNonSnByGudang = DB::table('transaksi_details')
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
            ->pluck('total_keluar', 'gudang_asal_id');

        // D. Mapping & Hitung Akumulasi Gabungan (SN + Non-SN)
        $warehouseMapData = $gudangsAktif->map(function ($g) use ($serialStatsByGudang, $masukNonSnByGudang, $keluarNonSnByGudang) {
            $raw = trim($g->lat_long ?? '');
            $parts = preg_split('/[\s,;\/]+/', $raw);
            if (count($parts) < 2) return null;
            $v1 = (float) str_replace(',', '.', $parts[0]);
            $v2 = (float) str_replace(',', '.', $parts[1]);
            if ($v1 == 0 && $v2 == 0) return null;
            $lat = abs($v1) <= 90 ? $v1 : $v2;
            $lng = abs($v1) <= 90 ? $v2 : $v1;

            // 1. Stok dari Barang Wajib SN
            $sn = $serialStatsByGudang->get($g->id);
            $snTotal = (int) ($sn->total_sn ?? 0);
            $snBaru  = (int) ($sn->sn_baru ?? 0);
            $snBekas = (int) ($sn->sn_bekas ?? 0);
            $snRusak = (int) ($sn->sn_rusak ?? 0);

            // 2. Stok dari Barang Non-SN
            $nonSn = $masukNonSnByGudang->get($g->id);
            $nonSnMasukTotal = (int) ($nonSn->total_masuk ?? 0);
            $nonSnKeluar     = (int) ($keluarNonSnByGudang[$g->id] ?? 0);
            $nonSnSisa       = max(0, $nonSnMasukTotal - $nonSnKeluar);

            $nonSnBaru  = max(0, ((int) ($nonSn->baru ?? 0)) - $nonSnKeluar);
            $nonSnBekas = (int) ($nonSn->bekas ?? 0);
            $nonSnRusak = (int) ($nonSn->rusak ?? 0);

            // GABUNGKAN STOK SN + NON-SN SECARA BERSAMAAN
            $qtyAktual = $snTotal + $nonSnSisa;
            $qtyBaru   = $snBaru + $nonSnBaru;
            $qtyBekas  = $snBekas + $nonSnBekas;
            $qtyRusak  = $snRusak + $nonSnRusak;

            return [
                'id'          => $g->id,
                'kode_gudang' => $g->kode_gudang,
                'nama_gudang' => $g->nama_gudang,
                'lokasi'      => $g->lokasi ?? '-',
                'latitude'    => $lat,
                'longitude'   => $lng,
                'total_item'  => $qtyAktual > 0 ? 1 : 0,
                'total_qty'   => $qtyAktual,
                'qty_baru'    => $qtyBaru,
                'qty_bekas'   => $qtyBekas,
                'qty_rusak'   => $qtyRusak,
                'status'      => 'ACTIVE'
            ];
        })->filter()->values();

        // 3. GRAFIK BULANAN LOGISTIK & KONDISI
        $monthlyCombined = (clone $baseDetailQuery)
            ->selectRaw("
                {$monthField} as bulan,
                SUM(CASE WHEN transaksis.jenis_transaksi = 'MASUK' THEN transaksi_details.qty ELSE 0 END) as masuk,
                SUM(CASE WHEN transaksis.jenis_transaksi = 'KELUAR' THEN transaksi_details.qty ELSE 0 END) as keluar,
                SUM(CASE WHEN (transaksis.jenis_transaksi = 'TRANSFER' OR transaksis.sub_jenis = 'TRANSFER_GUDANG') THEN transaksi_details.qty ELSE 0 END) as transfer,
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
            $row = $monthlyCombined->get($m);
            $masuk    = (int) ($row->masuk ?? 0);
            $keluar   = (int) ($row->keluar ?? 0);
            $transfer = (int) ($row->transfer ?? 0);

            $chartData[] = [
                'name'     => $monthNames[$m - 1],
                'fullName' => $monthFullNames[$m - 1],
                'MASUK'    => $masuk,
                'KELUAR'   => $keluar,
                'TRANSFER' => $transfer,
            ];

            $baru         = (int) ($row->baru ?? 0);
            $bekas        = (int) ($row->bekas ?? 0);
            $rusak        = (int) ($row->rusak ?? 0);
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

        // 4. RIWAYAT TRANSAKSI TERAKHIR
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

    public function storeGudang(Request $request)
    {
        $validated = $request->validate([
            'kode_gudang' => 'required|string|max:50|unique:gudangs,kode_gudang',
            'nama_gudang' => 'required|string|max:255',
            'lokasi'      => 'nullable|string|max:255',
            'latitude'    => 'required|numeric|between:-90,90',
            'longitude'   => 'required|numeric|between:-180,180',
        ]);

        Gudang::create([
            'kode_gudang' => strtoupper(trim($validated['kode_gudang'])),
            'nama_gudang' => trim($validated['nama_gudang']),
            'lokasi'      => trim($validated['lokasi'] ?? ''),
            'lat_long'    => "{$validated['latitude']}, {$validated['longitude']}",
            'is_active'   => true,
        ]);

        return redirect()->back()->with('success', 'Lokasi gudang baru berhasil ditambahkan.');
    }

    public function updateGudang(Request $request, int $id)
    {
        $gudang = Gudang::findOrFail($id);

        $validated = $request->validate([
            'kode_gudang' => 'required|string|max:50|unique:gudangs,kode_gudang,' . $gudang->id,
            'nama_gudang' => 'required|string|max:255',
            'lokasi'      => 'nullable|string|max:255',
            'latitude'    => 'required|numeric|between:-90,90',
            'longitude'   => 'required|numeric|between:-180,180',
        ]);

        $gudang->update([
            'kode_gudang' => strtoupper(trim($validated['kode_gudang'])),
            'nama_gudang' => trim($validated['nama_gudang']),
            'lokasi'      => trim($validated['lokasi'] ?? ''),
            'lat_long'    => "{$validated['latitude']}, {$validated['longitude']}",
        ]);

        return redirect()->back()->with('success', 'Data lokasi gudang berhasil diperbarui.');
    }

    public function destroyGudang(int $id)
    {
        $gudang = Gudang::findOrFail($id);
        $gudang->delete();

        return redirect()->back()->with('success', 'Lokasi gudang berhasil dihapus.');
    }
}