<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\Gudang;
use App\Models\Stok;
use App\Models\StockLog;
use App\Models\Supplier;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\BarangSerial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TransaksiController extends Controller
{
    public function index(Request $request): Response
    {
        $jenis   = $request->input('jenis_transaksi');
        $search  = $request->input('search');
        $perPage = (int) $request->input('per_page', 10);

        $query = Transaksi::with(['gudangAsal', 'gudangTujuan', 'supplier', 'picUser', 'details.barang'])
            ->latest('tanggal')
            ->latest('id');

        if ($jenis && $jenis !== 'ALL') {
            $query->where('jenis_transaksi', $jenis);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "%{$search}%")
                  ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        $transaksis = $query->paginate($perPage)->withQueryString();
        $gudangs    = Gudang::where('is_active', true)->get(['id', 'nama_gudang']);
        $suppliers  = Supplier::all(['id', 'nama_supplier']);
        $barangs    = Barang::all(['id', 'kode_barang', 'nama_barang', 'is_wajib_sn']);

        return Inertia::render('Transaksi/Index', [
            'transaksis' => $transaksis,
            'gudangs'    => $gudangs,
            'suppliers'  => $suppliers,
            'barangs'    => $barangs,
            'filters'    => $request->only(['jenis_transaksi', 'search', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'jenis_transaksi'  => 'required|in:MASUK,KELUAR,TRANSFER,PINJAM,KEMBALI',
            'tanggal'          => 'required|date',
            'gudang_asal_id'   => 'nullable|required_if:jenis_transaksi,KELUAR,TRANSFER,PINJAM|exists:gudangs,id',
            'gudang_tujuan_id' => 'nullable|required_if:jenis_transaksi,MASUK,TRANSFER,KEMBALI|exists:gudangs,id',
            'supplier_id'      => 'nullable|exists:suppliers,id',
            'keterangan'       => 'nullable|string',
            'items'            => 'required|array|min:1',
            'items.*.barang_id'=> 'required|exists:barangs,id',
            'items.*.qty'      => 'required|integer|min:1',
            'items.*.serials'  => 'nullable|array',
        ]);

        DB::transaction(function () use ($request) {
            $noTransaksi = 'TRX-' . strtoupper($request->jenis_transaksi) . '-' . date('YmdHis');

            $transaksi = Transaksi::create([
                'no_transaksi'     => $noTransaksi,
                'jenis_transaksi'  => $request->jenis_transaksi,
                'tanggal'          => $request->tanggal,
                'gudang_asal_id'   => $request->gudang_asal_id,
                'gudang_tujuan_id' => $request->gudang_tujuan_id,
                'supplier_id'      => $request->supplier_id,
                'pic_user_id'      => $request->user()->id,
                'keterangan'       => $request->keterangan,
                'status'           => 'COMPLETED',
            ]);

            foreach ($request->items as $item) {
                $barangId = $item['barang_id'];
                $qty      = (int) $item['qty'];

                // 1. Simpan detail item
                TransaksiDetail::create([
                    'transaksi_id' => $transaksi->id,
                    'barang_id'    => $barangId,
                    'qty'          => $qty,
                ]);

                // 2. Mutasi Stok berdasarkan jenis transaksi
                if ($request->jenis_transaksi === 'MASUK' || $request->jenis_transaksi === 'KEMBALI') {
                    $stok = Stok::firstOrCreate(
                        ['barang_id' => $barangId, 'gudang_id' => $request->gudang_tujuan_id],
                        ['jumlah' => 0]
                    );
                    $stok->increment('jumlah', $qty);

                    StockLog::create([
                        'barang_id'     => $barangId,
                        'gudang_id'     => $request->gudang_tujuan_id,
                        'transaksi_id'  => $transaksi->id,
                        'user_id'       => $request->user()->id,
                        'qty_perubahan' => +$qty,
                        'qty_akhir'     => $stok->jumlah,
                        'keterangan'    => "Penerimaan Barang ({$request->jenis_transaksi})",
                    ]);
                } elseif ($request->jenis_transaksi === 'KELUAR' || $request->jenis_transaksi === 'PINJAM') {
                    $stok = Stok::where('barang_id', $barangId)
                        ->where('gudang_id', $request->gudang_asal_id)
                        ->first();

                    if (!$stok || $stok->jumlah < $qty) {
                        throw new \Exception("Stok tidak mencukupi di gudang asal untuk barang ID: {$barangId}");
                    }

                    $stok->decrement('jumlah', $qty);

                    StockLog::create([
                        'barang_id'     => $barangId,
                        'gudang_id'     => $request->gudang_asal_id,
                        'transaksi_id'  => $transaksi->id,
                        'user_id'       => $request->user()->id,
                        'qty_perubahan' => -$qty,
                        'qty_akhir'     => $stok->jumlah,
                        'keterangan'    => "Pengeluaran Barang ({$request->jenis_transaksi})",
                    ]);
                } elseif ($request->jenis_transaksi === 'TRANSFER') {
                    // Kurangi dari Gudang Asal
                    $stokAsal = Stok::where('barang_id', $barangId)
                        ->where('gudang_id', $request->gudang_asal_id)
                        ->first();

                    if (!$stokAsal || $stokAsal->jumlah < $qty) {
                        throw new \Exception("Stok tidak mencukupi untuk transfer.");
                    }
                    $stokAsal->decrement('jumlah', $qty);

                    // Tambah ke Gudang Tujuan
                    $stokTujuan = Stok::firstOrCreate(
                        ['barang_id' => $barangId, 'gudang_id' => $request->gudang_tujuan_id],
                        ['jumlah' => 0]
                    );
                    $stokTujuan->increment('jumlah', $qty);

                    StockLog::create([
                        'barang_id'     => $barangId,
                        'gudang_id'     => $request->gudang_asal_id,
                        'transaksi_id'  => $transaksi->id,
                        'user_id'       => $request->user()->id,
                        'qty_perubahan' => -$qty,
                        'qty_akhir'     => $stokAsal->jumlah,
                        'keterangan'    => "Transfer Keluar ke Gudang Tujuan",
                    ]);

                    StockLog::create([
                        'barang_id'     => $barangId,
                        'gudang_id'     => $request->gudang_tujuan_id,
                        'transaksi_id'  => $transaksi->id,
                        'user_id'       => $request->user()->id,
                        'qty_perubahan' => +$qty,
                        'qty_akhir'     => $stokTujuan->jumlah,
                        'keterangan'    => "Transfer Masuk dari Gudang Asal",
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Transaksi berhasil disimpan dan stok otomatis diperbarui.');
    }
}