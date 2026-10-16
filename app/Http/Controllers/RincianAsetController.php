<?php

namespace App\Http\Controllers;

use App\Models\BarangSerial;
use App\Models\Gudang;
use App\Models\Proyek;
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
            // Pengeluaran proyek biasa dipisahkan dari aset transfer yang masih aktif di proyek.
            $query->where('transaksis.jenis_transaksi', 'KELUAR')
                ->where('transaksis.sub_jenis', 'BARANG_KE_SITE');
        } else {
            $query
                ->where('transaksis.jenis_transaksi', 'KELUAR')
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
            $isProjectReturn = $row->transaction_sub_jenis === 'PENGEMBALIAN_PROYEK';
            $qty = (int) $row->qty;
            if ($isProjectReturn) {
                $qty = -abs($qty);
            }
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

    /**
     * Snapshot aset transfer non-SN dan SN yang masih aktif di proyek.
     * Hanya transfer ke proyek dikurangi oleh transaksi MASUK/PENGEMBALIAN.
     * Pengeluaran biasa BARANG_KE_SITE tidak dimasukkan ke saldo aset transfer.
     */
    private function getTransferProjectPivot(Request $request, array $priceMap): array
    {
        $selectedProjects = $this->normalizeFilterArray($request->input('project', []));
        $search = mb_strtolower(trim((string) $request->input('search', '')));
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $activeProjects = Proyek::query()->get([
            'kode_projek', 'nama_projek', 'nama_customer', 'lokasi', 'is_active',
        ])->keyBy('kode_projek');

        $passesCommonFilters = function (array $row) use ($selectedProjects, $search, $startDate, $endDate): bool {
            if ($selectedProjects && !in_array((string) ($row['project'] ?? ''), $selectedProjects, true)) {
                return false;
            }
            if ($startDate && !empty($row['tanggal']) && $row['tanggal'] < $startDate) return false;
            if ($endDate && !empty($row['tanggal']) && $row['tanggal'] > $endDate) return false;
            if ($search !== '') {
                $haystack = mb_strtolower(implode(' ', [
                    $row['project'] ?? '', $row['project_name'] ?? '', $row['nama_customer'] ?? '',
                    $row['kode_barang'] ?? '', $row['nama_barang'] ?? '', $row['brand'] ?? '',
                    $row['tipe'] ?? '', $row['kategori'] ?? '', $row['part_number'] ?? '',
                    implode(' ', $row['serials'] ?? []),
                ]));
                if (!str_contains($haystack, $search)) return false;
            }
            return true;
        };

        $result = [];

        // 1. SN yang masih berstatus IN_USE dan sudah diberi kode proyek.
        $activeSerials = DB::table('barang_serials as bs')
            ->join('barangs as b', 'b.id', '=', 'bs.barang_id')
            ->where('bs.status', 'IN_USE')
            ->whereNull('bs.gudang_id')
            ->whereNotNull('bs.kode_projek')
            ->where('bs.kode_projek', '!=', '')
            ->orderBy('bs.kode_projek')->orderBy('b.kode_barang')->orderBy('bs.kondisi')->orderBy('bs.serial_number')
            ->get([
                'bs.id as serial_id', 'bs.barang_id', 'bs.kode_projek', 'bs.serial_number',
                'bs.kondisi', 'bs.nomer_imc', 'b.kode_barang', 'b.nama_barang', 'b.brand',
                'b.tipe', 'b.kategori', 'b.part_number',
            ]);

        $activeSerialIds = $activeSerials->pluck('serial_id')->map(fn($id) => (int) $id)->all();
        $serialTransferDates = [];
        if ($activeSerialIds) {
            $dateRows = DB::table('transaksi_detail_serials as tds')
                ->join('transaksi_details as td', 'td.id', '=', 'tds.transaksi_detail_id')
                ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
                ->whereIn('tds.barang_serial_id', $activeSerialIds)
                ->where(function ($q) {
                    $q->whereIn('t.status', ['COMPLETED', 'completed'])->orWhereNull('t.status');
                })
                ->where(function ($q) {
                    $q->where('t.jenis_transaksi', 'TRANSFER')->orWhere('t.sub_jenis', 'TRANSFER_GUDANG');
                })
                ->whereNull('t.gudang_tujuan_id')
                ->whereNotNull('t.kode_projek')->where('t.kode_projek', '!=', '')
                ->select('tds.barang_serial_id', 't.kode_projek', 't.tanggal', 't.no_transaksi')
                ->orderBy('t.tanggal')->orderBy('t.id')
                ->get();
            foreach ($dateRows as $dateRow) {
                $serialTransferDates[(int) $dateRow->barang_serial_id] = [
                    'kode_projek' => (string) $dateRow->kode_projek,
                    'tanggal' => $dateRow->tanggal,
                    'no_transaksi' => $dateRow->no_transaksi,
                ];
            }
        }

        $serialGroups = [];
        foreach ($activeSerials as $serial) {
            $code = (string) $serial->kode_projek;
            $dateInfo = $serialTransferDates[(int) $serial->serial_id] ?? [];
            if (!empty($dateInfo['kode_projek']) && $dateInfo['kode_projek'] !== $code) {
                // Serial sudah berpindah proyek; jangan pakai tanggal transfer proyek sebelumnya.
                $dateInfo = [];
            }
            $condition = $this->normalizeTransferCondition($serial->kondisi);
            $key = implode('|', [$code, (int) $serial->barang_id, $condition]);
            $serialGroups[$key] ??= [
                'project' => $code,
                'barang_id' => (int) $serial->barang_id,
                'kode_barang' => $serial->kode_barang,
                'nama_barang' => $serial->nama_barang,
                'brand' => $serial->brand,
                'tipe' => $serial->tipe,
                'kategori' => $serial->kategori,
                'part_number' => $serial->part_number,
                'kondisi' => $condition,
                'serials' => [],
                'tanggal' => null,
                'no_transaksi' => null,
            ];
            $serialGroups[$key]['serials'][] = trim((string) $serial->serial_number);
            $serialGroups[$key]['tanggal'] = max((string) ($serialGroups[$key]['tanggal'] ?? ''), (string) ($dateInfo['tanggal'] ?? '')) ?: null;
            if (!empty($dateInfo['no_transaksi'])) $serialGroups[$key]['no_transaksi'] = $dateInfo['no_transaksi'];
        }

        foreach ($serialGroups as $row) {
            $project = $activeProjects->get($row['project']);
            $row['project_name'] = $project->nama_projek ?? $row['project'];
            $row['nama_customer'] = $project->nama_customer ?? null;
            $row['lokasi'] = $project->lokasi ?? null;
            $row['qty'] = count($row['serials']);
            $row['jumlah'] = $row['qty'];
            $row['harga'] = (float) ($priceMap[$row['barang_id']] ?? 0);
            $row['nilai_aset'] = $row['qty'] * $row['harga'];
            $row['qty_transfer_total'] = $row['qty'];
            $row['qty_dikembalikan'] = 0;
            $row['status_aset'] = 'Aktif di Proyek';
            if ($passesCommonFilters($row)) $result[] = $row;
        }

        // 2. Non-SN dihitung dari buku mutasi: transfer proyek (+) dikurangi pengembalian (-).
        $ledgerRows = DB::table('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->join('barangs as b', 'b.id', '=', 'td.barang_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])->orWhereNull('t.status');
            })
            ->where(function ($q) {
                $q->where(function ($transfer) {
                    $transfer->where(function ($kind) {
                        $kind->where('t.jenis_transaksi', 'TRANSFER')->orWhere('t.sub_jenis', 'TRANSFER_GUDANG');
                    })->whereNull('t.gudang_tujuan_id')->whereNotNull('t.kode_projek')->where('t.kode_projek', '!=', '');
                })->orWhere(function ($return) {
                    $return->where('t.jenis_transaksi', 'MASUK')->where('t.sub_jenis', 'PENGEMBALIAN')
                        ->whereNotNull('t.kode_projek')->where('t.kode_projek', '!=', '');
                });
            })
            ->where('b.is_wajib_sn', false)
            ->orderBy('t.tanggal')->orderBy('t.id')->orderBy('td.id')
            ->get([
                'td.barang_id', 'td.qty', 'td.kondisi as detail_kondisi', 't.kondisi as header_kondisi',
                't.kode_projek', 't.jenis_transaksi', 't.sub_jenis', 't.tanggal', 't.no_transaksi',
                'b.kode_barang', 'b.nama_barang', 'b.brand', 'b.tipe', 'b.kategori', 'b.part_number',
            ]);

        $balances = [];
        foreach ($ledgerRows as $movement) {
            $code = trim((string) $movement->kode_projek);
            $condition = $this->normalizeTransferCondition($movement->detail_kondisi ?: $movement->header_kondisi);
            $isReturn = $movement->jenis_transaksi === 'MASUK' && $movement->sub_jenis === 'PENGEMBALIAN';
            $key = implode('|', [$code, (int) $movement->barang_id, $condition]);
            $balances[$key] ??= [
                'project' => $code,
                'barang_id' => (int) $movement->barang_id,
                'kode_barang' => $movement->kode_barang,
                'nama_barang' => $movement->nama_barang,
                'brand' => $movement->brand,
                'tipe' => $movement->tipe,
                'kategori' => $movement->kategori,
                'part_number' => $movement->part_number,
                'kondisi' => $condition,
                'qty_transfer_total' => 0,
                'qty_dikembalikan' => 0,
                'tanggal' => null,
                'no_transaksi' => null,
            ];
            if ($isReturn) {
                $balances[$key]['qty_dikembalikan'] += (int) $movement->qty;
            } else {
                $balances[$key]['qty_transfer_total'] += (int) $movement->qty;
                $balances[$key]['tanggal'] = $movement->tanggal;
                $balances[$key]['no_transaksi'] = $movement->no_transaksi;
            }
        }

        foreach ($balances as $row) {
            $row['qty'] = max(0, (int) $row['qty_transfer_total'] - (int) $row['qty_dikembalikan']);
            if ($row['qty'] <= 0) continue;
            $row['jumlah'] = $row['qty'];
            $row['serials'] = [];
            $project = $activeProjects->get($row['project']);
            $row['project_name'] = $project->nama_projek ?? $row['project'];
            $row['nama_customer'] = $project->nama_customer ?? null;
            $row['lokasi'] = $project->lokasi ?? null;
            $row['harga'] = (float) ($priceMap[$row['barang_id']] ?? 0);
            $row['nilai_aset'] = $row['qty'] * $row['harga'];
            $row['status_aset'] = 'Aktif di Proyek';
            if ($passesCommonFilters($row)) $result[] = $row;
        }

        usort($result, function ($a, $b) {
            return [$a['project'], $a['kode_barang'], $a['kondisi']] <=> [$b['project'], $b['kode_barang'], $b['kondisi']];
        });

        return array_values($result);
    }

    private function normalizeTransferCondition(?string $value): string
    {
        $condition = strtoupper(trim((string) $value));
        if (str_contains($condition, 'RUSAK') || str_contains($condition, 'DAMAGED')) return 'Rusak';
        if (str_contains($condition, 'BEKAS') || str_contains($condition, 'SECOND') || str_contains($condition, 'USED')) return 'Bekas';
        return 'Baru';
    }

    private function getProjectOptions(): array
    {
        return Proyek::query()
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
        $transferProjectPivot = $this->getTransferProjectPivot($request, $priceMap);

        $nonProjectPivot = $this->getPivotRows(
            $request,
            'NON_PROYEK',
            $priceMap
        );

        return Inertia::render('RincianAset/Index', [
            'activeTab' => $tab,
            'projectPivot' => $projectPivot,
            'transferProjectPivot' => $transferProjectPivot,
            'nonProjectPivot' => $nonProjectPivot,
            'gudangs' => $gudangs,
            'projectOptions' => $projectOptions,
            'departmentOptions' => $departmentOptions,
            'filters' => [
                'tab' => $tab,
                'search' => $request->input('search', ''),
                'project' => $request->input('project', ''),
                'project_view' => in_array($request->input('project_view', 'OUTBOUND'), ['OUTBOUND', 'TRANSFER'], true) ? $request->input('project_view', 'OUTBOUND') : 'OUTBOUND',
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