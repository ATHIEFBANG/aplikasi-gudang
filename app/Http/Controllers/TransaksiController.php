<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangSerial;
use App\Models\Gudang;
use App\Models\Proyek;
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
    private function syncStokAndSerials(): void
    {
        DB::transaction(function () {
            $inboundDetailIds = TransaksiDetail::whereHas('transaksi', function ($q) {
                $q->where('jenis_transaksi', 'MASUK')
                    ->where(function ($sq) {
                        $sq->whereIn('status', ['COMPLETED', 'completed'])
                            ->orWhereNull('status');
                    });
            })->pluck('id')->toArray();

            if (!empty($inboundDetailIds)) {
                $validSerialIds = DB::table('transaksi_detail_serials')
                    ->whereIn('transaksi_detail_id', $inboundDetailIds)
                    ->pluck('barang_serial_id')
                    ->filter()
                    ->unique()
                    ->toArray();

                if (!empty($validSerialIds)) {
                    BarangSerial::whereNotIn('id', $validSerialIds)->delete();
                } else {
                    BarangSerial::query()->delete();
                }
            } else {
                BarangSerial::query()->delete();
            }

            Stok::query()->update(['jumlah' => 0]);

            $transaksis = Transaksi::with(['details.serials'])
                ->where(function ($q) {
                    $q->whereIn('status', ['COMPLETED', 'completed'])
                        ->orWhereNull('status');
                })
                ->orderBy('tanggal', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            $stokMap = [];

            foreach ($transaksis as $t) {
                foreach ($t->details as $d) {
                    $bId = (int) $d->barang_id;
                    $qty = (int) $d->qty;

                    if ($t->jenis_transaksi === 'MASUK' && $t->gudang_tujuan_id) {
                        $gId = (int) $t->gudang_tujuan_id;
                        $stokMap[$bId][$gId] = ($stokMap[$bId][$gId] ?? 0) + $qty;

                        foreach ($d->serials as $s) {
                            DB::table('barang_serials')->where('id', $s->id)->update([
                                'gudang_id' => $gId,
                                'status' => 'IN_WAREHOUSE',
                                'kode_projek' => null,
                                'nomer_imc' => ($t->sub_jenis === 'PENGEMBALIAN' && !empty($t->kode_projek)) ? $s->nomer_imc : ($t->nomor_imc ?? $s->nomer_imc),
                            ]);
                        }
                    } elseif ($t->jenis_transaksi === 'KELUAR' && $t->gudang_asal_id) {
                        $gId = (int) $t->gudang_asal_id;
                        $stokMap[$bId][$gId] = max(0, ($stokMap[$bId][$gId] ?? 0) - $qty);

                        foreach ($d->serials as $s) {
                            DB::table('barang_serials')->where('id', $s->id)->update([
                                'gudang_id' => null,
                                'status' => 'IN_USE',
                                'kode_projek' => $t->sub_jenis === 'BARANG_KE_SITE' ? $t->kode_projek : null,
                            ]);
                        }
                    } elseif ($t->jenis_transaksi === 'TRANSFER' || $t->sub_jenis === 'TRANSFER_GUDANG') {
                        if ($t->gudang_asal_id) {
                            $gIdAsal = (int) $t->gudang_asal_id;
                            $stokMap[$bId][$gIdAsal] = max(0, ($stokMap[$bId][$gIdAsal] ?? 0) - $qty);
                        }

                        if ($t->gudang_tujuan_id) {
                            $gIdTujuan = (int) $t->gudang_tujuan_id;
                            $stokMap[$bId][$gIdTujuan] = ($stokMap[$bId][$gIdTujuan] ?? 0) + $qty;

                            foreach ($d->serials as $s) {
                                DB::table('barang_serials')->where('id', $s->id)->update([
                                    'gudang_id' => $gIdTujuan,
                                    'status' => 'IN_WAREHOUSE',
                                    'kode_projek' => null,
                                ]);
                            }
                        } elseif (!empty($t->kode_projek)) {
                            // Transfer ke proyek diperlakukan sebagai barang keluar: tidak masuk gudang lain.
                            foreach ($d->serials as $s) {
                                DB::table('barang_serials')->where('id', $s->id)->update([
                                    'gudang_id' => null,
                                    'status' => 'IN_USE',
                                    'kode_projek' => $t->kode_projek,
                                ]);
                            }
                        }
                    }
                }
            }

            $upsertData = [];

            foreach ($stokMap as $bId => $gudangs) {
                foreach ($gudangs as $gId => $jumlah) {
                    $upsertData[] = [
                        'barang_id' => $bId,
                        'gudang_id' => $gId,
                        'jumlah' => $jumlah,
                    ];
                }
            }

            if (!empty($upsertData)) {
                Stok::upsert($upsertData, ['barang_id', 'gudang_id'], ['jumlah']);
            }
        });
    }

    private function calculateKondisiAndStokNet(): array
    {
        $snRaw = BarangSerial::whereIn('status', ['IN_WAREHOUSE', 'READY', 'AVAILABLE'])
            ->whereNotNull('gudang_id')
            ->select('barang_id', 'gudang_id', 'kondisi', DB::raw('COUNT(*) as total'))
            ->groupBy('barang_id', 'gudang_id', 'kondisi')
            ->get();

        $kondisiByGudang = [];
        $kondisiByBarangGudang = [];
        $stokNetMap = [];

        foreach ($snRaw as $row) {
            $barangId = (int) $row->barang_id;
            $gudangId = (int) $row->gudang_id;
            $k = strtoupper(trim((string) ($row->kondisi ?? 'BARU')));
            $total = (int) $row->total;

            $kondisiByGudang[$gudangId] ??= ['baru' => 0, 'bekas' => 0, 'rusak' => 0];
            $kondisiByBarangGudang[$barangId][$gudangId] ??= ['baru' => 0, 'bekas' => 0, 'rusak' => 0];

            if (str_contains($k, 'RUSAK') || str_contains($k, 'DAMAGED')) {
                $key = 'rusak';
            } elseif (str_contains($k, 'BEKAS') || str_contains($k, 'SECOND') || str_contains($k, 'USED')) {
                $key = 'bekas';
            } else {
                $key = 'baru';
            }

            $kondisiByGudang[$gudangId][$key] += $total;
            $kondisiByBarangGudang[$barangId][$gudangId][$key] += $total;
        }

        $nonSnBarangSet = array_flip(
            Barang::where('is_wajib_sn', false)->pluck('id')->toArray()
        );

        $allDetails = DB::table('transaksi_details')
            ->join('transaksis', 'transaksis.id', '=', 'transaksi_details.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('transaksis.status', ['COMPLETED', 'completed'])
                    ->orWhereNull('transaksis.status');
            })
            ->orderBy('transaksis.tanggal', 'asc')
            ->orderBy('transaksis.id', 'asc')
            ->select([
                'transaksi_details.barang_id',
                'transaksi_details.qty',
                'transaksi_details.kondisi as detail_kondisi',
                'transaksis.jenis_transaksi',
                'transaksis.sub_jenis',
                'transaksis.gudang_asal_id',
                'transaksis.gudang_tujuan_id',
                'transaksis.kondisi as transaksi_kondisi',
            ])
            ->get();

        $ensureMap = function (&$map, $barangId, $gudangId) {
            $map[$barangId][$gudangId] ??= ['baru' => 0, 'bekas' => 0, 'rusak' => 0];
        };

        $parseCondition = function ($raw, $qty) {
            $raw = trim((string) $raw);
            $result = ['baru' => 0, 'bekas' => 0, 'rusak' => 0];

            preg_match_all(
                '/(\d+)\s*(BARU|BEKAS|SECOND|USED|RUSAK|DAMAGED)/i',
                $raw,
                $matches,
                PREG_SET_ORDER
            );

            if (!empty($matches)) {
                foreach ($matches as $m) {
                    $jumlah = (int) $m[1];
                    $k = strtoupper($m[2]);

                    if (str_contains($k, 'RUSAK') || str_contains($k, 'DAMAGED')) {
                        $result['rusak'] += $jumlah;
                    } elseif (str_contains($k, 'BEKAS') || str_contains($k, 'SECOND') || str_contains($k, 'USED')) {
                        $result['bekas'] += $jumlah;
                    } else {
                        $result['baru'] += $jumlah;
                    }
                }

                return $result;
            }

            $k = strtoupper($raw ?: 'BARU');

            if (str_contains($k, 'RUSAK') || str_contains($k, 'DAMAGED')) {
                $result['rusak'] = $qty;
            } elseif (str_contains($k, 'BEKAS') || str_contains($k, 'SECOND') || str_contains($k, 'USED')) {
                $result['bekas'] = $qty;
            } else {
                $result['baru'] = $qty;
            }

            return $result;
        };

        foreach ($allDetails as $d) {
            $bId = (int) $d->barang_id;
            $qty = (int) $d->qty;

            if (!isset($nonSnBarangSet[$bId])) {
                continue;
            }

            $kondisiRaw = ($d->detail_kondisi && $d->detail_kondisi !== '-')
                ? $d->detail_kondisi
                : ($d->transaksi_kondisi ?? 'Baru');

            $conditionQty = $parseCondition($kondisiRaw, $qty);

            if ($d->jenis_transaksi === 'MASUK' && $d->gudang_tujuan_id) {
                $gId = (int) $d->gudang_tujuan_id;
                $ensureMap($kondisiByBarangGudang, $bId, $gId);

                $kondisiByGudang[$gId] ??= ['baru' => 0, 'bekas' => 0, 'rusak' => 0];

                foreach ($conditionQty as $key => $jumlah) {
                    $kondisiByBarangGudang[$bId][$gId][$key] += $jumlah;
                    $kondisiByGudang[$gId][$key] += $jumlah;
                }

                $stokNetMap[$bId][$gId] = ($stokNetMap[$bId][$gId] ?? 0) + $qty;
            } elseif ($d->jenis_transaksi === 'KELUAR' && $d->gudang_asal_id) {
                $gId = (int) $d->gudang_asal_id;
                $ensureMap($kondisiByBarangGudang, $bId, $gId);

                $kondisiByGudang[$gId] ??= ['baru' => 0, 'bekas' => 0, 'rusak' => 0];

                foreach ($conditionQty as $key => $jumlah) {
                    $kondisiByBarangGudang[$bId][$gId][$key] = max(
                        0,
                        $kondisiByBarangGudang[$bId][$gId][$key] - $jumlah
                    );
                    $kondisiByGudang[$gId][$key] = max(
                        0,
                        $kondisiByGudang[$gId][$key] - $jumlah
                    );
                }

                $stokNetMap[$bId][$gId] = max(0, ($stokNetMap[$bId][$gId] ?? 0) - $qty);
            } elseif ($d->jenis_transaksi === 'TRANSFER' || $d->sub_jenis === 'TRANSFER_GUDANG') {
                if ($d->gudang_asal_id) {
                    $gId = (int) $d->gudang_asal_id;
                    $ensureMap($kondisiByBarangGudang, $bId, $gId);

                    $kondisiByGudang[$gId] ??= ['baru' => 0, 'bekas' => 0, 'rusak' => 0];

                    foreach ($conditionQty as $key => $jumlah) {
                        $kondisiByBarangGudang[$bId][$gId][$key] = max(
                            0,
                            $kondisiByBarangGudang[$bId][$gId][$key] - $jumlah
                        );
                        $kondisiByGudang[$gId][$key] = max(
                            0,
                            $kondisiByGudang[$gId][$key] - $jumlah
                        );
                    }

                    $stokNetMap[$bId][$gId] = max(0, ($stokNetMap[$bId][$gId] ?? 0) - $qty);
                }

                if ($d->gudang_tujuan_id) {
                    $gId = (int) $d->gudang_tujuan_id;
                    $ensureMap($kondisiByBarangGudang, $bId, $gId);

                    $kondisiByGudang[$gId] ??= ['baru' => 0, 'bekas' => 0, 'rusak' => 0];

                    foreach ($conditionQty as $key => $jumlah) {
                        $kondisiByBarangGudang[$bId][$gId][$key] += $jumlah;
                        $kondisiByGudang[$gId][$key] += $jumlah;
                    }

                    $stokNetMap[$bId][$gId] = ($stokNetMap[$bId][$gId] ?? 0) + $qty;
                }
            }
        }

        return [$kondisiByGudang, $stokNetMap, $kondisiByBarangGudang];
    }

    private function normalizeProjectCondition(?string $value): string
    {
        $condition = strtoupper(trim((string) $value));
        if (str_contains($condition, 'RUSAK') || str_contains($condition, 'DAMAGED')) return 'rusak';
        if (str_contains($condition, 'BEKAS') || str_contains($condition, 'SECOND') || str_contains($condition, 'USED')) return 'bekas';
        return 'baru';
    }

    /** Saldo aset transfer non-SN yang masih berada di proyek, dihitung dari mutasi transfer dikurangi pengembalian. */
    private function getProjectInventorySnapshot(): array
    {
        $ledger = DB::table('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->where(function ($q) {
                $q->whereIn('t.status', ['COMPLETED', 'completed'])->orWhereNull('t.status');
            })
            ->where(function ($q) {
                $q->where(function ($outbound) {
                    $outbound->where('t.jenis_transaksi', 'KELUAR')
                        ->where('t.sub_jenis', 'BARANG_KE_SITE')
                        ->whereNotNull('t.kode_projek')->where('t.kode_projek', '!=', '');
                })->orWhere(function ($transfer) {
                    $transfer->where(function ($kind) {
                        $kind->where('t.jenis_transaksi', 'TRANSFER')->orWhere('t.sub_jenis', 'TRANSFER_GUDANG');
                    })->whereNotNull('t.kode_projek')->where('t.kode_projek', '!=', '')->whereNull('t.gudang_tujuan_id');
                })->orWhere(function ($return) {
                    $return->where('t.jenis_transaksi', 'MASUK')->where('t.sub_jenis', 'PENGEMBALIAN')
                        ->whereNotNull('t.kode_projek')->where('t.kode_projek', '!=', '');
                });
            })
            ->orderBy('t.tanggal')->orderBy('t.id')->orderBy('td.id')
            ->get(['td.barang_id', 'td.qty', 'td.kondisi as detail_kondisi', 't.kondisi as header_kondisi', 't.kode_projek', 't.jenis_transaksi', 't.sub_jenis']);

        $stock = [];
        foreach ($ledger as $movement) {
            $code = trim((string) $movement->kode_projek);
            if ($code === '') continue;
            $condition = $this->normalizeProjectCondition($movement->detail_kondisi ?: $movement->header_kondisi);
            $isReturn = $movement->jenis_transaksi === 'MASUK' && $movement->sub_jenis === 'PENGEMBALIAN';
            $qty = (int) $movement->qty * ($isReturn ? -1 : 1);
            $stock[(int) $movement->barang_id][$code][$condition] = ($stock[(int) $movement->barang_id][$code][$condition] ?? 0) + $qty;
        }

        $projectStocksByBarang = [];
        foreach ($stock as $barangId => $projects) {
            foreach ($projects as $code => $conditions) {
                $baru = max(0, (int) ($conditions['baru'] ?? 0));
                $bekas = max(0, (int) ($conditions['bekas'] ?? 0));
                $rusak = max(0, (int) ($conditions['rusak'] ?? 0));
                $projectStocksByBarang[$barangId][$code] = [
                    'baru' => $baru, 'bekas' => $bekas, 'rusak' => $rusak,
                    'aktif' => $baru + $bekas + $rusak,
                    'total' => $baru + $bekas + $rusak,
                ];
            }
        }

        $projectSerialsByBarang = [];
        $activeSerials = BarangSerial::query()
            ->where('status', 'IN_USE')->whereNull('gudang_id')
            ->whereNotNull('kode_projek')->where('kode_projek', '!=', '')
            ->get(['id', 'barang_id', 'kode_projek', 'serial_number', 'kondisi', 'nomer_imc', 'status']);

        foreach ($activeSerials as $serial) {
            $barangId = (int) $serial->barang_id;
            $code = (string) $serial->kode_projek;
            $projectSerialsByBarang[$barangId][$code][] = [
                'id' => (int) $serial->id,
                'serial_number' => $serial->serial_number,
                'kondisi' => $serial->kondisi,
                'nomor_imc' => $serial->nomer_imc,
                'status' => $serial->status,
                'kode_projek' => $code,
            ];
            $condition = $this->normalizeProjectCondition($serial->kondisi);
            $projectStocksByBarang[$barangId][$code] ??= ['baru' => 0, 'bekas' => 0, 'rusak' => 0, 'aktif' => 0, 'total' => 0];
            $projectStocksByBarang[$barangId][$code][$condition] = count($projectSerialsByBarang[$barangId][$code] ?? []);
        }

        foreach ($projectStocksByBarang as $barangId => $projects) {
            foreach ($projects as $code => $conditions) {
                if (isset($projectSerialsByBarang[$barangId][$code])) {
                    $serialCounts = ['baru' => 0, 'bekas' => 0, 'rusak' => 0];
                    foreach ($projectSerialsByBarang[$barangId][$code] as $serial) {
                        $serialCounts[$this->normalizeProjectCondition($serial['kondisi'])]++;
                    }
                    $projectStocksByBarang[$barangId][$code] = $serialCounts + [
                        'aktif' => array_sum($serialCounts), 'total' => array_sum($serialCounts),
                    ];
                }
            }
        }

        return [$projectStocksByBarang, $projectSerialsByBarang];
    }

    public function index(Request $request): Response
    {
        $jenis = $request->input('jenis_transaksi', 'MASUK');
        $gudangId = $request->input('gudang_id');
        $search = $request->input('search');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $perPage = (int) $request->input('per_page', 10);

        $rawOrder = strtolower((string) $request->input('order', 'desc'));
        $order = in_array($rawOrder, ['asc', 'desc'], true) ? $rawOrder : 'desc';

        $query = Transaksi::with([
            'gudangAsal:id,nama_gudang',
            'gudangTujuan:id,nama_gudang',
            'supplier:id,nama_supplier',
            'picUser:id,name',
            'details.barang:id,kode_barang,nama_barang,brand,tipe,kategori,part_number,deskripsi,is_wajib_sn,is_wajib_pn',
            'details.serials',
        ])->orderBy('tanggal', $order)->orderBy('id', $order);

        $query->where(function ($q) {
            $q->whereNull('status')
                ->orWhereIn('status', ['COMPLETED', 'completed']);
        });

        if ($jenis === 'TRANSFER') {
            $query->where(function ($q) {
                $q->where('jenis_transaksi', 'TRANSFER')
                    ->orWhere('sub_jenis', 'TRANSFER_GUDANG');
            });
        } elseif ($jenis === 'KELUAR') {
            $query->where('jenis_transaksi', 'KELUAR')
                ->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } else {
            $query->where('jenis_transaksi', 'MASUK')
                ->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        }

        if ($gudangId && $gudangId !== 'ALL') {
            if ($jenis === 'MASUK') {
                $query->where('gudang_tujuan_id', $gudangId);
            } elseif ($jenis === 'KELUAR') {
                $query->where('gudang_asal_id', $gudangId);
            } elseif ($jenis === 'TRANSFER') {
                $query->where(function ($q) use ($gudangId) {
                    $q->where('gudang_asal_id', $gudangId)
                        ->orWhere('gudang_tujuan_id', $gudangId);
                });
            }
        }

        if ($startDate && $endDate) {
            $query->whereBetween('tanggal', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('tanggal', '>=', $startDate);
        } elseif ($endDate) {
            $query->where('tanggal', '<=', $endDate);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "%{$search}%")
                    ->orWhere('nomor_imc', 'like', "%{$search}%")
                    ->orWhere('nomor_omc', 'like', "%{$search}%")
                    ->orWhere('pihak_asal', 'like', "%{$search}%")
                    ->orWhere('kode_projek', 'like', "%{$search}%")
                    ->orWhere('nama_customer', 'like', "%{$search}%")
                    ->orWhereHas('details.barang', function ($qb) use ($search) {
                        $qb->where('nama_barang', 'like', "%{$search}%")
                            ->orWhere('kode_barang', 'like', "%{$search}%")
                            ->orWhere('brand', 'like', "%{$search}%")
                            ->orWhere('tipe', 'like', "%{$search}%")
                            ->orWhere('kategori', 'like', "%{$search}%")
                            ->orWhere('part_number', 'like', "%{$search}%");
                    });
            });
        }

        [$kondisiByGudang, $stokNetMap, $kondisiByBarangGudang] = $this->calculateKondisiAndStokNet();

        $stokAllRaw = Stok::select('gudang_id', DB::raw('SUM(jumlah) as total_qty'))
            ->groupBy('gudang_id')
            ->pluck('total_qty', 'gudang_id');

        $gudangList = Gudang::where('is_active', true)
            ->get(['id', 'nama_gudang', 'kode_gudang'])
            ->map(function ($g) use ($kondisiByGudang, $stokAllRaw) {
                $kData = $kondisiByGudang[$g->id] ?? ['baru' => 0, 'bekas' => 0, 'rusak' => 0];
                $totalStokFisik = (int) ($stokAllRaw[$g->id] ?? 0);

                $g->stok_baru = max(0, $kData['baru']);
                $g->stok_bekas = max(0, $kData['bekas']);
                $g->stok_rusak = max(0, $kData['rusak']);

                $sumKondisi = $g->stok_baru + $g->stok_bekas + $g->stok_rusak;
                $g->total_stok = max($totalStokFisik, $sumKondisi);

                return $g;
            });

        // Dropdown proyek untuk Barang Keluar: kode proyek + subteks nama proyek/customer.
        $projectOptions = Proyek::query()
            ->where('is_active', true)
            ->orderBy('kode_projek')
            ->get()
            ->map(fn ($proyek) => [
                'value' => (string) $proyek->kode_projek,
                'label' => (string) $proyek->kode_projek,
                'kode_projek' => (string) $proyek->kode_projek,
                'nama_projek' => $proyek->nama_projek ?? '',
                'nama_customer' => $proyek->nama_customer ?? '',
            ])
            ->values();

        [$projectStocksByBarang, $projectSerialsByBarang] = $this->getProjectInventorySnapshot();
        $outstandingProjectCodes = [];
        foreach ($projectStocksByBarang as $projectStockMap) {
            foreach ($projectStockMap as $projectCode => $projectStock) {
                if ((int) ($projectStock['aktif'] ?? 0) > 0) $outstandingProjectCodes[] = (string) $projectCode;
            }
        }
        foreach ($projectSerialsByBarang as $serialProjectMap) {
            foreach (array_keys($serialProjectMap) as $projectCode) $outstandingProjectCodes[] = (string) $projectCode;
        }
        $outstandingProjectCodes = array_values(array_unique(array_filter($outstandingProjectCodes)));

        // Proyek nonaktif tetap dapat dipilih saat mengembalikan aset yang masih aktif di sana.
        $returnProjectOptions = Proyek::query()
            ->where(function ($q) use ($outstandingProjectCodes) {
                $q->where('is_active', true);
                if (!empty($outstandingProjectCodes)) $q->orWhereIn('kode_projek', $outstandingProjectCodes);
            })
            ->orderBy('kode_projek')
            ->get()
            ->map(fn ($proyek) => [
                'value' => (string) $proyek->kode_projek,
                'label' => (string) $proyek->kode_projek,
                'kode_projek' => (string) $proyek->kode_projek,
                'nama_projek' => $proyek->nama_projek ?? '',
                'nama_customer' => $proyek->nama_customer ?? '',
            ])
            ->values();

        $customerOptions = Transaksi::query()
            ->whereNotNull('nama_customer')
            ->where('nama_customer', '!=', '')
            ->distinct()
            ->orderBy('nama_customer')
            ->pluck('nama_customer')
            ->values();

        $barangList = Barang::select([
            'id', 'kode_barang', 'nama_barang', 'part_number',
            'brand', 'tipe', 'kategori', 'deskripsi',
            'is_wajib_sn', 'is_wajib_pn',
        ])->with([
            'serials' => function ($q) {
                $q->select([
                    'id', 'barang_id', 'gudang_id', 'serial_number',
                    'kondisi', 'status', 'nomer_imc',
                ])->whereIn('status', ['IN_WAREHOUSE', 'READY', 'AVAILABLE']);
            },
            'transaksiDetails' => function ($q) {
                $q->select([
                    'id', 'transaksi_id', 'barang_id', 'qty', 'kondisi',
                ])->with([
                    'transaksi:id,no_transaksi,jenis_transaksi,sub_jenis,gudang_asal_id,gudang_tujuan_id,nomor_imc',
                ]);
            },
        ])->get()->map(function ($b) use ($stokNetMap, $gudangList, $kondisiByBarangGudang, $projectStocksByBarang, $projectSerialsByBarang) {
            $stoksFormatted = $gudangList->map(function ($g) use ($b, $stokNetMap, $kondisiByBarangGudang) {
                if ($b->is_wajib_sn) {
                    $jumlah = $b->serials
                        ->where('gudang_id', $g->id)
                        ->filter(fn($s) => !str_contains(strtoupper($s->kondisi ?? ''), 'RUSAK'))
                        ->count();
                } else {
                    $jumlah = max(0, $stokNetMap[$b->id][$g->id] ?? 0);
                }

                $kData = $kondisiByBarangGudang[$b->id][$g->id] ?? [
                    'baru' => 0,
                    'bekas' => 0,
                    'rusak' => 0,
                ];

                return [
                    'id' => null,
                    'barang_id' => $b->id,
                    'gudang_id' => $g->id,
                    'jumlah' => (int) $jumlah,
                    'kondisi' => [
                        'baru' => (int) ($kData['baru'] ?? 0),
                        'bekas' => (int) ($kData['bekas'] ?? 0),
                        'rusak' => (int) ($kData['rusak'] ?? 0),
                        'aktif' => (int) (($kData['baru'] ?? 0) + ($kData['bekas'] ?? 0)),
                    ],
                ];
            })->values();

            $kondisiStok = $gudangList->mapWithKeys(function ($g) use ($b, $kondisiByBarangGudang) {
                $data = $kondisiByBarangGudang[$b->id][$g->id] ?? [
                    'baru' => 0,
                    'bekas' => 0,
                    'rusak' => 0,
                ];

                return [
                    (string) $g->id => [
                        'baru' => (int) ($data['baru'] ?? 0),
                        'bekas' => (int) ($data['bekas'] ?? 0),
                        'rusak' => (int) ($data['rusak'] ?? 0),
                        'aktif' => (int) (($data['baru'] ?? 0) + ($data['bekas'] ?? 0)),
                    ],
                ];
            })->toArray();

            return [
                'id' => $b->id,
                'kode_barang' => $b->kode_barang,
                'nama_barang' => $b->nama_barang,
                'part_number' => $b->part_number,
                'brand' => $b->brand,
                'tipe' => $b->tipe,
                'kategori' => $b->kategori,
                'deskripsi' => $b->deskripsi,
                'is_wajib_sn' => (bool) $b->is_wajib_sn,
                'is_wajib_pn' => (bool) $b->is_wajib_pn,
                'stoks' => $stoksFormatted,
                'kondisi_stok' => $kondisiStok,
                'project_stocks' => $projectStocksByBarang[$b->id] ?? [],
                'project_serials' => $projectSerialsByBarang[$b->id] ?? [],
                'serials' => $b->serials->map(fn($s) => [
                    'id' => $s->id,
                    'barang_id' => $s->barang_id,
                    'gudang_id' => $s->gudang_id,
                    'serial_number' => $s->serial_number,
                    'kondisi' => $s->kondisi,
                    'status' => $s->status,
                    'nomor_imc' => $s->nomer_imc,
                ])->values(),
                'transaksi_details' => $b->transaksiDetails->map(function ($td) use ($stokNetMap, $b) {
                    $gudangId = $td->transaksi?->gudang_tujuan_id;
                    $sisaQty = $b->is_wajib_sn
                        ? (int) $td->qty
                        : max(0, min(
                            (int) $td->qty,
                            $stokNetMap[$b->id][$gudangId] ?? 0
                        ));

                    return [
                        'id' => $td->id,
                        'transaksi_id' => $td->transaksi_id,
                        'barang_id' => $td->barang_id,
                        'qty' => (int) $td->qty,
                        'sisa_qty' => $sisaQty,
                        'kondisi' => $td->kondisi,
                        'transaksi' => $td->transaksi ? [
                            'id' => $td->transaksi->id,
                            'no_transaksi' => $td->transaksi->no_transaksi,
                            'jenis_transaksi' => $td->transaksi->jenis_transaksi,
                            'sub_jenis' => $td->transaksi->sub_jenis,
                            'gudang_asal_id' => $td->transaksi->gudang_asal_id,
                            'gudang_tujuan_id' => $td->transaksi->gudang_tujuan_id,
                            'nomor_imc' => $td->transaksi->nomor_imc,
                        ] : null,
                    ];
                })->values(),
            ];
        });

        return Inertia::render('Transaksi/Index', [
            'transaksis' => $query->paginate($perPage)->withQueryString(),
            'gudangs' => $gudangList,
            'suppliers' => Supplier::all(['id', 'nama_supplier']),
            'customerOptions' => $customerOptions,
            'projectOptions' => $projectOptions,
            'returnProjectOptions' => $returnProjectOptions,
            'barangs' => $barangList,
            'filters' => [
                'jenis_transaksi' => $jenis,
                'gudang_id' => $gudangId ?? 'ALL',
                'search' => $search ?? '',
                'start_date' => $startDate ?? '',
                'end_date' => $endDate ?? '',
                'order' => $order,
                'per_page' => $perPage,
            ],
        ]);
    }

    private function isProtectedProjectMovement(Transaksi $transaksi): bool
    {
        if (empty($transaksi->kode_projek)) return false;

        $isProjectTransfer = (
            $transaksi->jenis_transaksi === 'TRANSFER' ||
            $transaksi->sub_jenis === 'TRANSFER_GUDANG'
        ) && empty($transaksi->gudang_tujuan_id);

        $isProjectReturn = in_array($transaksi->sub_jenis, ['PENGEMBALIAN', 'PENGEMBALIAN_PROYEK'], true);

        return $isProjectTransfer || $isProjectReturn;
    }

    public function destroy(int $id)
    {
        $transaksi = Transaksi::with(['details.serials'])->findOrFail($id);

        if ($this->isProtectedProjectMovement($transaksi)) {
            return redirect()->back()->with('error', 'Transaksi transfer/pengembalian proyek tidak dapat dihapus langsung agar saldo aset tetap konsisten. Gunakan aksi Batalkan Transaksi jika masih aman; riwayat tetap disimpan.');
        }

        DB::transaction(function () use ($transaksi) {
            foreach ($transaksi->details as $detail) {
                if ($detail->serials) {
                    $serialIds = $detail->serials->pluck('id')->toArray();

                    if (!empty($serialIds)) {
                        DB::table('transaksi_detail_serials')
                            ->where('transaksi_detail_id', $detail->id)
                            ->delete();

                        if ($transaksi->jenis_transaksi === 'MASUK') {
                            BarangSerial::whereIn('id', $serialIds)->delete();
                        }
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
            'ids' => 'required|array',
            'ids.*' => 'exists:transaksis,id',
        ]);

        $selectedTransactions = Transaksi::whereIn('id', $request->ids)->get();
        if ($selectedTransactions->contains(fn($transaction) => $this->isProtectedProjectMovement($transaction))) {
            return redirect()->back()->with('error', 'Pilihan memuat transfer/pengembalian proyek yang tidak boleh dihapus langsung. Batalkan transaksi tersebut lewat aksi pembatalan agar saldo aset dan riwayat tetap konsisten.');
        }

        DB::transaction(function () use ($request) {
            $transaksis = Transaksi::with(['details.serials'])
                ->whereIn('id', $request->ids)
                ->get();

            foreach ($transaksis as $transaksi) {
                foreach ($transaksi->details as $detail) {
                    if ($detail->serials) {
                        $serialIds = $detail->serials->pluck('id')->toArray();

                        if (!empty($serialIds)) {
                            DB::table('transaksi_detail_serials')
                                ->where('transaksi_detail_id', $detail->id)
                                ->delete();

                            if ($transaksi->jenis_transaksi === 'MASUK') {
                                BarangSerial::whereIn('id', $serialIds)->delete();
                            }
                        }
                    }
                }

                $transaksi->delete();
            }
        });

        $this->syncStokAndSerials();

        return redirect()->back()->with(
            'success',
            count($request->ids) . ' transaksi terpilih berhasil dihapus.'
        );
    }

    public function reset(Request $request)
    {
        if ($request->user()?->role !== 'admin') {
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

        return redirect()->back()->with(
            'success',
            'Seluruh Riwayat Transaksi berhasil dikosongkan.'
        );
    }

    public function export(Request $request): StreamedResponse
    {
        set_time_limit(180);

        $jenis = $request->input('jenis_transaksi', 'MASUK');
        $gudangId = $request->input('gudang_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $rawOrder = strtolower((string) $request->input('order', 'desc'));
        $order = in_array($rawOrder, ['asc', 'desc'], true) ? $rawOrder : 'desc';

        $query = Transaksi::with([
            'gudangAsal',
            'gudangTujuan',
            'details.barang',
            'details.serials',
        ])->orderBy('tanggal', $order);

        $query->where(function ($q) {
            $q->whereNull('status')
                ->orWhereIn('status', ['COMPLETED', 'completed']);
        });

        if ($jenis === 'TRANSFER') {
            $query->where(function ($q) {
                $q->where('jenis_transaksi', 'TRANSFER')
                    ->orWhere('sub_jenis', 'TRANSFER_GUDANG');
            });
        } elseif ($jenis === 'KELUAR') {
            $query->where('jenis_transaksi', 'KELUAR')
                ->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        } else {
            $query->where('jenis_transaksi', 'MASUK')
                ->where('sub_jenis', '!=', 'TRANSFER_GUDANG');
        }

        if ($gudangId && $gudangId !== 'ALL') {
            if ($jenis === 'MASUK') {
                $query->where('gudang_tujuan_id', $gudangId);
            } elseif ($jenis === 'KELUAR') {
                $query->where('gudang_asal_id', $gudangId);
            } elseif ($jenis === 'TRANSFER') {
                $query->where(function ($q) use ($gudangId) {
                    $q->where('gudang_asal_id', $gudangId)
                        ->orWhere('gudang_tujuan_id', $gudangId);
                });
            }
        }

        if ($startDate && $endDate) {
            $query->whereBetween('tanggal', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('tanggal', '>=', $startDate);
        } elseif ($endDate) {
            $query->where('tanggal', '<=', $endDate);
        }

        $transaksis = $query->get();
        $csvFileName = 'Transaksi_' . $jenis . '_' . date('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$csvFileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
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
            'Serial Numbers',
        ];

        $callback = function () use ($transaksis, $columns) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns, ';');

            foreach ($transaksis as $t) {
                $detail = $t->details->first();
                $barang = $detail?->barang;

                $snList = $detail
                    ? $detail->serials
                        ->map(fn($s) => "{$s->serial_number} ({$s->kondisi})")
                        ->implode(', ')
                    : '-';

                $namaLengkap = $barang
                    ? trim("{$barang->brand} {$barang->tipe} {$barang->kategori}")
                    : '-';

                $hargaSatuan = $detail?->harga ?? 0;
                $totalNilai = ($detail?->qty ?? 0) * $hargaSatuan;

                fputcsv($file, [
                    $t->no_transaksi,
                    $t->sub_jenis ?? $t->jenis_transaksi,
                    $barang?->kode_barang ?? '-',
                    $namaLengkap ?: ($barang?->nama_barang ?? '-'),
                    $barang?->part_number ?? '-',
                    $barang?->deskripsi ?? 'Unit',
                    $t->tanggal ? date('Y-m-d', strtotime($t->tanggal)) : '-',
                    $detail?->qty ?? 0,
                    $hargaSatuan > 0 ? number_format($hargaSatuan, 0, ',', '.') : '-',
                    $totalNilai > 0 ? number_format($totalNilai, 0, ',', '.') : '-',
                    $t->kondisi ?? '-',
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

        return response()->stream($callback, 200, $headers);
    }
}
