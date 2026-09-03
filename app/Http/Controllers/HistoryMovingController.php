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
        set_time_limit(120);

        $search    = $request->input('search', '');
        $jenis     = $request->input('jenis', 'ALL'); // ALL, MASUK, KELUAR, TRANSFER
        $gudangId  = $request->input('gudang_id', 'ALL');
        $barangId  = $request->input('barang_id', 'ALL');
        $kondisi   = $request->input('kondisi', 'ALL');
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $perPage   = (int) $request->input('per_page', 15);

        // Query transaksi mutasi
        $query = Transaksi::with([
            'gudangAsal:id,nama_gudang,kode_gudang',
            'gudangTujuan:id,nama_gudang,kode_gudang',
            'supplier:id,nama_supplier',
            'picUser:id,name',
            'details' => function ($q) {
                $q->select('id', 'transaksi_id', 'barang_id', 'qty', 'kondisi');
            },
            'details.barang:id,kode_barang,nama_barang,brand,tipe,kategori,part_number,deskripsi,is_wajib_sn',
            'details.serials:id,serial_number,kondisi'
        ])
            ->where(function ($q) {
                $q->whereIn('status', ['COMPLETED', 'completed'])
                  ->orWhereNull('status');
            })
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->orderBy('tanggal', 'desc')
            ->orderBy('id', 'desc');

        // Filter Jenis / Tipe Moving
        if ($jenis === 'MASUK') {
            $query->where('jenis_transaksi', 'MASUK')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } elseif ($jenis === 'KELUAR') {
            $query->where('jenis_transaksi', 'KELUAR')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } elseif ($jenis === 'TRANSFER') {
            $query->where(function ($q) {
                $q->where('jenis_transaksi', 'TRANSFER')
                  ->orWhere('sub_jenis', 'TRANSFER_GUDANG');
            });
        }

        // Filter Gudang (Asal atau Tujuan)
        if ($gudangId && $gudangId !== 'ALL') {
            $query->where(function ($q) use ($gudangId) {
                $q->where('gudang_asal_id', (int) $gudangId)
                  ->orWhere('gudang_tujuan_id', (int) $gudangId);
            });
        }

        // Filter Barang Terpilih
        if ($barangId && $barangId !== 'ALL') {
            $query->whereExists(function ($sub) use ($barangId) {
                $sub->select(DB::raw(1))
                    ->from('transaksi_details')
                    ->whereColumn('transaksi_details.transaksi_id', 'transaksis.id')
                    ->where('transaksi_details.barang_id', (int) $barangId);
            });
        }

        // Filter Kondisi Fisik
        if ($kondisi && $kondisi !== 'ALL') {
            $query->where(function ($q) use ($kondisi) {
                $q->where('kondisi', 'like', "%{$kondisi}%")
                  ->orWhereExists(function ($sub) use ($kondisi) {
                      $sub->select(DB::raw(1))
                          ->from('transaksi_details')
                          ->whereColumn('transaksi_details.transaksi_id', 'transaksis.id')
                          ->where('transaksi_details.kondisi', 'like', "%{$kondisi}%");
                  });
            });
        }

        // Filter Pencarian Universal
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "%{$search}%")
                  ->orWhere('nomor_imc', 'like', "%{$search}%")
                  ->orWhere('nomor_omc', 'like', "%{$search}%")
                  ->orWhere('pihak_asal', 'like', "%{$search}%")
                  ->orWhereExists(function ($sub) use ($search) {
                      $sub->select(DB::raw(1))
                          ->from('transaksi_details')
                          ->join('barangs', 'transaksi_details.barang_id', '=', 'barangs.id')
                          ->whereColumn('transaksi_details.transaksi_id', 'transaksis.id')
                          ->where(function ($qb) use ($search) {
                              $qb->where('barangs.nama_barang', 'like', "%{$search}%")
                                 ->orWhere('barangs.kode_barang', 'like', "%{$search}%")
                                 ->orWhere('barangs.brand', 'like', "%{$search}%")
                                 ->orWhere('barangs.tipe', 'like', "%{$search}%")
                                 ->orWhere('barangs.part_number', 'like', "%{$search}%");
                          });
                  })
                  ->orWhereExists(function ($sub) use ($search) {
                      $sub->select(DB::raw(1))
                          ->from('transaksi_details')
                          ->join('transaksi_detail_serials', 'transaksi_details.id', '=', 'transaksi_detail_serials.transaksi_detail_id')
                          ->join('barang_serials', 'transaksi_detail_serials.barang_serial_id', '=', 'barang_serials.id')
                          ->whereColumn('transaksi_details.transaksi_id', 'transaksis.id')
                          ->where('barang_serials.serial_number', 'like', "%{$search}%");
                  });
            });
        }

        $movings = $query->paginate($perPage)->withQueryString();

        $barangList = Barang::select(['id', 'kode_barang', 'nama_barang', 'brand', 'tipe', 'kategori'])
            ->orderBy('kode_barang', 'asc')
            ->get();

        return Inertia::render('HistoryMoving/Index', [
            'movings'  => $movings,
            'gudangs'  => Gudang::where('is_active', true)->get(['id', 'nama_gudang', 'kode_gudang']),
            'barangs'  => $barangList,
            'filters'  => [
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

        $search    = $request->input('search', '');
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
            'details.barang',
            'details.serials'
        ])
            ->where(function ($q) {
                $q->whereIn('status', ['COMPLETED', 'completed'])
                  ->orWhereNull('status');
            })
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->orderBy('tanggal', 'desc');

        if ($jenis === 'MASUK') {
            $query->where('jenis_transaksi', 'MASUK')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } elseif ($jenis === 'KELUAR') {
            $query->where('jenis_transaksi', 'KELUAR')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } elseif ($jenis === 'TRANSFER') {
            $query->where(function ($q) {
                $q->where('jenis_transaksi', 'TRANSFER')
                  ->orWhere('sub_jenis', 'TRANSFER_GUDANG');
            });
        }

        if ($gudangId && $gudangId !== 'ALL') {
            $query->where(function ($q) use ($gudangId) {
                $q->where('gudang_asal_id', (int) $gudangId)
                  ->orWhere('gudang_tujuan_id', (int) $gudangId);
            });
        }

        if ($barangId && $barangId !== 'ALL') {
            $query->whereExists(function ($sub) use ($barangId) {
                $sub->select(DB::raw(1))
                    ->from('transaksi_details')
                    ->whereColumn('transaksi_details.transaksi_id', 'transaksis.id')
                    ->where('transaksi_details.barang_id', (int) $barangId);
            });
        }

        if ($kondisi && $kondisi !== 'ALL') {
            $query->where(function ($q) use ($kondisi) {
                $q->where('kondisi', 'like', "%{$kondisi}%")
                  ->orWhereExists(function ($sub) use ($kondisi) {
                      $sub->select(DB::raw(1))
                          ->from('transaksi_details')
                          ->whereColumn('transaksi_details.transaksi_id', 'transaksis.id')
                          ->where('transaksi_details.kondisi', 'like', "%{$kondisi}%");
                  });
            });
        }

        $records = $query->get();
        $fileName = "History_Moving_{$startDate}_sampai_{$endDate}.csv";

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        $callback = function () use ($records) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");

            fputcsv($file, [
                'Tanggal',
                'No Transaksi',
                'Tipe Moving',
                'Sub Jenis',
                'Kode PPL',
                'Nama Barang',
                'Part Number',
                'Qty',
                'Kondisi',
                'Dari (Asal)',
                'Ke (Tujuan)',
                'No IMC',
                'No OMC',
                'Serial Numbers'
            ], ';');

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
                    $r->nomor_imc ?: '-',
                    $r->nomor_omc ?: '-',
                    $snText
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}