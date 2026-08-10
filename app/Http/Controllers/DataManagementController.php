<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RpmMaster;
use App\Models\SmartkeyMaster;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DataManagementController extends Controller
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

        // --- Query RPM Master ---
        $rpmQuery = RpmMaster::query();
        if ($search) {
            $rpmQuery->where(function ($q) use ($search) {
                $q->where('rpm_id', 'like', "%{$search}%")
                  ->orWhere('site_id', 'like', "%{$search}%")
                  ->orWhere('rtp', 'like', "%{$search}%")
                  ->orWhere('mitra', 'like', "%{$search}%")
                  ->orWhere('approve', 'like', "%{$search}%");
            });
        }
        $rpmMasters = $rpmQuery->orderBy('id', $order)
                               ->paginate($perPage)
                               ->withQueryString();

        // --- Query Smartkey Master ---
        $smartkeyQuery = SmartkeyMaster::query();
        if ($search) {
            $smartkeyQuery->where(function ($q) use ($search) {
                $q->where('serial_number', 'like', "%{$search}%")
                  ->orWhere('site_name', 'like', "%{$search}%")
                  ->orWhere('tower_id', 'like', "%{$search}%")
                  ->orWhere('infrako', 'like', "%{$search}%")
                  ->orWhere('ksm', 'like', "%{$search}%");
            });
        }
        $smartkeyMasters = $smartkeyQuery->orderBy('id', $order)
                                         ->paginate($perPage)
                                         ->withQueryString();

        return Inertia::render('Maintenance/DataManagement/Index', [
            'rpmMasters'      => $rpmMasters,
            'smartkeyMasters' => $smartkeyMasters,
            'filters'         => $request->only(['search', 'per_page', 'order', 'tab']),
        ]);
    }

    // ==========================================
    // STORE MULTIPLE RPM MASTER
    // ==========================================

    /**
     * Menerima input tunggal maupun array dari multiple baris
     */
    public function storeRpm(Request $request)
    {
        // Mendukung request dalam bentuk 'items' => [[...], [...]] atau payload objek tunggal
        $items = $request->has('items') ? $request->input('items') : [$request->all()];

        if (empty($items) || !is_array($items)) {
            return back()->with('error', 'Tidak ada data RPM yang dikirim.');
        }

        $insertData = [];
        $now = now();

        foreach ($items as $index => $item) {
            $siteId = $this->nullableString($item['site_id'] ?? null);

            // Jika baris kosong tanpa Site ID, lewati
            if (is_null($siteId)) {
                continue;
            }

            $insertData[] = [
                'rpm_id'          => $this->nullableString($item['rpm_id'] ?? null),
                'site_id'         => $siteId,
                'rtp'             => $this->nullableString($item['rtp'] ?? null),
                'mitra'           => $this->nullableString($item['mitra'] ?? null),
                'bulan'           => $this->nullableString($item['bulan'] ?? null),
                'tahun'           => $this->nullableString($item['tahun'] ?? null),
                'approve'         => $this->nullableString($item['approve'] ?? null),
                'tanggal_submit'  => $this->nullableString($item['tanggal_submit'] ?? null),
                'tanggal_approve' => $this->nullableString($item['tanggal_approve'] ?? null),
                'created_at'      => $now,
                'updated_at'      => $now,
            ];
        }

        if (empty($insertData)) {
            return back()->with('error', 'Gagal menyimpan. Pastikan minimal kolom Site ID terisi!');
        }

        try {
            DB::beginTransaction();
            RpmMaster::insert($insertData);
            DB::commit();

            $total = count($insertData);
            return back()->with('success', "Berhasil menambahkan $total data Master RPM baru.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Store RPM Error: " . $e->getMessage());
            return back()->with('error', 'Gagal menyimpan data RPM: ' . $e->getMessage());
        }
    }

    public function updateRpm(Request $request, int|string $id)
    {
        $validated = $request->validate([
            'rpm_id'          => 'nullable|string|max:255',
            'site_id'         => 'required|string|max:255',
            'rtp'             => 'nullable|string|max:255',
            'mitra'           => 'nullable|string|max:255',
            'bulan'           => 'nullable|string|max:255',
            'tahun'           => 'nullable|string|max:255',
            'approve'         => 'nullable|string|max:255',
            'tanggal_submit'  => 'nullable|string|max:255',
            'tanggal_approve' => 'nullable|string|max:255',
        ]);

        $data = array_map([$this, 'nullableString'], $validated);

        try {
            $rpm = RpmMaster::findOrFail($id);
            $rpm->update($data);
            return back()->with('success', 'Data Master RPM berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error("Update RPM Error: " . $e->getMessage());
            return back()->with('error', 'Gagal memperbarui data: ' . $e->getMessage());
        }
    }

    public function destroyRpm(Request $request, int|string|null $id = null)
    {
        try {
            if ($request->has('ids') && is_array($request->input('ids'))) {
                return $this->bulkDestroyRpm($request);
            }

            $targetId = $id ?? $request->input('id');
            $rpm = RpmMaster::findOrFail($targetId);
            $rpm->delete();

            return back()->with('success', 'Data Master RPM berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error("Delete RPM Error: " . $e->getMessage());
            return back()->with('error', 'Gagal menghapus data: ' . $e->getMessage());
        }
    }

    public function bulkDestroyRpm(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:rpm_masters,id',
        ]);

        try {
            $count = count($request->ids);
            RpmMaster::destroy($request->ids);
            return back()->with('success', "$count data Master RPM berhasil dihapus.");
        } catch (\Exception $e) {
            Log::error("Bulk Delete RPM Error: " . $e->getMessage());
            return back()->with('error', 'Gagal menghapus data terpilih: ' . $e->getMessage());
        }
    }

    // ==========================================
    // STORE MULTIPLE SMARTKEY MASTER
    // ==========================================

    /**
     * Menerima input tunggal maupun array dari multiple baris
     */
    public function storeSmartkey(Request $request)
    {
        // Mendukung request dalam bentuk 'items' => [[...], [...]] atau payload objek tunggal
        $items = $request->has('items') ? $request->input('items') : [$request->all()];

        if (empty($items) || !is_array($items)) {
            return back()->with('error', 'Tidak ada data Smart Key yang dikirim.');
        }

        $insertData = [];
        $now = now();

        foreach ($items as $index => $item) {
            $sn = $this->nullableString($item['serial_number'] ?? null);

            // Jika baris kosong tanpa Serial Number, lewati
            if (is_null($sn)) {
                continue;
            }

            $insertData[] = [
                'serial_number'    => $sn,
                'new_sn'           => $this->nullableString($item['new_sn'] ?? null),
                'tower_id'         => $this->nullableString($item['tower_id'] ?? null),
                'site_name'        => $this->nullableString($item['site_name'] ?? null),
                'kota_kab'         => $this->nullableString($item['kota_kab'] ?? null),
                'long_lat'         => $this->nullableString($item['long_lat'] ?? null),
                'infrako'          => $this->nullableString($item['infrako'] ?? null),
                'status'           => $this->nullableString($item['status'] ?? null),
                'status_aktifitas' => $this->nullableString($item['status_aktifitas'] ?? null),
                'ksm'              => $this->nullableString($item['ksm'] ?? null),
                'posisi_unit'      => $this->nullableString($item['posisi_unit'] ?? null),
                'batch'            => $this->nullableString($item['batch'] ?? null),
                'created_at'       => $now,
                'updated_at'       => $now,
            ];
        }

        if (empty($insertData)) {
            return back()->with('error', 'Gagal menyimpan. Pastikan minimal kolom Serial Number terisi!');
        }

        try {
            DB::beginTransaction();
            SmartkeyMaster::insert($insertData);
            DB::commit();

            $total = count($insertData);
            return back()->with('success', "Berhasil menambahkan $total data Master Smart Key baru.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Store Smart Key Error: " . $e->getMessage());
            return back()->with('error', 'Gagal menyimpan data Smart Key: ' . $e->getMessage());
        }
    }

    public function updateSmartkey(Request $request, int|string $id)
    {
        $validated = $request->validate([
            'serial_number'    => 'required|string|max:255',
            'new_sn'           => 'nullable|string|max:255',
            'tower_id'         => 'nullable|string|max:255',
            'site_name'        => 'nullable|string|max:255',
            'kota_kab'         => 'nullable|string|max:255',
            'long_lat'         => 'nullable|string|max:255',
            'infrako'          => 'nullable|string|max:255',
            'status'           => 'nullable|string|max:255',
            'status_aktifitas' => 'nullable|string|max:255',
            'ksm'              => 'nullable|string|max:255',
            'posisi_unit'      => 'nullable|string|max:255',
            'batch'            => 'nullable|string|max:255',
        ]);

        $data = array_map([$this, 'nullableString'], $validated);

        try {
            $smartkey = SmartkeyMaster::findOrFail($id);
            $smartkey->update($data);
            return back()->with('success', 'Data Master Smart Key berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error("Update Smart Key Error: " . $e->getMessage());
            return back()->with('error', 'Gagal memperbarui data: ' . $e->getMessage());
        }
    }

    public function destroySmartkey(Request $request, int|string|null $id = null)
    {
        try {
            if ($request->has('ids') && is_array($request->input('ids'))) {
                return $this->bulkDestroySmartkey($request);
            }

            $targetId = $id ?? $request->input('id');
            $smartkey = SmartkeyMaster::findOrFail($targetId);
            $smartkey->delete();

            return back()->with('success', 'Data Master Smart Key berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error("Delete Smart Key Error: " . $e->getMessage());
            return back()->with('error', 'Gagal menghapus data: ' . $e->getMessage());
        }
    }

    public function bulkDestroySmartkey(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:smartkey_masters,id',
        ]);

        try {
            $count = count($request->ids);
            SmartkeyMaster::destroy($request->ids);
            return back()->with('success', "$count data Master Smart Key berhasil dihapus.");
        } catch (\Exception $e) {
            Log::error("Bulk Delete Smart Key Error: " . $e->getMessage());
            return back()->with('error', 'Gagal menghapus data terpilih: ' . $e->getMessage());
        }
    }

    // ==========================================
    // EXPORT & RESET DATA
    // ==========================================

    public function exportRpm(): StreamedResponse
    {
        $fileName = 'export_master_rpm_' . date('Ymd_His') . '.csv';
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
            fputcsv($file, ['RPM ID', 'Site ID', 'RTP', 'Mitra', 'Bulan', 'Tahun', 'Approve', 'Tanggal Submit', 'Tanggal Approve'], ';');

            RpmMaster::chunk(500, function ($rows) use ($file) {
                foreach ($rows as $item) {
                    fputcsv($file, [
                        $item->rpm_id, $item->site_id, $item->rtp, $item->mitra, $item->bulan,
                        $item->tahun, $item->approve, $item->tanggal_submit, $item->tanggal_approve,
                    ], ';');
                }
            });

            fclose($file);
        }, 200, $headers);
    }

    public function exportSmartkey(): StreamedResponse
    {
        $fileName = 'export_master_smartkey_' . date('Ymd_His') . '.csv';
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
                'Serial Number', 'New SN', 'Tower ID', 'Site Name', 'Kota/Kab', 
                'Long Lat', 'Infrako', 'Status', 'Status Aktifitas', 'KSM', 'Posisi Unit', 'Batch'
            ], ';');

            SmartkeyMaster::chunk(500, function ($rows) use ($file) {
                foreach ($rows as $item) {
                    fputcsv($file, [
                        $item->serial_number, $item->new_sn, $item->tower_id, $item->site_name,
                        $item->kota_kab, $item->long_lat, $item->infrako, $item->status,
                        $item->status_aktifitas, $item->ksm, $item->posisi_unit, $item->batch,
                    ], ';');
                }
            });

            fclose($file);
        }, 200, $headers);
    }

    public function resetRpm()
    {
        try {
            DB::table('rpm_masters')->truncate();
            return back()->with('success', 'Tabel Master RPM berhasil dikosongkan!');
        } catch (\Exception $e) {
            Log::error("Reset RPM Error: " . $e->getMessage());
            return back()->with('error', 'Gagal mengosongkan tabel RPM: ' . $e->getMessage());
        }
    }

    public function resetSmartkey()
    {
        try {
            DB::table('smartkey_masters')->truncate();
            return back()->with('success', 'Tabel Master Smart Key berhasil dikosongkan!');
        } catch (\Exception $e) {
            Log::error("Reset Smartkey Error: " . $e->getMessage());
            return back()->with('error', 'Gagal mengosongkan tabel Smart Key: ' . $e->getMessage());
        }
    }
}