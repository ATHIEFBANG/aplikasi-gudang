import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QrCode, Search, X, CheckSquare, Check } from 'lucide-react';

export default function ModalSerialSelector({
    rowIdx,
    row,
    isProcessing,
    availableSnsForTransfer = [],
    snSearch = '',
    onSnSearchChange,
    onToggleTransferSn,
    onAutoSelectTransferSns,
    onClearTransferSns,
    onManualSerialChange
}) {
    const searchFilter = snSearch.toLowerCase().trim();
    const filteredAvailableSns = availableSnsForTransfer.filter(s => 
        !searchFilter || s.serial_number.toLowerCase().includes(searchFilter)
    );

    return (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            {/* Header Serial Number */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {row.sub_jenis === 'TRANSFER_GUDANG' 
                            ? 'Pilih Serial Number dari Gudang Asal' 
                            : `Daftar Serial Number (${row.serials.length} Unit) *`
                        }
                    </span>
                </div>

                <div className="text-[11px] font-mono font-bold">
                    <span className={row.serials.length === row.qty ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                        {row.serials.length} / {row.qty} Unit Terpilih
                    </span>
                </div>
            </div>

            {/* Mode Transfer Gudang */}
            {row.sub_jenis === 'TRANSFER_GUDANG' ? (
                !row.gudang_asal_id ? (
                    <div className="py-2 text-[11px] text-amber-700 dark:text-amber-400">
                        Pilih <strong>Gudang Asal</strong> terlebih dahulu untuk memuat daftar Serial Number yang tersedia.
                    </div>
                ) : availableSnsForTransfer.length === 0 ? (
                    <div className="py-2 text-[11px] text-rose-600 dark:text-rose-400">
                        Tidak ada Serial Number aktif untuk barang ini di gudang asal terpilih.
                    </div>
                ) : (
                    <div className="space-y-2 pt-1">
                        {/* Search & Actions */}
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

                            <div className="flex items-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onAutoSelectTransferSns(rowIdx, availableSnsForTransfer)}
                                    className="h-7 px-2 text-[10px] gap-1 border-blue-200 text-blue-600 dark:border-blue-900 dark:text-blue-400 cursor-pointer"
                                >
                                    <CheckSquare className="w-3 h-3" />
                                    <span>Pilih Otomatis ({row.qty})</span>
                                </Button>
                                {row.serials.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onClearTransferSns(rowIdx)}
                                        className="h-7 px-2 text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer"
                                    >
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Chips SN Terpilih */}
                        {row.serials.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto py-1">
                                {row.serials.map((snVal) => {
                                    const snItem = availableSnsForTransfer.find(s => s.serial_number === snVal);
                                    const rawSnKondisi = String(snItem?.kondisi || 'Baru').toUpperCase().trim();
                                    let snKondisiLabel = 'Baru';

                                    if (rawSnKondisi === 'RUSAK') snKondisiLabel = 'Rusak';
                                    else if (rawSnKondisi.includes('BEKAS') || rawSnKondisi.includes('SECOND')) snKondisiLabel = 'Bekas';

                                    return (
                                        <span
                                            key={snVal}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                                        >
                                            <span>{snVal}</span>
                                            <span className={`text-[8px] px-1 py-0.2 rounded font-sans uppercase ${
                                                snKondisiLabel === 'Rusak'
                                                    ? 'bg-rose-500/20 text-rose-600'
                                                    : snKondisiLabel === 'Bekas'
                                                    ? 'bg-amber-500/20 text-amber-600'
                                                    : 'bg-emerald-500/20 text-emerald-600'
                                            }`}>
                                                {snKondisiLabel}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onToggleTransferSn(rowIdx, snVal)}
                                                className="hover:text-rose-500 cursor-pointer ml-0.5"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Grid Checkbox SN */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pt-1">
                            {filteredAvailableSns.length === 0 ? (
                                <div className="col-span-full py-3 text-center text-xs text-slate-400">
                                    Tidak ada SN yang cocok.
                                </div>
                            ) : (
                                filteredAvailableSns.map((s) => {
                                    const isChecked = row.serials.includes(s.serial_number);
                                    const rawKondisi = String(s.kondisi || 'Baru').toUpperCase().trim();
                                    let kondisiLabel = 'Baru';

                                    if (rawKondisi === 'RUSAK') {
                                        kondisiLabel = 'Rusak';
                                    } else if (rawKondisi.includes('BEKAS') || rawKondisi.includes('SECOND')) {
                                        kondisiLabel = 'Bekas';
                                    }

                                    return (
                                        <button
                                            key={s.id || s.serial_number}
                                            type="button"
                                            onClick={() => onToggleTransferSn(rowIdx, s.serial_number, kondisiLabel)}
                                            className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
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
                                                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                                </div>
                                                <span className="font-mono text-[11px] truncate">
                                                    {s.serial_number}
                                                </span>
                                            </div>
                                            
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                                kondisiLabel === 'Rusak'
                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                    : kondisiLabel === 'Bekas'
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
                /* Mode Input Manual SN */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto p-1">
                    {row.serials.map((sn, snIdx) => (
                        <div key={`sn-input-${rowIdx}-${snIdx}`} className="space-y-0.5">
                            <Label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                SN Unit #{snIdx + 1}
                            </Label>
                            <Input
                                placeholder={`Ketik Serial Number #${snIdx + 1}`}
                                disabled={isProcessing}
                                value={sn}
                                onChange={(e) => onManualSerialChange(rowIdx, snIdx, e.target.value)}
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