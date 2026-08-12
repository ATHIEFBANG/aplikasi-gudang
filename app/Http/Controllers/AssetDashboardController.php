<?php

namespace App\Http\Controllers;

use App\Models\CombatMaster;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Arr;

class AssetDashboardController extends Controller
{
    /**
     * Menampilkan Halaman Utama Dashboard Assets
     */
    public function index(Request $request)
    {
        // 1. Tangkap parameter filter dari Request URL
        $selectedStatus     = (array) $request->input('status_combat', []);
        $selectedType       = (array) $request->input('type_combat', []);
        $selectedKetinggian = (array) $request->input('ketinggian_combat', []);

        $selectedStatus     = array_filter(Arr::flatten($selectedStatus));
        $selectedType       = array_filter(Arr::flatten($selectedType));
        $selectedKetinggian = array_filter(Arr::flatten($selectedKetinggian));

        // 2. Opsi Filter Dropdown
        $filterOptions = [
            'combat' => [
                'status_combat'     => CombatMaster::distinct()->whereNotNull('status_combat')->pluck('status_combat')->filter()->values(),
                'type_combat'       => CombatMaster::distinct()->whereNotNull('type_combat')->pluck('type_combat')->filter()->values(),
                'ketinggian_combat' => CombatMaster::distinct()->whereNotNull('ketinggian_combat')->pluck('ketinggian_combat')->filter()->values(),
            ]
        ];

        // 3. Query Utama
        $query = CombatMaster::query();

        if (!empty($selectedStatus)) {
            $query->whereIn('status_combat', $selectedStatus, 'and', false);
        }

        if (!empty($selectedType)) {
            $query->whereIn('type_combat', $selectedType, 'and', false);
        }

        if (!empty($selectedKetinggian)) {
            $query->whereIn('ketinggian_combat', $selectedKetinggian, 'and', false);
        }

        $combatRecords = $query->get();

        // 4. HELPER CATEGORY STATUS (Normalisasi Seragam)
        $getStatusCategory = function ($statusRaw) {
            if (!$statusRaw) return 'UNASSIGNED';
            $status = strtoupper(trim($statusRaw));

            if (str_contains($status, 'ONSITE') || str_starts_with($status, '2.')) {
                return 'ONSITE';
            }
            if (str_contains($status, 'READY') || str_starts_with($status, '5.')) {
                return 'READY TO USE';
            }
            if (str_contains($status, 'BROKEN') || str_contains($status, 'INOP') || str_starts_with($status, '6.')) {
                return 'BROKEN';
            }

            return 'UNASSIGNED';
        };

        // 5. KALKULASI KPI STATISTIK
        $totalCombat = $combatRecords->count();

        $countOnsite = $combatRecords->filter(fn($item) => $getStatusCategory($item->status_combat ?? '') === 'ONSITE')->count();
        $countReady  = $combatRecords->filter(fn($item) => $getStatusCategory($item->status_combat ?? '') === 'READY TO USE')->count();
        $countBroken = $combatRecords->filter(fn($item) => $getStatusCategory($item->status_combat ?? '') === 'BROKEN')->count();

        // 6. FORMAT DATA PETA & LIST ASSET
        $mapData = $combatRecords->map(function ($item) use ($getStatusCategory) {
            $lat = $item->latitude ?? $item->lat ?? null;
            $lng = $item->longitude ?? $item->lng ?? null;

            $assetName = !empty(trim($item->asset_name ?? '')) ? $item->asset_name : (!empty(trim($item->nama_site ?? '')) ? $item->nama_site : 'Unit COMBAT');
            $snCode    = !empty(trim($item->sn ?? '')) ? $item->sn : (!empty(trim($item->serial_number ?? '')) ? $item->serial_number : 'Tanpa SN');
            $statusCat = $getStatusCategory($item->status_combat ?? '');

            return [
                'id'                => $item->id,
                'latitude'          => $lat ? (float) $lat : null,
                'longitude'         => $lng ? (float) $lng : null,
                'status_combat'     => $statusCat, // ONSITE, READY TO USE, BROKEN
                'status_raw'        => $item->status_combat ?? 'N/A',
                'type_combat'       => !empty(trim($item->type_combat ?? '')) ? trim($item->type_combat) : 'Unassigned',
                'ketinggian_combat' => !empty(trim($item->ketinggian_combat ?? '')) ? trim($item->ketinggian_combat) : 'N/A',
                'asset_name'        => $assetName,
                'sn'                => $snCode,
                'pic_data'          => $item->pic_data ?? $item->pic ?? '-',
                'nama_site'         => $item->nama_site ?? '-',
                'lokasi_saat_ini'   => $item->lokasi_saat_ini ?? '-',
                'tanggal_ambil'     => $item->tanggal_ambil ?? '-',
                'tanggal_kembali'   => $item->tanggal_kembali ?? '-',
            ];
        })->values();

        // 7. DATA GRAFIK PER TYPE
        $chartData = $combatRecords->groupBy(function ($item) {
            return !empty(trim($item->type_combat ?? '')) ? trim($item->type_combat) : 'Unassigned';
        })->map(function ($group, $type) use ($getStatusCategory) {
            $onsite = $group->filter(fn($i) => $getStatusCategory($i->status_combat ?? '') === 'ONSITE')->count();
            $ready  = $group->filter(fn($i) => $getStatusCategory($i->status_combat ?? '') === 'READY TO USE')->count();
            $broken = $group->filter(fn($i) => $getStatusCategory($i->status_combat ?? '') === 'BROKEN')->count();

            return [
                'name'   => $type,
                'ONSITE' => $onsite,
                'READY'  => $ready,
                'BROKEN' => $broken,
                'total'  => $group->count(),
            ];
        })->values()->sortByDesc('total')->take(8)->values();

        // 8. SUMMARY PACKAGE UNTUK REACT
        $combatSummary = [
            'summary' => [
                'totalCombat'  => $totalCombat,
                'count_onsite' => $countOnsite,
                'count_ready'  => $countReady,
                'count_broken' => $countBroken,
            ],
            'map_data'   => $mapData,
            'chart'      => $chartData,
            'table_data' => $combatRecords,
        ];

        return Inertia::render('Assets/Dashboard/Index', [
            'combatSummary' => $combatSummary,
            'filterOptions' => $filterOptions,
            'filters'       => [
                'status_combat'     => $selectedStatus,
                'type_combat'       => $selectedType,
                'ketinggian_combat' => $selectedKetinggian,
            ],
        ]);
    }
}