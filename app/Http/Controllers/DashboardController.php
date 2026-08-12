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

    // ==========================================
    // 🟢 1. HALAMAN BERANDA / HOME UTAMA (/home)
    // ==========================================
    public function index(Request $request)
    {
        // Ubah nama 'Beranda' sesuai dengan nama file .jsx kamu di resources/js/Pages/ 
        // Contoh: jika filenya resources/js/Pages/Beranda.jsx atau Pages/Dashboard.jsx
        return Inertia::render('Beranda'); 
    }

    // ==========================================
    // 🟠 2. HALAMAN MAINTENANCE DASHBOARD (/maintenance/dashboard)
    // ==========================================
    public function maintenance(Request $request)
    {
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

        // --- Standardisasi Ekspresi SQL Status RPM ---
        $statusCol    = "LOWER(TRIM(COALESCE(approve, '')))";
        $condApproved = "{$statusCol} IN ('ok', 'approved', 'approve')";
        $condReject   = "({$statusCol} IN ('reject', 'nok') OR {$statusCol} LIKE '%reject%')";
        $condReturn   = "({$statusCol} IN ('return', 'revisi') OR {$statusCol} LIKE '%return%' OR {$statusCol} LIKE '%revisi%')";
        $condPending  = "(NOT ({$condApproved}) AND NOT ({$condReject}) AND NOT ({$condReturn}))";

        // --- 1A. KPI Metrics Summary ---
        $rpmKpi = (clone $rpmQuery)
            ->selectRaw("
                COUNT(*) as total_dokumen,
                COUNT(DISTINCT site_id) as total_site_unik,
                SUM(CASE WHEN {$condApproved} THEN 1 ELSE 0 END) as total_approved,
                SUM(CASE WHEN {$condReject} THEN 1 ELSE 0 END) as total_reject,
                SUM(CASE WHEN {$condReturn} THEN 1 ELSE 0 END) as total_return,
                SUM(CASE WHEN {$condPending} THEN 1 ELSE 0 END) as total_pending
            ", [])
            ->first();

        // --- 1B. Chart Data Bulanan & Pivot Monthly Raw ---
        $pivotMonthlyRaw = (clone $rpmQuery)
            ->selectRaw("
                TRIM(COALESCE(bulan, '')) as month_str,
                SUM(CASE WHEN {$condApproved} THEN 1 ELSE 0 END) as ok,
                SUM(CASE WHEN {$condReject} THEN 1 ELSE 0 END) as reject,
                SUM(CASE WHEN {$condReturn} THEN 1 ELSE 0 END) as return_val,
                SUM(CASE WHEN {$condPending} THEN 1 ELSE 0 END) as belum
            ", [])
            ->groupBy(DB::raw("TRIM(COALESCE(bulan, ''))"))
            ->get();

        // Inisialisasi struktur bulan 1-12
        $monthlyParsed = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthlyParsed[$i] = ['ok' => 0, 'belum' => 0, 'reject' => 0, 'returnVal' => 0];
        }

        // Pemetaan data bulan fleksibel
        foreach ($pivotMonthlyRaw as $row) {
            $str       = strtolower(trim($row->month_str));
            $okVal     = (int) ($row->ok ?? 0);
            $belumVal  = (int) ($row->belum ?? 0);
            $rejectVal = (int) ($row->reject ?? 0);
            $retVal    = (int) ($row->return_val ?? $row->returnval ?? 0);

            $mNum = intval(preg_replace('/[^0-9]/', '', $str));

            if ($mNum >= 1 && $mNum <= 12) {
                $targetMonth = $mNum;
            } else {
                if (str_contains($str, 'jan')) $targetMonth = 1;
                elseif (str_contains($str, 'feb')) $targetMonth = 2;
                elseif (str_contains($str, 'mar')) $targetMonth = 3;
                elseif (str_contains($str, 'apr')) $targetMonth = 4;
                elseif (str_contains($str, 'mei') || str_contains($str, 'may')) $targetMonth = 5;
                elseif (str_contains($str, 'jun')) $targetMonth = 6;
                elseif (str_contains($str, 'jul')) $targetMonth = 7;
                elseif (str_contains($str, 'agu') || str_contains($str, 'aug')) $targetMonth = 8;
                elseif (str_contains($str, 'sep')) $targetMonth = 9;
                elseif (str_contains($str, 'okt') || str_contains($str, 'oct')) $targetMonth = 10;
                elseif (str_contains($str, 'nov')) $targetMonth = 11;
                elseif (str_contains($str, 'des') || str_contains($str, 'dec')) $targetMonth = 12;
                else $targetMonth = 12;
            }

            $monthlyParsed[$targetMonth]['ok']        += $okVal;
            $monthlyParsed[$targetMonth]['belum']     += $belumVal;
            $monthlyParsed[$targetMonth]['reject']    += $rejectVal;
            $monthlyParsed[$targetMonth]['returnVal'] += $retVal;
        }

        $monthsName     = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $fullMonthsName = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        $rpmChartData = [];
        $rawCounts = ['OK' => [], 'BELUM' => [], 'REJECT' => [], 'RETURN' => []];
        $monthTotals = [];
        $monthPct = [];

        for ($m = 1; $m <= 12; $m++) {
            $pData     = $monthlyParsed[$m];
            $okVal     = $pData['ok'];
            $belumVal  = $pData['belum'];
            $rejectVal = $pData['reject'];
            $retVal    = $pData['returnVal'];

            $rawCounts['OK'][]     = $okVal;
            $rawCounts['BELUM'][]  = $belumVal;
            $rawCounts['REJECT'][] = $rejectVal;
            $rawCounts['RETURN'][] = $retVal;

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

        $counts = [
            'OK'        => $rawCounts['OK'],
            'BELUM'     => $rawCounts['BELUM'],
            'REJECT'    => $rawCounts['REJECT'],
            'RETURN'    => $rawCounts['RETURN'],
            'ok'        => $rawCounts['OK'],
            'belum'     => $rawCounts['BELUM'],
            'reject'    => $rawCounts['REJECT'],
            'return'    => $rawCounts['RETURN'],
            'returnVal' => $rawCounts['RETURN'],
            'Belum'     => $rawCounts['BELUM'],
            'Reject'    => $rawCounts['REJECT'],
            'Return'    => $rawCounts['RETURN'],
        ];

        $sumOk     = array_sum($rawCounts['OK']);
        $sumBelum  = array_sum($rawCounts['BELUM']);
        $sumReject = array_sum($rawCounts['REJECT']);
        $sumReturn = array_sum($rawCounts['RETURN']);

        $rowTotals = [
            'OK'        => $sumOk,
            'BELUM'     => $sumBelum,
            'REJECT'    => $sumReject,
            'RETURN'    => $sumReturn,
            'ok'        => $sumOk,
            'belum'     => $sumBelum,
            'reject'    => $sumReject,
            'return'    => $sumReturn,
            'returnVal' => $sumReturn,
            'Belum'     => $sumBelum,
            'Reject'    => $sumReject,
            'Return'    => $sumReturn,
        ];

        $overallTotal = array_sum($monthTotals);
        $overallPct   = $overallTotal > 0 ? round(($sumOk / $overallTotal) * 100) : 0;

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
                COALESCE(NULLIF(TRIM(rtp), ''), 'Unassigned') as rtp_name,
                SUM(CASE WHEN {$condApproved} THEN 1 ELSE 0 END) as ok,
                SUM(CASE WHEN {$condReject} THEN 1 ELSE 0 END) as reject,
                SUM(CASE WHEN {$condReturn} THEN 1 ELSE 0 END) as return_val,
                SUM(CASE WHEN {$condPending} THEN 1 ELSE 0 END) as belum,
                COUNT(*) as total
            ", [])
            ->groupBy(DB::raw("COALESCE(NULLIF(TRIM(rtp), ''), 'Unassigned')"))
            ->get()
            ->map(function ($item) {
                $tot    = (int) $item->total;
                $ok     = (int) $item->ok;
                $retVal = (int) ($item->return_val ?? $item->returnval ?? 0);
                return [
                    'rtp'        => $item->rtp_name,
                    'ok'         => $ok,
                    'belum'      => (int) $item->belum,
                    'reject'     => (int) $item->reject,
                    'return'     => $retVal,
                    'returnVal'  => $retVal,
                    'return_val' => $retVal,
                    'Return'     => $retVal,
                    'total'      => $tot,
                    'pct'        => $tot > 0 ? round(($ok / $tot) * 100) : 0,
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
            SUM(CASE WHEN LOWER(TRIM(status)) = 'aktif' THEN 1 ELSE 0 END) as count_aktif,
            SUM(CASE WHEN LOWER(TRIM(status)) IN ('rusak', 'hilang', 'problem') THEN 1 ELSE 0 END) as count_problem,
            SUM(CASE WHEN LOWER(TRIM(status_aktifitas)) = 'locked' THEN 1 ELSE 0 END) as count_locked,
            SUM(CASE WHEN LOWER(TRIM(status_aktifitas)) = 'unlocked' THEN 1 ELSE 0 END) as count_unlocked,
            SUM(CASE WHEN status_aktifitas IS NULL OR TRIM(status_aktifitas) = '' OR status_aktifitas = '#N/A' THEN 1 ELSE 0 END) as count_na
        ", [])->first();

        // --- 2B. Smartkey Chart ---
        $skChart = (clone $skQuery)
            ->selectRaw("
                COALESCE(NULLIF(TRIM(infrako), ''), 'Unassigned') as infrako,
                SUM(CASE WHEN LOWER(TRIM(status_aktifitas)) = 'locked' THEN 1 ELSE 0 END) as locked,
                SUM(CASE WHEN LOWER(TRIM(status_aktifitas)) = 'unlocked' THEN 1 ELSE 0 END) as unlocked,
                SUM(CASE WHEN status_aktifitas IS NULL OR TRIM(status_aktifitas) = '' OR status_aktifitas = '#N/A' THEN 1 ELSE 0 END) as na,
                COUNT(*) as total
            ", [])
            ->groupBy(DB::raw("COALESCE(NULLIF(TRIM(infrako), ''), 'Unassigned')"))
            ->get();

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
                    'position'         => [$lat, $lng],
                    'coordinates'      => [$lng, $lat],
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

        // --- 2D. Smartkey Table Pivot Data ---
        $skTableData = (clone $skQuery)
            ->selectRaw("
                COALESCE(NULLIF(TRIM(ksm), ''), 'Unassigned') as ksm_name,
                SUM(CASE WHEN LOWER(TRIM(status_aktifitas)) = 'locked' THEN 1 ELSE 0 END) as locked,
                SUM(CASE WHEN LOWER(TRIM(status_aktifitas)) = 'unlocked' THEN 1 ELSE 0 END) as unlocked,
                SUM(CASE WHEN status_aktifitas IS NULL OR TRIM(status_aktifitas) = '' OR status_aktifitas = '#N/A' THEN 1 ELSE 0 END) as na,
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
            $rpmFilterOptions = Cache::remember('rpm_filter_options_v10', 3600, function () {
                return [
                    'tahun' => array_values(RpmMaster::select('tahun')->whereNotNull('tahun')->where('tahun', '!=', '')->distinct()->pluck('tahun')->filter()->toArray()),
                    'rtp'   => array_values(RpmMaster::select('rtp')->whereNotNull('rtp')->where('rtp', '!=', '')->distinct()->pluck('rtp')->filter()->toArray()),
                ];
            });

            $skFilterOptions = Cache::remember('sk_filter_options_v10', 3600, function () {
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
        // 4. RENDER TO INERTIA (MAINTENANCE)
        // ==========================================
        return Inertia::render('Maintenance/Dashboard/Index', [
            'rpmSummary' => [
                'totalSite'       => (int) ($rpmKpi->total_dokumen ?? 0),
                'totalApproved'   => (int) ($rpmKpi->total_approved ?? 0),
                'totalPending'    => (int) ($rpmKpi->total_pending ?? 0),
                'totalReject'     => (int) ($rpmKpi->total_reject ?? 0),
                'totalReturn'     => (int) ($rpmKpi->total_return ?? 0),

                'total_site'      => (int) ($rpmKpi->total_dokumen ?? 0),
                'total_site_unik' => (int) ($rpmKpi->total_site_unik ?? 0),
                'total_dokumen'   => (int) ($rpmKpi->total_dokumen ?? 0),
                'total_approved'  => (int) ($rpmKpi->total_approved ?? 0),
                'total_pending'   => (int) ($rpmKpi->total_pending ?? 0),
                'total_reject'    => (int) ($rpmKpi->total_reject ?? 0),
                'total_return'    => (int) ($rpmKpi->total_return ?? 0),

                'chartData'       => $rpmChartData,
                'monthlyPivot'    => $rpmMonthlyPivot,
                'rtpPivot'        => $rpmRtpPivot,
            ],
            'smartkeySummary' => [
                'summary'    => $skSummary,
                'chart'      => $skChart,
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
}