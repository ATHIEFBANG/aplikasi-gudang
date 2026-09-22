<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangSerial;
use App\Models\Gudang;
use App\Models\Stok;
use App\Models\StockLog;
use App\Models\Supplier;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransaksiController extends Controller
{
    /**
     * Reconcile / Sinkronisasi Stok & Serial Number dengan Transaksi Riil yang Ada
     */
    private function syncStokAndSerials(): void
    {
        // 1. Hapus Serial Number yatim (yang transaksi dasarnya sudah dihapus)
        $activeSerialIds = DB::table('transaksi_detail_serials')->pluck('barang_serial_id')->toArray();
        if (!empty($activeSerialIds)) {
            BarangSerial::whereNotIn('id', $activeSerialIds)->delete();
        } else {
            BarangSerial::query()->delete();
        }

        // 2. Reset semua stok di tabel `stoks` menjadi 0
        Stok::query()->update(['jumlah' => 0]);

        // 3. Hitung ulang stok murni dari transaksi yang MASIH ADA di database
        $transaksis = Transaksi::with('details')->get();
        foreach ($transaksis as$t) {
            foreach ($t->details as$d) {
                if ($t->jenis_transaksi === 'MASUK' && $t->gudang_tujuan_id) {$stok = Stok::firstOrCreate(
                        ['barang_id' => $d->barang_id, 'gudang_id' =>$t->gudang_tujuan_id],
                        ['jumlah' => 0]
                    );
                    $stok->increment('jumlah',$d->qty);
                } elseif ($t->jenis_transaksi === 'KELUAR' &&$t->gudang_asal_id) {
                    $stok = Stok::where('barang_id',$d->barang_id)
                        ->where('gudang_id', $t->gudang_asal_id)
                        ->first();
                    if ($stok) {$stok->decrement('jumlah', min($stok->jumlah,$d->qty));
                    }
                } elseif ($t->jenis_transaksi === 'TRANSFER') {
                    if ($t->gudang_asal_id) {$stokAsal = Stok::where('barang_id', $d->barang_id)->where('gudang_id',$t->gudang_asal_id)->first();
                        if ($stokAsal) {$stokAsal->decrement('jumlah', min($stokAsal->jumlah,$d->qty));
                        }
                    }
                    if ($t->gudang_tujuan_id) {$stokTujuan = Stok::firstOrCreate(
                            ['barang_id' => $d->barang_id, 'gudang_id' =>$t->gudang_tujuan_id],
                            ['jumlah' => 0]
                        );
                        $stokTujuan->increment('jumlah',$d->qty);
                    }
                }
            }
        }
    }

    public function index(Request $request): Response
    {
        // 💡 Otomatis bersihkan stok yatim & sinkronkan tabel stoks/serials setiap membuka halaman
        $this->syncStokAndSerials();

        $jenis    =$request->input('jenis_transaksi', 'MASUK');
        $search   =$request->input('search');
        $perPage  = (int)$request->input('per_page', 10);

        $rawOrder = strtolower((string) $request->input('order', 'desc'));$order    = in_array($rawOrder, ['asc', 'desc'], true) ?$rawOrder : 'desc';

        // 1. Query Transaksi Utama
        $query = Transaksi::with([
            'gudangAsal:id,nama_gudang',
            'gudangTujuan:id,nama_gudang',
            'supplier:id,nama_supplier',
            'picUser:id,name',
            'details.barang:id,kode_barang,nama_barang,brand,tipe,kategori,part_number,deskripsi,is_wajib_sn,is_wajib_pn',
            'details.serials'
        ])
            ->orderBy('tanggal', $order)
            ->orderBy('id', $order);

        if ($jenis === 'TRANSFER') {$query->where(function ($q) {$q->where('jenis_transaksi', 'TRANSFER')
                  ->orWhere('sub_jenis', 'TRANSFER_GUDANG');
            });
        } elseif ($jenis === 'KELUAR') {$query->where('jenis_transaksi', 'KELUAR')
                  ->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } else {
            $query->where('jenis_transaksi', 'MASUK')
                  ->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        }

        if ($search) {$query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "\%{$search}%")
                  ->orWhere('nomor_imc', 'like', "%{$search}%")
                  ->orWhere('nomor_omc', 'like', "%{$search}%")
                  ->orWhere('pihak_asal', 'like', "%{$search}%")
                  ->orWhere('kode_projek', 'like', "%{$search}%")
                  ->orWhere('nama_customer', 'like', "%{$search}%")
                  ->orWhereHas('details.barang', function ($qb) use ($search) {
                      $qb->where('nama_barang', 'like', "\%{$search}%")
                         ->orWhere('kode_barang', 'like', "%{$search}%")
                         ->orWhere('brand', 'like', "%{$search}%")
                         ->orWhere('tipe', 'like', "%{$search}%")
                         ->orWhere('kategori', 'like', "%{$search}%")
                         ->orWhere('part_number', 'like', "%{$search}%");
                  });
            });
        }

        // 2. Ringkasan Stok Gudang Presisi
        $snRaw = BarangSerial::whereIn('status', ['IN_WAREHOUSE', 'READY', 'AVAILABLE'])
            ->whereNotNull('gudang_id')
            ->select('gudang_id', 'kondisi', DB::raw('COUNT(*) as total'))
            ->groupBy('gudang_id', 'kondisi')
            ->get();

        $snByGudang = [];
        foreach ($snRaw as$row) {
            $gId =$row->gudang_id;
            $k   = strtoupper(trim($row->kondisi ?? 'BARU'));
            if (!isset($snByGudang[$gId])) {
                $snByGudang[$gId] = ['baru' => 0, 'bekas' => 0, 'rusak' => 0];
            }
            if (str_contains($k, 'RUSAK')) {$snByGudang[$gId]['rusak'] +=$row->total;
            } elseif (str_contains($k, 'BEKAS') || str_contains($k, 'SECOND')) {$snByGudang[$gId]['bekas'] +=$row->total;
            } else {
                $snByGudang[$gId]['baru'] +=$row->total;
            }
        }

        $stokAllRaw = Stok::select('gudang_id', DB::raw('SUM(jumlah) as total_qty'))
            ->groupBy('gudang_id')
            ->pluck('total_qty', 'gudang_id');

        $gudangList = Gudang::where('is_active', true)
            ->get(['id', 'nama_gudang', 'kode_gudang'])
            ->map(function ($g) use ($snByGudang,$stokAllRaw) {
                $snData =$snByGudang[$g->id] ?? ['baru' => 0, 'bekas' => 0, 'rusak' => 0];$totalStokFisik = (int) ($stokAllRaw[$g->id] ?? 0);
                $snTotal =$snData['baru'] + $snData['bekas'] +$snData['rusak'];

                if ($snTotal > 0) {$g->stok_baru  = $snData['baru'];$g->stok_bekas = $snData['bekas'];$g->stok_rusak = $snData['rusak'];$g->total_stok = max($totalStokFisik,$snTotal);
                } else {
                    $g->stok_baru  =$totalStokFisik;
                    $g->stok_bekas = 0;
                    $g->stok_rusak = 0;
                    $g->total_stok =$totalStokFisik;
                }
                return $g;
            });

        // 3. Master Barang Ringan untuk Modal (Lengkap dengan Relasi Serials & Transaksi)
        $barangList = Barang::select([
            'id', 
            'kode_barang', 
            'nama_barang', 
            'part_number', 
            'brand', 
            'tipe', 
            'kategori', 
            'deskripsi', 
            'is_wajib_sn', 
            'is_wajib_pn'
        ])
        ->with([
            'stoks:id,barang_id,gudang_id,jumlah',
            'serials' => function($q) {$q->select('id', 'barang_id', 'gudang_id', 'serial_number', 'kondisi', 'status', 'nomer_imc')
                  ->whereIn('status', ['IN_WAREHOUSE', 'READY', 'AVAILABLE']);
            },
            'transaksiDetails' => function($q) {$q->select('id', 'transaksi_id', 'barang_id', 'qty', 'kondisi')
                  ->with(['transaksi:id,no_transaksi,jenis_transaksi,sub_jenis,gudang_asal_id,gudang_tujuan_id,nomor_imc']);
            }
        ])
        ->get()
        ->map(fn($b) => [
            'id'                => $b->id,
            'kode_barang'       => $b->kode_barang,
            'nama_barang'       => $b->nama_barang,
            'part_number'       => $b->part_number,
            'brand'             => $b->brand,
            'tipe'              => $b->tipe,
            'kategori'          => $b->kategori,
            'deskripsi'         => $b->deskripsi,
            'is_wajib_sn'       => (bool) $b->is_wajib_sn,
            'is_wajib_pn'       => (bool) $b->is_wajib_pn,
            'stoks'             => $b->stoks->map(fn($s) => [
                'id'        => $s->id,
                'barang_id' => $s->barang_id,
                'gudang_id' => $s->gudang_id,
                'jumlah'    => (int) $s->jumlah,
            ]),
            'serials'           => $b->serials->map(fn($s) => [
                'id'            => $s->id,
                'barang_id'     => $s->barang_id,
                'gudang_id'     => $s->gudang_id,
                'serial_number' => $s->serial_number,
                'kondisi'       => $s->kondisi,
                'status'        => $s->status,
                'nomor_imc'     => $s->nomer_imc,
            ]),
            'transaksi_details' => $b->transaksiDetails->map(fn($td) => [
                'id'           => $td->id,
                'transaksi_id' => $td->transaksi_id,
                'barang_id'    => $td->barang_id,
                'qty'          => (int) $td->qty,
                'kondisi'      => $td->kondisi,
                'transaksi'    => $td->transaksi ? [
                    'id'               => $td->transaksi->id,
                    'no_transaksi'     => $td->transaksi->no_transaksi,
                    'jenis_transaksi'  => $td->transaksi->jenis_transaksi,
                    'sub_jenis'        => $td->transaksi->sub_jenis,
                    'gudang_asal_id'   => $td->transaksi->gudang_asal_id,
                    'gudang_tujuan_id' => $td->transaksi->gudang_tujuan_id,
                    'nomor_imc'        => $td->transaksi->nomor_imc,
                ] : null,
            ]),
        ]);

        return Inertia::render('Transaksi/Index', [
            'transaksis' => $query->paginate($perPage)->withQueryString(),
            'gudangs'    => $gudangList,
            'suppliers'  => Supplier::all(['id', 'nama_supplier']),
            'barangs'    => $barangList,
            'filters'    => [
                'jenis_transaksi' => $jenis,
                'search'          => $search ?? '',
                'order'           => $order,
                'per_page'        => $perPage,
            ],
        ]);
    }

    public function getSerialsByBarang(Request $request, int$barangId)
    {
        $gudangId =$request->input('gudang_id');

        $query = BarangSerial::select('id', 'barang_id', 'gudang_id', 'serial_number', 'kondisi', 'status')
            ->where('barang_id', $barangId)
            ->where('status', 'IN_WAREHOUSE');

        if ($gudangId) {
            $query->where('gudang_id',$gudangId);
        }

        return response()->json($query->get());
    }

    public function destroy(int $id)
    {
        $transaksi = Transaksi::with(['details.serials'])->findOrFail($id);
        
        DB::transaction(function () use ($transaksi) {
            foreach ($transaksi->details as$detail) {
                if ($detail->serials) {
                    $serialIds =$detail->serials->pluck('id')->toArray();
                    if (!empty($serialIds)) {
                        DB::table('transaksi_detail_serials')->whereIn('barang_serial_id', $serialIds)->delete();
                        BarangSerial::whereIn('id', $serialIds)->delete();
                    }
                }
            }
            $transaksi->delete();
        });

        $this->syncStokAndSerials();

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:transaksis,id',
        ]);

        DB::transaction(function () use ($request) {
            $transaksis = Transaksi::with(['details.serials'])->whereIn('id',$request->ids)->get();
            foreach ($transaksis as$transaksi) {
                foreach ($transaksi->details as$detail) {
                    if ($detail->serials) {
                        $serialIds =$detail->serials->pluck('id')->toArray();
                        if (!empty($serialIds)) {
                            DB::table('transaksi_detail_serials')->whereIn('barang_serial_id', $serialIds)->delete();
                            BarangSerial::whereIn('id', $serialIds)->delete();
                        }
                    }
                }
                $transaksi->delete();
            }
        });

        $this->syncStokAndSerials();

        return redirect()->back()->with('success', count($request->ids) . ' transaksi terpilih berhasil dihapus.');
    }

    public function reset(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Hanya Admin yang dapat mengosongkan data transaksi.');
        }

        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::table('transaksi_detail_serials')->truncate();
            TransaksiDetail::truncate();
            StockLog::truncate();
            BarangSerial::truncate();
            Stok::truncate();
            Transaksi::truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } else {
            DB::table('transaksi_detail_serials')->delete();
            TransaksiDetail::query()->delete();
            StockLog::query()->delete();
            BarangSerial::query()->delete();
            Stok::query()->delete();
            Transaksi::query()->delete();
        }

        return redirect()->back()->with('success', 'Seluruh Riwayat Transaksi berhasil dikosongkan.');
    }

    public function export(Request $request): StreamedResponse
    {
        set_time_limit(180);

        $jenis    = $request->input('jenis_transaksi', 'MASUK');$rawOrder = strtolower((string) $request->input('order', 'desc'));$order    = in_array($rawOrder, ['asc', 'desc'], true) ?$rawOrder : 'desc';

        $query = Transaksi::with(['gudangAsal', 'gudangTujuan', 'details.barang', 'details.serials'])
            ->orderBy('tanggal', $order);

        if ($jenis === 'TRANSFER') {$query->where(fn($q) =>$q->where('jenis_transaksi', 'TRANSFER')->orWhere('sub_jenis', 'TRANSFER_GUDANG'));
        } elseif ($jenis === 'KELUAR') {$query->where('jenis_transaksi', 'KELUAR')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } else {
            $query->where('jenis_transaksi', 'MASUK')->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        }

        $transaksis  =$query->get();
        $csvFileName = 'Transaksi_' .$jenis . '_' . date('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$csvFileName}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $columns = [
            'No Transaksi', 
            'Jenis Transaksi', 
            'Kode PPL', 
            'Nama Barang', 
            'Part Number', 
            'Satuan', 
            'Tanggal', 
            'QTY', 
            'Harga Satuan (Rp)',
            'Total Nilai (Rp)',
            'Kondisi', 
            'Nomor IMC', 
            'Nomor OMC', 
            'Kode Projek', 
            'Nama Customer', 
            'Gudang Asal / Pihak Asal', 
            'Gudang Tujuan / Site', 
            'Serial Numbers'
        ];

        $callback = function () use ($transaksis, $columns) {$file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file,$columns, ';');

            foreach ($transaksis as$t) {
                $detail      =$t->details->first();
                $barang      =$detail?->barang;
                $snList      =$detail ? $detail->serials->map(fn($s) => "{$s->serial_number} ({$s->kondisi})")->implode(', ') : '-';
                $namaLengkap = $barang ? trim("{$barang->brand} {$barang->tipe} {$barang->kategori}") : '-';
                $hargaSatuan =$detail?->harga ?? 0;
                $totalNilai  = ($detail?->qty ?? 0) * $hargaSatuan;

                fputcsv($file, [
                    $t->no_transaksi,$t->sub_jenis ?? $t->jenis_transaksi,$barang?->kode_barang ?? '-',
                    $namaLengkap ?: ($barang?->nama_barang ?? '-'),
                    $barang?->part_number ?? '-',
                    $barang?->deskripsi ?? 'Unit',
                    $t->tanggal ? date('Y-m-d', strtotime($t->tanggal)) : '-',$detail?->qty ?? 0,
                    $hargaSatuan > 0 ? number_format($hargaSatuan, 0, ',', '.') : '-',$totalNilai > 0 ? number_format($totalNilai, 0, ',', '.') : '-',$t->kondisi ?? '-',
                    $t->nomor_imc ?? '-',
                    $t->nomor_omc ?? '-',
                    $t->kode_projek ?? '-',
                    $t->nama_customer ?? '-',
                    $t->gudangAsal?->nama_gudang ?? ($t->pihak_asal ?? '-'),
                    $t->gudangTujuan?->nama_gudang ?? ($t->pihak_asal ?? '-'),
                    $snList ?: '-',
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200,$headers);
    }
}