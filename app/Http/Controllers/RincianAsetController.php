<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangSerial;
use App\Models\Gudang;
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
            if (!empty($projects)) {
                $query->whereIn('transaksis.kode_projek', $projects);
            }
        }

        if ($type === 'NON_PROYEK' && !empty($departments)) {
            $query->whereIn('transaksis.pihak_asal', $departments);
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
            ->where(function ($q) {
                $q->whereIn(
                    'transaksis.status',
                    ['COMPLETED', 'completed']
                )
                    ->orWhereNull('transaksis.status');
            });

        if ($type === 'PROYEK') {
            $query->where(function ($movement) {
                $movement->where(function ($outbound) {
                    $outbound->where('transaksis.jenis_transaksi', 'KELUAR')
                        ->where('transaksis.sub_jenis', 'BARANG_KE_SITE');
                })->orWhere(function ($return) {
                    $return->where('transaksis.jenis_transaksi', 'MASUK')
                        ->whereIn('transaksis.sub_jenis', ['PENGEMBALIAN', 'PENGEMBALIAN_PROYEK']);
                });
            })->whereNotNull('transaksis.kode_projek')->where('transaksis.kode_projek', '!=', '');
        } else {
            $query->where('transaksis.jenis_transaksi', 'KELUAR')
                ->where('transaksis.sub_jenis', 'PEMAKAIAN_INTERNAL');
        }

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
                'transaksis.sub_jenis as transaction_sub_jenis',
                'transaksis.jenis_transaksi as transaction_jenis_transaksi',
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
            $isProjectReturn = $row->transaction_jenis_transaksi === 'MASUK'
                && in_array($row->transaction_sub_jenis, ['PENGEMBALIAN', 'PENGEMBALIAN_PROYEK'], true);
            $qty = (int) $row->qty;
            if ($isProjectReturn) $qty = -abs($qty);
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
                'sub_jenis' => $row->transaction_sub_jenis,
                'is_pengembalian_proyek' => $isProjectReturn,
                'qty' => $qty,
                'jumlah' => $qty,
                'harga' => $harga,
                'nilai_aset' => $qty * $harga,
                'serials' => $serials,
            ];
        })->values()->all();
    }

    private function normalizeStockCondition(?string $condition): string
    {
        $value = strtoupper(trim((string) $condition));

        if (str_contains($value, 'RUSAK') || str_contains($value, 'DAMAGED')) {
            return 'Rusak';
        }

        if (
            str_contains($value, 'BEKAS') ||
            str_contains($value, 'SECOND') ||
            str_contains($value, 'USED')
        ) {
            return 'Bekas';
        }

        return 'Baru';
    }

    /**
     * Pecah qty non-SN berdasarkan kondisi yang tersimpan pada detail transaksi.
     * Mendukung format "3 Baru, 2 Bekas" maupun "Baru: 3, Bekas: 2".
     */
    private function parseStockConditionQuantities(?string $rawCondition, int $qty): array
    {
        $result = ['baru' => 0, 'bekas' => 0, 'rusak' => 0];
        $raw = trim((string) $rawCondition);

        preg_match_all(
            '/(\d+)\s*(BARU|BEKAS|SECOND|USED|RUSAK|DAMAGED)|\b(BARU|BEKAS|SECOND|USED|RUSAK|DAMAGED)\s*[:=]\s*(\d+)/i',
            $raw,
            $matches,
            PREG_SET_ORDER
        );

        if (!empty($matches)) {
            foreach ($matches as $match) {
                $condition = strtoupper(($match[2] ?? '') ?: ($match[3] ?? ''));
                $amount = (int) ((($match[1] ?? '') !== '') ? $match[1] : ($match[4] ?? 0));

                if (str_contains($condition, 'RUSAK') || str_contains($condition, 'DAMAGED')) {
                    $result['rusak'] += $amount;
                } elseif (
                    str_contains($condition, 'BEKAS') ||
                    str_contains($condition, 'SECOND') ||
                    str_contains($condition, 'USED')
                ) {
                    $result['bekas'] += $amount;
                } else {
                    $result['baru'] += $amount;
                }
            }

            return $result;
        }

        $key = strtolower($this->normalizeStockCondition($raw));
        $key = $key === 'rusak' ? 'rusak' : ($key === 'bekas' ? 'bekas' : 'baru');
        $result[$key] = max(0, $qty);

        return $result;
    }

    /**
     * Pivot stok akhir saat ini. SN dihitung dari serial yang masih berada di gudang;
     * non-SN dihitung dari mutasi transaksi selesai, per gudang dan kondisi.
     */
    private function getStockPivotRows(array $priceMap): array
    {
        $gudangs = Gudang::query()
            ->orderBy('nama_gudang')
            ->get(['id', 'nama_gudang', 'kode_gudang'])
            ->keyBy('id');

        if ($gudangs->isEmpty()) {
            return [];
        }

        $barangs = Barang::query()
            ->get([
                'id', 'kode_barang', 'nama_barang', 'brand', 'tipe',
                'kategori', 'part_number', 'is_wajib_sn',
            ])
            ->keyBy('id');

        $result = [];
        $validWarehouseIds = $gudangs->keys()->map(fn ($id) => (int) $id)->all();

        // 1. Serial number yang benar-benar masih berada di gudang saat ini.
        $serials = BarangSerial::query()
            ->whereIn('status', ['IN_WAREHOUSE', 'READY', 'AVAILABLE'])
            ->whereNotNull('gudang_id')
            ->whereIn('gudang_id', $validWarehouseIds)
            ->orderBy('barang_id')
            ->orderBy('serial_number')
            ->get([
                'id', 'barang_id', 'gudang_id', 'serial_number', 'kondisi', 'status',
            ]);

        foreach ($serials as $serial) {
            $barang = $barangs->get($serial->barang_id);
            $gudang = $gudangs->get($serial->gudang_id);

            if (!$barang || !$gudang) {
                continue;
            }

            $condition = $this->normalizeStockCondition($serial->kondisi);
            $conditionKey = strtolower($condition);
            $price = (float) ($priceMap[(int) $barang->id] ?? 0);

            $result[] = [
                'barang_id' => (int) $barang->id,
                'kode_barang' => $barang->kode_barang,
                'nama_barang' => $barang->nama_barang,
                'brand' => $barang->brand,
                'tipe' => $barang->tipe,
                'kategori' => $barang->kategori,
                'part_number' => $barang->part_number,
                'is_wajib_sn' => true,
                'warehouse_id' => (int) $gudang->id,
                'warehouse_name' => $gudang->nama_gudang,
                'warehouse_code' => $gudang->kode_gudang,
                'serial_number' => $serial->serial_number,
                'kondisi' => $condition,
                'qty' => 1,
                'stok_baru' => $conditionKey === 'baru' ? 1 : 0,
                'stok_bekas' => $conditionKey === 'bekas' ? 1 : 0,
                'stok_rusak' => $conditionKey === 'rusak' ? 1 : 0,
                'stok_lainnya' => 0,
                'harga_satuan' => $price,
                'nilai_stok' => $price,
            ];
        }

        // 2. Mutasi non-SN untuk mendapat saldo akhir per barang, gudang, dan kondisi.
        $nonSnBarangIds = Barang::query()
            ->where(function ($query) {
                $query->where('is_wajib_sn', false)->orWhereNull('is_wajib_sn');
            })
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->flip();

        if ($nonSnBarangIds->isNotEmpty()) {
            $events = DB::table('transaksi_details as td')
                ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
                ->where(function ($query) {
                    $query->whereIn('t.status', ['COMPLETED', 'completed'])
                        ->orWhereNull('t.status');
                })
                ->orderBy('t.tanggal')
                ->orderBy('t.id')
                ->orderBy('td.id')
                ->get([
                    'td.barang_id',
                    'td.qty',
                    'td.kondisi as detail_kondisi',
                    't.kondisi as header_kondisi',
                    't.jenis_transaksi',
                    't.sub_jenis',
                    't.gudang_asal_id',
                    't.gudang_tujuan_id',
                ]);

            $conditionByBarangWarehouse = [];
            $qtyByBarangWarehouse = [];

            $ensureStockMap = static function (&$map, int $barangId, int $warehouseId): void {
                $map[$barangId][$warehouseId] ??= [
                    'baru' => 0,
                    'bekas' => 0,
                    'rusak' => 0,
                ];
            };

            foreach ($events as $event) {
                $barangId = (int) $event->barang_id;

                if (!isset($nonSnBarangIds[$barangId])) {
                    continue;
                }

                $qty = max(0, (int) $event->qty);
                if ($qty === 0) {
                    continue;
                }

                $conditionRaw = ($event->detail_kondisi && $event->detail_kondisi !== '-')
                    ? $event->detail_kondisi
                    : ($event->header_kondisi ?? 'Baru');
                $conditionQty = $this->parseStockConditionQuantities($conditionRaw, $qty);
                $movementType = strtoupper((string) $event->jenis_transaksi);
                $subType = strtoupper((string) $event->sub_jenis);

                if ($movementType === 'MASUK' && $event->gudang_tujuan_id) {
                    $warehouseId = (int) $event->gudang_tujuan_id;
                    $ensureStockMap($conditionByBarangWarehouse, $barangId, $warehouseId);
                    foreach ($conditionQty as $key => $amount) {
                        $conditionByBarangWarehouse[$barangId][$warehouseId][$key] += $amount;
                    }
                    $qtyByBarangWarehouse[$barangId][$warehouseId] = ($qtyByBarangWarehouse[$barangId][$warehouseId] ?? 0) + $qty;
                } elseif ($movementType === 'KELUAR' && $event->gudang_asal_id) {
                    $warehouseId = (int) $event->gudang_asal_id;
                    $ensureStockMap($conditionByBarangWarehouse, $barangId, $warehouseId);
                    foreach ($conditionQty as $key => $amount) {
                        $conditionByBarangWarehouse[$barangId][$warehouseId][$key] = max(
                            0,
                            $conditionByBarangWarehouse[$barangId][$warehouseId][$key] - $amount
                        );
                    }
                    $qtyByBarangWarehouse[$barangId][$warehouseId] = max(
                        0,
                        ($qtyByBarangWarehouse[$barangId][$warehouseId] ?? 0) - $qty
                    );
                } elseif ($movementType === 'TRANSFER' || $subType === 'TRANSFER_GUDANG') {
                    if ($event->gudang_asal_id) {
                        $warehouseId = (int) $event->gudang_asal_id;
                        $ensureStockMap($conditionByBarangWarehouse, $barangId, $warehouseId);
                        foreach ($conditionQty as $key => $amount) {
                            $conditionByBarangWarehouse[$barangId][$warehouseId][$key] = max(
                                0,
                                $conditionByBarangWarehouse[$barangId][$warehouseId][$key] - $amount
                            );
                        }
                        $qtyByBarangWarehouse[$barangId][$warehouseId] = max(
                            0,
                            ($qtyByBarangWarehouse[$barangId][$warehouseId] ?? 0) - $qty
                        );
                    }

                    if ($event->gudang_tujuan_id) {
                        $warehouseId = (int) $event->gudang_tujuan_id;
                        $ensureStockMap($conditionByBarangWarehouse, $barangId, $warehouseId);
                        foreach ($conditionQty as $key => $amount) {
                            $conditionByBarangWarehouse[$barangId][$warehouseId][$key] += $amount;
                        }
                        $qtyByBarangWarehouse[$barangId][$warehouseId] = ($qtyByBarangWarehouse[$barangId][$warehouseId] ?? 0) + $qty;
                    }
                }
            }

            foreach ($qtyByBarangWarehouse as $barangId => $warehouses) {
                $barang = $barangs->get($barangId);
                if (!$barang) {
                    continue;
                }

                foreach ($warehouses as $warehouseId => $totalQty) {
                    $gudang = $gudangs->get($warehouseId);
                    if (!$gudang || $totalQty <= 0) {
                        continue;
                    }

                    $conditions = $conditionByBarangWarehouse[$barangId][$warehouseId] ?? [
                        'baru' => 0, 'bekas' => 0, 'rusak' => 0,
                    ];
                    $conditionTotal = array_sum($conditions);
                    $conditions['lainnya'] = max(0, (int) $totalQty - $conditionTotal);
                    $price = (float) ($priceMap[(int) $barangId] ?? 0);

                    foreach ([
                        'baru' => 'Baru',
                        'bekas' => 'Bekas',
                        'rusak' => 'Rusak',
                        'lainnya' => 'Belum Terpetakan',
                    ] as $key => $conditionLabel) {
                        $amount = (int) ($conditions[$key] ?? 0);
                        if ($amount <= 0) {
                            continue;
                        }

                        $result[] = [
                            'barang_id' => (int) $barangId,
                            'kode_barang' => $barang->kode_barang,
                            'nama_barang' => $barang->nama_barang,
                            'brand' => $barang->brand,
                            'tipe' => $barang->tipe,
                            'kategori' => $barang->kategori,
                            'part_number' => $barang->part_number,
                            'is_wajib_sn' => false,
                            'warehouse_id' => (int) $gudang->id,
                            'warehouse_name' => $gudang->nama_gudang,
                            'warehouse_code' => $gudang->kode_gudang,
                            'serial_number' => null,
                            'kondisi' => $conditionLabel,
                            'qty' => $amount,
                            'stok_baru' => $key === 'baru' ? $amount : 0,
                            'stok_bekas' => $key === 'bekas' ? $amount : 0,
                            'stok_rusak' => $key === 'rusak' ? $amount : 0,
                            'stok_lainnya' => $key === 'lainnya' ? $amount : 0,
                            'harga_satuan' => $price,
                            'nilai_stok' => $amount * $price,
                        ];
                    }
                }
            }
        }

        return $result;
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

        $stockPivot = $this->getStockPivotRows($priceMap);

        return Inertia::render('RincianAset/Index', [
            'activeTab' => $tab,
            'projectPivot' => $projectPivot,
            'nonProjectPivot' => $nonProjectPivot,
            'stockPivot' => $stockPivot,
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