<?php

namespace App\Http\Controllers;

use App\Models\Barang;
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
            'items.*.arah_transfer' => 'nullable|string|in:GUDANG_KE_GUDANG,GUDANG_KE_PROYEK,PROYEK_KE_GUDANG',
            'items.*.tujuan_tipe' => 'nullable|string|in:GUDANG,PROYEK',
            'items.*.tanggal' => 'required|date',
            'items.*.kondisi' => 'nullable|string|max:100',
            'items.*.nomor_omc' => 'required|string|max:100',
            'items.*.nomor_imc' => 'nullable|string|max:100',
            'items.*.kode_projek' => 'nullable|string|max:100',
            'items.*.nama_customer' => 'nullable|string|max:255',
            'items.*.gudang_asal_id' => 'nullable|exists:gudangs,id',
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
            $direction = $this->resolveTransferDirection($item);
            $sourceWarehouseId = $item['gudang_asal_id'] ?? null;
            $targetWarehouseId = $item['gudang_tujuan_id'] ?? null;
            $projectCode = trim((string) ($item['kode_projek'] ?? ''));

            if ($direction === 'GUDANG_KE_GUDANG') {
                if (!$sourceWarehouseId || !$targetWarehouseId) {
                    throw ValidationException::withMessages([
                        "items.{$index}.gudang_tujuan_id" => 'Gudang asal dan gudang tujuan wajib dipilih.',
                    ]);
                }
                if ((int) $sourceWarehouseId === (int) $targetWarehouseId) {
                    throw ValidationException::withMessages([
                        "items.{$index}.gudang_tujuan_id" => 'Gudang asal dan gudang tujuan tidak boleh sama.',
                    ]);
                }
            } elseif ($direction === 'GUDANG_KE_PROYEK') {
                if (!$sourceWarehouseId) {
                    throw ValidationException::withMessages([
                        "items.{$index}.gudang_asal_id" => 'Gudang asal wajib dipilih.',
                    ]);
                }
                if ($projectCode === '') {
                    throw ValidationException::withMessages([
                        "items.{$index}.kode_projek" => 'Kode proyek tujuan wajib dipilih.',
                    ]);
                }

                $projectExists = Transaksi::query()
                    ->where('kode_projek', $projectCode)
                    ->where(function ($query) {
                        $query->where(function ($outbound) {
                            $outbound->where('jenis_transaksi', 'KELUAR')
                                ->where('sub_jenis', 'BARANG_KE_SITE');
                        })->orWhere(function ($transfer) {
                            $transfer->where('jenis_transaksi', 'TRANSFER')
                                ->whereNotNull('gudang_asal_id')
                                ->whereNull('gudang_tujuan_id')
                                ->where('sub_jenis', '!=', 'PENGEMBALIAN_PROYEK');
                        });
                    })
                    ->where(function ($query) {
                        $query->whereIn('status', ['COMPLETED', 'completed'])
                            ->orWhereNull('status');
                    })
                    ->exists();

                if (!$projectExists) {
                    throw ValidationException::withMessages([
                        "items.{$index}.kode_projek" => "Kode proyek '{$projectCode}' tidak ditemukan pada transaksi proyek yang berhasil.",
                    ]);
                }
            } else {
                if (!$targetWarehouseId) {
                    throw ValidationException::withMessages([
                        "items.{$index}.gudang_tujuan_id" => 'Gudang tujuan pengembalian wajib dipilih.',
                    ]);
                }
                if ($projectCode === '') {
                    throw ValidationException::withMessages([
                        "items.{$index}.kode_projek" => 'Proyek asal wajib dipilih.',
                    ]);
                }
            }
        }

        $barangIds = array_values(array_unique(array_map(
            'intval',
            array_column($validated['items'], 'barang_id')
        )));
        $gudangAsalIds = [];
        $allCleanSns = [];
        $seenSns = [];

        foreach ($validated['items'] as $item) {
            $direction = $this->resolveTransferDirection($item);
            if ($direction !== 'PROYEK_KE_GUDANG' && !empty($item['gudang_asal_id'])) {
                $gudangAsalIds[] = (int) $item['gudang_asal_id'];
            }

            foreach (($item['serials'] ?? []) as $serial) {
                $clean = trim((string) $serial);
                if ($clean === '') continue;

                $key = mb_strtolower($clean);
                if (isset($seenSns[$key])) {
                    throw ValidationException::withMessages([
                        'items' => "Serial Number '{$clean}' dipilih lebih dari satu kali dalam transaksi.",
                    ]);
                }
                $seenSns[$key] = true;
                $allCleanSns[] = $clean;
            }
        }

        $gudangAsalIds = array_values(array_unique($gudangAsalIds));
        $barangs = Barang::whereIn('id', $barangIds)->get()->keyBy('id');
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

            // Kunci riwayat proyek terlebih dahulu agar dua pengembalian bersamaan
            // tidak sama-sama membaca saldo proyek yang sama.
            $returnProjectCodes = collect($validated['items'])
                ->filter(fn ($item) => $this->resolveTransferDirection($item) === 'PROYEK_KE_GUDANG')
                ->map(fn ($item) => trim((string) ($item['kode_projek'] ?? '')))
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (!empty($returnProjectCodes)) {
                Transaksi::query()
                    ->whereIn('kode_projek', $returnProjectCodes)
                    ->where(function ($query) {
                        $query->whereIn('status', ['COMPLETED', 'completed'])->orWhereNull('status');
                    })
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get(['id']);
            }

            // Kunci baris stok tujuan sebelum menghitung ulang saldo proyek.
            $returnStockKeys = [];
            foreach ($validated['items'] as $item) {
                if ($this->resolveTransferDirection($item) !== 'PROYEK_KE_GUDANG') continue;
                $returnStockKeys[(int) $item['barang_id'] . '_' . (int) $item['gudang_tujuan_id']] = [
                    'barang_id' => (int) $item['barang_id'],
                    'gudang_id' => (int) $item['gudang_tujuan_id'],
                ];
            }
            foreach ($returnStockKeys as $stockKey) {
                Stok::firstOrCreate(
                    ['barang_id' => $stockKey['barang_id'], 'gudang_id' => $stockKey['gudang_id']],
                    ['jumlah' => 0]
                );
                Stok::where('barang_id', $stockKey['barang_id'])
                    ->where('gudang_id', $stockKey['gudang_id'])
                    ->lockForUpdate()
                    ->first();
            }

            $projectInventory = $this->getProjectInventorySnapshot();
            $serialRecords = collect();
            $detailSerialsToInsert = [];
            $serialsToUpdate = [];
            $stockLogsToInsert = [];
            $conditionStockCache = [];
            $reservedConditionStock = [];
            $reservedProjectConditionStock = [];

            if (!empty($allCleanSns)) {
                $serialRecords = BarangSerial::query()
                    ->whereIn('barang_id', $barangIds)
                    ->whereIn('serial_number', $allCleanSns)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy(fn ($serial) => (int) $serial->barang_id . '_' . mb_strtolower(trim($serial->serial_number)));
            }

            foreach ($validated['items'] as $index => $item) {
                $direction = $this->resolveTransferDirection($item);
                $isProjectOutbound = $direction === 'GUDANG_KE_PROYEK';
                $isProjectReturn = $direction === 'PROYEK_KE_GUDANG';
                $isProjectMovement = $isProjectOutbound || $isProjectReturn;
                $barangId = (int) $item['barang_id'];
                $gudangAsalId = $isProjectReturn ? null : (int) $item['gudang_asal_id'];
                $gudangTujuanId = $isProjectOutbound ? null : (int) $item['gudang_tujuan_id'];
                $kodeProjek = $isProjectMovement ? trim((string) ($item['kode_projek'] ?? '')) : null;
                $qty = (int) $item['qty'];
                $serials = array_values(array_filter(array_map(
                    fn ($value) => trim((string) $value),
                    $item['serials'] ?? []
                ), fn ($value) => $value !== ''));
                $barang = $barangs->get($barangId);

                if (!$barang) {
                    throw new \RuntimeException("Data barang #{$barangId} tidak ditemukan.");
                }

                $isSn = $this->isBooleanFlag($barang->is_wajib_sn) ||
                    $this->isBooleanFlag($barang->is_sn ?? false);

                if (!$isProjectReturn && !$gudangAsalId) {
                    throw new \RuntimeException("Gudang asal barang '{$barang->nama_barang}' tidak valid.");
                }
                if ($isProjectOutbound && $gudangAsalId === $gudangTujuanId) {
                    throw new \RuntimeException('Gudang asal dan tujuan tidak boleh sama.');
                }

                $stokAsal = null;
                if ($gudangAsalId) {
                    $stokAsal = Stok::query()
                        ->where('barang_id', $barangId)
                        ->where('gudang_id', $gudangAsalId)
                        ->lockForUpdate()
                        ->first();

                    if (!$stokAsal || (int) $stokAsal->jumlah < $qty) {
                        $available = (int) ($stokAsal?->jumlah ?? 0);
                        throw new \RuntimeException(
                            "Stok barang '{$barang->nama_barang}' di gudang asal tidak mencukupi (Tersedia: {$available}, Diminta: {$qty})."
                        );
                    }
                }

                $conditionGroups = [];
                $groupSerials = [];
                $nomorImcParts = [];

                if (!empty($item['nomor_imc'])) {
                    $nomorImcParts[] = trim((string) $item['nomor_imc']);
                }

                if ($isSn) {
                    if (count($serials) !== $qty) {
                        throw new \RuntimeException(
                            "Pilih Serial Number untuk barang '{$barang->nama_barang}' tepat {$qty} unit."
                        );
                    }

                    foreach ($serials as $sn) {
                        $serialKey = $barangId . '_' . mb_strtolower($sn);
                        $serialRecord = $serialRecords->get($serialKey);
                        if (!$serialRecord) {
                            throw new \RuntimeException("Serial Number '{$sn}' tidak ditemukan.");
                        }

                        if ($isProjectReturn) {
                            $ownedSerial = $projectInventory['serials'][$barangId][$kodeProjek][mb_strtolower($sn)] ?? null;
                            if (
                                !$ownedSerial ||
                                (int) $ownedSerial['id'] !== (int) $serialRecord->id ||
                                strtoupper((string) $serialRecord->status) !== 'IN_USE' ||
                                $serialRecord->gudang_id !== null
                            ) {
                                throw new \RuntimeException(
                                    "Serial Number '{$sn}' tidak tercatat aktif pada proyek '{$kodeProjek}' atau sudah dikembalikan."
                                );
                            }
                        } else {
                            $status = strtoupper(trim((string) $serialRecord->status));
                            if (
                                (int) $serialRecord->gudang_id !== (int) $gudangAsalId ||
                                !in_array($status, ['IN_WAREHOUSE', 'READY', 'AVAILABLE'], true)
                            ) {
                                throw new \RuntimeException(
                                    "Serial Number '{$sn}' tidak tersedia di gudang asal yang dipilih."
                                );
                            }
                        }

                        $condition = $this->normalizeCondition($serialRecord->kondisi);
                        $conditionGroups[$condition] = ($conditionGroups[$condition] ?? 0) + 1;
                        $groupSerials[$condition][] = $serialRecord;

                        if (!empty($serialRecord->nomer_imc)) {
                            $nomorImcParts[] = trim((string) $serialRecord->nomer_imc);
                        }

                        $serialsToUpdate[$isProjectOutbound ? 'PROJECT' : (string) $gudangTujuanId][] = $serialRecord->id;
                    }
                } else {
                    if (!empty($serials)) {
                        throw new \RuntimeException(
                            "Barang '{$barang->nama_barang}' bukan barang SN sehingga Serial Number tidak boleh dikirim."
                        );
                    }

                    $selections = $item['non_sn_selections'] ?? [];
                    $selectedTotal = 0;

                    if (!empty($selections)) {
                        foreach ($selections as $selection) {
                            $condition = $this->normalizeCondition($selection['kondisi'] ?? 'Baru');
                            $selectionQty = (int) ($selection['qty'] ?? 0);
                            if ($condition === 'Campuran') {
                                throw new \RuntimeException('Kondisi Campuran harus dipisahkan menjadi Baru, Bekas, dan Rusak.');
                            }
                            if ($selectionQty <= 0) continue;

                            $selectedTotal += $selectionQty;
                            $conditionGroups[$condition] = ($conditionGroups[$condition] ?? 0) + $selectionQty;
                            if (!empty($selection['nomor_imc'])) {
                                $nomorImcParts[] = trim((string) $selection['nomor_imc']);
                            }

                            if ($isProjectReturn) {
                                $projectAvailable = (int) ($projectInventory['stocks'][$barangId][$kodeProjek][$condition] ?? 0);
                                $reservedKey = $barangId . '_' . $kodeProjek . '_' . $condition;
                                $reserved = (int) ($reservedProjectConditionStock[$reservedKey] ?? 0);
                                if ($reserved + $selectionQty > $projectAvailable) {
                                    $remaining = max(0, $projectAvailable - $reserved);
                                    throw new \RuntimeException(
                                        "Stok kondisi {$condition} barang '{$barang->nama_barang}' pada proyek '{$kodeProjek}' tidak mencukupi (Tersedia: {$remaining}, Diminta: {$selectionQty})."
                                    );
                                }
                                $reservedProjectConditionStock[$reservedKey] = $reserved + $selectionQty;
                            } else {
                                $cacheKey = $barangId . '_' . $gudangAsalId;
                                if (!isset($conditionStockCache[$cacheKey])) {
                                    $conditionStockCache[$cacheKey] = $this->getNonSnConditionStock($barangId, $gudangAsalId);
                                }
                                $availableCondition = (int) ($conditionStockCache[$cacheKey][$condition] ?? 0);
                                $reservedKey = $cacheKey . '_' . $condition;
                                $reserved = (int) ($reservedConditionStock[$reservedKey] ?? 0);
                                if ($reserved + $selectionQty > $availableCondition) {
                                    $remaining = max(0, $availableCondition - $reserved);
                                    throw new \RuntimeException(
                                        "Stok kondisi {$condition} barang '{$barang->nama_barang}' di gudang asal tidak mencukupi (Tersedia: {$remaining}, Diminta: {$selectionQty})."
                                    );
                                }
                                $reservedConditionStock[$reservedKey] = $reserved + $selectionQty;
                            }
                        }
                    } else {
                        $condition = $this->normalizeCondition($item['kondisi'] ?? 'Baru');
                        if ($condition === 'Campuran') {
                            throw new \RuntimeException("Detail kondisi barang '{$barang->nama_barang}' tidak valid.");
                        }
                        $conditionGroups[$condition] = $qty;
                        if ($isProjectReturn) {
                            $availableCondition = (int) ($projectInventory['stocks'][$barangId][$kodeProjek][$condition] ?? 0);
                            $reservedKey = $barangId . '_' . $kodeProjek . '_' . $condition;
                            $reserved = (int) ($reservedProjectConditionStock[$reservedKey] ?? 0);
                            if ($reserved + $qty > $availableCondition) {
                                throw new \RuntimeException("Stok kondisi {$condition} barang '{$barang->nama_barang}' tidak mencukupi pada proyek '{$kodeProjek}'.");
                            }
                            $reservedProjectConditionStock[$reservedKey] = $reserved + $qty;
                        } else {
                            $cacheKey = $barangId . '_' . $gudangAsalId;
                            if (!isset($conditionStockCache[$cacheKey])) {
                                $conditionStockCache[$cacheKey] = $this->getNonSnConditionStock($barangId, $gudangAsalId);
                            }
                            $availableCondition = (int) ($conditionStockCache[$cacheKey][$condition] ?? 0);
                            $reservedKey = $cacheKey . '_' . $condition;
                            $reserved = (int) ($reservedConditionStock[$reservedKey] ?? 0);
                            if ($reserved + $qty > $availableCondition) {
                                throw new \RuntimeException("Stok kondisi {$condition} barang '{$barang->nama_barang}' tidak mencukupi di gudang asal.");
                            }
                            $reservedConditionStock[$reservedKey] = $reserved + $qty;
                        }
                    }

                    if (!empty($selections) && $selectedTotal !== $qty) {
                        throw new \RuntimeException(
                            "Total pilihan kondisi untuk barang '{$barang->nama_barang}' harus sama dengan Qty transfer ({$qty})."
                        );
                    }
                }

                if (empty($conditionGroups)) {
                    throw new \RuntimeException("Kondisi transfer barang '{$barang->nama_barang}' tidak valid.");
                }

                $conditionKeys = array_keys($conditionGroups);
                $kondisiFix = count($conditionKeys) > 1 ? 'Campuran' : $conditionKeys[0];
                $nomorImcParts = array_values(array_unique(array_filter(array_map('trim', $nomorImcParts))));
                $nomorImc = implode(', ', $nomorImcParts);

                $noTransaksi = ($isProjectReturn ? 'TRX-TRF-RET-' : 'TRX-TRF-') .
                    date('YmdHis') . '-' . strtoupper(Str::random(4));

                $transaksi = Transaksi::create([
                    'no_transaksi' => $noTransaksi,
                    'jenis_transaksi' => 'TRANSFER',
                    'sub_jenis' => $isProjectReturn ? 'PENGEMBALIAN_PROYEK' : 'TRANSFER_GUDANG',
                    'tanggal' => $item['tanggal'],
                    'kondisi' => $kondisiFix,
                    'nomor_omc' => trim((string) $item['nomor_omc']),
                    'nomor_imc' => $isProjectOutbound ? null : ($nomorImc ?: null),
                    'kode_projek' => $kodeProjek,
                    'nama_customer' => $isProjectMovement && !empty($item['nama_customer'])
                        ? trim((string) $item['nama_customer'])
                        : null,
                    'pihak_asal' => $isProjectReturn ? $kodeProjek : null,
                    'gudang_asal_id' => $gudangAsalId,
                    'gudang_tujuan_id' => $gudangTujuanId,
                    'pic_user_id' => $request->user()->id,
                    'status' => 'COMPLETED',
                ]);

                $stokTujuan = null;
                if ($gudangTujuanId) {
                    $stokTujuan = Stok::query()
                        ->where('barang_id', $barangId)
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
                        'qty' => (int) $conditionQty,
                        'harga' => 0,
                        'kondisi' => $condition,
                    ]);

                    if ($stokAsal) {
                        $stokAsal->decrement('jumlah', (int) $conditionQty);
                        $stokAsal->refresh();
                        $stockLogsToInsert[] = [
                            'barang_id' => $barangId,
                            'gudang_id' => $gudangAsalId,
                            'transaksi_id' => $transaksi->id,
                            'user_id' => $request->user()->id,
                            'qty_perubahan' => -(int) $conditionQty,
                            'qty_akhir' => (int) $stokAsal->jumlah,
                            'keterangan' => $isProjectOutbound
                                ? "Transfer Keluar ({$condition}) ke Proyek {$kodeProjek}"
                                : "Transfer Keluar ({$condition}) ke Gudang #{$gudangTujuanId}",
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    if ($stokTujuan) {
                        $stokTujuan->increment('jumlah', (int) $conditionQty);
                        $stokTujuan->refresh();
                        $stockLogsToInsert[] = [
                            'barang_id' => $barangId,
                            'gudang_id' => $gudangTujuanId,
                            'transaksi_id' => $transaksi->id,
                            'user_id' => $request->user()->id,
                            'qty_perubahan' => (int) $conditionQty,
                            'qty_akhir' => (int) $stokTujuan->jumlah,
                            'keterangan' => $isProjectReturn
                                ? "Pengembalian dari Proyek {$kodeProjek} ({$condition})"
                                : "Penerimaan Transfer ({$condition}) dari Gudang #{$gudangAsalId}",
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

            foreach ($serialsToUpdate as $targetWarehouseKey => $serialIds) {
                $isProjectTarget = $targetWarehouseKey === 'PROJECT';
                BarangSerial::whereIn('id', array_unique($serialIds))->update([
                    'gudang_id' => $isProjectTarget ? null : (int) $targetWarehouseKey,
                    'status' => $isProjectTarget ? 'IN_USE' : 'IN_WAREHOUSE',
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

        return redirect()->back()->with('success', 'Transaksi transfer/pengembalian proyek berhasil dicatat.');
    }

    private function resolveTransferDirection(array $item): string
    {
        $direction = strtoupper(trim((string) ($item['arah_transfer'] ?? '')));
        if (in_array($direction, ['GUDANG_KE_GUDANG', 'GUDANG_KE_PROYEK', 'PROYEK_KE_GUDANG'], true)) {
            return $direction;
        }

        // Kompatibilitas untuk form lama yang hanya mengirim tujuan_tipe.
        return strtoupper((string) ($item['tujuan_tipe'] ?? 'GUDANG')) === 'PROYEK'
            ? 'GUDANG_KE_PROYEK'
            : 'GUDANG_KE_GUDANG';
    }

    private function getProjectInventorySnapshot(): array
    {
        $inventory = ['stocks' => [], 'batches' => [], 'serials' => []];
        $serialOwners = [];

        $transaksis = Transaksi::with(['details.serials'])
            ->where(function ($query) {
                $query->whereIn('status', ['COMPLETED', 'completed'])->orWhereNull('status');
            })
            ->where(function ($movement) {
                $movement->where(function ($outbound) {
                    $outbound->where('jenis_transaksi', 'KELUAR')
                        ->where('sub_jenis', 'BARANG_KE_SITE');
                })->orWhere(function ($transferToProject) {
                    $transferToProject->where('jenis_transaksi', 'TRANSFER')
                        ->where('sub_jenis', '!=', 'PENGEMBALIAN_PROYEK')
                        ->whereNotNull('gudang_asal_id')
                        ->whereNull('gudang_tujuan_id')
                        ->whereNotNull('kode_projek')
                        ->where('kode_projek', '!=', '');
                })->orWhere('sub_jenis', 'PENGEMBALIAN_PROYEK');
            })
            ->orderBy('tanggal')
            ->orderBy('id')
            ->get();

        foreach ($transaksis as $transaksi) {
            $projectCode = trim((string) ($transaksi->kode_projek ?? ''));
            $isReturn = $transaksi->sub_jenis === 'PENGEMBALIAN_PROYEK';
            $isTransfer = $transaksi->jenis_transaksi === 'TRANSFER' || $transaksi->sub_jenis === 'TRANSFER_GUDANG';
            $isProjectInbound = $projectCode !== '' &&
                !empty($transaksi->gudang_asal_id) &&
                empty($transaksi->gudang_tujuan_id) &&
                !$isReturn &&
                (($transaksi->jenis_transaksi === 'KELUAR' && $transaksi->sub_jenis === 'BARANG_KE_SITE') || $isTransfer);

            foreach ($transaksi->details as $detail) {
                $barangId = (int) $detail->barang_id;
                $qty = (int) $detail->qty;
                $condition = $this->normalizeCondition($detail->kondisi ?: $transaksi->kondisi ?: 'Baru');

                if ($isProjectInbound) {
                    $inventory['stocks'][$barangId][$projectCode][$condition] =
                        (int) ($inventory['stocks'][$barangId][$projectCode][$condition] ?? 0) + $qty;

                    $imc = trim((string) ($transaksi->nomor_imc ?: $transaksi->no_transaksi ?: 'Stok Proyek'));
                    $batchKey = $condition . '|' . $imc;
                    $inventory['batches'][$barangId][$projectCode][$batchKey] ??= [
                        'key' => $batchKey,
                        'kondisi' => $condition,
                        'nomor_imc' => $imc,
                        'max_stock' => 0,
                    ];
                    $inventory['batches'][$barangId][$projectCode][$batchKey]['max_stock'] += $qty;

                    foreach ($detail->serials as $serial) {
                        $serialOwners[(int) $serial->id] = [
                            'barang_id' => $barangId,
                            'kode_projek' => $projectCode,
                            'id' => (int) $serial->id,
                            'serial_number' => trim((string) $serial->serial_number),
                            'kondisi' => $serial->kondisi ?: $condition,
                            'nomor_imc' => $serial->nomer_imc,
                        ];
                    }
                    continue;
                }

                if ($isReturn && $projectCode !== '' && !empty($transaksi->gudang_tujuan_id)) {
                    $current = (int) ($inventory['stocks'][$barangId][$projectCode][$condition] ?? 0);
                    $inventory['stocks'][$barangId][$projectCode][$condition] = max(0, $current - $qty);

                    $remainingToRemove = $qty;
                    foreach (($inventory['batches'][$barangId][$projectCode] ?? []) as $batchKey => $batch) {
                        if ($remainingToRemove <= 0) break;
                        if (($batch['kondisi'] ?? '') !== $condition) continue;
                        $available = (int) ($batch['max_stock'] ?? 0);
                        if ($available <= 0) continue;
                        $take = min($available, $remainingToRemove);
                        $inventory['batches'][$barangId][$projectCode][$batchKey]['max_stock'] = $available - $take;
                        $remainingToRemove -= $take;
                    }

                    foreach ($detail->serials as $serial) {
                        $serialId = (int) $serial->id;
                        if (($serialOwners[$serialId]['kode_projek'] ?? null) === $projectCode) {
                            unset($serialOwners[$serialId]);
                        }
                    }
                    continue;
                }

                // Pergerakan lain dengan serial berarti serial tidak lagi ada di proyek sebelumnya.
                foreach ($detail->serials as $serial) {
                    unset($serialOwners[(int) $serial->id]);
                }
            }
        }

        foreach ($serialOwners as $owner) {
            $barangId = (int) $owner['barang_id'];
            $projectCode = (string) $owner['kode_projek'];
            $snKey = mb_strtolower((string) $owner['serial_number']);
            $inventory['serials'][$barangId][$projectCode][$snKey] = [
                'id' => (int) $owner['id'],
                'serial_number' => $owner['serial_number'],
                'kondisi' => $owner['kondisi'],
                'nomor_imc' => $owner['nomor_imc'],
                'gudang_id' => null,
                'status' => 'IN_USE',
            ];
        }

        foreach ($inventory['batches'] as $barangId => $projects) {
            foreach ($projects as $projectCode => $batches) {
                $inventory['batches'][$barangId][$projectCode] = array_values(array_filter(
                    $batches,
                    fn ($batch) => (int) ($batch['max_stock'] ?? 0) > 0
                ));
            }
        }

        return $inventory;
    }

    public function update(Request $request, int $id)
    {
        $transaksi = Transaksi::with(['details'])->findOrFail($id);

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
            $transaksi = Transaksi::with(['details'])->lockForUpdate()->findOrFail($id);

            if ($transaksi->status === 'CANCELLED') {
                throw new \RuntimeException('Transaksi transfer ini sudah dibatalkan sebelumnya.');
            }

            $isProjectReturn = $transaksi->sub_jenis === 'PENGEMBALIAN_PROYEK';
            $now = now();

            foreach ($transaksi->details as $detail) {
                $serialIds = DB::table('transaksi_detail_serials')
                    ->where('transaksi_detail_id', $detail->id)
                    ->pluck('barang_serial_id');

                if ($isProjectReturn) {
                    $stokTujuan = Stok::where('barang_id', $detail->barang_id)
                        ->where('gudang_id', $transaksi->gudang_tujuan_id)
                        ->lockForUpdate()
                        ->first();

                    if (!$stokTujuan || (int) $stokTujuan->jumlah < (int) $detail->qty) {
                        throw new \RuntimeException(
                            'Stok gudang tujuan tidak mencukupi untuk membatalkan pengembalian proyek.'
                        );
                    }

                    $stokTujuan->decrement('jumlah', (int) $detail->qty);
                    $stokTujuan->refresh();

                    if ($serialIds->isNotEmpty()) {
                        BarangSerial::whereIn('id', $serialIds)->update([
                            'gudang_id' => null,
                            'status' => 'IN_USE',
                            'updated_at' => $now,
                        ]);
                    }

                    StockLog::create([
                        'barang_id' => $detail->barang_id,
                        'gudang_id' => $transaksi->gudang_tujuan_id,
                        'transaksi_id' => $transaksi->id,
                        'user_id' => $request->user()->id,
                        'qty_perubahan' => -(int) $detail->qty,
                        'qty_akhir' => (int) $stokTujuan->jumlah,
                        'keterangan' => "Pembatalan pengembalian dari Proyek {$transaksi->kode_projek} ({$detail->kondisi})",
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);

                    continue;
                }

                $stokAsal = Stok::firstOrCreate(
                    [
                        'barang_id' => $detail->barang_id,
                        'gudang_id' => $transaksi->gudang_asal_id,
                    ],
                    ['jumlah' => 0]
                );
                $stokAsal->increment('jumlah', (int) $detail->qty);
                $stokAsal->refresh();

                $stokTujuan = $transaksi->gudang_tujuan_id
                    ? Stok::where('barang_id', $detail->barang_id)
                        ->where('gudang_id', $transaksi->gudang_tujuan_id)
                        ->lockForUpdate()
                        ->first()
                    : null;

                if ($stokTujuan && (int) $stokTujuan->jumlah < (int) $detail->qty) {
                    throw new \RuntimeException(
                        'Stok di gudang tujuan tidak mencukupi untuk melakukan pembatalan.'
                    );
                }

                if ($stokTujuan) {
                    $stokTujuan->decrement('jumlah', (int) $detail->qty);
                    $stokTujuan->refresh();
                }

                if ($serialIds->isNotEmpty()) {
                    BarangSerial::whereIn('id', $serialIds)->update([
                        'gudang_id' => $transaksi->gudang_asal_id,
                        'status' => 'IN_WAREHOUSE',
                        'updated_at' => $now,
                    ]);
                }

                StockLog::create([
                    'barang_id' => $detail->barang_id,
                    'gudang_id' => $transaksi->gudang_asal_id,
                    'transaksi_id' => $transaksi->id,
                    'user_id' => $request->user()->id,
                    'qty_perubahan' => (int) $detail->qty,
                    'qty_akhir' => (int) $stokAsal->jumlah,
                    'keterangan' => $transaksi->gudang_tujuan_id
                        ? "Pembatalan Transfer ({$detail->kondisi}) - Kembali dari Gudang #{$transaksi->gudang_tujuan_id}"
                        : "Pembatalan Transfer ({$detail->kondisi}) - Kembali dari Proyek {$transaksi->kode_projek}",
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                if ($stokTujuan) {
                    StockLog::create([
                        'barang_id' => $detail->barang_id,
                        'gudang_id' => $transaksi->gudang_tujuan_id,
                        'transaksi_id' => $transaksi->id,
                        'user_id' => $request->user()->id,
                        'qty_perubahan' => -(int) $detail->qty,
                        'qty_akhir' => (int) $stokTujuan->jumlah,
                        'keterangan' => "Pembatalan Transfer ({$detail->kondisi}) - Ditarik kembali ke Gudang #{$transaksi->gudang_asal_id}",
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }

            $transaksi->update(['status' => 'CANCELLED']);
        });

        return redirect()->back()->with('success', 'Transaksi transfer berhasil dibatalkan dan stok disesuaikan.');
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