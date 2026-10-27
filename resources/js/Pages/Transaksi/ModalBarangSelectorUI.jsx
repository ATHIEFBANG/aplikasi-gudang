import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HybridDropdown from "@/components/gabungan/HybridDropdown";
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
    const [qtyDrafts, setQtyDrafts] = React.useState({});
    const isProjectReturn = row?.arah_transfer === 'PROYEK_KE_GUDANG' || (row?.sub_jenis === 'PENGEMBALIAN' && row?.return_source !== 'MANUAL' && Boolean(row?.kode_projek));
    const sourceSelected = isProjectReturn ? Boolean(row?.kode_projek) : Boolean(row?.gudang_asal_id);
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
        handleNonSnBatchQtyChange,
        clearNonSnSearch,
        filteredBatches,
        getBatchSelectedQty,
        isBatchSelected,
        handleToggleNonSnBatch,
        handleReturnConditionChange,
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
                            {isProjectReturn ? 'Pilih Barang dari Proyek (SN)' : 'Pilih Barang dari Gudang (SN)'}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2.5 text-[11px] font-mono font-semibold tabular-nums">
                        <span className="text-slate-500 dark:text-slate-400">
                            Tersedia <strong className="font-bold text-slate-700 dark:text-slate-200">{availableSnCount}</strong>
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</span>
                        <span className={isSnSelectionComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                            Dipilih <strong className="font-bold">{selectedSnCount}</strong>
                        </span>
                        {selectedSerials.length > 0 && (
                            <Button type="button" variant="ghost" size="sm" onClick={handleClearSns} disabled={isProcessing} className="h-7 px-2 text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer">
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                {!sourceSelected ? (
                    <div className="py-2 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        Pilih <strong>{isProjectReturn ? 'Proyek Asal' : 'Gudang Asal'}</strong> terlebih dahulu untuk memuat daftar Serial Number yang tersedia.
                    </div>
                ) : availableSnCount === 0 ? (
                    <div className="py-2 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        Tidak ada Serial Number aktif yang dapat dipindahkan dari {isProjectReturn ? 'proyek asal' : 'gudang asal'} terpilih.
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
                                    className="h-9 rounded-md text-xs pl-8 pr-7 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-400"
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

                                            {isProjectReturn ? (
                                                <HybridDropdown
                                                    value={row?.serial_conditions?.[snVal] || kondisiLabel}
                                                    options={[
                                                        { value: 'Baru', label: 'Baru' },
                                                        { value: 'Bekas', label: 'Bekas' },
                                                        { value: 'Rusak', label: 'Rusak' }
                                                    ]}
                                                    onChange={value => setRows(prev => prev.map((item, idx) => idx !== rowIdx ? item : { ...item, serial_conditions: { ...(item.serial_conditions || {}), [snVal]: value } }))}
                                                    placeholder="Kondisi"
                                                    searchPlaceholder="Cari kondisi..."
                                                    allowCustom={false}
                                                    disabled={isProcessing}
                                                    className="w-[88px] shrink-0"
                                                    inputClassName="h-6 min-h-6 rounded border-slate-200 bg-white text-[10px] dark:border-slate-700 dark:bg-slate-900"
                                                    compact
                                                    portalMenu
                                                    direction="auto"
                                                />
                                            ) : (
                                                <span className={`text-[8px] px-1 py-0.5 rounded font-sans uppercase ${kondisiClass}`}>{kondisiLabel}</span>
                                            )}

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
                                <div className="col-span-full rounded-md border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
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
                                            disabled={isProcessing || (!isChecked && selectedSerials.length >= 10)}
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
        <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <PackageCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />

                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {isProjectReturn ? 'Barang dari Proyek · Non-SN' : 'Barang dari Gudang · Non-SN'}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Tersedia <strong className="font-mono font-semibold text-slate-700 dark:text-slate-200">{availableNonSnStock}</strong></span>
                    <span className="text-slate-300 dark:text-slate-700">/</span>
                    <span className="text-slate-500 dark:text-slate-400">Dipilih <strong className="font-mono font-semibold text-slate-800 dark:text-slate-100">{row?.qty || 0}</strong></span>
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
                    className="h-9 rounded-md text-xs pl-8 pr-7 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-400"
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 pt-0.5">
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
                                className={`group min-w-0 rounded-lg border p-3 transition-colors ${
                                    isChecked
                                        ? 'border-blue-500/60 bg-blue-50/40 dark:bg-blue-950/15'
                                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700'
                                }`}
                            >
                                <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleToggleNonSnBatch(batch)}
                                    className="flex w-full min-w-0 items-center gap-2.5 text-left disabled:cursor-not-allowed"
                                >
                                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                                        isChecked
                                            ? 'border-blue-600 bg-blue-600 text-white'
                                            : 'border-slate-300 bg-white text-transparent dark:border-slate-600 dark:bg-slate-950'
                                    }`}>
                                        <Check className="h-3 w-3 stroke-[3]" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-semibold leading-4 text-slate-800 dark:text-slate-100" title={currentNamaBarang}>
                                            {currentNamaBarang}
                                        </span>
                                        <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-500 dark:text-slate-400" title={batch.nomor_imc || 'Tanpa nomor IMC'}>
                                            IMC: {batch.nomor_imc || '-'}
                                        </span>
                                    </span>
                                    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${batch.badgeClass}`}>
                                        {batch.kondisi}
                                    </span>
                                </button>

                                {isProjectReturn && selectedQty > 0 && (
                                    <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                                        <div className="mb-1.5 flex items-center justify-between gap-2">
                                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Kondisi saat kembali</label>
                                            <span className="text-[10px] text-slate-400">Kondisi aktual</span>
                                        </div>
                                        <HybridDropdown
                                            value={selector.getBatchSelection(batch.key)?.return_condition || batch.kondisi}
                                            options={[
                                                { value: 'Baru', label: 'Baru' },
                                                { value: 'Bekas', label: 'Bekas' },
                                                { value: 'Rusak', label: 'Rusak' }
                                            ]}
                                            onChange={value => handleReturnConditionChange(batch, value)}
                                            placeholder="Pilih kondisi"
                                            searchPlaceholder="Cari kondisi..."
                                            allowCustom={false}
                                            disabled={isProcessing}
                                            className="w-full min-w-0"
                                            inputClassName="h-9 min-h-9 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium shadow-none dark:border-slate-800 dark:bg-slate-950"
                                        />
                                    </div>
                                )}

                                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                                    <div className="min-w-0">
                                        <span className="block text-[10px] text-slate-500 dark:text-slate-400">Stok tersedia</span>
                                        <span className="font-mono text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">{batch.max_stock} <span className="text-[10px] font-normal text-slate-400">unit</span></span>
                                    </div>
                                    <div className="flex h-9 shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-1 dark:border-slate-800 dark:bg-slate-950">
                                        <button
                                            type="button"
                                            aria-label={`Kurangi ${currentNamaBarang}`}
                                            disabled={isProcessing || selectedQty <= 0}
                                            onClick={e => { e.preventDefault(); e.stopPropagation(); decrementNonSnBatch(batch); }}
                                            className="flex h-7 w-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            max={Number(batch.max_stock || 0)}
                                            value={Object.prototype.hasOwnProperty.call(qtyDrafts, batch.key) ? qtyDrafts[batch.key] : selectedQty}
                                            disabled={isProcessing}
                                            aria-label={`Jumlah pengembalian ${currentNamaBarang}`}
                                            onChange={e => {
                                                const raw = e.target.value;
                                                setQtyDrafts(prev => ({ ...prev, [batch.key]: raw }));
                                                if (raw.trim() === '') return;
                                                const parsed = Number.parseInt(raw, 10);
                                                if (Number.isFinite(parsed)) {
                                                    handleNonSnBatchQtyChange(batch, Math.max(0, Math.min(Number(batch.max_stock || 0), parsed)));
                                                }
                                            }}
                                            onFocus={e => {
                                                setQtyDrafts(prev => ({ ...prev, [batch.key]: String(selectedQty) }));
                                                e.target.select();
                                            }}
                                            onBlur={e => {
                                                const raw = e.target.value.trim();
                                                const parsed = raw === '' ? 0 : Number.parseInt(raw, 10);
                                                const nextQty = Number.isFinite(parsed) ? Math.max(0, Math.min(Number(batch.max_stock || 0), parsed)) : 0;
                                                handleNonSnBatchQtyChange(batch, nextQty);
                                                setQtyDrafts(prev => {
                                                    const next = { ...prev };
                                                    delete next[batch.key];
                                                    return next;
                                                });
                                            }}
                                            className="h-7 w-12 border-0 bg-transparent px-0 text-center font-mono text-xs font-semibold tabular-nums text-slate-900 shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                            type="button"
                                            aria-label={`Tambah ${currentNamaBarang}`}
                                            disabled={isProcessing || selectedQty >= Number(batch.max_stock || 0)}
                                            onClick={e => { e.preventDefault(); e.stopPropagation(); incrementNonSnBatch(batch); }}
                                            className="flex h-7 w-7 items-center justify-center rounded bg-rose-600 text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
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
