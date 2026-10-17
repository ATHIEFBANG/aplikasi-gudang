<?php
namespace App\Http\Controllers;
use App\Models\Barang;
use App\Models\Proyek;
use App\Models\BarangSerial;
use App\Models\Stok;
use App\Models\StockLog;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
class TransaksiTransferController extends Controller
{
    public function store(Request $request)
    {
        set_time_limit(120);
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.tanggal' => 'required|date',
            'items.*.kondisi' => 'nullable|string|max:100',
            'items.*.nomor_omc' => 'required|string|max:100',
            'items.*.arah_transfer' => 'nullable|string|in:GUDANG_KE_GUDANG',
            'items.*.tujuan_tipe' => 'nullable|string|in:GUDANG',
            'items.*.nomor_imc' => 'nullable|string|max:100',
            'items.*.kode_projek' => 'nullable|string|max:100',
            'items.*.nama_customer' => 'nullable|string|max:255',
            'items.*.gudang_asal_id' => 'required|exists:gudangs,id',
            'items.*.gudang_tujuan_id' => 'nullable|exists:gudangs,id',
            'items.*.barang_id' => 'required|exists:barangs,id',
            'items.*.qty' => 'required|integer|min:1|max:50',
            'items.*.serials' => 'nullable|array',
            'items.*.serials.*' => 'nullable|string|max:100',
            'items.*.non_sn_selections' => 'nullable|array',
            'items.*.non_sn_selections.*.nomor_imc' => 'nullable|string|max:100',
            'items.*.non_sn_selections.*.kondisi' => 'required|string|max:100',
            'items.*.non_sn_selections.*.qty' => 'required|integer|min:1|max:50',
        ]);
        foreach ($validated['items'] as $index => $item) {
            $arah = $item['arah_transfer'] ?? (($item['tujuan_tipe'] ?? 'GUDANG') === 'PROYEK' ? 'GUDANG_KE_PROYEK' : 'GUDANG_KE_GUDANG');
            if ($arah !== 'GUDANG_KE_GUDANG' || ($item['tujuan_tipe'] ?? 'GUDANG') !== 'GUDANG') {
                throw ValidationException::withMessages([
                    "items.{$index}.arah_transfer" => 'Transfer hanya mendukung perpindahan Gudang ke Gudang. Untuk pengeluaran ke proyek, gunakan menu Barang Keluar.'
                ]);
            }
            if (empty($item['gudang_tujuan_id'])) {
                throw ValidationException::withMessages([
                    "items.{$index}.gudang_tujuan_id" => 'Gudang tujuan wajib dipilih.'
                ]);
            }
            if ((string) $item['gudang_asal_id'] === (string) $item['gudang_tujuan_id']) {
                throw ValidationException::withMessages([
                    "items.{$index}.gudang_tujuan_id" => 'Gudang asal dan tujuan tidak boleh sama.'
                ]);
            }
        }
        $barangIds = array_unique(array_column($validated['items'], 'barang_id'));
        $gudangAsalIds = array_unique(array_column($validated['items'], 'gudang_asal_id'));
        $barangs = Barang::whereIn('id', $barangIds)->get()->keyBy('id');
        $allCleanSns = [];
        foreach ($validated['items'] as $item) {
            foreach (($item['serials'] ?? []) as $sn) {
                $clean = trim((string) $sn);
                if ($clean !== '') {
                    $allCleanSns[] = $clean;
                }
            }
        }

        if (count($allCleanSns) !== count(array_unique($allCleanSns))) {
            throw new \Exception('Terdapat Serial Number yang dipilih lebih dari satu kali dalam transaksi transfer.');
        }
        $allCleanSns = array_values(array_unique($allCleanSns));
        DB::transaction(function () use (
            $validated,
            $request,
            $barangs,
            $barangIds,
            $gudangAsalIds,
            $allCleanSns
        ) {
            $now = now();
            $serialsMap = collect();
            $detailSerialsToInsert = [];
            $serialsToUpdate = [];
            $stockLogsToInsert = [];
            $conditionStockCache = [];
            $reservedConditionStock = [];
            if (!empty($allCleanSns)) {
                $serialsMap = BarangSerial::whereIn('barang_id', $barangIds)
                    ->whereIn('gudang_id', $gudangAsalIds)
                    ->whereIn('status', ['IN_WAREHOUSE', 'READY', 'AVAILABLE'])
                    ->whereIn('serial_number', $allCleanSns)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy(fn($s) =>
                        $s->barang_id . '_' .
                        $s->gudang_id . '_' .
                        trim($s->serial_number)
                    );
            }

            foreach ($validated['items'] as $item) {
                $barangId = (int) $item['barang_id'];
                $gudangAsalId = (int) $item['gudang_asal_id'];
                $arahTransfer = $item['arah_transfer'] ?? (($item['tujuan_tipe'] ?? 'GUDANG') === 'PROYEK' ? 'GUDANG_KE_PROYEK' : 'GUDANG_KE_GUDANG');
                $isProject = false;
                if ($arahTransfer !== 'GUDANG_KE_GUDANG' || ($item['tujuan_tipe'] ?? 'GUDANG') !== 'GUDANG') {
                    throw ValidationException::withMessages(['items' => 'Transfer ke proyek sudah dinonaktifkan. Gunakan menu Barang Keluar.']);
                }
                $gudangTujuanId = $isProject ? null : (int) $item['gudang_tujuan_id'];
                $kodeProjek = $isProject ? trim((string) $item['kode_projek']) : null;
                $lockedProject = null;
                if ($isProject) {
                    $lockedProject = Proyek::query()->where('kode_projek', $kodeProjek)->where('is_active', true)->lockForUpdate()->first();
                    if (!$lockedProject) throw new \Exception("Proyek '{$kodeProjek}' sudah tidak aktif atau tidak ditemukan.");
                }
                $qty = (int) $item['qty'];
                $serials = array_values(array_filter(array_map('trim', $item['serials'] ?? [])));
                $barang = $barangs->get($barangId);
                if (!$barang) {
                    throw new \Exception("Data barang #{$barangId} tidak ditemukan.");
                }

                if (!$isProject && $gudangAsalId === $gudangTujuanId) {
                    throw new \Exception('Gudang Asal dan Gudang Tujuan tidak boleh sama.');
                }
                $stokAsal = Stok::where('barang_id', $barangId)
                    ->where('gudang_id', $gudangAsalId)
                    ->lockForUpdate()
                    ->first();
                if (!$stokAsal || $stokAsal->jumlah < $qty) {
                    $stokTersedia = $stokAsal?->jumlah ?? 0;
                    throw new \Exception(
                        "Stok barang '{$barang->nama_barang}' di gudang asal tidak mencukupi " .
                        "(Tersedia: {$stokTersedia}, Diminta: {$qty})."
                    );
                }
                $isSn = $this->isBooleanFlag($barang->is_wajib_sn) ||
                    $this->isBooleanFlag($barang->is_sn);
                $conditionGroups = [];
                $groupSerials = [];
                $nomorImcParts = [];
                if (!empty($item['nomor_imc'])) {
                    $nomorImcParts[] = trim($item['nomor_imc']);
                }

                if ($isSn) {
                    if (count($serials) !== $qty) {
                        throw new \Exception(
                            "Pilih Serial Number untuk barang '{$barang->nama_barang}' tepat {$qty} unit."
                        );
                    }

                    foreach ($serials as $sn) {
                        $snKey = $barangId . '_' . $gudangAsalId . '_' . $sn;
                        $serialRecord = $serialsMap->get($snKey);
                        if (!$serialRecord) {
                            throw new \Exception(
                                "Serial Number '{$sn}' untuk barang '{$barang->nama_barang}' " .
                                'tidak ditemukan di gudang asal atau tidak tersedia untuk ditransfer.'
                            );
                        }
                        $condition = $this->normalizeCondition($serialRecord->kondisi);
                        $conditionGroups[$condition] = ($conditionGroups[$condition] ?? 0) + 1;
                        $groupSerials[$condition][] = $serialRecord;
                        if (!empty($serialRecord->nomer_imc)) {
                            $nomorImcParts[] = trim($serialRecord->nomer_imc);
                        }
                        $serialsToUpdate[(int) $serialRecord->id] = [
                            'gudang_id' => $isProject ? null : $gudangTujuanId,
                            'status' => $isProject ? 'IN_USE' : 'IN_WAREHOUSE',
                            'kode_projek' => $isProject ? $kodeProjek : null,
                        ];
                    }
                } else {
                    if (!empty($serials)) {
                        throw new \Exception(
                            "Barang '{$barang->nama_barang}' bukan barang SN sehingga Serial Number tidak boleh dikirim."
                        );
                    }
                    $selections = $item['non_sn_selections'] ?? [];
                    if (!empty($selections)) {
                        $selectedTotal = 0;
                        foreach ($selections as $selection) {
                            $condition = $this->normalizeCondition($selection['kondisi'] ?? 'Baru');
                            $selectionQty = (int) ($selection['qty'] ?? 0);
                            if ($condition === 'Campuran') {
                                throw new \Exception(
                                    "Kondisi Campuran tidak boleh dikirim sebagai satu pilihan. Pisahkan menjadi Baru, Bekas, dan Rusak."
                                );
                            }

                            if ($selectionQty <= 0) {
                                continue;
                            }
                            $selectedTotal += $selectionQty;
                            $conditionGroups[$condition] = ($conditionGroups[$condition] ?? 0) + $selectionQty;
                            if (!empty($selection['nomor_imc'])) {
                                $nomorImcParts[] = trim($selection['nomor_imc']);
                            }
                        }

                        if ($selectedTotal !== $qty) {
                            throw new \Exception(
                                "Total pilihan kondisi untuk barang '{$barang->nama_barang}' " .
                                "harus sama dengan Qty transfer ({$qty})."
                            );
                        }
                    } else {
                        $fallbackCondition = $this->normalizeCondition($item['kondisi'] ?? 'Baru');
                        if ($fallbackCondition === 'Campuran') {
                            throw new \Exception(
                                "Detail kondisi barang '{$barang->nama_barang}' tidak valid."
                            );
                        }
                        $conditionGroups[$fallbackCondition] = $qty;
                    }

                    foreach ($conditionGroups as $condition => $conditionQty) {
                        $cacheKey = $barangId . '_' . $gudangAsalId;
                        if (!isset($conditionStockCache[$cacheKey])) {
                            $conditionStockCache[$cacheKey] = $this->getNonSnConditionStock(
                                $barangId,
                                $gudangAsalId
                            );
                        }
                        $availableCondition = (int) (
                            $conditionStockCache[$cacheKey][$condition] ?? 0
                        );
                        $reservedKey = $cacheKey . '_' . $condition;
                        $reservedQty = (int) ($reservedConditionStock[$reservedKey] ?? 0);
                        if ($reservedQty + $conditionQty > $availableCondition) {
                            $sisa = max(0, $availableCondition - $reservedQty);
                            throw new \Exception(
                                "Stok kondisi {$condition} untuk barang '{$barang->nama_barang}' " .
                                "tidak mencukupi di gudang asal " .
                                "(Tersedia: {$sisa}, Diminta: {$conditionQty})."
                            );
                        }
                        $reservedConditionStock[$reservedKey] =
                            $reservedQty + $conditionQty;
                    }
                }

                if (empty($conditionGroups)) {
                    throw new \Exception(
                        "Kondisi transfer barang '{$barang->nama_barang}' tidak valid."
                    );
                }
                $conditionKeys = array_keys($conditionGroups);
                $kondisiFix = count($conditionKeys) > 1
                    ? 'Campuran'
                    : $conditionKeys[0];
                $nomorImcParts = array_values(
                    array_unique(
                        array_filter(
                            array_map('trim', $nomorImcParts)
                        )
                    )
                );
                $nomorImc = implode(', ', $nomorImcParts);
                $noTransaksi = 'TRX-TRF-' .
                    date('YmdHis') .
                    '-' .
                    strtoupper(Str::random(4));
                $transaksi = Transaksi::create([
                    'no_transaksi' => $noTransaksi,
                    'jenis_transaksi' => 'TRANSFER',
                    'sub_jenis' => 'TRANSFER_GUDANG',
                    'tanggal' => $item['tanggal'],
                    'kondisi' => $kondisiFix,
                    'nomor_omc' => $item['nomor_omc'],
                    'nomor_imc' => $isProject ? null : ($nomorImc ?: null),
                    'kode_projek' => $kodeProjek,
                    'nama_customer' => $isProject
                        ? ($lockedProject?->nama_customer ?: ($item['nama_customer'] ?? null))
                        : null,
                    'gudang_asal_id' => $gudangAsalId,
                    'gudang_tujuan_id' => $gudangTujuanId,
                    'pic_user_id' => $request->user()->id,
                    'status' => 'COMPLETED',
                ]);
                $stokTujuan = null;
                if ($gudangTujuanId) {
                    $stokTujuan = Stok::where('barang_id', $barangId)
                        ->where('gudang_id', $gudangTujuanId)
                        ->lockForUpdate()
                        ->first();
                    if (!$stokTujuan) {
                        $stokTujuan = Stok::create([
                            'barang_id' => $barangId,
                            'gudang_id' => $gudangTujuanId,
                            'jumlah' => 0,
                        ]);
                    }
                }

                foreach ($conditionGroups as $condition => $conditionQty) {
                    $detail = TransaksiDetail::create([
                        'transaksi_id' => $transaksi->id,
                        'barang_id' => $barangId,
                        'qty' => $conditionQty,
                        'harga' => 0,
                        'kondisi' => $condition,
                    ]);
                    $stokAsal->decrement('jumlah', $conditionQty);
                    if ($stokTujuan) {
                        $stokTujuan->increment('jumlah', $conditionQty);
                    }
                    $tujuanDescription = $isProject
                        ? "Proyek {$kodeProjek}"
                        : "Gudang #{$gudangTujuanId}";
                    $stockLogsToInsert[] = [
                        'barang_id' => $barangId,
                        'gudang_id' => $gudangAsalId,
                        'transaksi_id' => $transaksi->id,
                        'user_id' => $request->user()->id,
                        'qty_perubahan' => -$conditionQty,
                        'qty_akhir' => $stokAsal->jumlah,
                        'keterangan' => "Transfer Keluar ({$condition}) ke {$tujuanDescription}",
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                    if ($stokTujuan) {
                        $stockLogsToInsert[] = [
                            'barang_id' => $barangId,
                            'gudang_id' => $gudangTujuanId,
                            'transaksi_id' => $transaksi->id,
                            'user_id' => $request->user()->id,
                            'qty_perubahan' => $conditionQty,
                            'qty_akhir' => $stokTujuan->jumlah,
                            'keterangan' => "Penerimaan Transfer ({$condition}) dari Gudang #{$gudangAsalId}",
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    foreach ($groupSerials[$condition] ?? [] as $serialRecord) {
                        $detailSerialsToInsert[] = [
                            'transaksi_detail_id' => $detail->id,
                            'barang_serial_id' => $serialRecord->id,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
            }

            foreach ($serialsToUpdate as $serialId => $state) {
                DB::table('barang_serials')->where('id', $serialId)->update([
                    'gudang_id' => $state['gudang_id'],
                    'status' => $state['status'],
                    'kode_projek' => $state['kode_projek'],
                    'updated_at' => $now,
                ]);
            }

            if (!empty($detailSerialsToInsert)) {
                DB::table('transaksi_detail_serials')->insert($detailSerialsToInsert);
            }

            if (!empty($stockLogsToInsert)) {
                StockLog::insert($stockLogsToInsert);
            }
        });
        return redirect()
            ->back()
            ->with('success', count($validated['items']) . ' transaksi transfer berhasil dicatat.');
    }

    public function update(Request $request, int $id)
    {
        $transaksi = Transaksi::with(['details'])->findOrFail($id);
        if ($transaksi->status === 'CANCELLED') {
            return redirect()->back()->with('error', 'Transaksi yang sudah dibatalkan tidak dapat diedit.');
        }
        $isProjectTransfer = $transaksi->jenis_transaksi === 'TRANSFER'
            && empty($transaksi->gudang_tujuan_id)
            && !empty($transaksi->kode_projek);
        if ($isProjectTransfer) {
            return redirect()->back()->with('error', 'Transfer ke proyek tidak dapat diedit langsung karena memengaruhi saldo aset proyek. Batalkan transaksi jika masih aman, lalu buat transaksi baru.');
        }

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'kondisi' => 'nullable|string|max:100',
            'nomor_omc' => 'required|string|max:100',
            'nomor_imc' => 'nullable|string|max:100',
            'gudang_asal_id' => 'nullable|exists:gudangs,id',
            'gudang_tujuan_id' => 'nullable|exists:gudangs,id',
            'qty' => 'nullable|integer|min:1|max:50',
            'keterangan' => 'nullable|string|max:500',
        ]);
        $kondisiFix = !empty($validated['kondisi']) && $validated['kondisi'] !== '-'
            ? trim($validated['kondisi'])
            : ($transaksi->kondisi !== '-' ? $transaksi->kondisi : 'Baru');
        DB::transaction(function () use ($transaksi, $validated, $kondisiFix) {
            $transaksi->update([
                'tanggal' => $validated['tanggal'],
                'kondisi' => $kondisiFix,
                'nomor_omc' => $validated['nomor_omc'],
                'nomor_imc' => $validated['nomor_imc'] ?? $transaksi->nomor_imc,
                'gudang_asal_id' => $validated['gudang_asal_id'] ?? $transaksi->gudang_asal_id,
                'gudang_tujuan_id' => $validated['gudang_tujuan_id'] ?? $transaksi->gudang_tujuan_id,
                'keterangan' => $validated['keterangan'] ?? $transaksi->keterangan,
            ]);

            // Jangan meratakan kondisi jika transaksi memiliki beberapa detail kondisi.
            if ($transaksi->details->count() === 1) {
                $transaksi->details->first()->update([
                    'kondisi' => $kondisiFix,
                ]);
            }
        });
        return redirect()
            ->back()
            ->with('success', 'Data transfer gudang berhasil diperbarui.');
    }

    public function cancel(Request $request, int $id)
    {
        DB::transaction(function () use ($id, $request) {
            $transaksi = Transaksi::with(['details'])->findOrFail($id);
            if ($transaksi->status === 'CANCELLED') {
                throw new \Exception(
                    'Transaksi transfer ini sudah dibatalkan sebelumnya.'
                );
            }
            $now = now();
            $isProjectTransfer = !$transaksi->gudang_tujuan_id && !empty($transaksi->kode_projek)
                && ($transaksi->jenis_transaksi === 'TRANSFER' || $transaksi->sub_jenis === 'TRANSFER_GUDANG');
            foreach ($transaksi->details as $detail) {
                if ($isProjectTransfer) {
                    $hasLaterProjectMovement = DB::table('transaksi_details as later_detail')
                        ->join('transaksis as later', 'later.id', '=', 'later_detail.transaksi_id')
                        ->where('later_detail.barang_id', $detail->barang_id)
                        ->where('later.kode_projek', $transaksi->kode_projek)
                        ->where('later.id', '!=', $transaksi->id)
                        ->where(function ($q) {
                            $q->whereIn('later.status', ['COMPLETED', 'completed'])->orWhereNull('later.status');
                        })
                        ->where(function ($q) {
                            $q->where(function ($transfer) {
                                $transfer->where(function ($kind) {
                                    $kind->where('later.jenis_transaksi', 'TRANSFER')->orWhere('later.sub_jenis', 'TRANSFER_GUDANG');
                                })->whereNull('later.gudang_tujuan_id');
                            })->orWhere(function ($return) {
                                $return->where('later.jenis_transaksi', 'MASUK')->where('later.sub_jenis', 'PENGEMBALIAN');
                            });
                        })
                        ->where(function ($q) use ($transaksi) {
                            $q->where('later.tanggal', '>', $transaksi->tanggal)
                                ->orWhere(function ($sameDate) use ($transaksi) {
                                    $sameDate->where('later.tanggal', '=', $transaksi->tanggal)->where('later.id', '>', $transaksi->id);
                                });
                        })
                        ->exists();
                    if ($hasLaterProjectMovement) {
                        throw new \Exception('Transfer ke proyek ini tidak bisa dibatalkan karena sudah ada mutasi atau pengembalian lanjutan untuk barang yang sama. Periksa saldo proyek terlebih dahulu.');
                    }
                    $serialIdsForCheck = DB::table('transaksi_detail_serials')
                        ->where('transaksi_detail_id', $detail->id)
                        ->pluck('barang_serial_id');
                    if ($serialIdsForCheck->isNotEmpty()) {
                        $activeSerialCount = DB::table('barang_serials')
                            ->whereIn('id', $serialIdsForCheck)
                            ->where('status', 'IN_USE')
                            ->whereNull('gudang_id')
                            ->where('kode_projek', $transaksi->kode_projek)
                            ->lockForUpdate()
                            ->count();
                        if ($activeSerialCount !== $serialIdsForCheck->count()) {
                            throw new \Exception('Transfer tidak bisa dibatalkan karena satu atau lebih SN sudah tidak berada di proyek asal.');
                        }
                    }
                }
                $stokAsal = Stok::firstOrCreate(
                    [
                        'barang_id' => $detail->barang_id,
                        'gudang_id' => $transaksi->gudang_asal_id,
                    ],
                    ['jumlah' => 0]
                );
                $stokAsal->increment('jumlah', $detail->qty);
                $stokTujuan = $transaksi->gudang_tujuan_id
                    ? Stok::where('barang_id', $detail->barang_id)
                        ->where('gudang_id', $transaksi->gudang_tujuan_id)
                        ->lockForUpdate()
                        ->first()
                    : null;
                if ($stokTujuan && $stokTujuan->jumlah < $detail->qty) {
                    throw new \Exception(
                        'Stok di gudang tujuan tidak mencukupi untuk melakukan pembatalan.'
                    );
                }

                if ($stokTujuan) {
                    $stokTujuan->decrement('jumlah', $detail->qty);
                }
                $serialIds = DB::table('transaksi_detail_serials')
                    ->where('transaksi_detail_id', $detail->id)
                    ->pluck('barang_serial_id');
                if ($serialIds->isNotEmpty()) {
                    DB::table('barang_serials')->whereIn('id', $serialIds)->update([
                        'gudang_id' => $transaksi->gudang_asal_id,
                        'status' => 'IN_WAREHOUSE',
                        'kode_projek' => null,
                        'updated_at' => $now,
                    ]);
                }
                StockLog::create([
                    'barang_id' => $detail->barang_id,
                    'gudang_id' => $transaksi->gudang_asal_id,
                    'transaksi_id' => $transaksi->id,
                    'user_id' => $request->user()->id,
                    'qty_perubahan' => $detail->qty,
                    'qty_akhir' => $stokAsal->jumlah,
                    'keterangan' => $transaksi->gudang_tujuan_id
                        ? "Pembatalan Transfer ({$detail->kondisi}) - Kembali dari Gudang #{$transaksi->gudang_tujuan_id}"
                        : "Pembatalan Transfer ({$detail->kondisi}) - Kembali dari Proyek {$transaksi->kode_projek}",
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                if ($transaksi->gudang_tujuan_id) {
                    StockLog::create([
                        'barang_id' => $detail->barang_id,
                        'gudang_id' => $transaksi->gudang_tujuan_id,
                        'transaksi_id' => $transaksi->id,
                        'user_id' => $request->user()->id,
                        'qty_perubahan' => -$detail->qty,
                        'qty_akhir' => $stokTujuan?->jumlah ?? 0,
                        'keterangan' => "Pembatalan Transfer ({$detail->kondisi}) - Ditarik kembali ke Gudang #{$transaksi->gudang_asal_id}",
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }

            $transaksi->update(['status' => 'CANCELLED']);
        });
        return redirect()
            ->back()
            ->with('success', 'Transfer gudang berhasil dibatalkan dan stok dikembalikan.');
    }

    private function isBooleanFlag($value): bool
    {
        return $value === true ||
            $value === 1 ||
            $value === '1' ||
            strtolower((string) $value) === 'true';
    }

    private function normalizeCondition(?string $condition): string
    {
        $value = strtoupper(trim((string) $condition));
        if (str_contains($value, 'RUSAK') || str_contains($value, 'DAMAGED')) {
            return 'Rusak';
        }

        if (
            str_contains($value, 'BEKAS') ||
            str_contains($value, 'SECOND') ||
            str_contains($value, 'USED')
        ) {
            return 'Bekas';
        }

        if ($value === 'CAMPURAN') {
            return 'Campuran';
        }

        return 'Baru';
    }

    private function getNonSnConditionStock(int $barangId, int $gudangId): array
    {
        $stock = [
            'Baru' => 0,
            'Bekas' => 0,
            'Rusak' => 0,
        ];
        $details = DB::table('transaksi_details')
            ->join(
                'transaksis',
                'transaksis.id',
                '=',
                'transaksi_details.transaksi_id'
            )
            ->where('transaksi_details.barang_id', $barangId)
            ->where(function ($query) {
                $query->whereIn('transaksis.status', ['COMPLETED', 'completed'])
                    ->orWhereNull('transaksis.status');
            })
            ->orderBy('transaksis.tanggal', 'asc')
            ->orderByRaw("
                CASE
                    WHEN transaksis.jenis_transaksi = 'MASUK' THEN 1
                    WHEN transaksis.jenis_transaksi = 'TRANSFER'
                        OR transaksis.sub_jenis = 'TRANSFER_GUDANG' THEN 2
                    ELSE 3
                END
            ")
            ->orderBy('transaksis.id', 'asc')
            ->select([
                'transaksi_details.qty',
                'transaksi_details.kondisi as detail_kondisi',
                'transaksis.jenis_transaksi',
                'transaksis.sub_jenis',
                'transaksis.gudang_asal_id',
                'transaksis.gudang_tujuan_id',
                'transaksis.kondisi as transaksi_kondisi',
            ])
            ->get();
        foreach ($details as $detail) {
            $qty = (int) $detail->qty;
            $condition = $this->normalizeCondition(
                $detail->detail_kondisi &&
                $detail->detail_kondisi !== '-'
                    ? $detail->detail_kondisi
                    : ($detail->transaksi_kondisi ?? 'Baru')
            );
            if ($condition === 'Campuran') {
                continue;
            }

            if (
                $detail->jenis_transaksi === 'MASUK' &&
                (int) $detail->gudang_tujuan_id === $gudangId
            ) {
                $stock[$condition] += $qty;
                continue;
            }

            if (
                $detail->jenis_transaksi === 'KELUAR' &&
                (int) $detail->gudang_asal_id === $gudangId
            ) {
                $stock[$condition] = max(0, $stock[$condition] - $qty);
                continue;
            }

            if (
                $detail->jenis_transaksi === 'TRANSFER' ||
                $detail->sub_jenis === 'TRANSFER_GUDANG'
            ) {
                if ((int) $detail->gudang_asal_id === $gudangId) {
                    $stock[$condition] = max(0, $stock[$condition] - $qty);
                }

                if ((int) $detail->gudang_tujuan_id === $gudangId) {
                    $stock[$condition] += $qty;
                }
            }
        }

        return $stock;
    }
}
