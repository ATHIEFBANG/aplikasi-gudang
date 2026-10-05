<?php

namespace App\Http\Controllers;

use App\Models\Gudang;
use App\Models\Stok;
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

    private function getLatestOutboundDates(): array
    {
        $rows = DB::table('transaksis')
            ->join('transaksi_details', 'transaksi_details.transaksi_id', '=', 'transaksis.id')
            ->where('transaksis.jenis_transaksi', 'KELUAR')
            ->where('transaksis.sub_jenis', '!=', 'TRANSFER_GUDANG')
            ->where(function ($q) {
                $q->whereIn('transaksis.status', ['COMPLETED', 'completed'])
                    ->orWhereNull('transaksis.status');
            })
            ->select([
                'transaksi_details.barang_id',
                'transaksis.gudang_asal_id',
                'transaksis.tanggal',
                'transaksis.id',
            ])
            ->orderByDesc('transaksis.tanggal')
            ->orderByDesc('transaksis.id')
            ->get();

        $dates = [];

        foreach ($rows as $row) {
            if (!$row->gudang_asal_id) {
                continue;
            }

            $key = (int) $row->barang_id . '_' . (int) $row->gudang_asal_id;

            if (!array_key_exists($key, $dates)) {
                $dates[$key] = $row->tanggal;
            }
        }

        return $dates;
    }

    private function applyTerpasangFilters($query, Request $request): void
    {
        $search = trim((string) $request->input('search', ''));
        $project = trim((string) $request->input('project', ''));
        $gudangId = $request->input('gudang_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if ($project !== '') {
            $query->where('transaksis.kode_projek', $project);
        }

        if ($gudangId && $gudangId !== 'ALL') {
            $query->where('transaksis.gudang_asal_id', $gudangId);
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
                $q->where('transaksis.kode_projek', 'like', "%{$search}%")
                    ->orWhere('transaksis.nama_customer', 'like', "%{$search}%")
                    ->orWhere('transaksis.no_transaksi', 'like', "%{$search}%")
                    ->orWhere('barangs.kode_barang', 'like', "%{$search}%")
                    ->orWhere('barangs.nama_barang', 'like', "%{$search}%")
                    ->orWhere('barangs.brand', 'like', "%{$search}%")
                    ->orWhere('barangs.tipe', 'like', "%{$search}%")
                    ->orWhere('barangs.kategori', 'like', "%{$search}%")
                    ->orWhere('barangs.part_number', 'like', "%{$search}%");
            });
        }
    }

    private function applyStokFilters($query, Request $request): void
    {
        $search = trim((string) $request->input('search', ''));
        $gudangId = $request->input('gudang_id');

        if ($gudangId && $gudangId !== 'ALL') {
            $query->where('stok.gudang_id', $gudangId);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('barangs.kode_barang', 'like', "%{$search}%")
                    ->orWhere('barangs.nama_barang', 'like', "%{$search}%")
                    ->orWhere('barangs.brand', 'like', "%{$search}%")
                    ->orWhere('barangs.tipe', 'like', "%{$search}%")
                    ->orWhere('barangs.kategori', 'like', "%{$search}%")
                    ->orWhere('barangs.part_number', 'like', "%{$search}%")
                    ->orWhere('gudangs.nama_gudang', 'like', "%{$search}%")
                    ->orWhere('gudangs.kode_gudang', 'like', "%{$search}%");
            });
        }
    }

    private function getInstalledSummary(Request $request, array $priceMap): array
    {
        $query = TransaksiDetail::query()
            ->join('transaksis', 'transaksis.id', '=', 'transaksi_details.transaksi_id')
            ->join('barangs', 'barangs.id', '=', 'transaksi_details.barang_id')
            ->where('transaksis.jenis_transaksi', 'KELUAR')
            ->where('transaksis.sub_jenis', '!=', 'TRANSFER_GUDANG')
            ->where(function ($q) {
                $q->whereIn('transaksis.status', ['COMPLETED', 'completed'])
                    ->orWhereNull('transaksis.status');
            });

        $this->applyTerpasangFilters($query, $request);

        $rows = $query
            ->select([
                'transaksi_details.barang_id',
                'transaksi_details.qty',
                'transaksis.kode_projek',
            ])
            ->get();

        $totalUnit = 0;
        $totalNilai = 0;

        foreach ($rows as $row) {
            $qty = (int) $row->qty;
            $harga = (float) ($priceMap[(int) $row->barang_id] ?? 0);

            $totalUnit += $qty;
            $totalNilai += $qty * $harga;
        }

        return [
            'total_unit' => $totalUnit,
            'nilai_aset' => $totalNilai,
            'total_project' => $rows
                ->pluck('kode_projek')
                ->filter(fn($value) => trim((string) $value) !== '')
                ->unique()
                ->count(),
            'jenis_barang' => $rows
                ->pluck('barang_id')
                ->unique()
                ->count(),
        ];
    }

    public function index(Request $request): Response
    {
        $tab = strtoupper((string) $request->input('tab', 'TERPASANG'));

        if (!in_array($tab, ['TERPASANG', 'GUDANG', 'STOK'], true)) {
            $tab = 'TERPASANG';
        }

        $perPage = max(
            5,
            min((int) $request->input('per_page', 10), 100)
        );

        $priceMap = $this->getLatestInboundPrices();
        $latestOutboundDates = $this->getLatestOutboundDates();

        $gudangs = Gudang::query()
            ->where('is_active', true)
            ->orderBy('nama_gudang')
            ->get([
                'id',
                'nama_gudang',
                'kode_gudang',
            ]);

        $projectOptions = Transaksi::query()
            ->where('jenis_transaksi', 'KELUAR')
            ->where('sub_jenis', '!=', 'TRANSFER_GUDANG')
            ->whereNotNull('kode_projek')
            ->where('kode_projek', '!=', '')
            ->where(function ($q) {
                $q->whereIn('status', ['COMPLETED', 'completed'])
                    ->orWhereNull('status');
            })
            ->distinct()
            ->orderBy('kode_projek')
            ->pluck('kode_projek')
            ->values();

        /*
         * ============================================
         * TAB 1: ASET PROJECT TERPASANG
         * ============================================
         */

        $terpasangQuery = TransaksiDetail::query()
            ->join('transaksis', 'transaksis.id', '=', 'transaksi_details.transaksi_id')
            ->join('barangs', 'barangs.id', '=', 'transaksi_details.barang_id')
            ->where('transaksis.jenis_transaksi', 'KELUAR')
            ->where('transaksis.sub_jenis', '!=', 'TRANSFER_GUDANG')
            ->where(function ($q) {
                $q->whereIn('transaksis.status', ['COMPLETED', 'completed'])
                    ->orWhereNull('transaksis.status');
            });

        $this->applyTerpasangFilters($terpasangQuery, $request);

        $terpasang = $terpasangQuery
            ->select([
                'barangs.id as barang_id',
                'barangs.kode_barang',
                'barangs.nama_barang',
                'barangs.brand',
                'barangs.tipe',
                'barangs.kategori',
                'barangs.part_number',
                'transaksis.kode_projek as project',
                'transaksis.nama_customer',
                DB::raw('SUM(transaksi_details.qty) as jumlah'),
            ])
            ->groupBy([
                'barangs.id',
                'barangs.kode_barang',
                'barangs.nama_barang',
                'barangs.brand',
                'barangs.tipe',
                'barangs.kategori',
                'barangs.part_number',
                'transaksis.kode_projek',
                'transaksis.nama_customer',
            ])
            ->orderBy('barangs.kode_barang')
            ->paginate(
                $perPage,
                ['*'],
                'terpasang_page'
            )
            ->withQueryString();

        $terpasang->getCollection()->transform(function ($row) use ($priceMap) {
            $row->jumlah = (int) $row->jumlah;
            $row->harga = (float) ($priceMap[(int) $row->barang_id] ?? 0);
            $row->nilai_aset = $row->jumlah * $row->harga;
            $row->status = 'Terpasang';

            return $row;
        });

        /*
         * ============================================
         * TAB 2: ASET PROJECT DI GUDANG
         * ============================================
         */

        $stokTable = (new Stok())->getTable();

        $gudangQuery = Stok::query()
            ->from("{$stokTable} as stok")
            ->join('barangs', 'barangs.id', '=', 'stok.barang_id')
            ->join('gudangs', 'gudangs.id', '=', 'stok.gudang_id')
            ->where('stok.jumlah', '>', 0);

        $this->applyStokFilters($gudangQuery, $request);

        $gudangAssets = $gudangQuery
            ->select([
                'stok.barang_id',
                'stok.gudang_id',
                'barangs.kode_barang',
                'barangs.nama_barang',
                'barangs.brand',
                'barangs.tipe',
                'barangs.kategori',
                'barangs.part_number',
                'gudangs.nama_gudang',
                'gudangs.kode_gudang',
                'stok.jumlah',
            ])
            ->orderBy('gudangs.nama_gudang')
            ->orderBy('barangs.kode_barang')
            ->paginate(
                $perPage,
                ['*'],
                'gudang_page'
            )
            ->withQueryString();

        $gudangAssets->getCollection()->transform(function ($row) use ($priceMap, $latestOutboundDates) {
            $barangId = (int) $row->barang_id;
            $gudangId = (int) $row->gudang_id;
            $key = $barangId . '_' . $gudangId;

            $row->jumlah = (int) $row->jumlah;
            $row->harga = (float) ($priceMap[$barangId] ?? 0);
            $row->nilai_aset = $row->jumlah * $row->harga;
            $row->keluar_data = $latestOutboundDates[$key] ?? null;

            return $row;
        });

        /*
         * ============================================
         * TAB 3: STOK PER GUDANG
         * ============================================
         */

        $stokQuery = Stok::query()
            ->from("{$stokTable} as stok")
            ->join('barangs', 'barangs.id', '=', 'stok.barang_id')
            ->join('gudangs', 'gudangs.id', '=', 'stok.gudang_id')
            ->where('stok.jumlah', '>', 0);

        $this->applyStokFilters($stokQuery, $request);

        $stokGudang = $stokQuery
            ->select([
                'stok.barang_id',
                'stok.gudang_id',
                'barangs.kode_barang',
                'barangs.nama_barang',
                'barangs.brand',
                'barangs.tipe',
                'barangs.kategori',
                'barangs.part_number',
                'gudangs.nama_gudang',
                'gudangs.kode_gudang',
                'stok.jumlah as total_stok',
            ])
            ->orderBy('gudangs.nama_gudang')
            ->orderBy('barangs.kode_barang')
            ->paginate(
                $perPage,
                ['*'],
                'stok_page'
            )
            ->withQueryString();

        $stokGudang->getCollection()->transform(function ($row) use ($priceMap) {
            $barangId = (int) $row->barang_id;

            $row->total_stok = (int) $row->total_stok;
            $row->harga = (float) ($priceMap[$barangId] ?? 0);
            $row->nilai_aset = $row->total_stok * $row->harga;

            return $row;
        });

        /*
         * ============================================
         * SUMMARY
         * ============================================
         */

        $summary = $this->getInstalledSummary(
            $request,
            $priceMap
        );

        return Inertia::render('RincianAset/Index', [
            'activeTab' => $tab,
            'terpasang' => $terpasang,
            'asetGudang' => $gudangAssets,
            'stokGudang' => $stokGudang,
            'summary' => $summary,
            'gudangs' => $gudangs,
            'projectOptions' => $projectOptions,
            'filters' => [
                'tab' => $tab,
                'search' => $request->input('search', ''),
                'project' => $request->input('project', ''),
                'gudang_id' => $request->input('gudang_id', 'ALL'),
                'start_date' => $request->input('start_date', ''),
                'end_date' => $request->input('end_date', ''),
                'per_page' => $perPage,
            ],
        ]);
    }
}