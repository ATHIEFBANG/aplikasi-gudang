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
        // 1. STATISTIK KPI
        $totalBarang    = Barang::count();
        $totalStokFisik = (int) Stok::sum('jumlah');
        $totalGudang    = Gudang::where('is_active', true)->count();
        
        $totalBarangKeluar = (int) TransaksiDetail::whereHas('transaksi', function ($q) {
            $q->where('jenis_transaksi', 'KELUAR')
              ->where('status', 'COMPLETED');
        })->sum('qty');

        $totalTransfer = (int) TransaksiDetail::whereHas('transaksi', function ($q) {
            $q->where(function ($qb) {
                $qb->where('jenis_transaksi', 'TRANSFER')
                   ->orWhere('sub_jenis', 'TRANSFER_GUDANG');
            })->where('status', 'COMPLETED');
        })->sum('qty');

        // 2. DATA PETA SEBARAN GUDANG
        $warehouseMapData = Gudang::where('is_active', true)
            ->whereNotNull('lat_long')
            ->where('lat_long', '!=', '')
            ->withCount('stoks')
            ->withSum('stoks', 'jumlah')
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
                return [
                    'id'          => $g->id,
                    'kode_gudang' => $g->kode_gudang,
                    'nama_gudang' => $g->nama_gudang,
                    'lokasi'      => $g->lokasi ?? '-',
                    'latitude'    => $lat,
                    'longitude'   => $lng,
                    'total_item'  => $g->stoks_count ?? 0,
                    'total_qty'   => (int) ($g->stoks_sum_jumlah ?? 0),
                    'status'      => 'ACTIVE'
                ];
            })
            ->filter()
            ->values();

        // 3. GRAFIK BULANAN LOGISTIK (MASUK, KELUAR, TRANSFER)
        $currentYear = date('Y');
        $driverName  = DB::connection()->getDriverName();
        $isSqlite    = $driverName === 'sqlite';
        $monthField  = $isSqlite ? "CAST(strftime('%m', transaksis.tanggal) AS INTEGER)" : "EXTRACT(MONTH FROM transaksis.tanggal)";

        $monthlyRaw = DB::table('transaksi_details')
            ->join('transaksis', 'transaksi_details.transaksi_id', '=', 'transaksis.id')
            ->selectRaw("
                {$monthField} as bulan,
                SUM(CASE WHEN (transaksis.jenis_transaksi = 'MASUK' AND (transaksis.sub_jenis != 'TRANSFER_GUDANG' OR transaksis.sub_jenis IS NULL)) THEN transaksi_details.qty ELSE 0 END) as masuk,
                SUM(CASE WHEN transaksis.jenis_transaksi = 'KELUAR' THEN transaksi_details.qty ELSE 0 END) as keluar,
                SUM(CASE WHEN (transaksis.jenis_transaksi = 'TRANSFER' OR transaksis.sub_jenis = 'TRANSFER_GUDANG') THEN transaksi_details.qty ELSE 0 END) as transfer
            ")
            ->whereYear('transaksis.tanggal', $currentYear)
            ->where('transaksis.status', 'COMPLETED')
            ->groupBy(DB::raw($monthField))
            ->get()
            ->keyBy(fn($item) => (int) $item->bulan);

        // 4. GRAFIK BULANAN KONDISI FISIK BARANG (BARU, BEKAS, RUSAK)
        $kondisiMonthlyRaw = DB::table('transaksi_details')
            ->join('transaksis', 'transaksi_details.transaksi_id', '=', 'transaksis.id')
            ->selectRaw("
                {$monthField} as bulan,
                SUM(CASE WHEN (UPPER(COALESCE(transaksis.kondisi, 'BARU')) = 'BARU' OR UPPER(COALESCE(transaksis.kondisi, 'BARU')) = 'BAIK') THEN transaksi_details.qty ELSE 0 END) as baru,
                SUM(CASE WHEN (UPPER(COALESCE(transaksis.kondisi, 'BARU')) LIKE '%BEKAS%' OR UPPER(COALESCE(transaksis.kondisi, 'BARU')) LIKE '%SECOND%') THEN transaksi_details.qty ELSE 0 END) as bekas,
                SUM(CASE WHEN UPPER(COALESCE(transaksis.kondisi, 'BARU')) LIKE '%RUSAK%' THEN transaksi_details.qty ELSE 0 END) as rusak
            ")
            ->whereYear('transaksis.tanggal', $currentYear)
            ->where('transaksis.status', 'COMPLETED')
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

        // 5. TRANSAKSI TERAKHIR & TIM OPERASIONAL
        $recentTransactions = Transaksi::with(['gudangAsal', 'gudangTujuan', 'supplier', 'picUser', 'details.barang'])
            ->latest('id')
            ->take(6)
            ->get();

        $teamMembers = User::select(['id', 'name', 'email', 'role', 'created_at'])
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Dashboard/Index', [
            'kpi' => [
                'totalBarang'       => $totalBarang,
                'totalStokFisik'    => $totalStokFisik,
                'totalBarangKeluar' => $totalBarangKeluar,
                'totalTransfer'     => $totalTransfer,
                'totalGudang'       => $totalGudang,
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