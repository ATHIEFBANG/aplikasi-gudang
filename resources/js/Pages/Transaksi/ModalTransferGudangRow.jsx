import React, { useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import HybridDropdown from '@/components/HybridDropdown';
import DatePicker from '@/components/DatePicker';
import ModalBarangSelectorUI from './ModalBarangSelectorUI';
import { isBooleanFlag } from './ModalBarangSelectorLogic';

export default function ModalTransferGudangRow({
    row,
    rowIdx,
    rowsCount,
    isEditMode,
    isProcessing,
    barangs = [],
    gudangs = [],
    gudangOptions = [],
    pplOptions = [],
    namaOptions = [],
    stockInOrigin = null,
    setRows,
    onRemoveRow,
    onFieldChange,
    onBarangChange
}) {
    const targetBarang = useMemo(() => {
        if (!row.barang_id) return null;

        return barangs.find(
            b => String(b.id) === String(row.barang_id)
        ) || null;
    }, [barangs, row.barang_id]);

    const isWajibSn =
        isBooleanFlag(targetBarang?.is_wajib_sn) ||
        isBooleanFlag(targetBarang?.is_sn);

    const isWajibPn =
        isBooleanFlag(targetBarang?.is_wajib_pn) ||
        isBooleanFlag(targetBarang?.is_pn);

    const currentNamaBarang = targetBarang
        ? (
            [
                targetBarang.brand,
                targetBarang.tipe,
                targetBarang.kategori
            ]
                .filter(Boolean)
                .join(' ') ||
            targetBarang.nama_barang ||
            targetBarang.kode_barang ||
            ''
        )
        : '';

    return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-3">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    Transfer #{rowIdx + 1}
                </span>

                {rowsCount > 1 && !isEditMode && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveRow(rowIdx)}
                        className="h-7 px-2 text-rose-500 hover:text-rose-700 text-xs gap-1 cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                    </Button>
                )}
            </div>

            {/* 1. RUTE GUDANG & SURAT JALAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-2.5">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            1. Gudang Asal (Pengirim) *
                        </Label>

                        <HybridDropdown
                            value={
                                gudangs.find(
                                    g =>
                                        String(g.id) ===
                                        String(row.gudang_asal_id)
                                )?.nama_gudang || ''
                            }
                            options={gudangOptions}
                            onChange={(val, selectedOpt) => {
                                const targetId =
                                    selectedOpt?.id ||
                                    gudangs.find(
                                        g =>
                                            g.nama_gudang
                                                .toLowerCase()
                                                .trim() ===
                                            String(val)
                                                .toLowerCase()
                                                .trim()
                                    )?.id;

                                onFieldChange(
                                    rowIdx,
                                    'gudang_asal_id',
                                    targetId
                                        ? String(targetId)
                                        : ''
                                );
                            }}
                            placeholder="Pilih Gudang Asal..."
                            searchPlaceholder="Cari Gudang Asal..."
                            disabled={isProcessing || isEditMode}
                            inputClassName="h-8 text-xs font-semibold"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Nomor OMC (Surat Jalan Asal) *
                        </Label>

                        <Input
                            placeholder="Ketik nomor OMC..."
                            disabled={isProcessing}
                            value={row.nomor_omc}
                            onChange={e =>
                                onFieldChange(
                                    rowIdx,
                                    'nomor_omc',
                                    e.target.value
                                )
                            }
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2.5">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            2. Gudang Tujuan (Penerima) *
                        </Label>

                        <HybridDropdown
                            value={
                                gudangs.find(
                                    g =>
                                        String(g.id) ===
                                        String(row.gudang_tujuan_id)
                                )?.nama_gudang || ''
                            }
                            options={gudangOptions}
                            onChange={(val, selectedOpt) => {
                                const targetId =
                                    selectedOpt?.id ||
                                    gudangs.find(
                                        g =>
                                            g.nama_gudang
                                                .toLowerCase()
                                                .trim() ===
                                            String(val)
                                                .toLowerCase()
                                                .trim()
                                    )?.id;

                                onFieldChange(
                                    rowIdx,
                                    'gudang_tujuan_id',
                                    targetId
                                        ? String(targetId)
                                        : ''
                                );
                            }}
                            placeholder="Pilih Gudang Penerima..."
                            searchPlaceholder="Cari Gudang Penerima..."
                            disabled={isProcessing}
                            inputClassName="h-8 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Nomor IMC (Opsional)
                        </Label>

                        <Input
                            placeholder="Ketik nomor IMC..."
                            disabled={isProcessing}
                            value={row.nomor_imc}
                            onChange={e =>
                                onFieldChange(
                                    rowIdx,
                                    'nomor_imc',
                                    e.target.value
                                )
                            }
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* 2. DETAIL BARANG */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Kode PPL *
                        </Label>

                        <HybridDropdown
                            value={targetBarang?.kode_barang || ''}
                            options={pplOptions}
                            onChange={(val, selectedOpt) => {
                                if (!val) {
                                    onBarangChange(rowIdx, '');
                                    return;
                                }

                                const targetId =
                                    selectedOpt?.id ||
                                    barangs.find(b =>
                                        String(b.id) === String(selectedOpt?.id) ||
                                        String(b.kode_barang || '')
                                            .toLowerCase()
                                            .trim() ===
                                        String(val)
                                            .toLowerCase()
                                            .trim()
                                    )?.id;

                                if (targetId) {
                                    onBarangChange(
                                        rowIdx,
                                        String(targetId)
                                    );
                                }
                            }}
                            placeholder={
                                !row.gudang_asal_id
                                    ? 'Pilih Gudang Asal Dulu...'
                                    : (
                                        pplOptions.length === 0
                                            ? 'Stok Kosong di Gudang Ini'
                                            : 'Pilih PPL...'
                                    )
                            }
                            searchPlaceholder="Cari Kode PPL..."
                            disabled={
                                isProcessing ||
                                isEditMode ||
                                !row.gudang_asal_id
                            }
                            inputClassName="h-8 text-xs font-mono font-bold"
                        />
                    </div>

                    <div className="sm:col-span-8 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Nama Barang *
                        </Label>

                        <HybridDropdown
                            value={currentNamaBarang}
                            options={namaOptions}
                            onChange={(val, selectedOpt) => {
                                if (!val) {
                                    onBarangChange(rowIdx, '');
                                    return;
                                }

                                const targetId =
                                    selectedOpt?.id ||
                                    barangs.find(b => {
                                        const fullName = [
                                            b.brand,
                                            b.tipe,
                                            b.kategori
                                        ]
                                            .filter(Boolean)
                                            .join(' ') ||
                                            b.nama_barang ||
                                            b.kode_barang;

                                        return (
                                            fullName
                                                .toLowerCase()
                                                .trim() ===
                                            String(val)
                                                .toLowerCase()
                                                .trim() ||
                                            String(b.id) ===
                                            String(selectedOpt?.id)
                                        );
                                    })?.id;

                                if (targetId) {
                                    onBarangChange(
                                        rowIdx,
                                        String(targetId)
                                    );
                                }
                            }}
                            placeholder={
                                !row.gudang_asal_id
                                    ? 'Pilih Gudang Asal Dulu...'
                                    : (
                                        namaOptions.length === 0
                                            ? 'Stok Kosong di Gudang Ini'
                                            : 'Pilih Barang...'
                                    )
                            }
                            searchPlaceholder="Cari Nama Barang..."
                            disabled={
                                isProcessing ||
                                isEditMode ||
                                !row.gudang_asal_id
                            }
                            inputClassName="h-8 text-xs"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Tanggal *
                        </Label>

                        <DatePicker
                            disabled={isProcessing}
                            value={row.tanggal}
                            onChange={newDate =>
                                onFieldChange(
                                    rowIdx,
                                    'tanggal',
                                    newDate
                                )
                            }
                            inputClassName="h-8 text-xs font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                Quantity *
                            </Label>

                            {stockInOrigin !== null &&
                                stockInOrigin !== undefined && (
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                        (Maks: {stockInOrigin})
                                    </span>
                                )}
                        </div>

                        <Input
                            type="number"
                            value={row.qty ?? 0}
                            readOnly
                            tabIndex={-1}
                            className="h-8 w-full text-center font-bold text-xs rounded-lg bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Satuan / Unit
                        </Label>

                        <Input
                            disabled
                            value={
                                targetBarang?.deskripsi ||
                                targetBarang?.satuan ||
                                'Unit'
                            }
                            className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Part Number
                        </Label>

                        <Input
                            disabled
                            placeholder={isWajibPn ? 'Part Number' : '-'}
                            value={
                                isWajibPn
                                    ? (
                                        targetBarang?.part_number ||
                                        ''
                                    )
                                    : '-'
                            }
                            className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-mono text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            {/* 3. SELECTOR BARANG */}
            {!isEditMode && targetBarang && (
                <ModalBarangSelectorUI
                    row={row}
                    rowIdx={rowIdx}
                    targetBarang={targetBarang}
                    gudangs={gudangs}
                    setRows={setRows}
                    isProcessing={isProcessing}
                    isEditMode={isEditMode}
                    stockInOrigin={stockInOrigin}
                    allowRusak={true}
                />
            )}
        </div>
    );
}