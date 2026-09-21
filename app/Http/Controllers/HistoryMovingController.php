<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\Gudang;
use App\Models\Transaksi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HistoryMovingController extends Controller
{
    public function index(Request $request): Response
    {
        $search    = trim((string) $request->input('search', ''));
        $jenis     = $request->input('jenis', 'ALL'); // ALL, MASUK, KELUAR, TRANSFER
        $gudangId  = $request->input('gudang_id', 'ALL');
        $barangId  = $request->input('barang_id', 'ALL');
        $kondisi   = $request->input('kondisi', 'ALL');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $perPage   = min(max((int) $request->input('per_page', 15), 1), 100);

        // 1. Query Utama Transaksi Mutasi
        $query = Transaksi::query()
            ->select([
                'id', 'no_transaksi', 'jenis_transaksi', 'sub_jenis', 'tanggal', 
                'kondisi', 'nomor_imc', 'nomor_omc', 'pihak_asal', 'kode_projek', 
                'nama_customer', 'gudang_asal_id', 'gudang_tujuan_id', 'supplier_id', 
                'pic_user_id', 'status'
            ])
            ->with([
                'gudangAsal:id,nama_gudang,kode_gudang',
                'gudangTujuan:id,nama_gudang,kode_gudang',
                'supplier:id,nama_supplier',
                'picUser:id,name',
                'details' => fn($q) => $q->select('id', 'transaksi_id', 'barang_id', 'qty', 'kondisi'),
                // Eager load 'stoks' agar Accessor total_stok pada Barang tidak memicu N+1 Query
                'details.barang' => fn($q) => $q->select('id', 'kode_barang', 'nama_barang', 'brand', 'tipe', 'kategori', 'part_number', 'deskripsi', 'is_wajib_sn')
                    ->with('stoks:id,barang_id,gudang_id,jumlah'),
                'details.serials'
            ])
            ->where(function ($q) {
                $q->whereIn('status', ['COMPLETED', 'completed'])
                  ->orWhereNull('status');
            })
            ->whereBetween('tanggal', [$startDate, $endDate]);

        // 2. Filter Jenis Transaksi
        if ($jenis === 'MASUK') {
            $query->where('jenis_transaksi', 'MASUK')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } elseif ($jenis === 'KELUAR') {
            $query->where('jenis_transaksi', 'KELUAR')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } elseif ($jenis === 'TRANSFER') {
            $query->where(fn($q) => $q->where('jenis_transaksi', 'TRANSFER')->orWhere('sub_jenis', 'TRANSFER_GUDANG'));
        }

        // 3. Filter Gudang
        if ($gudangId && $gudangId !== 'ALL') {
            $gid = (int) $gudangId;
            $query->where(fn($q) => $q->where('gudang_asal_id', $gid)->orWhere('gudang_tujuan_id', $gid));
        }

        // 4. Filter Barang (Direct SQL Subquery tanpa array pluck raksasa)
        if ($barangId && $barangId !== 'ALL') {
            $bid = (int) $barangId;
            $query->whereHas('details', fn($q) => $q->where('barang_id', $bid));
        }

        // 5. Filter Kondisi
        if ($kondisi && $kondisi !== 'ALL') {
            $query->where(function ($q) use ($kondisi) {
                $q->where('kondisi', 'like', "%{$kondisi}%")
                  ->orWhereHas('details', fn($qd) => $qd->where('kondisi', 'like', "%{$kondisi}%"));
            });
        }

        // 6. Pencarian Global (Direct SQL Subquery tanpa merge array di memori PHP)
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "%{$search}%")
                  ->orWhere('nomor_imc', 'like', "%{$search}%")
                  ->orWhere('nomor_omc', 'like', "%{$search}%")
                  ->orWhere('pihak_asal', 'like', "%{$search}%")
                  ->orWhere('kode_projek', 'like', "%{$search}%")
                  ->orWhere('nama_customer', 'like', "%{$search}%")
                  ->orWhereHas('details.barang', function ($qb) use ($search) {
                      $qb->where('nama_barang', 'like', "%{$search}%")
                         ->orWhere('kode_barang', 'like', "%{$search}%")
                         ->orWhere('brand', 'like', "%{$search}%")
                         ->orWhere('tipe', 'like', "%{$search}%")
                         ->orWhere('part_number', 'like', "%{$search}%");
                  })
                  ->orWhereHas('details.serials', function ($qs) use ($search) {
                      $qs->where('serial_number', 'like', "%{$search}%");
                  });
            });
        }

        $movings = $query->orderBy('tanggal', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('HistoryMoving/Index', [
            'movings' => $movings,
            // Menggunakan Query DB Direct agar tidak memicu Accessor total_stok Eloquent
            'gudangs' => fn() => Gudang::where('is_active', true)->get(['id', 'nama_gudang', 'kode_gudang']),
            'barangs' => fn() => DB::table('barangs')
                ->select(['id', 'kode_barang', 'nama_barang', 'brand', 'tipe'])
                ->orderBy('kode_barang', 'asc')
                ->get(),
            'filters' => [
                'search'     => $search,
                'jenis'      => $jenis,
                'gudang_id'  => $gudangId,
                'barang_id'  => $barangId,
                'kondisi'    => $kondisi,
                'start_date' => $startDate,
                'end_date'   => $endDate,
                'per_page'   => $perPage,
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        set_time_limit(180);

        $search    = trim((string) $request->input('search', ''));
        $jenis     = $request->input('jenis', 'ALL');
        $gudangId  = $request->input('gudang_id', 'ALL');
        $barangId  = $request->input('barang_id', 'ALL');
        $kondisi   = $request->input('kondisi', 'ALL');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        $query = Transaksi::with([
            'gudangAsal:id,nama_gudang',
            'gudangTujuan:id,nama_gudang',
            'supplier:id,nama_supplier',
            'details.barang' => fn($q) => $q->with('stoks:id,barang_id,gudang_id,jumlah'),
            'details.serials'
        ])
        ->where(function ($q) {
            $q->whereIn('status', ['COMPLETED', 'completed'])
              ->orWhereNull('status');
        })
        ->whereBetween('tanggal', [$startDate, $endDate]);

        if ($jenis === 'MASUK') {
            $query->where('jenis_transaksi', 'MASUK')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } elseif ($jenis === 'KELUAR') {
            $query->where('jenis_transaksi', 'KELUAR')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } elseif ($jenis === 'TRANSFER') {
            $query->where(fn($q) => $q->where('jenis_transaksi', 'TRANSFER')->orWhere('sub_jenis', 'TRANSFER_GUDANG'));
        }

        if ($gudangId && $gudangId !== 'ALL') {
            $gid = (int) $gudangId;
            $query->where(fn($q) => $q->where('gudang_asal_id', $gid)->orWhere('gudang_tujuan_id', $gid));
        }

        if ($barangId && $barangId !== 'ALL') {
            $bid = (int) $barangId;
            $query->whereHas('details', fn($q) => $q->where('barang_id', $bid));
        }

        if ($kondisi && $kondisi !== 'ALL') {
            $query->where(function ($q) use ($kondisi) {
                $q->where('kondisi', 'like', "%{$kondisi}%")
                  ->orWhereHas('details', fn($qd) => $qd->where('kondisi', 'like', "%{$kondisi}%"));
            });
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "%{$search}%")
                  ->orWhere('nomor_imc', 'like', "%{$search}%")
                  ->orWhere('nomor_omc', 'like', "%{$search}%")
                  ->orWhere('pihak_asal', 'like', "%{$search}%")
                  ->orWhere('kode_projek', 'like', "%{$search}%")
                  ->orWhere('nama_customer', 'like', "%{$search}%")
                  ->orWhereHas('details.barang', function ($qb) use ($search) {
                      $qb->where('nama_barang', 'like', "%{$search}%")
                         ->orWhere('kode_barang', 'like', "%{$search}%")
                         ->orWhere('brand', 'like', "%{$search}%")
                         ->orWhere('tipe', 'like', "%{$search}%")
                         ->orWhere('part_number', 'like', "%{$search}%");
                  })
                  ->orWhereHas('details.serials', function ($qs) use ($search) {
                      $qs->where('serial_number', 'like', "%{$search}%");
                  });
            });
        }

        $query->orderBy('tanggal', 'desc')->orderBy('id', 'desc');

        $fileName = "History_Moving_{$startDate}_sampai_{$endDate}.csv";
        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($query) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, [
                'Tanggal', 'No Transaksi', 'Tipe Moving', 'Sub Jenis', 'Kode PPL', 
                'Nama Barang', 'Part Number', 'Qty', 'Kondisi', 'Dari (Asal)', 
                'Ke (Tujuan)', 'Kode Projek', 'Nama Customer', 'No IMC', 'No OMC', 'Serial Numbers'
            ], ';');

            // Chunking per 250 record agar hemat RAM dan cepat
            $query->chunk(250, function ($records) use ($file) {
                foreach ($records as $r) {
                    $detail = $r->details->first();
                    $b = $detail?->barang;
                    $nama = $b ? trim("{$b->brand} {$b->tipe} {$b->kategori}") ?: $b->nama_barang : '-';
                    $snText = $detail && $detail->serials->isNotEmpty()
                        ? $detail->serials->map(fn($s) => "{$s->serial_number} (" . ($s->kondisi ?: 'Baru') . ")")->implode(', ')
                        : '-';

                    fputcsv($file, [
                        $r->tanggal ? date('Y-m-d', strtotime($r->tanggal)) : '-',
                        $r->no_transaksi,
                        $r->jenis_transaksi,
                        $r->sub_jenis ?: '-',
                        $b?->kode_barang ?? '-',
                        $nama,
                        $b?->part_number ?? '-',
                        $detail?->qty ?? 0,
                        $r->kondisi ?: 'Baru',
                        $r->gudangAsal?->nama_gudang ?: ($r->pihak_asal ?: '-'),
                        $r->gudangTujuan?->nama_gudang ?: ($r->pihak_asal ?: '-'),
                        $r->kode_projek ?: '-',
                        $r->nama_customer ?: '-',
                        $r->nomor_imc ?: '-',
                        $r->nomor_omc ?: '-',
                        $snText
                    ], ';');
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}