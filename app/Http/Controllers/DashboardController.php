<?php

namespace App\Http\Controllers;

use App\Models\RpmMaster;
use App\Models\SmartkeyMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Helper untuk mengekstrak nilai string tunggal dari input filter RPM
     */
    private function parseFilterValue($input, string $default = 'ALL'): string
    {
        if (is_null($input)) {
            return $default;
        }

        if (is_array($input)) {
            $val = $input['value'] ?? $input['id'] ?? reset($input);
            return !empty($val) ? (string) $val : $default;
        }

        return (string) $input;
    }

    /**
     * Helper untuk menyaring & meratakan input filter bertipe Array (Smartkey)
     */
    private function parseArrayFilter($input): array
    {
        if (empty($input)) {
            return [];
        }

        $array = is_array($input) ? $input : [$input];

        $flat = [];
        foreach ($array as $item) {
            if (is_array($item)) {
                $val = $item['value'] ?? $item['id'] ?? reset($item);
            } else {
                $val = $item;
            }

            if (!is_null($val) && $val !== '' && strtoupper((string)$val) !== 'ALL') {
                $flat[] = (string) $val;
            }
        }

        return array_values(array_unique($flat));
    }

    public function index(Request $request)
    {
        // Hanya memproses bulan bernilai angka (1-12) agar CAST ke INTEGER tidak error
        $validMonths = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '01', '02', '03', '04', '05', '06', '07', '08', '09'];

        // ==========================================
        // 1. DASHBOARD RPM LOGIC
        // ==========================================
        $rpmTahun = $this->parseFilterValue($request->input('tahun'), 'ALL');
        $rpmRtp   = $this->parseFilterValue($request->input('rtp'), 'ALL');

        $rpmQuery = RpmMaster::query();

        if (!empty($rpmTahun) && strtoupper($rpmTahun) !== 'ALL') {
            $rpmQuery->where('tahun', '=', $rpmTahun);
        }
        
        if (!empty($rpmRtp) && strtoupper($rpmRtp) !== 'ALL') {
            $rpmQuery->where('rtp', '=', $rpmRtp);
        }

        // --- 1A. KPI Metrics Summary ---
        $rpmKpi = (clone $rpmQuery)
            ->selectRaw("
                COUNT(*) as total_site,
                SUM(CASE WHEN UPPER(TRIM(approve)) = 'OK' THEN 1 ELSE 0 END) as total_approved,
                SUM(CASE WHEN UPPER(TRIM(approve)) IN ('BELUM', 'REVIEWED') OR approve IS NULL THEN 1 ELSE 0 END) as total_pending,
                SUM(CASE WHEN UPPER(TRIM(approve)) IN ('REJECT', 'TIDAKOM', 'TIDAK OM') THEN 1 ELSE 0 END) as total_reject,
                SUM(CASE WHEN UPPER(TRIM(approve)) = 'RETURN' THEN 1 ELSE 0 END) as total_return
            ", [])
            ->first();

        // --- 1B. Chart Data Bulanan & Pivot Monthly Raw ---
        $pivotMonthlyRaw = (clone $rpmQuery)
            ->selectRaw("
                CAST(bulan AS INTEGER) as month_num,
                SUM(CASE WHEN UPPER(TRIM(approve)) = 'OK' THEN 1 ELSE 0 END) as ok,
                SUM(CASE WHEN UPPER(TRIM(approve)) IN ('BELUM', 'REVIEWED') OR approve IS NULL THEN 1 ELSE 0 END) as belum,
                SUM(CASE WHEN UPPER(TRIM(approve)) IN ('REJECT', 'TIDAKOM', 'TIDAK OM') THEN 1 ELSE 0 END) as reject,
                SUM(CASE WHEN UPPER(TRIM(approve)) = 'RETURN' THEN 1 ELSE 0 END) as returnVal
            ", [])
            ->whereIn('bulan', $validMonths)
            ->groupBy(DB::raw("CAST(bulan AS INTEGER)"))
            ->get()
            ->keyBy('month_num');

        $monthsName     = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $fullMonthsName = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        $rpmChartData = [];
        $counts = ['OK' => [], 'BELUM' => [], 'REJECT' => [], 'RETURN' => []];
        $monthTotals = [];
        $monthPct = [];

        for ($m = 1; $m <= 12; $m++) {
            $row = $pivotMonthlyRaw[$m] ?? null;
            $okVal     = (int) ($row->ok ?? 0);
            $belumVal  = (int) ($row->belum ?? 0);
            $rejectVal = (int) ($row->reject ?? 0);
            $retVal    = (int) ($row->returnVal ?? 0);

            $counts['OK'][]     = $okVal;
            $counts['BELUM'][]  = $belumVal;
            $counts['REJECT'][] = $rejectVal;
            $counts['RETURN'][] = $retVal;

            $mTotal = $okVal + $belumVal + $rejectVal + $retVal;
            $monthTotals[] = $mTotal;
            $monthPct[]    = $mTotal > 0 ? round(($okVal / $mTotal) * 100) : 0;

            $rpmChartData[] = [
                'name'      => $monthsName[$m - 1],
                'monthNum'  => $m,
                'fullMonth' => $fullMonthsName[$m - 1],
                'total'     => $mTotal,
            ];
        }

        $rowTotals = [
            'OK'     => array_sum($counts['OK']),
            'BELUM'  => array_sum($counts['BELUM']),
            'REJECT' => array_sum($counts['REJECT']),
            'RETURN' => array_sum($counts['RETURN']),
        ];
        $overallTotal = array_sum($monthTotals);
        $overallPct   = $overallTotal > 0 ? round(($rowTotals['OK'] / $overallTotal) * 100) : 0;

        $rpmMonthlyPivot = [
            'counts'       => $counts,
            'monthTotals'  => $monthTotals,
            'monthPct'     => $monthPct,
            'rowTotals'    => $rowTotals,
            'overallTotal' => $overallTotal,
            'overallPct'   => $overallPct,
        ];

        // --- 1C. RTP Pivot Table Data ---
        $rpmRtpPivot = (clone $rpmQuery)
            ->selectRaw("
                rtp,
                SUM(CASE WHEN UPPER(TRIM(approve)) = 'OK' THEN 1 ELSE 0 END) as ok,
                SUM(CASE WHEN UPPER(TRIM(approve)) IN ('BELUM', 'REVIEWED') OR approve IS NULL THEN 1 ELSE 0 END) as belum,
                SUM(CASE WHEN UPPER(TRIM(approve)) IN ('REJECT', 'TIDAKOM', 'TIDAK OM') THEN 1 ELSE 0 END) as reject,
                SUM(CASE WHEN UPPER(TRIM(approve)) = 'RETURN' THEN 1 ELSE 0 END) as returnVal,
                COUNT(*) as total
            ", [])
            ->groupBy('rtp')
            ->get()
            ->map(function ($item) {
                $tot = (int) $item->total;
                $ok  = (int) $item->ok;
                return [
                    'rtp'       => $item->rtp ?? 'Unassigned',
                    'ok'        => $ok,
                    'belum'     => (int) $item->belum,
                    'reject'    => (int) $item->reject,
                    'returnVal' => (int) $item->returnVal,
                    'total'     => $tot,
                    'pct'       => $tot > 0 ? round(($ok / $tot) * 100) : 0,
                ];
            });

        // ==========================================
        // 2. DASHBOARD SMARTKEY LOGIC
        // ==========================================
        $skInfrako = $this->parseArrayFilter($request->input('infrako'));
        $skStatus  = $this->parseArrayFilter($request->input('status'));
        $skSn      = $this->parseArrayFilter($request->input('sn'));

        $skQuery = SmartkeyMaster::query()
            ->when(!empty($skInfrako), fn ($q) => $q->whereIn('infrako', $skInfrako))
            ->when(!empty($skStatus),  fn ($q) => $q->whereIn('status', $skStatus))
            ->when(!empty($skSn),      fn ($q) => $q->whereIn('serial_number', $skSn));

        // --- 2A. Smartkey Summary Cards ---
        $skSummary = (clone $skQuery)->selectRaw("
            COUNT(*) as total_unit,
            SUM(CASE WHEN LOWER(status) = 'aktif' THEN 1 ELSE 0 END) as count_aktif,
            SUM(CASE WHEN LOWER(status) IN ('rusak', 'hilang', 'problem') THEN 1 ELSE 0 END) as count_problem,
            SUM(CASE WHEN LOWER(status_aktifitas) = 'locked' THEN 1 ELSE 0 END) as count_locked,
            SUM(CASE WHEN LOWER(status_aktifitas) = 'unlocked' THEN 1 ELSE 0 END) as count_unlocked,
            SUM(CASE WHEN status_aktifitas IS NULL OR status_aktifitas = '' OR status_aktifitas = '#N/A' THEN 1 ELSE 0 END) as count_na
        ", [])->first();

        // --- 2B. Smartkey Chart ---
        $skChart = (clone $skQuery)
            ->selectRaw("
                infrako,
                SUM(CASE WHEN LOWER(status_aktifitas) = 'locked' THEN 1 ELSE 0 END) as locked,
                SUM(CASE WHEN LOWER(status_aktifitas) = 'unlocked' THEN 1 ELSE 0 END) as unlocked,
                SUM(CASE WHEN status_aktifitas IS NULL OR status_aktifitas = '' OR status_aktifitas = '#N/A' THEN 1 ELSE 0 END) as na,
                COUNT(*) as total
            ", [])
            ->groupBy('infrako')
            ->get();

        // --- 2C. Smartkey Map Data (DIPERBAIKI: Smart Parser Longitude & Latitude) ---
        // --- 2C. Smartkey Map Data ---
        $skMapData = (clone $skQuery)
            ->select('long_lat', 'site_name', 'tower_id', 'serial_number', 'new_sn', 'infrako', 'status_aktifitas', 'kota_kab', 'posisi_unit', 'ksm')
            ->whereNotNull('long_lat')
            ->where('long_lat', '!=', '')
            ->where('long_lat', 'NOT LIKE', '%#N/A%')
            ->get()
            ->map(function ($item) {
                $raw = trim($item->long_lat);
                
                $parts = preg_split('/[\s,;\/]+/', $raw);
                if (count($parts) < 2) return null;

                $v1 = (float) str_replace(',', '.', $parts[0]);
                $v2 = (float) str_replace(',', '.', $parts[1]);

                if ($v1 == 0 && $v2 == 0) return null;

                // Deteksi Wilayah Indonesia
                if (abs($v1) > 50) {
                    $lng = $v1;
                    $lat = $v2;
                } elseif (abs($v2) > 50) {
                    $lat = $v1;
                    $lng = $v2;
                } else {
                    $lng = $v1;
                    $lat = $v2;
                }

                if ($lat < -90 || $lat > 90) return null;

                // Standardisasi Status Aktifitas
                $rawStatus = strtoupper(trim($item->status_aktifitas ?? ''));
                if ($rawStatus === 'LOCKED') {
                    $cleanStatus = 'LOCKED';
                } elseif ($rawStatus === 'UNLOCKED') {
                    $cleanStatus = 'UNLOCKED';
                } else {
                    $cleanStatus = '#N/A';
                }

                return [
                    'latitude'         => $lat,
                    'longitude'        => $lng,
                    'lat'              => $lat,
                    'lng'              => $lng,
                    'position'         => [$lat, $lng],          // Format Leaflet
                    'coordinates'      => [$lng, $lat],          // Format MapLibre/Mapbox
                    'site_name'        => $item->site_name ?? '-',
                    'tower_id'         => $item->tower_id ?? '-',
                    'serial_number'    => $item->serial_number ?? $item->new_sn ?? '-',
                    'infrako'          => $item->infrako ?? '-',
                    'kota_kab'         => $item->kota_kab ?? '-',
                    'posisi_unit'      => $item->posisi_unit ?? '-',
                    'ksm'              => $item->ksm ?? '-',
                    'status_aktifitas' => $cleanStatus,
                    'status'           => $cleanStatus,
                ];
            })
            ->filter()
            ->values();

        // --- 2D. Smartkey Table Pivot Data (COALESCE NULL KSM) ---
        $skTableData = (clone $skQuery)
            ->selectRaw("
                COALESCE(NULLIF(TRIM(ksm), ''), 'Unassigned') as ksm_name,
                SUM(CASE WHEN LOWER(status_aktifitas) = 'locked' THEN 1 ELSE 0 END) as locked,
                SUM(CASE WHEN LOWER(status_aktifitas) = 'unlocked' THEN 1 ELSE 0 END) as unlocked,
                SUM(CASE WHEN status_aktifitas IS NULL OR status_aktifitas = '' OR status_aktifitas = '#N/A' THEN 1 ELSE 0 END) as na,
                COUNT(*) as total
            ", [])
            ->groupBy(DB::raw("COALESCE(NULLIF(TRIM(ksm), ''), 'Unassigned')"))
            ->get()
            ->map(function ($item) {
                return [
                    'ksm'      => $item->ksm_name,
                    'ksm_name' => $item->ksm_name,
                    'locked'   => (int) $item->locked,
                    'unlocked' => (int) $item->unlocked,
                    'na'       => (int) $item->na,
                    'total'    => (int) $item->total,
                ];
            });

        // ==========================================
        // 3. DROPDOWN FILTER OPTIONS
        // ==========================================
        try {
            $rpmFilterOptions = Cache::remember('rpm_filter_options_v4', 3600, function () {
                return [
                    'tahun' => array_values(RpmMaster::select('tahun')->whereNotNull('tahun')->where('tahun', '!=', '')->distinct()->pluck('tahun')->filter()->toArray()),
                    'rtp'   => array_values(RpmMaster::select('rtp')->whereNotNull('rtp')->where('rtp', '!=', '')->distinct()->pluck('rtp')->filter()->toArray()),
                ];
            });

            $skFilterOptions = Cache::remember('sk_filter_options_v4', 3600, function () {
                return [
                    'infrako' => array_values(SmartkeyMaster::select('infrako')->whereNotNull('infrako')->where('infrako', '!=', '')->distinct()->pluck('infrako')->filter()->toArray()),
                    'status'  => array_values(SmartkeyMaster::select('status')->whereNotNull('status')->where('status', '!=', '')->distinct()->pluck('status')->filter()->toArray()),
                    'sn'      => array_values(SmartkeyMaster::select('serial_number')->whereNotNull('serial_number')->where('serial_number', '!=', '')->distinct()->pluck('serial_number')->filter()->toArray()),
                ];
            });
        } catch (\Throwable $e) {
            $rpmFilterOptions = [
                'tahun' => array_values(RpmMaster::select('tahun')->whereNotNull('tahun')->where('tahun', '!=', '')->distinct()->pluck('tahun')->filter()->toArray()),
                'rtp'   => array_values(RpmMaster::select('rtp')->whereNotNull('rtp')->where('rtp', '!=', '')->distinct()->pluck('rtp')->filter()->toArray()),
            ];
            $skFilterOptions = [
                'infrako' => array_values(SmartkeyMaster::select('infrako')->whereNotNull('infrako')->where('infrako', '!=', '')->distinct()->pluck('infrako')->filter()->toArray()),
                'status'  => array_values(SmartkeyMaster::select('status')->whereNotNull('status')->where('status', '!=', '')->distinct()->pluck('status')->filter()->toArray()),
                'sn'      => array_values(SmartkeyMaster::select('serial_number')->whereNotNull('serial_number')->where('serial_number', '!=', '')->distinct()->pluck('serial_number')->filter()->toArray()),
            ];
        }

        // ==========================================
        // 4. RENDER TO INERTIA
        // ==========================================
        return Inertia::render('Maintenance/Dashboard/Index', [
            'rpmSummary' => [
                'totalSite'     => (int) ($rpmKpi->total_site ?? 0),
                'totalApproved' => (int) ($rpmKpi->total_approved ?? 0),
                'totalPending'  => (int) ($rpmKpi->total_pending ?? 0),
                'totalReject'   => (int) ($rpmKpi->total_reject ?? 0),
                'totalReturn'   => (int) ($rpmKpi->total_return ?? 0),

                'total_site'     => (int) ($rpmKpi->total_site ?? 0),
                'total_approved' => (int) ($rpmKpi->total_approved ?? 0),
                'total_pending'  => (int) ($rpmKpi->total_pending ?? 0),
                'total_reject'   => (int) ($rpmKpi->total_reject ?? 0),
                'total_return'   => (int) ($rpmKpi->total_return ?? 0),

                'chartData'     => $rpmChartData,
                'monthlyPivot'  => $rpmMonthlyPivot,
                'rtpPivot'      => $rpmRtpPivot,
            ],
            'smartkeySummary' => [
                'summary'    => $skSummary,
                'chart'      => $skChart,

                // Mendukung penamaan snake_case & camelCase sekaligus
                'map_data'   => $skMapData,
                'mapData'    => $skMapData,

                'tableData'  => $skTableData,
                'table_data' => $skTableData,
            ],
            'filterOptions' => [
                'rpm'      => $rpmFilterOptions,
                'smartkey' => $skFilterOptions,
            ],
            'filters' => [
                'rpm' => [
                    'tahun' => $rpmTahun,
                    'rtp'   => $rpmRtp,
                ],
                'smartkey' => [
                    'infrako' => $skInfrako,
                    'status'  => $skStatus,
                    'sn'      => $skSn,
                ]
            ]
        ]);
    }

    public function maintenance(Request $request)
    {
        return $this->index($request);
    }
}