<?php

namespace App\Http\Controllers;

use App\Models\CombatMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AssetDataManagementController extends Controller
{
    private function nullableString(mixed $value): ?string
    {
        if (is_null($value)) {
            return null;
        }

        $trimmed = trim((string)$value);
        return $trimmed === '' ? null : $trimmed;
    }

    // ==========================================
    // METHOD INDEX
    // ==========================================

    public function index(Request $request)
    {
        $search  = $request->input('search');
        $perPage = $request->input('per_page', 10);
        $order   = $request->input('order', 'asc');

        $order = in_array(strtolower($order), ['asc', 'desc'], true) ? strtolower($order) : 'asc';

        // --- Query Combat Master (UTAMA) ---
        $combatQuery = CombatMaster::query();
        if ($search) {
            $combatQuery->where(function ($q) use ($search) {
                $q->where('asset_name', 'like', "%{$search}%")
                  ->orWhere('sn', 'like', "%{$search}%")
                  ->orWhere('nama_site', 'like', "%{$search}%")
                  ->orWhere('pic_data', 'like', "%{$search}%")
                  ->orWhere('status_combat', 'like', "%{$search}%")
                  ->orWhere('type_combat', 'like', "%{$search}%");
            });
        }
        $combatMasters = $combatQuery->orderBy('id', $order)
                                     ->paginate($perPage)
                                     ->withQueryString();

        // --- Template Master (Dummy / Standby) ---
        $templateMasters = ['data' => [], 'total' => 0];

        return Inertia::render('Assets/DataManagement/Index', [
            'combatMasters'   => $combatMasters,
            'templateMasters' => $templateMasters,
            'filters'         => $request->only(['search', 'per_page', 'order', 'tab']),
        ]);
    }

    // ==========================================
    // STORE MULTIPLE COMBAT MASTER
    // ==========================================

    public function storeCombat(Request $request)
    {
        $items = $request->has('items') ? $request->input('items') : [$request->all()];

        if (empty($items) || !is_array($items)) {
            return back()->with('error', 'Tidak ada data COMBAT yang dikirim.');
        }

        $insertData = [];
        $now = now();

        foreach ($items as $item) {
            $assetName  = $this->nullableString($item['asset_name'] ?? $item['combat_id'] ?? null);
            $sn         = $this->nullableString($item['sn'] ?? null);
            $picData    = $this->nullableString($item['pic_data'] ?? $item['operator'] ?? null);
            $namaSite   = $this->nullableString($item['nama_site'] ?? $item['site_name'] ?? null);
            $lokasi     = $this->nullableString($item['lokasi_saat_ini'] ?? null);
            $longitude  = $this->nullableString($item['longitude'] ?? null);
            $latitude   = $this->nullableString($item['latitude'] ?? null);
            $status     = $this->nullableString($item['status_combat'] ?? $item['status'] ?? null);
            $type       = $this->nullableString($item['type_combat'] ?? $item['tipe_combat'] ?? null);
            $ketinggian = $this->nullableString($item['ketinggian_combat'] ?? $item['ketinggian_m'] ?? null);
            $tglAmbil   = $this->nullableString($item['tanggal_ambil'] ?? null);
            $tglKembali = $this->nullableString($item['tanggal_kembali'] ?? null);
            $remark     = $this->nullableString($item['remark'] ?? null);

            // Lewati HANYA jika seluruh kolom dalam baris ini benar-benar kosong
            $hasData = !is_null($assetName) || !is_null($sn) || !is_null($picData) 
                    || !is_null($namaSite) || !is_null($lokasi) || !is_null($status) 
                    || !is_null($type) || !is_null($longitude) || !is_null($latitude);

            if (!$hasData) {
                continue;
            }

            $insertData[] = [
                'asset_name'        => $assetName,
                'sn'                => $sn,
                'pic_data'          => $picData,
                'nama_site'         => $namaSite,
                'lokasi_saat_ini'   => $lokasi,
                'longitude'         => $longitude,
                'latitude'          => $latitude,
                'status_combat'     => $status,
                'type_combat'       => $type,
                'ketinggian_combat' => $ketinggian,
                'tanggal_ambil'     => $tglAmbil,
                'tanggal_kembali'   => $tglKembali,
                'remark'            => $remark,
                'created_at'        => $now,
                'updated_at'        => $now,
            ];
        }

        if (empty($insertData)) {
            return back()->with('error', 'Gagal menyimpan. Tidak ada baris data yang valid untuk disimpan.');
        }

        try {
            DB::beginTransaction();
            CombatMaster::insert($insertData);
            DB::commit();

            $total = count($insertData);
            return back()->with('success', "Berhasil menambahkan $total data Master COMBAT baru.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Store Combat Error: " . $e->getMessage());
            return back()->with('error', 'Gagal menyimpan data COMBAT: ' . $e->getMessage());
        }
    }

    public function updateCombat(Request $request, int|string $id)
    {
        $validated = $request->validate([
            'asset_name'        => 'nullable|string|max:255',
            'sn'                => 'nullable|string|max:255',
            'pic_data'          => 'nullable|string|max:255',
            'nama_site'         => 'nullable|string|max:255',
            'lokasi_saat_ini'   => 'nullable|string',
            'longitude'         => 'nullable|string|max:255',
            'latitude'          => 'nullable|string|max:255',
            'status_combat'     => 'nullable|string|max:255',
            'type_combat'       => 'nullable|string|max:255',
            'ketinggian_combat' => 'nullable|string|max:255',
            'tanggal_ambil'     => 'nullable|string|max:255',
            'tanggal_kembali'   => 'nullable|string|max:255',
            'remark'            => 'nullable|string',
        ]);

        $data = array_map([$this, 'nullableString'], $validated);

        try {
            $combat = CombatMaster::findOrFail($id);
            $combat->update($data);
            return back()->with('success', 'Data Master COMBAT berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error("Update Combat Error: " . $e->getMessage());
            return back()->with('error', 'Gagal memperbarui data: ' . $e->getMessage());
        }
    }

    public function destroyCombat(Request $request, int|string|null $id = null)
    {
        try {
            if ($request->has('ids') && is_array($request->input('ids'))) {
                return $this->bulkDestroyCombat($request);
            }

            $targetId = $id ?? $request->input('id');
            $combat = CombatMaster::findOrFail($targetId);
            $combat->delete();

            return back()->with('success', 'Data Master COMBAT berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error("Delete Combat Error: " . $e->getMessage());
            return back()->with('error', 'Gagal menghapus data: ' . $e->getMessage());
        }
    }

    public function bulkDestroyCombat(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:combat_masters,id',
        ]);

        try {
            $count = count($request->ids);
            CombatMaster::destroy($request->ids);
            return back()->with('success', "$count data Master COMBAT berhasil dihapus.");
        } catch (\Exception $e) {
            Log::error("Bulk Delete Combat Error: " . $e->getMessage());
            return back()->with('error', 'Gagal menghapus data terpilih: ' . $e->getMessage());
        }
    }

    public function bulkPasteCombat(Request $request)
    {
        return $this->storeCombat($request);
    }

    // ==========================================
    // STUB METODE TEMPLATE (AGAR TIDAK ERROR)
    // ==========================================

    public function storeTemplate(Request $request)
    {
        return back()->with('error', 'Master Data Template belum diaktifkan.');
    }

    public function updateTemplate(Request $request, int|string $id)
    {
        return back()->with('error', 'Master Data Template belum diaktifkan.');
    }

    public function destroyTemplate(Request $request, int|string|null $id = null)
    {
        return back()->with('error', 'Master Data Template belum diaktifkan.');
    }

    public function bulkDestroyTemplate(Request $request)
    {
        return back()->with('error', 'Master Data Template belum diaktifkan.');
    }

    public function bulkPasteTemplate(Request $request)
    {
        return $this->storeTemplate($request);
    }

    // ==========================================
    // EXPORT & RESET DATA
    // ==========================================

    public function exportCombat(): StreamedResponse
    {
        $fileName = 'export_master_combat_' . date('Ymd_His') . '.csv';
        $headers  = [
            "Content-type"        => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        return response()->stream(function () {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, [
                'Asset Name', 'SN', 'Data/PIC', 'Nama Site', 'Lokasi Combat Saat Ini',
                'Longitude', 'Latitude', 'Status Combat', 'Type Combat',
                'Ketinggian Combat (M)', 'Tanggal Ambil', 'Tanggal Kembali', 'Remark'
            ], ';');

            CombatMaster::chunk(500, function ($rows) use ($file) {
                foreach ($rows as $item) {
                    fputcsv($file, [
                        $item->asset_name,
                        $item->sn,
                        $item->pic_data,
                        $item->nama_site,
                        $item->lokasi_saat_ini,
                        $item->longitude,
                        $item->latitude,
                        $item->status_combat,
                        $item->type_combat,
                        $item->ketinggian_combat,
                        $item->tanggal_ambil,
                        $item->tanggal_kembali,
                        $item->remark,
                    ], ';');
                }
            });

            fclose($file);
        }, 200, $headers);
    }

    public function exportTemplate(): StreamedResponse
    {
        return response()->stream(function () {}, 200);
    }

    public function resetCombat()
    {
        try {
            DB::table('combat_masters')->truncate();
            return back()->with('success', 'Tabel Master COMBAT berhasil dikosongkan!');
        } catch (\Exception $e) {
            Log::error("Reset Combat Error: " . $e->getMessage());
            return back()->with('error', 'Gagal mengosongkan tabel COMBAT: ' . $e->getMessage());
        }
    }

    public function resetTemplate()
    {
        return back()->with('error', 'Master Data Template belum diaktifkan.');
    }
}