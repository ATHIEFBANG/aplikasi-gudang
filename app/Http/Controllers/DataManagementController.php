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
    // STORE MULTIPLE RPM MASTER (SUPER TOLERAN)
    // ==========================================

    /**
     * Menerima input tunggal maupun array dari multiple baris
     */
    public function storeRpm(Request $request)
    {
        $items = $request->has('items') ? $request->input('items') : [$request->all()];

        if (empty($items) || !is_array($items)) {
            return back()->with('error', 'Tidak ada data RPM yang dikirim.');
        }

        $insertData = [];
        $now = now();

        foreach ($items as $item) {
            $rpmId          = $this->nullableString($item['rpm_id'] ?? $item['id_rpm'] ?? null);
            $siteId         = $this->nullableString($item['site_id'] ?? $item['siteid'] ?? null);
            $rtp            = $this->nullableString($item['rtp'] ?? null);
            $mitra          = $this->nullableString($item['mitra'] ?? null);
            $bulan          = $this->nullableString($item['bulan'] ?? null);
            $tahun          = $this->nullableString($item['tahun'] ?? null);
            $approve        = $this->nullableString($item['approve'] ?? $item['status_approve'] ?? null);
            $tanggalSubmit  = $this->nullableString($item['tanggal_submit'] ?? $item['tanggalsubn'] ?? $item['tanggalsubmit'] ?? null);
            $tanggalApprove = $this->nullableString($item['tanggal_approve'] ?? $item['tanggalappr'] ?? $item['tanggalapprove'] ?? null);

            // 👉 Cek apakah ada MINIMAL 1 data apapun yang terisi di baris ini
            $hasData = !is_null($rpmId) || !is_null($siteId) || !is_null($rtp) 
                    || !is_null($mitra) || !is_null($bulan) || !is_null($tahun) 
                    || !is_null($approve) || !is_null($tanggalSubmit) || !is_null($tanggalApprove);

            // Jika baris benar-benar kosong melompong, lewati
            if (!$hasData) {
                continue;
            }

            // AUTO-FALLBACK: Jika site_id kosong, isi otomatis dari rpm_id / default
            if (is_null($siteId)) {
                $siteId = $rpmId ?? 'SITE-UNKNOWN';
            }

            $insertData[] = [
                'rpm_id'          => $rpmId,
                'site_id'         => $siteId,
                'rtp'             => $rtp,
                'mitra'           => $mitra,
                'bulan'           => $bulan,
                'tahun'           => $tahun,
                'approve'         => $approve ?? 'BELUM APPROVED',
                'tanggal_submit'  => $tanggalSubmit,
                'tanggal_approve' => $tanggalApprove,
                'created_at'      => $now,
                'updated_at'      => $now,
            ];
        }

        if (empty($insertData)) {
            return back()->with('error', 'Gagal menyimpan. Tidak ada baris data yang valid untuk disimpan.');
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
            'site_id'         => 'nullable|string|max:255',
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

            // Pastikan site_id tidak kosong
            if (empty($data['site_id'])) {
                $data['site_id'] = $data['rpm_id'] ?? $rpm->site_id ?? 'SITE-UNKNOWN';
            }

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

    public function bulkPasteRpm(Request $request)
    {
        return $this->storeRpm($request);
    }

    // ==========================================
    // STORE MULTIPLE SMARTKEY MASTER (SUPER TOLERAN)
    // ==========================================

    /**
     * Menerima input tunggal maupun array dari multiple baris
     */
    public function storeSmartkey(Request $request)
    {
        $items = $request->has('items') ? $request->input('items') : [$request->all()];

        if (empty($items) || !is_array($items)) {
            return back()->with('error', 'Tidak ada data Smart Key yang dikirim.');
        }

        $insertData = [];
        $now = now();

        foreach ($items as $item) {
            $sn              = $this->nullableString($item['serial_number'] ?? $item['sn'] ?? $item['lock_id'] ?? null);
            $newSn           = $this->nullableString($item['new_sn'] ?? null);
            $towerId         = $this->nullableString($item['tower_id'] ?? null);
            $siteName        = $this->nullableString($item['site_name'] ?? null);
            $kotaKab         = $this->nullableString($item['kota_kab'] ?? $item['kota'] ?? $item['kabupaten'] ?? null);
            $longLat         = $this->nullableString($item['long_lat'] ?? $item['longlat'] ?? $item['coordinate'] ?? null);
            $infrako         = $this->nullableString($item['infrako'] ?? null);
            $status          = $this->nullableString($item['status'] ?? null);
            $statusAktifitas = $this->nullableString($item['status_aktifitas'] ?? $item['status_aktivitas'] ?? null);
            $ksm             = $this->nullableString($item['ksm'] ?? null);
            $posisiUnit      = $this->nullableString($item['posisi_unit'] ?? null);
            $batch           = $this->nullableString($item['batch'] ?? null);

            // 👉 Cek apakah ada MINIMAL 1 data apapun yang terisi di baris ini
            $hasData = !is_null($sn) || !is_null($newSn) || !is_null($towerId) 
                    || !is_null($siteName) || !is_null($kotaKab) || !is_null($longLat) 
                    || !is_null($infrako) || !is_null($status) || !is_null($statusAktifitas)
                    || !is_null($ksm) || !is_null($posisiUnit) || !is_null($batch);

            // Jika baris benar-benar kosong melompong, lewati
            if (!$hasData) {
                continue;
            }

            // AUTO-FALLBACK: Jika serial_number kosong, isi otomatis dari new_sn / tower_id / default
            if (is_null($sn)) {
                $sn = $newSn ?? $towerId ?? 'SK-UNKNOWN';
            }

            $insertData[] = [
                'serial_number'    => $sn,
                'new_sn'           => $newSn,
                'tower_id'         => $towerId,
                'site_name'        => $siteName,
                'kota_kab'         => $kotaKab,
                'long_lat'         => $longLat,
                'infrako'          => $infrako,
                'status'           => $status ?? 'AKTIF',
                'status_aktifitas' => $statusAktifitas ?? 'LOCKED',
                'ksm'              => $ksm,
                'posisi_unit'      => $posisiUnit,
                'batch'            => $batch,
                'created_at'       => $now,
                'updated_at'       => $now,
            ];
        }

        if (empty($insertData)) {
            return back()->with('error', 'Gagal menyimpan. Tidak ada baris data yang valid untuk disimpan.');
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
            'serial_number'    => 'nullable|string|max:255',
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

            // Pastikan serial_number tidak kosong
            if (empty($data['serial_number'])) {
                $data['serial_number'] = $data['new_sn'] ?? $smartkey->serial_number ?? 'SK-UNKNOWN';
            }

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

    public function bulkPasteSmartkey(Request $request)
    {
        return $this->storeSmartkey($request);
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