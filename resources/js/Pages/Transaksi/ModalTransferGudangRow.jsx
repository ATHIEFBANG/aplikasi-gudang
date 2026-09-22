import React, { useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, PackageCheck, Search, X, Check } from 'lucide-react';
import HybridDropdown from '@/components/HybridDropdown';
import ModalSerialSelector from './ModalSerialSelector';

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
    availableSns = [],
    nonSnSearch = '',
    snSearch = '',
    onRemoveRow,
    onFieldChange,
    onBarangChange,
    onQtyChange,
    onNonSnBatchQtyChange,
    onNonSnSearchChange,
    onSnSearchChange,
    onToggleSn,
    onClearSns
}) {
    const targetBarang = useMemo(() => {
        if (!row.barang_id) return null;
        return barangs.find(b => String(b.id) === String(row.barang_id)) || null;
    }, [barangs, row.barang_id]);

    const isWajibSn = Boolean(targetBarang?.is_wajib_sn === true || targetBarang?.is_wajib_sn === 1 || targetBarang?.is_wajib_sn === '1');
    const isWajibPn = Boolean(targetBarang?.is_wajib_pn === true || targetBarang?.is_wajib_pn === 1 || targetBarang?.is_wajib_pn === '1');
    
    const currentNamaBarang = targetBarang 
        ? ([targetBarang.brand, targetBarang.tipe, targetBarang.kategori].filter(Boolean).join(' ') || targetBarang.nama_barang || targetBarang.kode_barang)
        : '';

    // Grouping Non-SN Batches
    const groupedNonSnBatches = useMemo(() => {
        if (isWajibSn || !targetBarang || !row.gudang_asal_id) return [];
        const details = targetBarang.transaksi_details || targetBarang.transaksiDetails || [];
        const matching = details.filter(td => {
            const trx = td.transaksi;
            return trx && String(trx.gudang_tujuan_id) === String(row.gudang_asal_id);
        });
        const conditionMap = new Map();
        if (matching.length > 0) {
            matching.forEach((td) => {
                const trx = td.transaksi;
                const imc = trx?.nomor_imc || trx?.no_transaksi || '';
                const rawK = String(td.kondisi || trx?.kondisi || 'Baru').toUpperCase();
                let normKondisi = 'Baru';
                let badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
                if (rawK === 'RUSAK') {
                    normKondisi = 'Rusak';
                    badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
                } else if (rawK.includes('BEKAS') || rawK.includes('SECOND')) {
                    normKondisi = 'Bekas';
                    badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
                }
                if (conditionMap.has(normKondisi)) {
                    const existing = conditionMap.get(normKondisi);
                    existing.max_stock += (parseInt(td.qty, 10) || 1);
                    if (imc && !existing.imcs.includes(imc)) existing.imcs.push(imc);
                } else {
                    conditionMap.set(normKondisi, {
                        key: normKondisi,
                        kondisi: normKondisi,
                        max_stock: parseInt(td.qty, 10) || 1,
                        imcs: imc ? [imc] : [],
                        badgeClass
                    });
                }
            });
            return Array.from(conditionMap.values()).map(item => ({
                ...item,
                nomor_imc: item.imcs.length > 0 ? item.imcs.join(', ') : (targetBarang.kode_barang || 'IMC-IN')
            }));
        }
        return [{
            key: 'Baru',
            nomor_imc: targetBarang.kode_barang || 'IMC-IN',
            kondisi: 'Baru',
            max_stock: stockInOrigin || 1,
            badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
        }];
    }, [isWajibSn, targetBarang, row.gudang_asal_id, stockInOrigin]);

    const filteredBatches = useMemo(() => {
        if (!nonSnSearch.trim()) return groupedNonSnBatches;
        const s = nonSnSearch.toLowerCase().trim();
        return groupedNonSnBatches.filter(b => 
            b.nomor_imc.toLowerCase().includes(s) || 
            currentNamaBarang.toLowerCase().includes(s) ||
            b.kondisi.toLowerCase().includes(s)
        );
    }, [groupedNonSnBatches, nonSnSearch, currentNamaBarang]);

    const selections = row.non_sn_selections || {};

    return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-3">
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
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </Button>
                )}
            </div>

            {/* Rute Gudang & Surat Jalan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-2.5">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-rose-600 dark:text-rose-400">1. Gudang Asal (Pengirim) *</Label>
                        <HybridDropdown
                            value={gudangs.find(g => String(g.id) === String(row.gudang_asal_id))?.nama_gudang || ''}
                            options={gudangOptions}
                            onChange={(val, selectedOpt) => {
                                const targetId = selectedOpt?.id || gudangs.find(g => g.nama_gudang.toLowerCase() === String(val).toLowerCase())?.id;
                                onFieldChange(rowIdx, 'gudang_asal_id', targetId ? String(targetId) : '');
                            }}
                            placeholder="Pilih Gudang Asal..."
                            searchPlaceholder="Cari Gudang Asal..."
                            disabled={isProcessing || isEditMode}
                            inputClassName="h-8 text-xs font-semibold"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nomor OMC (Surat Jalan Asal) *</Label>
                        <Input
                            placeholder="Ketik nomor OMC..."
                            value={row.nomor_omc}
                            onChange={(e) => onFieldChange(rowIdx, 'nomor_omc', e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2.5">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">2. Gudang Tujuan (Penerima) *</Label>
                        <HybridDropdown
                            value={gudangs.find(g => String(g.id) === String(row.gudang_tujuan_id))?.nama_gudang || ''}
                            options={gudangOptions}
                            onChange={(val, selectedOpt) => {
                                const targetId = selectedOpt?.id || gudangs.find(g => g.nama_gudang.toLowerCase() === String(val).toLowerCase())?.id;
                                onFieldChange(rowIdx, 'gudang_tujuan_id', targetId ? String(targetId) : '');
                            }}
                            placeholder="Pilih Gudang Penerima..."
                            searchPlaceholder="Cari Gudang Penerima..."
                            disabled={isProcessing}
                            inputClassName="h-8 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nomor IMC (Opsional)</Label>
                        <Input
                            placeholder="Ketik nomor IMC..."
                            value={row.nomor_imc}
                            onChange={(e) => onFieldChange(rowIdx, 'nomor_imc', e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* Detail Barang, Tanggal, dan Kuantitas */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kode PPL *</Label>
                        <HybridDropdown
                            value={targetBarang?.kode_barang || ''}
                            options={pplOptions}
                            onChange={(val, selectedOpt) => {
                                if (!val) {
                                    onBarangChange(rowIdx, '');
                                    return;
                                }
                                const targetId = selectedOpt?.id || barangs.find(b => 
                                    String(b.id) === String(selectedOpt?.id) ||
                                    String(b.kode_barang).toLowerCase() === String(val).toLowerCase()
                                )?.id;
                                if (targetId) onBarangChange(rowIdx, String(targetId));
                            }}
                            placeholder={
                                !row.gudang_asal_id
                                    ? "Pilih Gudang Asal Dulu..."
                                    : (pplOptions.length === 0 ? "Stok Kosong di Gudang Ini" : "Pilih PPL...")
                            }
                            searchPlaceholder="Cari Kode PPL..."
                            disabled={isProcessing || isEditMode || !row.gudang_asal_id}
                            inputClassName="h-8 text-xs font-mono font-bold"
                        />
                    </div>
                    <div className="sm:col-span-8 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nama Barang *</Label>
                        <HybridDropdown
                            value={currentNamaBarang}
                            options={namaOptions}
                            onChange={(val, selectedOpt) => {
                                if (!val) {
                                    onBarangChange(rowIdx, '');
                                    return;
                                }
                                const targetId = selectedOpt?.id || barangs.find(b => {
                                    const fullName = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang || b.kode_barang;
                                    return fullName.toLowerCase() === String(val).trim().toLowerCase() || String(b.id) === String(selectedOpt?.id);
                                })?.id;
                                if (targetId) onBarangChange(rowIdx, String(targetId));
                            }}
                            placeholder={
                                !row.gudang_asal_id
                                    ? "Pilih Gudang Asal Dulu..."
                                    : (namaOptions.length === 0 ? "Stok Kosong di Gudang Ini" : "Pilih Barang...")
                            }
                            searchPlaceholder="Cari Nama Barang..."
                            disabled={isProcessing || isEditMode || !row.gudang_asal_id}
                            inputClassName="h-8 text-xs"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Tanggal *</Label>
                        <Input
                            type="date"
                            value={row.tanggal}
                            onClick={(e) => {
                                try {
                                    if (typeof e.target.showPicker === 'function') e.target.showPicker();
                                } catch (err) {}
                            }}
                            onChange={(e) => onFieldChange(rowIdx, 'tanggal', e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 cursor-pointer"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Quantity *</Label>
                            {stockInOrigin !== null && (
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">(Stok: {stockInOrigin})</span>
                            )}
                        </div>
                        <div className="flex items-center">
                            <button
                                type="button"
                                disabled={row.qty <= 1}
                                onClick={() => onQtyChange(rowIdx, row.qty - 1)}
                                className="h-8 w-8 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs cursor-pointer disabled:opacity-40 transition-colors"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <Input
                                type="number"
                                min={1}
                                max={stockInOrigin || 50}
                                value={row.qty}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => onQtyChange(rowIdx, e.target.value)}
                                className="h-8 w-full text-center font-bold text-xs rounded-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                required
                            />
                            <button
                                type="button"
                                disabled={stockInOrigin !== null && row.qty >= stockInOrigin}
                                onClick={() => onQtyChange(rowIdx, row.qty + 1)}
                                className="h-8 w-8 rounded-r-lg border border-l-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs cursor-pointer disabled:opacity-40 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Satuan / Unit</Label>
                        <Input
                            disabled
                            value={targetBarang?.deskripsi || targetBarang?.satuan || 'Unit'}
                            className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Part Number</Label>
                        <Input
                            disabled
                            placeholder={isWajibPn ? "Part Number" : "-"}
                            value={isWajibPn ? (targetBarang?.part_number || '') : '-'}
                            className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-mono text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            {/* Selektor Non-SN */}
            {!isWajibSn && targetBarang && !isEditMode && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                            <PackageCheck className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Pilih Barang Masuk dari Gudang Asal (Non-SN)
                            </span>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {row.qty} Unit &bull; {row.kondisi || 'Baru'}
                        </div>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <Input
                            value={nonSnSearch}
                            onChange={(e) => onNonSnSearchChange(rowIdx, e.target.value)}
                            placeholder="Cari nama barang / no IMC..."
                            className="h-7 text-[11px] pl-7 pr-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        />
                        {nonSnSearch && (
                            <button 
                                type="button" 
                                onClick={() => onNonSnSearchChange(rowIdx, '')} 
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pt-1">
                        {filteredBatches.length === 0 ? (
                            <div className="col-span-full py-3 text-center text-xs text-slate-400">
                                Tidak ada data Barang Masuk yang cocok.
                            </div>
                        ) : (
                            filteredBatches.map((b) => {
                                const selectedBatch = selections[b.key];
                                const isChecked = Boolean(selectedBatch && selectedBatch.qty > 0);
                                const currentBatchQty = selectedBatch?.qty || 0;

                                return (
                                    <div
                                        key={b.key}
                                        className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between gap-2 ${
                                            isChecked
                                                ? 'bg-blue-600/10 border-blue-600/60 text-blue-700 dark:text-blue-300 shadow-2xs'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                                        }`}
                                    >
                                        <div 
                                            className="flex items-start justify-between gap-1.5 cursor-pointer select-none"
                                            onClick={() => {
                                                if (isChecked) {
                                                    onNonSnBatchQtyChange(rowIdx, b.key, b, 0, b.max_stock);
                                                } else {
                                                    onNonSnBatchQtyChange(rowIdx, b.key, b, 1, b.max_stock);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border shrink-0 ${
                                                    isChecked 
                                                        ? 'bg-blue-600 border-blue-600 text-white' 
                                                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                                }`}>
                                                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                                </div>
                                                <span 
                                                    className="font-mono text-[11px] font-bold truncate leading-tight" 
                                                    title={`${currentNamaBarang} / ${b.nomor_imc}`}
                                                >
                                                    {currentNamaBarang} / {b.nomor_imc}
                                                </span>
                                            </div>
                                            <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${b.badgeClass}`}>
                                                {b.kondisi}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                Tersedia: <strong>{b.max_stock}</strong>
                                            </span>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    disabled={currentBatchQty <= 0}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onNonSnBatchQtyChange(rowIdx, b.key, b, currentBatchQty - 1, b.max_stock);
                                                    }}
                                                    className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                                                >
                                                    <Minus className="w-2.5 h-2.5" />
                                                </button>

                                                <span className="w-6 text-center font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                                                    {currentBatchQty}
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={currentBatchQty >= b.max_stock}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onNonSnBatchQtyChange(rowIdx, b.key, b, currentBatchQty + 1, b.max_stock);
                                                    }}
                                                    className="w-5 h-5 rounded bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-xs font-bold text-white disabled:opacity-30 cursor-pointer"
                                                >
                                                    <Plus className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Serial Number Picker */}
            {isWajibSn && !isEditMode && (
                <ModalSerialSelector
                    rowIdx={rowIdx}
                    row={{ ...row, sub_jenis: 'TRANSFER_GUDANG' }}
                    availableSnsForTransfer={availableSns}
                    snSearch={snSearch}
                    onSnSearchChange={onSnSearchChange}
                    onToggleTransferSn={onToggleSn}
                    onClearTransferSns={onClearSns}
                />
            )}
        </div>
    );
}