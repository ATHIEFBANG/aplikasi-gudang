<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\Gudang;
use App\Models\Stok;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BarangController extends Controller
{
    public function index(Request $request): Response
    {
        $search   = $request->input('search');
        $perPage  = (int) $request->input('per_page', 10);
        
        $rawOrder = strtolower((string) $request->input('order', 'asc'));
        $order    = in_array($rawOrder, ['asc', 'desc'], true) ? $rawOrder : 'asc';

        $query = Barang::with(['stoks.gudang', 'serials'])
            ->withSum('stoks', 'jumlah');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('kode_barang', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhere('tipe', 'like', "%{$search}%")
                  ->orWhere('kategori', 'like', "%{$search}%")
                  ->orWhere('part_number', 'like', "%{$search}%")
                  ->orWhere('nama_barang', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        // 1. Dikelompokkan & diurutkan berdasarkan Brand (A-Z)
        // 2. Jika Brand sama, barang yang diinput duluan tetap di atas (ID ASC)
        $barangs = $query->orderBy('brand', $order)
            ->orderBy('id', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        $existingOptions = [
            'brandList'    => Barang::whereNotNull('brand')->where('brand', '!=', '')->distinct()->pluck('brand')->values(),
            'tipeList'     => Barang::whereNotNull('tipe')->where('tipe', '!=', '')->distinct()->pluck('tipe')->values(),
            'kategoriList' => Barang::whereNotNull('kategori')->where('kategori', '!=', '')->distinct()->pluck('kategori')->values(),
            'satuanList'   => Barang::whereNotNull('deskripsi')->where('deskripsi', '!=', '')->distinct()->pluck('deskripsi')->values(),
        ];

        return Inertia::render('Barang/Index', [
            'barangs'         => $barangs,
            'existingOptions' => $existingOptions,
            'filters' => [
                'search'   => $search ?? '',
                'per_page' => $perPage,
                'order'    => $order,
            ],
        ]);
    }

    public function store(Request $request)
    {
        if ($request->has('items') && is_array($request->items)) {
            $validated = $request->validate([
                'items'               => 'required|array|min:1',
                'items.*.kode_barang' => 'required|string|min:8|max:100|unique:barangs,kode_barang',
                'items.*.brand'       => 'required|string|max:255',
                'items.*.tipe'        => 'required|string|max:255',
                'items.*.kategori'    => 'required|string|max:255',
                'items.*.part_number' => 'nullable|string|max:255',
                'items.*.nama_barang' => 'nullable|string|max:255',
                'items.*.satuan'      => 'nullable|string|max:255',
                'items.*.deskripsi'   => 'nullable|string|max:255',
                'items.*.min_stock'   => 'nullable|integer|min:0',
                'items.*.is_wajib_sn' => 'boolean',
                'items.*.is_wajib_pn' => 'boolean',
            ]);

            DB::transaction(function () use ($validated) {
                foreach ($validated['items'] as $item) {
                    $isWajibSn = (bool) ($item['is_wajib_sn'] ?? false);
                    $isWajibPn = (bool) ($item['is_wajib_pn'] ?? false);
                    $partNumber = !empty($item['part_number']) ? trim($item['part_number']) : null;
                    $namaBarang = trim(
                        $item['nama_barang'] 
                        ?? ($isWajibPn && $partNumber ? $partNumber : "{$item['brand']} {$item['tipe']}")
                    );
                    $satuan = trim($item['satuan'] ?? $item['deskripsi'] ?? '');

                    Barang::create([
                        'kode_barang' => trim($item['kode_barang']),
                        'nama_barang' => $namaBarang,
                        'kategori'    => trim($item['kategori']),
                        'brand'       => trim($item['brand']),
                        'tipe'        => trim($item['tipe']),
                        'part_number' => $partNumber,
                        'min_stock'   => $item['min_stock'] ?? 0,
                        'is_wajib_sn' => $isWajibSn,
                        'is_wajib_pn' => $isWajibPn,
                        'deskripsi'   => $satuan !== '' ? $satuan : null,
                    ]);
                }
            });

            return redirect()->back()->with('success', count($validated['items']) . ' Master Barang PPL berhasil ditambahkan.');
        }

        $validated = $request->validate([
            'kode_barang' => 'required|string|min:8|max:100|unique:barangs,kode_barang',
            'brand'       => 'required|string|max:255',
            'tipe'        => 'required|string|max:255',
            'kategori'    => 'required|string|max:255',
            'part_number' => 'nullable|string|max:255',
            'nama_barang' => 'nullable|string|max:255',
            'satuan'      => 'nullable|string|max:255',
            'deskripsi'   => 'nullable|string|max:255',
            'min_stock'   => 'nullable|integer|min:0',
            'is_wajib_sn' => 'boolean',
            'is_wajib_pn' => 'boolean',
        ]);

        $isWajibSn = $request->boolean('is_wajib_sn');
        $isWajibPn = $request->boolean('is_wajib_pn');
        $partNumber = $request->filled('part_number') ? trim($request->part_number) : null;
        $namaBarang = trim(
            $validated['nama_barang'] 
            ?? ($isWajibPn && $partNumber ? $partNumber : "{$validated['brand']} {$validated['tipe']}")
        );
        $satuan = trim($validated['satuan'] ?? $validated['deskripsi'] ?? '');

        Barang::create([
            'kode_barang' => trim($validated['kode_barang']),
            'nama_barang' => $namaBarang,
            'kategori'    => trim($validated['kategori']),
            'brand'       => trim($validated['brand']),
            'tipe'        => trim($validated['tipe']),
            'part_number' => $partNumber,
            'min_stock'   => $validated['min_stock'] ?? 0,
            'is_wajib_sn' => $isWajibSn,
            'is_wajib_pn' => $isWajibPn,
            'deskripsi'   => $satuan !== '' ? $satuan : null,
        ]);

        return redirect()->back()->with('success', 'Barang PPL baru berhasil ditambahkan.');
    }

    public function update(Request $request, int $id)
    {
        $barang = Barang::findOrFail($id);
        $validated = $request->validate([
            'kode_barang' => 'required|string|min:8|max:100|unique:barangs,kode_barang,' . $barang->id,
            'brand'       => 'required|string|max:255',
            'tipe'        => 'required|string|max:255',
            'kategori'    => 'required|string|max:255',
            'part_number' => 'nullable|string|max:255',
            'nama_barang' => 'nullable|string|max:255',
            'satuan'      => 'nullable|string|max:255',
            'deskripsi'   => 'nullable|string|max:255',
            'min_stock'   => 'nullable|integer|min:0',
            'is_wajib_sn' => 'boolean',
            'is_wajib_pn' => 'boolean',
        ]);

        $isWajibSn = $request->boolean('is_wajib_sn');
        $isWajibPn = $request->boolean('is_wajib_pn');
        $partNumber = $request->filled('part_number') ? trim($request->part_number) : null;
        $namaBarang = trim(
            $validated['nama_barang'] 
            ?? ($isWajibPn && $partNumber ? $partNumber : "{$validated['brand']} {$validated['tipe']}")
        );
        $satuan = trim($validated['satuan'] ?? $validated['deskripsi'] ?? '');

        $barang->update([
            'kode_barang' => trim($validated['kode_barang']),
            'nama_barang' => $namaBarang,
            'kategori'    => trim($validated['kategori']),
            'brand'       => trim($validated['brand']),
            'tipe'        => trim($validated['tipe']),
            'part_number' => $partNumber,
            'min_stock'   => $validated['min_stock'] ?? 0,
            'is_wajib_sn' => $isWajibSn,
            'is_wajib_pn' => $isWajibPn,
            'deskripsi'   => $satuan !== '' ? $satuan : null,
        ]);

        return redirect()->back()->with('success', 'Data barang PPL berhasil diperbarui.');
    }

    public function destroy(int $id)
    {
        $barang = Barang::findOrFail($id);
        $barang->delete();
        return redirect()->back()->with('success', 'Barang berhasil dihapus.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:barangs,id',
        ]);

        Barang::destroy($request->ids);
        return redirect()->back()->with('success', count($request->ids) . ' barang terpilih berhasil dihapus.');
    }

    public function export(): StreamedResponse
    {
        $barangs = Barang::orderBy('brand', 'asc')->orderBy('id', 'asc')->get();
        $csvFileName = 'Master_Barang_PPL_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$csvFileName}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $columns = ['Kode PPL', 'Brand / Merk', 'Tipe / Jenis', 'Kategori', 'Part Number', 'Satuan', 'Wajib SN', 'Wajib PN'];

        $callback = function () use ($barangs, $columns) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns, ';');

            foreach ($barangs as $b) {
                fputcsv($file, [
                    $b->kode_barang,
                    $b->brand ?? '-',
                    $b->tipe ?? '-',
                    $b->kategori ?? '-',
                    $b->part_number ?? $b->nama_barang ?? '-',
                    $b->deskripsi ?? '-',
                    $b->is_wajib_sn ? 'Ya' : 'Tidak',
                    $b->is_wajib_pn ? 'Ya' : 'Tidak',
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function reset(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Hanya Admin yang dapat mengosongkan master data.');
        }

        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            Barang::truncate();
            Stok::truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } else {
            Stok::query()->delete();
            Barang::query()->delete();
        }

        return redirect()->back()->with('success', 'Seluruh Master Data Barang berhasil dikosongkan.');
    }
}