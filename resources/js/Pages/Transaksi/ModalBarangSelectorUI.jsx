import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    PackageCheck,
    QrCode,
    Search,
    X,
    Check,
    Minus,
    Plus
} from 'lucide-react';
import useModalBarangSelectorLogic from './ModalBarangSelectorLogic';

export default function ModalBarangSelectorUI({
    row,
    rowIdx,
    targetBarang,
    gudangs = [],
    setRows,
    isProcessing = false,
    isEditMode = false,
    stockInOrigin = 0,
    allowRusak = false
}) {
    const selector = useModalBarangSelectorLogic({
        row,
        rowIdx,
        targetBarang,
        gudangs,
        setRows,
        isProcessing,
        isEditMode,
        stockInOrigin,
        allowRusak
    });

    const {
        isWajibSn,
        currentNamaBarang,

        snSearch,
        selectedSerials,
        selectedSnItems,
        selectedSnCount,
        availableSnCount,
        filteredAvailableSns,
        isSnSelectionComplete,
        getSnValue,
        getSnKondisiLabel,
        handleSnSearchChange,
        handleToggleSn,
        handleClearSns,

        nonSnSearch,
        handleNonSnSearchChange,
        clearNonSnSearch,
        filteredBatches,
        getBatchSelectedQty,
        isBatchSelected,
        handleToggleNonSnBatch,
        incrementNonSnBatch,
        decrementNonSnBatch,
        availableNonSnStock
    } = selector;

    if (!targetBarang || isEditMode) {
        return null;
    }

    /* =========================================================
     * SELECTOR SN
     * ========================================================= */

    if (isWajibSn) {
        return (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-amber-500" />

                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Pilih Barang dari Gudang (SN)
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
                        <span className="text-slate-500 dark:text-slate-400">
                            Ada: {availableSnCount}
                        </span>

                        <span
                            className={
                                isSnSelectionComplete
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                            }
                        >
                            {selectedSnCount} / {row?.qty || 0} Unit Terpilih
                        </span>
                    </div>
                </div>

                {!row?.gudang_asal_id ? (
                    <div className="py-2 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        Pilih <strong>Gudang Asal</strong> terlebih dahulu untuk memuat daftar Serial Number yang tersedia.
                    </div>
                ) : availableSnCount === 0 ? (
                    <div className="py-2 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        Tidak ada Serial Number aktif yang dapat dipindahkan dari gudang asal terpilih.
                    </div>
                ) : (
                    <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="relative flex-1 min-w-[160px] max-w-xs">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />

                                <Input
                                    value={snSearch}
                                    onChange={e =>
                                        handleSnSearchChange(e.target.value)
                                    }
                                    placeholder="Cari nomor SN..."
                                    className="h-7 text-[11px] pl-7 pr-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                />

                                {snSearch && (
                                    <button
                                        type="button"
                                        onClick={() => handleSnSearchChange('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {selectedSerials.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearSns}
                                    disabled={isProcessing}
                                    className="h-7 px-2 text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>

                        {selectedSerials.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto py-1">
                                {selectedSerials.map(snVal => {
                                    const snItem = selectedSnItems.find(
                                        serial => getSnValue(serial) === snVal
                                    );

                                    const kondisiLabel = snItem
                                        ? getSnKondisiLabel(snItem)
                                        : 'Baru';

                                    const kondisiClass =
                                        kondisiLabel === 'Rusak'
                                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                            : kondisiLabel === 'Bekas'
                                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';

                                    return (
                                        <span
                                            key={snVal}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                                        >
                                            <span>{snVal}</span>

                                            <span
                                                className={`text-[8px] px-1 py-0.5 rounded font-sans uppercase ${kondisiClass}`}
                                            >
                                                {kondisiLabel}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleToggleSn(snVal)}
                                                disabled={isProcessing}
                                                className="hover:text-rose-500 cursor-pointer ml-0.5 disabled:opacity-50"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pt-1">
                            {filteredAvailableSns.length === 0 ? (
                                <div className="col-span-full py-3 text-center text-xs text-slate-400">
                                    Tidak ada SN yang cocok.
                                </div>
                            ) : (
                                filteredAvailableSns.map(serial => {
                                    const snVal = getSnValue(serial);
                                    const isChecked =
                                        selectedSerials.includes(snVal);

                                    const kondisiLabel =
                                        getSnKondisiLabel(serial);

                                    const kondisiClass =
                                        kondisiLabel === 'Rusak'
                                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                            : kondisiLabel === 'Bekas'
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';

                                    return (
                                        <button
                                            key={serial?.id || snVal}
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => handleToggleSn(snVal)}
                                            className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                                                isChecked
                                                    ? 'bg-blue-600/10 border-blue-600/60 text-blue-700 dark:text-blue-300 font-bold'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div
                                                    className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border shrink-0 ${
                                                        isChecked
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                                    }`}
                                                >
                                                    {isChecked && (
                                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                    )}
                                                </div>

                                                <span className="font-mono text-[11px] truncate">
                                                    {snVal}
                                                </span>
                                            </div>

                                            <span
                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${kondisiClass}`}
                                            >
                                                {kondisiLabel}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    /* =========================================================
     * SELECTOR NON-SN
     * ========================================================= */

    return (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-amber-500" />

                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Pilih Barang dari Gudang (Non-SN)
                    </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
                    <span className="text-slate-500 dark:text-slate-400">
                        Ada: {availableNonSnStock}
                    </span>

                    <span className="text-rose-600 dark:text-rose-400">
                        {row?.qty || 0} Unit
                    </span>
                </div>
            </div>

            <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                <Input
                    value={nonSnSearch}
                    onChange={e =>
                        handleNonSnSearchChange(e.target.value)
                    }
                    placeholder="Cari kondisi / no IMC..."
                    className="h-7 text-[11px] pl-7 pr-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />

                {nonSnSearch && (
                    <button
                        type="button"
                        onClick={clearNonSnSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pt-1">
                {filteredBatches.length === 0 ? (
                    <div className="col-span-full py-3 text-center text-xs text-slate-400">
                        Tidak ada data stok Non-SN yang cocok.
                    </div>
                ) : (
                    filteredBatches.map(batch => {
                        const selectedQty =
                            getBatchSelectedQty(batch.key);

                        const isChecked =
                            isBatchSelected(batch.key);

                        return (
                            <div
                                key={batch.key}
                                className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between gap-2 ${
                                    isChecked
                                        ? 'bg-rose-600/10 border-rose-600/60 text-rose-700 dark:text-rose-300 shadow-2xs'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                                }`}
                            >
                                <div
                                    className="flex items-start justify-between gap-1.5 cursor-pointer select-none"
                                    onClick={() =>
                                        handleToggleNonSnBatch(batch)
                                    }
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border shrink-0 ${
                                                isChecked
                                                    ? 'bg-rose-600 border-rose-600 text-white'
                                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                            }`}
                                        >
                                            {isChecked && (
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            )}
                                        </div>

                                        <span className="font-mono text-[11px] font-bold truncate leading-tight">
                                            {currentNamaBarang} / {batch.nomor_imc}
                                        </span>
                                    </div>

                                    <span
                                        className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${batch.badgeClass}`}
                                    >
                                        {batch.kondisi}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                        Tersedia: <strong>{batch.max_stock}</strong>
                                    </span>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={
                                                isProcessing ||
                                                selectedQty <= 0
                                            }
                                            onClick={e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                decrementNonSnBatch(batch);
                                            }}
                                            className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                                        >
                                            <Minus className="w-2.5 h-2.5" />
                                        </button>

                                        <span className="w-6 text-center font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                                            {selectedQty}
                                        </span>

                                        <button
                                            type="button"
                                            disabled={
                                                isProcessing ||
                                                selectedQty >= Number(batch.max_stock || 0)
                                            }
                                            onClick={e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                incrementNonSnBatch(batch);
                                            }}
                                            className="w-5 h-5 rounded bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-xs font-bold text-white disabled:opacity-30 cursor-pointer"
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
    );
}