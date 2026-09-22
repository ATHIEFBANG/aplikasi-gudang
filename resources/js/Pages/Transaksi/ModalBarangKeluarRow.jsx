import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, Minus, Plus, PackageCheck, Search, X } from 'lucide-react';
import HybridDropdown from '@/components/HybridDropdown';
import ModalSerialSelector from './ModalSerialSelector';
import { CATEGORIES_KELUAR, LIST_KEPERLUAN_PATEN } from './ModalBarangKeluarControl';

export default function ModalBarangKeluarRow({
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
    stockInOrigin,
    availableSnsForOutbound = [],
    snSearch = '',
    onRemoveRow,
    onFieldChange,
    onBarangChange,
    onQtyChange,
    onNonSnBatchQtyChange,
    onSnSearchChange,
    onToggleTransferSn,
    onClearTransferSns
}) {
    const [nonSnSearch, setNonSnSearch] = useState('');

    // Mencari objek barang yang terpilih berdasarkan ID
    const targetBarang = useMemo(() => {
        if (!row.barang_id) return null;
        return barangs.find(b => String(b.id) === String(row.barang_id)) || null;
    }, [barangs, row.barang_id]);

    const isWajibSn = Boolean(targetBarang?.is_wajib_sn === true || targetBarang?.is_wajib_sn === 1 || targetBarang?.is_wajib_sn === '1');
    const isWajibPn = Boolean(targetBarang?.is_wajib_pn === true || targetBarang?.is_wajib_pn === 1 || targetBarang?.is_wajib_pn === '1');
    
    const statusText = isWajibSn && isWajibPn 
        ? 'Wajib SN & PN' 
        : isWajibSn 
        ? 'Wajib SN' 
        : isWajibPn 
        ? 'Wajib PN' 
        : 'Standar';

    const isProyek = row.sub_jenis === 'BARANG_KE_SITE';

    const currentNamaBarang = targetBarang 
        ? ([targetBarang.brand, targetBarang.tipe, targetBarang.kategori].filter(Boolean).join(' ') || targetBarang.nama_barang || targetBarang.kode_barang)
        : '';

    return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 relative group space-y-3 transition-all">
            {/* Header Baris */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        Baris #{rowIdx + 1}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        (Status Item: <strong className="text-rose-600 dark:text-rose-400">{statusText}</strong>)
                    </span>
                </div>
                {rowsCount > 1 && !isEditMode && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveRow(rowIdx)}
                        className="h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs gap-1 cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Baris
                    </Button>
                )}
            </div>

            {/* 1. Kategori Pengeluaran */}
            {!isEditMode && (
                <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kategori Pengeluaran *</Label>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {CATEGORIES_KELUAR.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = row.sub_jenis === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => onFieldChange(rowIdx, 'sub_jenis', cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
                                        isSelected
                                            ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                                    }`}
                                >
                                    <Icon className="w-3 h-3" />
                                    <span>{cat.label}</span>
                                    {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 2. Gudang Asal, OMC, Proyek & Site/Departemen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-2.5">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            Gudang Asal (Ambil Stok) *
                        </Label>
                        <HybridDropdown
                            value={
                                gudangs.find(g => 
                                    String(g.id) === String(row.gudang_asal_id) || 
                                    g.nama_gudang === row.gudang_asal_id
                                )?.nama_gudang || ''
                            }
                            options={gudangOptions}
                            onChange={(val, selectedOpt) => {
                                const targetId = selectedOpt?.id || gudangs.find(g => g.nama_gudang.toLowerCase() === String(val).toLowerCase())?.id;
                                onFieldChange(rowIdx, 'gudang_asal_id', targetId ? String(targetId) : '');
                            }}
                            placeholder="Pilih Gudang Asal..."
                            searchPlaceholder="Cari Gudang Asal..."
                            disabled={isProcessing || isEditMode}
                            inputClassName="h-8 text-xs font-semibold border-rose-300 dark:border-rose-900"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Nomor OMC (Outbound Material Control) *
                        </Label>
                        <Input
                            placeholder="Ketik Nomor OMC..."
                            disabled={isProcessing}
                            value={row.nomor_omc}
                            onChange={(e) => onFieldChange(rowIdx, 'nomor_omc', e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2.5">
                    {isProyek ? (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kode Proyek</Label>
                                    <Input
                                        placeholder="Ketik Kode..."
                                        disabled={isProcessing}
                                        value={row.kode_projek || ''}
                                        onChange={(e) => onFieldChange(rowIdx, 'kode_projek', e.target.value)}
                                        className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nama Customer</Label>
                                    <Input
                                        placeholder="Nama Customer..."
                                        disabled={isProcessing}
                                        value={row.nama_customer || ''}
                                        onChange={(e) => onFieldChange(rowIdx, 'nama_customer', e.target.value)}
                                        className="h-8 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                    Site Tujuan *
                                </Label>
                                <Input
                                    placeholder="Ketik Site Tujuan..."
                                    disabled={isProcessing}
                                    value={row.pihak_asal}
                                    onChange={(e) => onFieldChange(rowIdx, 'pihak_asal', e.target.value)}
                                    className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                Keperluan / Departemen *
                            </Label>
                            <HybridDropdown
                                value={row.pihak_asal || 'General Affair'}
                                options={LIST_KEPERLUAN_PATEN}
                                allowCustom={false}
                                onChange={(val) => onFieldChange(rowIdx, 'pihak_asal', val)}
                                placeholder="Pilih Departemen..."
                                searchPlaceholder="Cari Departemen..."
                                disabled={isProcessing}
                                inputClassName="h-8 text-xs font-semibold"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Detail Barang (Kode PPL, Nama Barang, Qty, Satuan, PN) */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                {/* Kode PPL & Nama Barang */}
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

                {/* Tanggal, Quantity, Satuan, Part Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Tanggal Keluar *</Label>
                        <Input
                            type="date"
                            disabled={isProcessing}
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

                    {/* Stepper Quantity */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Quantity *</Label>
                            {stockInOrigin !== null && (
                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                    (Ada: {stockInOrigin})
                                </span>
                            )}
                        </div>
                        <div className="flex items-center">
                            <button
                                type="button"
                                disabled={isProcessing || row.qty <= 1}
                                onClick={() => onQtyChange(rowIdx, row.qty - 1)}
                                className="h-8 w-8 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <Input
                                type="number"
                                min={1}
                                max={stockInOrigin || 50}
                                disabled={isProcessing}
                                value={row.qty}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => onQtyChange(rowIdx, e.target.value)}
                                className="h-8 w-full text-center font-bold text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-1 focus-visible:ring-rose-500"
                                required
                            />
                            <button
                                type="button"
                                disabled={isProcessing || (stockInOrigin !== null && row.qty >= stockInOrigin)}
                                onClick={() => onQtyChange(rowIdx, row.qty + 1)}
                                className="h-8 w-8 rounded-r-lg border border-l-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors"
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
                            value={isWajibPn ? (targetBarang?.part_number || '-') : '-'}
                            className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-mono text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            {/* 4. Selektor Serial Number (Muncul otomatis ketika memilih barang Wajib SN) */}
            {isWajibSn && !isEditMode && (
                <ModalSerialSelector
                    rowIdx={rowIdx}
                    row={{ ...row, sub_jenis: 'TRANSFER_GUDANG' }}
                    isProcessing={isProcessing}
                    availableSnsForTransfer={availableSnsForOutbound}
                    snSearch={snSearch}
                    onSnSearchChange={onSnSearchChange}
                    onToggleTransferSn={onToggleTransferSn}
                    onClearTransferSns={onClearTransferSns}
                />
            )}
        </div>
    );
}