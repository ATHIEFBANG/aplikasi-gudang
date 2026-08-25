<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\Gudang;
use App\Models\Stok;
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
        // 1. STATISTIK KPI
        $totalBarang   = Barang::count();
        $totalStokFisik = (int) Stok::sum('jumlah');
        $totalGudang   = Gudang::where('is_active', true)->count();
        
        // Barang dengan stok di bawah atau sama dengan min_stock
        $lowStockCount = Barang::whereHas('stoks')
            ->withSum('stoks', 'jumlah')
            ->get()
            ->filter(fn($b) => ($b->stoks_sum_jumlah ?? 0) <= $b->min_stock)
            ->count();

        // 2. DATA PETA SEBARAN GUDANG (Support format lat_long "lat,lng" / "lat;lng")
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

        // 3. GRAFIK TRANSAKSI BULANAN (Tahun Berjalan)
        $currentYear = date('Y');
        $monthlyRaw = Transaksi::selectRaw("
                EXTRACT(MONTH FROM tanggal) as bulan,
                SUM(CASE WHEN jenis_transaksi = 'MASUK' THEN 1 ELSE 0 END) as masuk,
                SUM(CASE WHEN jenis_transaksi = 'KELUAR' THEN 1 ELSE 0 END) as keluar,
                SUM(CASE WHEN jenis_transaksi = 'TRANSFER' THEN 1 ELSE 0 END) as transfer
            ")
            ->whereYear('tanggal', $currentYear)
            ->where('status', 'COMPLETED')
            ->groupBy(DB::raw("EXTRACT(MONTH FROM tanggal)"))
            ->get()
            ->keyBy(fn($item) => (int) $item->bulan);

        $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $chartData = [];
        for ($m = 1; $m <= 12; $m++) {
            $row = $monthlyRaw->get($m);
            $chartData[] = [
                'name'     => $monthNames[$m - 1],
                'MASUK'    => (int) ($row->masuk ?? 0),
                'KELUAR'   => (int) ($row->keluar ?? 0),
                'TRANSFER' => (int) ($row->transfer ?? 0),
            ];
        }

        // 4. DAFTAR TRANSAKSI TERAKHIR
        $recentTransactions = Transaksi::with(['gudangAsal', 'gudangTujuan', 'supplier', 'picUser', 'details.barang'])
            ->latest('id')
            ->take(6)
            ->get();

        // 5. TIM OPERASIONAL GUDANG
        $teamMembers = User::select(['id', 'name', 'email', 'role', 'created_at'])
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Dashboard/Index', [
            'kpi' => [
                'totalBarang'    => $totalBarang,
                'totalStokFisik' => $totalStokFisik,
                'totalGudang'    => $totalGudang,
                'lowStockCount'  => $lowStockCount,
            ],
            'mapData'            => $warehouseMapData,
            'chartData'          => $chartData,
            'recentTransactions' => $recentTransactions,
            'teamMembers'        => $teamMembers,
        ]);
    }
}