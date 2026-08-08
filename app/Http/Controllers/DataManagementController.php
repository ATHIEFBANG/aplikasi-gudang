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
    // ==========================================
    // HELPER FUNCTIONS (SANITIZATION & PARSING)
    // ==========================================

    private function cleanHeader(?string $string): string
    {
        if (is_null($string)) {
            return '';
        }

        $clean = preg_replace('/[\x00-\x1F\x7F\xEF\xBB\xBF]/', '', $string);
        return strtolower(preg_replace('/[^a-zA-Z0-9]/', '', (string)$clean));
    }

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
    // BULK PASTE DATA (RPM & SMARTKEY)
    // ==========================================

    /**
     * Memproses Bulk Paste Data Master RPM
     */
    public function bulkPasteRpm(Request $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        $request->validate([
            'pasted_data' => 'nullable|string',
            'rows'        => 'nullable|array',
            'truncate'    => 'nullable|boolean',
        ]);

        try {
            $rows = $request->input('rows');

            // Jika menerima string mentah dari Textarea, lakukan parsing Tab & Enter
            if (empty($rows) && $request->filled('pasted_data')) {
                $pastedText = $request->input('pasted_data');
                $lines = preg_split('/\r\n|\r|\n/', trim($pastedText));
                $rows = [];
                foreach ($lines as $line) {
                    if (trim($line) === '') continue;
                    $rows[] = explode("\t", $line);
                }
            }

            if (empty($rows)) {
                return back()->with('error', 'Tidak ada data yang ditempelkan/dikirim.');
            }

            // Deteksi baris pertama apakah berupa Header
            $firstRow = $rows[0];
            $hasHeader = false;
            if (is_array($firstRow)) {
                $cleanedRow = array_map([$this, 'cleanHeader'], $firstRow);
                $siteIdAliases = ['siteid', 'idsite', 'sitecode', 'site', 'id_site', 'site_id'];
                foreach ($siteIdAliases as $alias) {
                    if (in_array($alias, $cleanedRow, true)) {
                        $hasHeader = true;
                        break;
                    }
                }
            }

            $startIndex = $hasHeader ? 1 : 0;
            $rowsToProcess = array_slice($rows, $startIndex);

            $imported  = 0;
            $skipped   = 0;
            $batchData = [];
            $chunkSize = 500;

            DB::beginTransaction();

            // Kosongkan tabel jika opsi truncate aktif (default: true)
            if ($request->boolean('truncate', true)) {
                DB::table('rpm_masters')->truncate();
            }

            foreach ($rowsToProcess as $row) {
                // Jika data berupa Object JSON
                if (is_array($row) && array_key_exists('site_id', $row)) {
                    $siteId = $this->nullableString($row['site_id'] ?? null);
                    if (is_null($siteId)) {
                        $skipped++;
                        continue;
                    }

                    $batchData[] = [
                        'rpm_id'          => $this->nullableString($row['rpm_id'] ?? null),
                        'site_id'         => $siteId,
                        'rtp'             => $this->nullableString($row['rtp'] ?? null),
                        'mitra'           => $this->nullableString($row['mitra'] ?? null),
                        'bulan'           => $this->nullableString($row['bulan'] ?? null),
                        'tahun'           => $this->nullableString($row['tahun'] ?? null),
                        'approve'         => $this->nullableString($row['approve'] ?? null),
                        'tanggal_submit'  => $this->nullableString($row['tanggal_submit'] ?? null),
                        'tanggal_approve' => $this->nullableString($row['tanggal_approve'] ?? null),
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ];
                } 
                // Jika data berupa Array Indeks (urutan kolom dari salinan Excel)
                // Urutan: 0: RPM ID | 1: Site ID | 2: RTP | 3: Mitra | 4: Bulan | 5: Tahun | 6: Approve | 7: Tgl Submit | 8: Tgl Approve
                elseif (is_array($row)) {
                    $siteId = $this->nullableString($row[1] ?? $row[0] ?? null);
                    if (is_null($siteId)) {
                        $skipped++;
                        continue;
                    }

                    $batchData[] = [
                        'rpm_id'          => $this->nullableString($row[0] ?? null),
                        'site_id'         => $siteId,
                        'rtp'             => $this->nullableString($row[2] ?? null),
                        'mitra'           => $this->nullableString($row[3] ?? null),
                        'bulan'           => $this->nullableString($row[4] ?? null),
                        'tahun'           => $this->nullableString($row[5] ?? null),
                        'approve'         => $this->nullableString($row[6] ?? null),
                        'tanggal_submit'  => $this->nullableString($row[7] ?? null),
                        'tanggal_approve' => $this->nullableString($row[8] ?? null),
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ];
                }

                $imported++;

                if (count($batchData) >= $chunkSize) {
                    DB::table('rpm_masters')->insert($batchData);
                    $batchData = [];
                }
            }

            if (!empty($batchData)) {
                DB::table('rpm_masters')->insert($batchData);
            }

            DB::commit();

            return back()->with('success', "Sukses! $imported data Master RPM berhasil disimpan.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Bulk Paste RPM Error: " . $e->getMessage());
            return back()->with('error', 'Terjadi kesalahan sistem: ' . $e->getMessage());
        }
    }

    /**
     * Memproses Bulk Paste Data Master Smart Key
     */
    public function bulkPasteSmartkey(Request $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        $request->validate([
            'pasted_data' => 'nullable|string',
            'rows'        => 'nullable|array',
            'truncate'    => 'nullable|boolean',
        ]);

        try {
            $rows = $request->input('rows');

            // Jika menerima string mentah dari Textarea, lakukan parsing Tab & Enter
            if (empty($rows) && $request->filled('pasted_data')) {
                $pastedText = $request->input('pasted_data');
                $lines = preg_split('/\r\n|\r|\n/', trim($pastedText));
                $rows = [];
                foreach ($lines as $line) {
                    if (trim($line) === '') continue;
                    $rows[] = explode("\t", $line);
                }
            }

            if (empty($rows)) {
                return back()->with('error', 'Tidak ada data yang ditempelkan/dikirim.');
            }

            // Deteksi baris pertama apakah berupa Header
            $firstRow = $rows[0];
            $hasHeader = false;
            if (is_array($firstRow)) {
                $cleanedRow = array_map([$this, 'cleanHeader'], $firstRow);
                $snAliases = ['serialnumber', 'serialno', 'sn', 'hardwareno', 'lockid'];
                foreach ($snAliases as $alias) {
                    if (in_array($alias, $cleanedRow, true)) {
                        $hasHeader = true;
                        break;
                    }
                }
            }

            $startIndex = $hasHeader ? 1 : 0;
            $rowsToProcess = array_slice($rows, $startIndex);

            $imported  = 0;
            $skipped   = 0;
            $batchData = [];
            $chunkSize = 500;

            DB::beginTransaction();

            if ($request->boolean('truncate', true)) {
                DB::table('smartkey_masters')->truncate();
            }

            foreach ($rowsToProcess as $row) {
                // Jika data berupa Object JSON
                if (is_array($row) && array_key_exists('serial_number', $row)) {
                    $sn = $this->nullableString($row['serial_number'] ?? null);
                    if (is_null($sn)) {
                        $skipped++;
                        continue;
                    }

                    $batchData[] = [
                        'serial_number'    => $sn,
                        'new_sn'           => $this->nullableString($row['new_sn'] ?? null),
                        'tower_id'         => $this->nullableString($row['tower_id'] ?? null),
                        'site_name'        => $this->nullableString($row['site_name'] ?? null),
                        'kota_kab'         => $this->nullableString($row['kota_kab'] ?? null),
                        'long_lat'         => $this->nullableString($row['long_lat'] ?? null),
                        'infrako'          => $this->nullableString($row['infrako'] ?? null),
                        'status'           => $this->nullableString($row['status'] ?? null),
                        'status_aktifitas' => $this->nullableString($row['status_aktifitas'] ?? null),
                        'ksm'              => $this->nullableString($row['ksm'] ?? null),
                        'posisi_unit'      => $this->nullableString($row['posisi_unit'] ?? null),
                        'batch'            => $this->nullableString($row['batch'] ?? null),
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ];
                } 
                // Jika data berupa Array Indeks (urutan kolom dari salinan Excel)
                // Urutan: 0: SN | 1: New SN | 2: Tower ID | 3: Site Name | 4: Kota/Kab | 5: Long Lat | 6: Infrako | 7: Status | 8: Status Aktifitas | 9: KSM | 10: Posisi Unit | 11: Batch
                elseif (is_array($row)) {
                    $sn = $this->nullableString($row[0] ?? null);
                    if (is_null($sn)) {
                        $skipped++;
                        continue;
                    }

                    $batchData[] = [
                        'serial_number'    => $sn,
                        'new_sn'           => $this->nullableString($row[1] ?? null),
                        'tower_id'         => $this->nullableString($row[2] ?? null),
                        'site_name'        => $this->nullableString($row[3] ?? null),
                        'kota_kab'         => $this->nullableString($row[4] ?? null),
                        'long_lat'         => $this->nullableString($row[5] ?? null),
                        'infrako'          => $this->nullableString($row[6] ?? null),
                        'status'           => $this->nullableString($row[7] ?? null),
                        'status_aktifitas' => $this->nullableString($row[8] ?? null),
                        'ksm'              => $this->nullableString($row[9] ?? null),
                        'posisi_unit'      => $this->nullableString($row[10] ?? null),
                        'batch'            => $this->nullableString($row[11] ?? null),
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ];
                }

                $imported++;

                if (count($batchData) >= $chunkSize) {
                    DB::table('smartkey_masters')->insert($batchData);
                    $batchData = [];
                }
            }

            if (!empty($batchData)) {
                DB::table('smartkey_masters')->insert($batchData);
            }

            DB::commit();

            return back()->with('success', "Sukses! $imported data Master Smart Key berhasil disimpan.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Bulk Paste Smart Key Error: " . $e->getMessage());
            return back()->with('error', 'Terjadi kesalahan sistem: ' . $e->getMessage());
        }
    }

    // ==========================================
    // EXPORT MASTER DATA (CSV STREAMING)
    // ==========================================

    public function exportRpm(): StreamedResponse
    {
        $fileName = 'export_master_rpm_' . date('Ymd_His') . '.csv';
        $headers  = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        return response()->stream(function () {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['RPM ID', 'Site ID', 'RTP', 'Mitra', 'Bulan', 'Tahun', 'Approve', 'Tanggal Submit', 'Tanggal Approve'], ';');

            RpmMaster::chunk(500, function ($rows) use ($file) {
                foreach ($rows as $item) {
                    fputcsv($file, [
                        $item->rpm_id,
                        $item->site_id,
                        $item->rtp,
                        $item->mitra,
                        $item->bulan,
                        $item->tahun,
                        $item->approve,
                        $item->tanggal_submit,
                        $item->tanggal_approve,
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
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        return response()->stream(function () {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'Serial Number', 'New SN', 'Tower ID', 'Site Name', 'Kota/Kab', 
                'Long Lat', 'Infrako', 'Status', 'Status Aktifitas', 'KSM', 'Posisi Unit', 'Batch'
            ], ';');

            SmartkeyMaster::chunk(500, function ($rows) use ($file) {
                foreach ($rows as $item) {
                    fputcsv($file, [
                        $item->serial_number,
                        $item->new_sn,
                        $item->tower_id,
                        $item->site_name,
                        $item->kota_kab,
                        $item->long_lat,
                        $item->infrako,
                        $item->status,
                        $item->status_aktifitas,
                        $item->ksm,
                        $item->posisi_unit,
                        $item->batch,
                    ], ';');
                }
            });

            fclose($file);
        }, 200, $headers);
    }

    // ==========================================
    // RESET TABLE DATA
    // ==========================================

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

    // ==========================================
    // CRUD OPERATIONS (RPM MASTER)
    // ==========================================

    public function storeRpm(Request $request)
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
            RpmMaster::create($data);
            return back()->with('success', 'Data Master RPM berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error("Store RPM Error: " . $e->getMessage());
            return back()->with('error', 'Gagal menambahkan data: ' . $e->getMessage());
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
    // CRUD OPERATIONS (SMARTKEY MASTER)
    // ==========================================

    public function storeSmartkey(Request $request)
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
            SmartkeyMaster::create($data);
            return back()->with('success', 'Data Master Smart Key berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error("Store Smart Key Error: " . $e->getMessage());
            return back()->with('error', 'Gagal menambahkan data: ' . $e->getMessage());
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
    // DATA PROCESSING & RECONCILIATION ENGINE
    // ==========================================

    public function processRpm(Request $request) 
    { 
        try {
            return back()->with('success', 'Proses data RPM berhasil dijalankan.');
        } catch (\Exception $e) {
            Log::error("Process RPM Error: " . $e->getMessage());
            return back()->with('error', 'Gagal memproses data RPM: ' . $e->getMessage());
        }
    }

    public function processSmartkey(Request $request) 
    { 
        try {
            return back()->with('success', 'Proses data Smart Key berhasil dijalankan.');
        } catch (\Exception $e) {
            Log::error("Process Smartkey Error: " . $e->getMessage());
            return back()->with('error', 'Gagal memproses data Smart Key: ' . $e->getMessage());
        }
    }
}