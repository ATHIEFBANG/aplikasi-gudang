<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangSerial;
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
        $trxQuery = Transaksi::where('status', 'COMPLETED');
        if ($selectedGudang && $selectedGudang !== 'ALL') {
            $trxQuery->where(function ($qb) use ($selectedGudang) {
                $qb->where('gudang_asal_id', $selectedGudang)
                   ->orWhere('gudang_tujuan_id', $selectedGudang);
            });
        }
        if ($selectedKondisi && $selectedKondisi !== 'ALL') {
            if (strtoupper($selectedKondisi) === 'BARU') {
                $trxQuery->where(fn($q) => $q->where('kondisi', 'Baru')->orWhere('kondisi', 'BAIK'));
            } else {
                $trxQuery->where('kondisi', 'like', "%{$selectedKondisi}%");
            }
        }

        // Total Barang Masuk: Akumulasi seluruh unit dari transaksi Masuk (Inbound)
        $totalBarangMasuk = (int) TransaksiDetail::whereIn(
            'transaksi_id', 
            (clone $trxQuery)->where('jenis_transaksi', 'MASUK')->pluck('id')
        )->sum('qty');

        // Total Barang Keluar
        $totalBarangKeluar = (int) TransaksiDetail::whereIn(
            'transaksi_id', 
            (clone $trxQuery)->where('jenis_transaksi', 'KELUAR')->pluck('id')
        )->sum('qty');

        // Total Transfer Gudang
        $totalTransfer = (int) TransaksiDetail::whereIn(
            'transaksi_id', 
            (clone $trxQuery)->where(fn($q) => $q->where('jenis_transaksi', 'TRANSFER')->orWhere('sub_jenis', 'TRANSFER_GUDANG'))->pluck('id')
        )->sum('qty');

        // Total Nilai Pembelian (Rp)
        $totalNilaiPembelian = (float) TransaksiDetail::whereIn(
            'transaksi_id', 
            (clone $trxQuery)->where('sub_jenis', 'PEMBELIAN')->pluck('id')
        )->selectRaw('SUM(qty * COALESCE(harga, 0)) as total_beli')->value('total_beli') ?? 0;

        // Distribusi Kategori Mutasi untuk Donut Chart (Transfer diganti Barang ke Site & Pemakaian Internal)
        $donutPenerimaan = [
            'Pembelian'          => (int) TransaksiDetail::whereIn('transaksi_id', (clone $trxQuery)->where('sub_jenis', 'PEMBELIAN')->pluck('id'))->sum('qty'),
            'Peminjaman'         => (int) TransaksiDetail::whereIn('transaksi_id', (clone $trxQuery)->where('sub_jenis', 'PEMINJAMAN')->pluck('id'))->sum('qty'),
            'Pengembalian'       => (int) TransaksiDetail::whereIn('transaksi_id', (clone $trxQuery)->where('sub_jenis', 'PENGEMBALIAN')->pluck('id'))->sum('qty'),
            'Barang ke Site'     => (int) TransaksiDetail::whereIn('transaksi_id', (clone $trxQuery)->where('sub_jenis', 'BARANG_KE_SITE')->pluck('id'))->sum('qty'),
            'Pemakaian Internal' => (int) TransaksiDetail::whereIn('transaksi_id', (clone $trxQuery)->where('sub_jenis', 'PEMAKAIAN_INTERNAL')->pluck('id'))->sum('qty'),
        ];

        // 2. DATA PETA & RINCIAN STOK PER GUDANG (BARU, BEKAS, RUSAK, TOTAL STOK FISIK)
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

                // 1. Ambil Serial Number fisik aktif di gudang
                $serialsInWh = BarangSerial::where('gudang_id', $g->id)
                    ->where('status', 'IN_WAREHOUSE')
                    ->get();

                $snBaru  = $serialsInWh->filter(fn($s) => in_array(strtoupper($s->kondisi ?? ''), ['BARU', 'BAIK']))->count();
                $snBekas = $serialsInWh->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'BEKAS'))->count();
                $snRusak = $serialsInWh->filter(fn($s) => str_contains(strtoupper($s->kondisi ?? ''), 'RUSAK'))->count();
                $snTotal = $serialsInWh->count();

                // 2. Hitung dari riwayat transaksi
                $masukBaru = (int) TransaksiDetail::whereHas('transaksi', function ($q) use ($g) {
                    $q->where('status', 'COMPLETED')->where('gudang_tujuan_id', $g->id);
                })->where(function($q) {
                    $q->where('kondisi', 'Baru')->orWhere('kondisi', 'BAIK');
                })->sum('qty');

                $masukBekas = (int) TransaksiDetail::whereHas('transaksi', function ($q) use ($g) {
                    $q->where('status', 'COMPLETED')->where('gudang_tujuan_id', $g->id);
                })->where('kondisi', 'like', '%Bekas%')->sum('qty');

                $masukRusak = (int) TransaksiDetail::whereHas('transaksi', function ($q) use ($g) {
                    $q->where('status', 'COMPLETED')->where('gudang_tujuan_id', $g->id);
                })->where('kondisi', 'like', '%Rusak%')->sum('qty');

                $keluarQty = (int) TransaksiDetail::whereHas('transaksi', function ($q) use ($g) {
                    $q->where('status', 'COMPLETED')->where('gudang_asal_id', $g->id);
                })->sum('qty');

                if ($snTotal > 0) {
                    $qtyBaru   = $snBaru;
                    $qtyBekas  = $snBekas;
                    $qtyRusak  = $snRusak;
                    $qtyAktual = $qtyBaru + $qtyBekas + $qtyRusak;
                } else {
                    $qtyBaru   = $masukBaru;
                    $qtyBekas  = $masukBekas;
                    $qtyRusak  = $masukRusak;
                    $qtyAktual = max(0, ($qtyBaru + $qtyBekas + $qtyRusak) - $keluarQty);
                }

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
            })
            ->filter()
            ->values();

        // 3. GRAFIK BULANAN LOGISTIK
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