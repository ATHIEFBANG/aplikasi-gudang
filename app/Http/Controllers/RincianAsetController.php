<?php

namespace App\Http\Controllers;

use App\Models\BarangSerial;
use App\Models\Gudang;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RincianAsetController extends Controller
{
    private function getLatestInboundPrices(): array
    {
        $rows = DB::table('transaksi_details')
            ->join('transaksis', 'transaksis.id', '=', 'transaksi_details.transaksi_id')
            ->where('transaksis.jenis_transaksi', 'MASUK')
            ->where('transaksi_details.harga', '>', 0)
            ->where(function ($q) {
                $q->whereIn('transaksis.status', ['COMPLETED', 'completed'])
                    ->orWhereNull('transaksis.status');
            })
            ->orderByDesc('transaksis.tanggal')
            ->orderByDesc('transaksis.id')
            ->select([
                'transaksi_details.barang_id',
                'transaksi_details.harga',
                'transaksis.tanggal',
                'transaksis.id as transaksi_id',
            ])
            ->get();

        $prices = [];

        foreach ($rows as $row) {
            $barangId = (int) $row->barang_id;

            if (!array_key_exists($barangId, $prices)) {
                $prices[$barangId] = (float) $row->harga;
            }
        }

        return $prices;
    }

    private function normalizeFilterArray($value): array
    {
        if (is_array($value)) {
            return collect($value)
                ->map(fn($item) => trim((string) $item))
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        if ($value === null || $value === '' || $value === 'ALL') {
            return [];
        }

        return [trim((string) $value)];
    }

    private function applyPivotFilters($query, Request $request, string $type): void
    {
        $search = trim((string) $request->input('search', ''));

        $projects = $this->normalizeFilterArray(
            $request->input('project', [])
        );

        $departments = $this->normalizeFilterArray(
            $request->input('department', [])
        );

        $gudangs = $this->normalizeFilterArray(
            $request->input('gudang_id', [])
        );

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if ($type === 'PROYEK') {
            $query->where('transaksis.sub_jenis', 'BARANG_KE_SITE');

            if (!empty($projects)) {
                $query->whereIn('transaksis.kode_projek', $projects);
            }
        }

        if ($type === 'NON_PROYEK') {
            $query->where('transaksis.sub_jenis', 'PEMAKAIAN_INTERNAL');

            if (!empty($departments)) {
                $query->whereIn('transaksis.pihak_asal', $departments);
            }
        }

        if (!empty($gudangs)) {
            $query->whereIn('transaksis.gudang_asal_id', $gudangs);
        }

        if ($startDate && $endDate) {
            $query->whereBetween('transaksis.tanggal', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('transaksis.tanggal', '>=', $startDate);
        } elseif ($endDate) {
            $query->where('transaksis.tanggal', '<=', $endDate);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $like = "%{$search}%";

                $q->where('transaksis.kode_projek', 'like', $like)
                    ->orWhere('transaksis.nama_customer', 'like', $like)
                    ->orWhere('transaksis.pihak_asal', 'like', $like)
                    ->orWhere('transaksis.no_transaksi', 'like', $like)
                    ->orWhere('barangs.kode_barang', 'like', $like)
                    ->orWhere('barangs.nama_barang', 'like', $like)
                    ->orWhere('barangs.brand', 'like', $like)
                    ->orWhere('barangs.tipe', 'like', $like)
                    ->orWhere('barangs.kategori', 'like', $like)
                    ->orWhere('barangs.part_number', 'like', $like);
            });
        }
    }

    private function getSerialsByDetailIds(array $detailIds): array
    {
        if (empty($detailIds)) {
            return [];
        }

        $serialTable = (new BarangSerial())->getTable();

        $rows = DB::table('transaksi_detail_serials as tds')
            ->join(
                "{$serialTable} as bs",
                'bs.id',
                '=',
                'tds.barang_serial_id'
            )
            ->whereIn('tds.transaksi_detail_id', $detailIds)
            ->select([
                'tds.transaksi_detail_id',
                'bs.serial_number',
            ])
            ->orderBy('tds.transaksi_detail_id')
            ->orderBy('bs.serial_number')
            ->get();

        $result = [];

        foreach ($rows as $row) {
            $detailId = (int) $row->transaksi_detail_id;

            if (!isset($result[$detailId])) {
                $result[$detailId] = [];
            }

            if (
                $row->serial_number !== null &&
                trim((string) $row->serial_number) !== ''
            ) {
                $result[$detailId][] = trim((string) $row->serial_number);
            }
        }

        return $result;
    }

    private function getPivotRows(
        Request $request,
        string $type,
        array $priceMap
    ): array {
        $query = TransaksiDetail::query()
            ->join(
                'transaksis',
                'transaksis.id',
                '=',
                'transaksi_details.transaksi_id'
            )
            ->join(
                'barangs',
                'barangs.id',
                '=',
                'transaksi_details.barang_id'
            )
            ->where('transaksis.jenis_transaksi', 'KELUAR')
            ->where(function ($q) {
                $q->whereIn(
                    'transaksis.status',
                    ['COMPLETED', 'completed']
                )
                    ->orWhereNull('transaksis.status');
            });

        $this->applyPivotFilters($query, $request, $type);

        $rows = $query
            ->select([
                'transaksi_details.id as detail_id',
                'transaksi_details.barang_id',
                'transaksi_details.qty',
                'barangs.kode_barang',
                'barangs.nama_barang',
                'barangs.brand',
                'barangs.tipe',
                'barangs.kategori',
                'barangs.part_number',
                'transaksis.kode_projek as project',
                'transaksis.nama_customer',
                'transaksis.pihak_asal',
                'transaksis.gudang_asal_id',
                'transaksis.tanggal',
                'transaksis.no_transaksi',
            ])
            ->orderBy('transaksis.tanggal')
            ->orderBy('transaksis.id')
            ->orderBy('barangs.kode_barang')
            ->orderBy('transaksi_details.id')
            ->get();

        if ($rows->isEmpty()) {
            return [];
        }

        $detailIds = $rows
            ->pluck('detail_id')
            ->map(fn($id) => (int) $id)
            ->values()
            ->all();

        $serialMap = $this->getSerialsByDetailIds($detailIds);

        return $rows->map(function ($row) use ($priceMap, $serialMap) {
            $barangId = (int) $row->barang_id;
            $qty = (int) $row->qty;
            $harga = (float) ($priceMap[$barangId] ?? 0);
            $serials = $serialMap[(int) $row->detail_id] ?? [];

            return [
                'detail_id' => (int) $row->detail_id,
                'barang_id' => $barangId,
                'kode_barang' => $row->kode_barang,
                'nama_barang' => $row->nama_barang,
                'brand' => $row->brand,
                'tipe' => $row->tipe,
                'kategori' => $row->kategori,
                'part_number' => $row->part_number,
                'project' => $row->project,
                'nama_customer' => $row->nama_customer,
                'department' => $row->pihak_asal,
                'pihak_asal' => $row->pihak_asal,
                'gudang_asal_id' => $row->gudang_asal_id
                    ? (int) $row->gudang_asal_id
                    : null,
                'tanggal' => $row->tanggal,
                'no_transaksi' => $row->no_transaksi,
                'qty' => $qty,
                'jumlah' => $qty,
                'harga' => $harga,
                'nilai_aset' => $qty * $harga,
                'serials' => $serials,
            ];
        })->values()->all();
    }

    private function getProjectOptions(): array
    {
        return Transaksi::query()
            ->where('jenis_transaksi', 'KELUAR')
            ->where('sub_jenis', 'BARANG_KE_SITE')
            ->whereNotNull('kode_projek')
            ->where('kode_projek', '!=', '')
            ->where(function ($q) {
                $q->whereIn(
                    'status',
                    ['COMPLETED', 'completed']
                )
                    ->orWhereNull('status');
            })
            ->distinct()
            ->orderBy('kode_projek')
            ->pluck('kode_projek')
            ->values()
            ->all();
    }

    private function getDepartmentOptions(): array
    {
        return Transaksi::query()
            ->where('jenis_transaksi', 'KELUAR')
            ->where('sub_jenis', 'PEMAKAIAN_INTERNAL')
            ->whereNotNull('pihak_asal')
            ->where('pihak_asal', '!=', '')
            ->where(function ($q) {
                $q->whereIn(
                    'status',
                    ['COMPLETED', 'completed']
                )
                    ->orWhereNull('status');
            })
            ->distinct()
            ->orderBy('pihak_asal')
            ->pluck('pihak_asal')
            ->values()
            ->all();
    }

    public function index(Request $request): Response
    {
        $tab = strtoupper(
            (string) $request->input('tab', 'PROYEK')
        );

        if (!in_array($tab, ['PROYEK', 'NON_PROYEK'], true)) {
            $tab = 'PROYEK';
        }

        $priceMap = $this->getLatestInboundPrices();

        $gudangs = Gudang::query()
            ->where('is_active', true)
            ->orderBy('nama_gudang')
            ->get([
                'id',
                'nama_gudang',
                'kode_gudang',
            ]);

        $projectOptions = $this->getProjectOptions();
        $departmentOptions = $this->getDepartmentOptions();

        $projectPivot = $this->getPivotRows(
            $request,
            'PROYEK',
            $priceMap
        );

        $nonProjectPivot = $this->getPivotRows(
            $request,
            'NON_PROYEK',
            $priceMap
        );

        return Inertia::render('RincianAset/Index', [
            'activeTab' => $tab,
            'projectPivot' => $projectPivot,
            'nonProjectPivot' => $nonProjectPivot,
            'gudangs' => $gudangs,
            'projectOptions' => $projectOptions,
            'departmentOptions' => $departmentOptions,
            'filters' => [
                'tab' => $tab,
                'search' => $request->input('search', ''),
                'project' => $request->input('project', ''),
                'department' => $request->input('department', ''),
                'gudang_id' => $request->input(
                    'gudang_id',
                    'ALL'
                ),
                'start_date' => $request->input(
                    'start_date',
                    ''
                ),
                'end_date' => $request->input(
                    'end_date',
                    ''
                ),
                'zoom' => (int) $request->input(
                    'zoom',
                    100
                ),
            ],
        ]);
    }
}