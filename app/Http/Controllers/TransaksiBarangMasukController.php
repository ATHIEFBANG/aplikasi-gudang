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
use Illuminate\Database\UniqueConstraintViolationException;

class TransaksiBarangMasukController extends Controller
{
    private function normalizeProjectReturnCondition(?string $condition): string
    {
        $value = strtoupper(trim((string) $condition));
        if (str_contains($value, 'RUSAK') || str_contains($value, 'DAMAGED')) return 'Rusak';
        if (str_contains($value, 'BEKAS') || str_contains($value, 'SECOND') || str_contains($value, 'USED')) return 'Bekas';
        return 'Baru';
    }

    /** Saldo barang non-SN per kondisi yang masih berada pada proyek. */
    private function getProjectNonSnConditionStock(int $barangId, string $kodeProjek): array
    {
        $stock = ['Baru' => 0, 'Bekas' => 0, 'Rusak' => 0];
        $events = DB::table('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where('td.barang_id', $barangId)
            ->where('t.kode_projek', $kodeProjek)
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])->orWhereNull('t.status');
            })
            ->where(function ($q) {
                $q->where(function ($outbound) {
                    $outbound->where('t.jenis_transaksi', 'KELUAR')
                        ->where('t.sub_jenis', 'BARANG_KE_SITE');
                })->orWhere(function ($transfer) {
                    $transfer->where(function ($kind) {
                        $kind->where('t.jenis_transaksi', 'TRANSFER')->orWhere('t.sub_jenis', 'TRANSFER_GUDANG');
                    })->whereNull('t.gudang_tujuan_id');
                })->orWhere(function ($return) {
                    $return->where('t.jenis_transaksi', 'MASUK')->where('t.sub_jenis', 'PENGEMBALIAN')
                        ->whereNotNull('t.gudang_tujuan_id');
                });
            })
            ->orderBy('t.tanggal')->orderBy('t.id')->orderBy('td.id')
            ->get(['td.qty', 'td.kondisi as detail_kondisi', 't.kondisi as header_kondisi', 't.jenis_transaksi', 't.sub_jenis']);

        foreach ($events as $event) {
            $condition = $this->normalizeProjectReturnCondition($event->detail_kondisi ?: $event->header_kondisi);
            $isReturn = $event->jenis_transaksi === 'MASUK' && $event->sub_jenis === 'PENGEMBALIAN';
            $delta = (int) $event->qty * ($isReturn ? -1 : 1);
            $stock[$condition] = max(0, $stock[$condition] + $delta);
        }

        return $stock;
    }

    public function store(Request $request)
    {
        if (!$request->has('items') || !is_array($request->items)) {
            return redirect()->back()->with('error', 'Format data tidak valid.');
        }

        set_time_limit(120);

        try {
            $validated = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.sub_jenis' => 'required|string|in:PEMBELIAN,PEMINJAMAN,PENGEMBALIAN',
                'items.*.tanggal' => 'required|date',
                'items.*.kondisi' => 'required|string|max:50',
                'items.*.nomor_imc' => 'required|string|max:100',
                'items.*.nomor_omc' => 'nullable|string|max:100',
                'items.*.pihak_asal' => 'nullable|string|max:255',
                'items.*.kode_projek' => 'nullable|string|max:100|exists:proyeks,kode_projek',
                'items.*.nama_customer' => 'nullable|string|max:255',
                'items.*.gudang_tujuan_id' => 'required|exists:gudangs,id',
                'items.*.barang_id' => 'required|exists:barangs,id',
                'items.*.qty' => 'required|integer|min:1|max:50',
                'items.*.harga' => 'nullable|numeric|min:0',
                'items.*.serials' => 'nullable|array',
                'items.*.serials.*' => 'nullable|string|max:100',
            ]);

            $barangIds = array_unique(array_column($validated['items'], 'barang_id'));
            $barangs = Barang::whereIn('id', $barangIds)->get()->keyBy('id');
            $seenSerials = [];

            // Barang masuk normal harus memakai SN baru; pengembalian proyek memakai SN yang telah terdaftar.
            foreach ($validated['items'] as $index => $item) {
                $isProjectReturn = $item['sub_jenis'] === 'PENGEMBALIAN' && !empty($item['kode_projek']);
                if ($item['sub_jenis'] === 'PENGEMBALIAN' && !$isProjectReturn && empty(trim((string) ($item['pihak_asal'] ?? '')))) {
                    throw new \Exception('Asal barang wajib diisi untuk pengembalian manual.');
                }
                if ($isProjectReturn && !Proyek::where('kode_projek', trim($item['kode_projek']))->exists()) {
                    throw new \Exception("Kode proyek '{$item['kode_projek']}' tidak ditemukan di Master Data Proyek.");
                }

                foreach (array_filter(array_map('trim', $item['serials'] ?? []), fn($sn) => $sn !== '') as $sn) {
                    $key = strtolower($sn);
                    if (isset($seenSerials[$key])) {
                        throw new \Exception("Serial Number '{$sn}' dipilih lebih dari satu kali dalam transaksi.");
                    }
                    $seenSerials[$key] = true;

                    if (!$isProjectReturn && BarangSerial::whereRaw('LOWER(serial_number) = ?', [$key])->exists()) {
                        throw new \Exception("Serial Number '{$sn}' sudah terdaftar di sistem.");
                    }
                }
            }

            DB::transaction(function () use ($validated, $request, $barangs) {
                $now = now();
                $detailSerialsToInsert = [];
                $stockLogsToInsert = [];

                foreach ($validated['items'] as $item) {
                    $subJenis = $item['sub_jenis'];
                    $kodeProjek = $subJenis === 'PENGEMBALIAN' && !empty($item['kode_projek'])
                        ? trim((string) $item['kode_projek']) : null;
                    $isProjectReturn = $subJenis === 'PENGEMBALIAN' && $kodeProjek !== null;
                    $barangId = (int) $item['barang_id'];
                    $qty = (int) $item['qty'];
                    $barang = $barangs->get($barangId);
                    if (!$barang) throw new \Exception("Data barang #{$barangId} tidak ditemukan.");

                    $serials = array_values(array_filter(array_map('trim', $item['serials'] ?? []), fn($sn) => $sn !== ''));
                    $isSn = (bool) $barang->is_wajib_sn;
                    $condition = $this->normalizeProjectReturnCondition($item['kondisi'] ?? 'Baru');
                    $projectSerialRecords = collect();

                    $project = null;
                    if ($isProjectReturn) {
                        // Mengunci master proyek menserialisasi proses transfer/pengembalian agar saldo non-SN tidak oversold.
                        $project = Proyek::where('kode_projek', $kodeProjek)->lockForUpdate()->firstOrFail();
                        if ($isSn) {
                            if (count($serials) !== $qty) {
                                throw new \Exception("Jumlah Serial Number untuk pengembalian '{$barang->nama_barang}' harus tepat {$qty} unit.");
                            }
                            $projectSerialRecords = BarangSerial::query()
                                ->where('barang_id', $barangId)
                                ->where('kode_projek', $kodeProjek)
                                ->whereNull('gudang_id')
                                ->where('status', 'IN_USE')
                                ->whereIn('serial_number', $serials)
                                ->lockForUpdate()->get()->keyBy(fn($serial) => strtolower(trim($serial->serial_number)));

                            foreach ($serials as $sn) {
                                $record = $projectSerialRecords->get(strtolower($sn));
                                if (!$record) throw new \Exception("SN '{$sn}' tidak tercatat sebagai aset aktif di proyek {$kodeProjek}.");
                            }
                        } else {
                            if (!empty($serials)) throw new \Exception("Barang '{$barang->nama_barang}' bukan barang SN.");
                            $available = $this->getProjectNonSnConditionStock($barangId, $kodeProjek);
                            if ($qty > (int) ($available[$condition] ?? 0)) {
                                throw new \Exception("Saldo {$condition} barang '{$barang->nama_barang}' di proyek {$kodeProjek} tidak cukup (tersedia: " . (int) ($available[$condition] ?? 0) . ", diminta: {$qty}).");
                            }
                        }
                    } elseif ($isSn && count($serials) !== $qty) {
                        throw new \Exception("Jumlah Serial Number untuk barang '{$barang->nama_barang}' harus tepat {$qty} unit.");
                    } elseif (!$isSn && !empty($serials)) {
                        throw new \Exception("Barang '{$barang->nama_barang}' bukan barang SN.");
                    }

                    $prefix = match ($subJenis) {
                        'PEMBELIAN' => 'TRX-IN-BUY',
                        'PEMINJAMAN' => 'TRX-IN-BORROW',
                        'PENGEMBALIAN' => 'TRX-IN-RET',
                        default => 'TRX-MASUK',
                    };
                    $noTransaksi = $prefix . '-' . date('YmdHis') . '-' . strtoupper(Str::random(4));
                    $returnSerialGroups = collect();
                    $kondisiFix = $condition;
                    if ($isProjectReturn && $isSn) {
                        $returnSerialGroups = collect($serials)
                            ->map(fn($sn) => $projectSerialRecords->get(strtolower($sn)))
                            ->filter()
                            ->groupBy(fn($record) => $this->normalizeProjectReturnCondition($record->kondisi));
                        $returnConditions = $returnSerialGroups->keys()->values();
                        $kondisiFix = $returnConditions->count() > 1 ? 'Campuran' : ($returnConditions->first() ?? $condition);
                    }
                    $harga = $subJenis === 'PEMBELIAN' ? (float) ($item['harga'] ?? 0) : 0;
                    $pihakAsal = $isProjectReturn ? ('Proyek ' . $kodeProjek) : trim((string) ($item['pihak_asal'] ?? ''));

                    $transaksi = Transaksi::create([
                        'no_transaksi' => $noTransaksi,
                        'jenis_transaksi' => 'MASUK',
                        'sub_jenis' => $subJenis,
                        'tanggal' => $item['tanggal'],
                        'kondisi' => $kondisiFix,
                        'nomor_imc' => trim((string) $item['nomor_imc']),
                        'nomor_omc' => $item['nomor_omc'] ?? null,
                        'pihak_asal' => $pihakAsal !== '' ? $pihakAsal : null,
                        'kode_projek' => $kodeProjek,
                        'nama_customer' => $isProjectReturn ? ($item['nama_customer'] ?? $project?->nama_customer ?? null) : ($item['nama_customer'] ?? null),
                        'gudang_asal_id' => null,
                        'gudang_tujuan_id' => (int) $item['gudang_tujuan_id'],
                        'pic_user_id' => $request->user()->id,
                        'status' => 'COMPLETED',
                    ]);

                    $detail = null;
                    if ($isProjectReturn && $isSn) {
                        // Buat detail terpisah per kondisi SN agar laporan stok kondisi tetap akurat.
                        foreach ($returnSerialGroups as $returnCondition => $recordsForCondition) {
                            $conditionDetail = TransaksiDetail::create([
                                'transaksi_id' => $transaksi->id,
                                'barang_id' => $barangId,
                                'qty' => $recordsForCondition->count(),
                                'harga' => $harga,
                                'kondisi' => $returnCondition,
                            ]);
                            foreach ($recordsForCondition as $record) {
                                DB::table('barang_serials')->where('id', $record->id)->update([
                                    'gudang_id' => (int) $item['gudang_tujuan_id'],
                                    'status' => 'IN_WAREHOUSE',
                                    'kode_projek' => null,
                                    'updated_at' => $now,
                                ]);
                                $detailSerialsToInsert[] = [
                                    'transaksi_detail_id' => $conditionDetail->id,
                                    'barang_serial_id' => $record->id,
                                    'created_at' => $now,
                                    'updated_at' => $now,
                                ];
                            }
                        }
                    } else {
                        $detail = TransaksiDetail::create([
                            'transaksi_id' => $transaksi->id,
                            'barang_id' => $barangId,
                            'qty' => $qty,
                            'harga' => $harga,
                            'kondisi' => $kondisiFix,
                        ]);

                        if ($isSn) {
                            foreach ($serials as $sn) {
                                $serialRecord = BarangSerial::create([
                                    'barang_id' => $barangId,
                                    'serial_number' => $sn,
                                    'status' => 'IN_WAREHOUSE',
                                    'gudang_id' => (int) $item['gudang_tujuan_id'],
                                    'kondisi' => $condition,
                                    'nomer_imc' => trim((string) $item['nomor_imc']),
                                    'kode_projek' => null,
                                ]);
                                $detailSerialsToInsert[] = [
                                    'transaksi_detail_id' => $detail->id,
                                    'barang_serial_id' => $serialRecord->id,
                                    'created_at' => $now,
                                    'updated_at' => $now,
                                ];
                            }
                        }
                    }

                    $stokTujuan = Stok::firstOrCreate(
                        ['barang_id' => $barangId, 'gudang_id' => (int) $item['gudang_tujuan_id']],
                        ['jumlah' => 0]
                    );
                    $stokTujuan->increment('jumlah', $qty);
                    $stockLogsToInsert[] = [
                        'barang_id' => $barangId,
                        'gudang_id' => (int) $item['gudang_tujuan_id'],
                        'transaksi_id' => $transaksi->id,
                        'user_id' => $request->user()->id,
                        'qty_perubahan' => $qty,
                        'qty_akhir' => $stokTujuan->jumlah,
                        'keterangan' => $isProjectReturn
                            ? "Pengembalian aset transfer dari Proyek {$kodeProjek} ({$kondisiFix})"
                            : "Penerimaan Stok Masuk ({$transaksi->sub_jenis})",
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if ($detailSerialsToInsert) DB::table('transaksi_detail_serials')->insert($detailSerialsToInsert);
                if ($stockLogsToInsert) StockLog::insert($stockLogsToInsert);
            });

            return back()->with('success', count($validated['items']) . ' data transaksi masuk berhasil dicatat.');
        } catch (UniqueConstraintViolationException $e) {
            return back()->with('error', 'Gagal menyimpan: Serial Number sudah terdaftar di sistem.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal menyimpan: ' . $e->getMessage());
        }
    }

    /** Hanya transaksi pengembalian aset proyek yang dapat dibatalkan dari tab Barang Masuk. */
    public function cancel(Request $request, int $id)
    {
        try {
            DB::transaction(function () use ($request, $id) {
                $transaksi = Transaksi::with(['details'])->lockForUpdate()->findOrFail($id);
                if ($transaksi->jenis_transaksi !== 'MASUK' || $transaksi->sub_jenis !== 'PENGEMBALIAN' || empty($transaksi->kode_projek)) {
                    throw new \Exception('Pembatalan melalui aksi ini hanya tersedia untuk pengembalian aset proyek.');
                }
                if ($transaksi->status === 'CANCELLED') throw new \Exception('Transaksi ini sudah dibatalkan.');
                $now = now();

                foreach ($transaksi->details as $detail) {
                    $stokTujuan = Stok::where('barang_id', $detail->barang_id)
                        ->where('gudang_id', $transaksi->gudang_tujuan_id)->lockForUpdate()->first();
                    if (!$stokTujuan || $stokTujuan->jumlah < $detail->qty) {
                        throw new \Exception('Stok gudang tujuan sudah berubah sehingga pengembalian ini tidak bisa dibatalkan dengan aman.');
                    }

                    $serialIds = DB::table('transaksi_detail_serials')
                        ->where('transaksi_detail_id', $detail->id)->pluck('barang_serial_id')->filter()->all();
                    if (!$serialIds) {
                        $hasLaterOutbound = DB::table('transaksi_details as later_detail')
                            ->join('transaksis as later', 'later.id', '=', 'later_detail.transaksi_id')
                            ->where('later_detail.barang_id', $detail->barang_id)
                            ->where('later.gudang_asal_id', $transaksi->gudang_tujuan_id)
                            ->where(function ($q) {
                                $q->whereIn('later.status', ['COMPLETED', 'completed'])->orWhereNull('later.status');
                            })
                            ->where(function ($q) {
                                $q->where('later.jenis_transaksi', 'KELUAR')
                                    ->orWhere('later.jenis_transaksi', 'TRANSFER')
                                    ->orWhere('later.sub_jenis', 'TRANSFER_GUDANG');
                            })
                            ->where(function ($q) use ($transaksi) {
                                $q->where('later.tanggal', '>', $transaksi->tanggal)
                                    ->orWhere(function ($sameDate) use ($transaksi) {
                                        $sameDate->where('later.tanggal', '=', $transaksi->tanggal)->where('later.id', '>', $transaksi->id);
                                    });
                            })
                            ->exists();
                        if ($hasLaterOutbound) {
                            throw new \Exception('Pengembalian tidak bisa dibatalkan karena stok non-SN sudah dipakai atau dipindahkan lagi dari gudang tujuan. Batalkan transaksi lanjutan terlebih dahulu.');
                        }
                    }

                    $stokTujuan->decrement('jumlah', $detail->qty);
                    if ($serialIds) {
                        $validCount = DB::table('barang_serials')->whereIn('id', $serialIds)
                            ->where('status', 'IN_WAREHOUSE')->where('gudang_id', $transaksi->gudang_tujuan_id)->count();
                        if ($validCount !== count($serialIds)) {
                            throw new \Exception('Sebagian SN pengembalian telah dipindahkan lagi. Batalkan transaksi lanjutan terlebih dahulu.');
                        }
                        DB::table('barang_serials')->whereIn('id', $serialIds)->update([
                            'gudang_id' => null, 'status' => 'IN_USE',
                            'kode_projek' => $transaksi->kode_projek, 'updated_at' => $now,
                        ]);
                    }

                    StockLog::create([
                        'barang_id' => $detail->barang_id,
                        'gudang_id' => $transaksi->gudang_tujuan_id,
                        'transaksi_id' => $transaksi->id,
                        'user_id' => $request->user()->id,
                        'qty_perubahan' => -((int) $detail->qty),
                        'qty_akhir' => $stokTujuan->fresh()->jumlah,
                        'keterangan' => "Pembatalan pengembalian aset ke Proyek {$transaksi->kode_projek}",
                        'created_at' => $now, 'updated_at' => $now,
                    ]);
                }
                $transaksi->update(['status' => 'CANCELLED']);
            });
            return back()->with('success', 'Pengembalian proyek dibatalkan; stok gudang dan status aset dipulihkan.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal membatalkan pengembalian: ' . $e->getMessage());
        }
    }

    public function update(Request $request, int $id)
    {
        $transaksi = Transaksi::with(['details.serials'])->findOrFail($id);
        if ($transaksi->sub_jenis === 'PENGEMBALIAN' && !empty($transaksi->kode_projek)) {
            return back()->with('error', 'Pengembalian proyek tidak dapat diedit langsung. Batalkan lalu buat ulang dengan data yang benar.');
        }

        $validated = $request->validate([
            'tanggal'          => 'required|date',
            'kondisi'          => 'nullable|string|max:50',
            'nomor_imc'        => 'nullable|string|max:100',
            'nomor_omc'        => 'nullable|string|max:100',
            'pihak_asal'       => 'nullable|string|max:255',
            'kode_projek'      => 'nullable|string|max:100',
            'nama_customer'    => 'nullable|string|max:255',
            'gudang_tujuan_id' => 'nullable|exists:gudangs,id',
            'qty'              => 'nullable|integer|min:1|max:50',
            'harga'            => 'nullable|numeric|min:0',
            'keterangan'       => 'nullable|string|max:500',
        ]);

        $kondisiFix = ucfirst(strtolower($validated['kondisi'] ?? 'Baru'));
        $hargaFix   = $transaksi->sub_jenis === 'PEMBELIAN' ? (float) ($validated['harga'] ?? 0) : 0;
        $newQty     = isset($validated['qty']) ? (int) $validated['qty'] : null;

        try {
            DB::transaction(function () use ($transaksi, $validated, $kondisiFix, $hargaFix, $newQty) {
                $oldGudangTujuanId = (int) $transaksi->gudang_tujuan_id;
                $newGudangTujuanId = isset($validated['gudang_tujuan_id']) ? (int) $validated['gudang_tujuan_id'] : $oldGudangTujuanId;

                foreach ($transaksi->details as $detail) {
                    $oldQty   = (int) $detail->qty;
                    $finalQty = $newQty !== null ? $newQty : $oldQty;

                    $detail->update([
                        'kondisi' => $kondisiFix,
                        'harga'   => $hargaFix,
                        'qty'     => $finalQty,
                    ]);

                    if ($newGudangTujuanId && $newGudangTujuanId !== $oldGudangTujuanId) {
                        $barangId = $detail->barang_id;
                        $stokLama = Stok::where('barang_id', $barangId)->where('gudang_id', $oldGudangTujuanId)->first();
                        if ($stokLama) {
                            $stokLama->decrement('jumlah', min($stokLama->jumlah, $oldQty));
                        }

                        $stokBaru = Stok::firstOrCreate(['barang_id' => $barangId, 'gudang_id' => $newGudangTujuanId], ['jumlah' => 0]);
                        $stokBaru->increment('jumlah', $finalQty);

                        foreach ($detail->serials as $serial) {
                            $serial->update([
                                'gudang_id' => $newGudangTujuanId,
                                'nomer_imc' => $validated['nomor_imc'] ?? $serial->nomer_imc,
                            ]);
                        }
                    }
                }

                $transaksi->update([
                    'tanggal'          => $validated['tanggal'],
                    'kondisi'          => $kondisiFix,
                    'nomor_imc'        => $validated['nomor_imc'] ?? $transaksi->nomor_imc,
                    'nomor_omc'        => $validated['nomor_omc'] ?? $transaksi->nomor_omc,
                    'pihak_asal'       => $validated['pihak_asal'] ?? $transaksi->pihak_asal,
                    'kode_projek'      => $validated['kode_projek'] ?? $transaksi->kode_projek,
                    'nama_customer'    => $validated['nama_customer'] ?? $transaksi->nama_customer,
                    'gudang_tujuan_id' => $newGudangTujuanId,
                    'keterangan'       => $validated['keterangan'] ?? $transaksi->keterangan,
                ]);
            });

            return redirect()->back()->with('success', 'Data transaksi masuk berhasil diperbarui.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui: ' . $e->getMessage());
        }
    }
}
