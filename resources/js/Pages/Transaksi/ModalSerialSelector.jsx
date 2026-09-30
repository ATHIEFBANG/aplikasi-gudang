import React, { useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QrCode, Search, X, Check } from 'lucide-react';

const AVAILABLE_STATUSES = ['IN_WAREHOUSE', 'READY', 'AVAILABLE'];

const isRusak = (kondisi) => {
    const value = String(kondisi || '').toUpperCase().trim();
    return value.includes('RUSAK') || value.includes('DAMAGED');
};

export default function ModalSerialSelector({
    rowIdx,
    row,
    isProcessing,
    availableSnsForTransfer = [],
    snSearch = '',
    onSnSearchChange,
    onToggleTransferSn,
    onClearTransferSns,
    onManualSerialChange
}) {
    const isPickerMode = Boolean(
        row?.sub_jenis === 'TRANSFER_GUDANG' ||
        row?.sub_jenis === 'BARANG_KE_SITE' ||
        row?.sub_jenis === 'PEMAKAIAN_INTERNAL' ||
        onToggleTransferSn
    );

    const selectedSerials = Array.isArray(row?.serials) ? row.serials : [];

    const getSnValue = (s) => (
        typeof s === 'string'
            ? s
            : (s?.serial_number || s?.sn || '')
    );

    const availableEligibleSns = useMemo(() => {
        if (!Array.isArray(availableSnsForTransfer)) return [];

        return availableSnsForTransfer.filter(s => {
            if (!s || typeof s !== 'object') return false;

            const snValue = getSnValue(s);
            if (!snValue) return false;

            const gudangId = s.gudang_id !== null &&
                s.gudang_id !== undefined &&
                String(s.gudang_id).trim() !== ''
                ? String(s.gudang_id)
                : null;

            if (!gudangId || !row?.gudang_asal_id) {
                return false;
            }

            if (gudangId !== String(row.gudang_asal_id)) {
                return false;
            }

            const status = String(s.status || '').toUpperCase().trim();

            if (!AVAILABLE_STATUSES.includes(status)) {
                return false;
            }

            if (isRusak(s.kondisi)) {
                return false;
            }

            return true;
        });
    }, [availableSnsForTransfer, row?.gudang_asal_id]);

    const searchFilter = snSearch.toLowerCase().trim();

    const filteredAvailableSns = useMemo(() => {
        if (!searchFilter) return availableEligibleSns;

        return availableEligibleSns.filter(s => {
            const snVal = getSnValue(s);
            return snVal.toLowerCase().includes(searchFilter);
        });
    }, [availableEligibleSns, searchFilter]);

    const availableCount = availableEligibleSns.length;

    return (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {isPickerMode
                            ? 'Pilih Barang dari Gudang (SN)'
                            : `Daftar Serial Number (${selectedSerials.length} Unit) *`
                        }
                    </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
                    {isPickerMode && (
                        <span className="text-slate-500 dark:text-slate-400">
                            Ada: {availableCount}
                        </span>
                    )}

                    <span className={
                        selectedSerials.length === (row?.qty || 0) && row?.qty > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                    }>
                        {selectedSerials.length} / {row?.qty || 0} Unit Terpilih
                    </span>
                </div>
            </div>

            {isPickerMode ? (
                !row?.gudang_asal_id ? (
                    <div className="py-2 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        Pilih <strong>Gudang Asal</strong> terlebih dahulu untuk memuat daftar Serial Number yang tersedia.
                    </div>
                ) : availableCount === 0 ? (
                    <div className="py-2 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        Tidak ada Serial Number aktif yang dapat dikeluarkan dari gudang asal terpilih.
                    </div>
                ) : (
                    <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="relative flex-1 min-w-[160px] max-w-xs">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />

                                <Input
                                    value={snSearch}
                                    onChange={(e) => onSnSearchChange(rowIdx, e.target.value)}
                                    placeholder="Cari nomor SN..."
                                    className="h-7 text-[11px] pl-7 pr-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                />

                                {snSearch && (
                                    <button
                                        type="button"
                                        onClick={() => onSnSearchChange(rowIdx, '')}
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
                                    onClick={() => onClearTransferSns(rowIdx)}
                                    disabled={isProcessing}
                                    className="h-7 px-2 text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>

                        {selectedSerials.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto py-1">
                                {selectedSerials.map((snVal) => {
                                    const snItem = availableEligibleSns.find(
                                        s => getSnValue(s) === snVal
                                    );

                                    const rawSnKondisi = String(
                                        snItem?.kondisi || 'Baru'
                                    ).toUpperCase().trim();

                                    let snKondisiLabel = 'Baru';

                                    if (
                                        rawSnKondisi.includes('BEKAS') ||
                                        rawSnKondisi.includes('SECOND') ||
                                        rawSnKondisi.includes('USED')
                                    ) {
                                        snKondisiLabel = 'Bekas';
                                    }

                                    return (
                                        <span
                                            key={snVal}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                                        >
                                            <span>{snVal}</span>

                                            <span className={`text-[8px] px-1 py-0.2 rounded font-sans uppercase ${
                                                snKondisiLabel === 'Bekas'
                                                    ? 'bg-amber-500/20 text-amber-600'
                                                    : 'bg-emerald-500/20 text-emerald-600'
                                            }`}>
                                                {snKondisiLabel}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => onToggleTransferSn(rowIdx, snVal)}
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
                                filteredAvailableSns.map((s) => {
                                    const snVal = getSnValue(s);
                                    const isChecked = selectedSerials.includes(snVal);

                                    const rawKondisi = String(
                                        s?.kondisi || 'Baru'
                                    ).toUpperCase().trim();

                                    const isBekas =
                                        rawKondisi.includes('BEKAS') ||
                                        rawKondisi.includes('SECOND') ||
                                        rawKondisi.includes('USED');

                                    const kondisiLabel = isBekas ? 'Bekas' : 'Baru';

                                    return (
                                        <button
                                            key={s?.id || snVal}
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => onToggleTransferSn(rowIdx, snVal, kondisiLabel)}
                                            className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                                                isChecked
                                                    ? 'bg-blue-600/10 border-blue-600/60 text-blue-700 dark:text-blue-300 font-bold'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border shrink-0 ${
                                                    isChecked
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                                }`}>
                                                    {isChecked && (
                                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                    )}
                                                </div>

                                                <span className="font-mono text-[11px] truncate">
                                                    {snVal}
                                                </span>
                                            </div>

                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                                isBekas
                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                            }`}>
                                                {kondisiLabel}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto p-1">
                    {selectedSerials.map((sn, snIdx) => (
                        <div key={`sn-input-${rowIdx}-${snIdx}`} className="space-y-0.5">
                            <Label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                SN Unit #{snIdx + 1}
                            </Label>

                            <Input
                                placeholder={`Ketik Serial Number #${snIdx + 1}`}
                                disabled={isProcessing}
                                value={sn || ''}
                                onChange={(e) =>
                                    onManualSerialChange &&
                                    onManualSerialChange(
                                        rowIdx,
                                        snIdx,
                                        e.target.value
                                    )
                                }
                                className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono border-slate-200 dark:border-slate-700"
                                required
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}