import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, Minus, Plus, PackageCheck, Search, X, CheckSquare } from 'lucide-react';
import HybridDropdown from '@/components/HybridDropdown';
import ModalSerialSelector from './ModalSerialSelector';
import { CATEGORIES_KELUAR, LIST_KEPERLUAN_PATEN } from './ModalBarangKeluarControl';

export default function ModalBarangKeluarRow({
    row,
    rowIdx,
    rowsCount,
    isEditMode,
    isProcessing,
    barangs,
    gudangs,
    gudangOptions,
    pplOptions,
    namaOptions,
    stockInOrigin,
    availableSnsForOutbound,
    snSearch,
    onRemoveRow,
    onFieldChange,
    onBarangChange,
    onQtyChange,
    onNonSnBatchQtyChange,
    onAutoSelectNonSnBatches,
    onSnSearchChange,
    onToggleTransferSn,
    onAutoSelectTransferSns,
    onClearTransferSns
}) {
    const [nonSnSearch, setNonSnSearch] = useState('');

    const targetBarang = barangs.find(b => String(b.id) === String(row.barang_id));
    const isWajibSn = Boolean(targetBarang?.is_wajib_sn);
    const isWajibPn = Boolean(targetBarang?.is_wajib_pn);
    const statusText = isWajibSn && isWajibPn 
        ? 'Wajib SN & PN' 
        : isWajibSn 
        ? 'Wajib SN' 
        : isWajibPn 
        ? 'Wajib PN' 
        : 'Standar';

    const isProyek = row.sub_jenis === 'BARANG_KE_SITE';
    const pihakTujuanLabel = isProyek
        ? 'Site Tujuan / Nama Site / Teknisi *'
        : 'Keperluan / Departemen *';

    const currentNamaBarang = targetBarang 
        ? ([targetBarang.brand, targetBarang.tipe, targetBarang.kategori].filter(Boolean).join(' ') || targetBarang.nama_barang || targetBarang.kode_barang)
        : '';

    // GABUNGKAN DATA BATCH BERDASARKAN KONDISI (KONDISI SAMA = 1 KARTU SAJA DENGAN AKUMULASI STOKNYA)
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
                    if (imc && !existing.imcs.includes(imc)) {
                        existing.imcs.push(imc);
                    }
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

        // Fallback jika belum ada transaksi masuk tercatat
        return [
            {
                key: 'Baru',
                nomor_imc: targetBarang.kode_barang || 'IMC-IN',
                kondisi: 'Baru',
                max_stock: stockInOrigin || 1,
                badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }
        ];
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

            {/* 2. Gudang Asal & Tujuan / Departemen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-2.5">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            Gudang Asal (Ambil Stok) *
                        </Label>
                        <HybridDropdown
                            value={gudangs.find(g => String(g.id) === String(row.gudang_asal_id))?.nama_gudang || ''}
                            options={gudangOptions}
                            onChange={(val, selectedOpt) => {
                                const targetId = selectedOpt?.id || gudangs.find(g => g.nama_gudang.toLowerCase() === val.toLowerCase())?.id;
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
                            Nomor OMC (Surat Jalan) *
                        </Label>
                        <Input
                            placeholder="ketik nomor OMC..."
                            disabled={isProcessing}
                            value={row.nomor_omc}
                            onChange={(e) => onFieldChange(rowIdx, 'nomor_omc', e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        {pihakTujuanLabel}
                    </Label>
                    {isProyek ? (
                        <Input
                            placeholder="Ketik nama site / teknisi..."
                            disabled={isProcessing}
                            value={row.pihak_asal}
                            onChange={(e) => onFieldChange(rowIdx, 'pihak_asal', e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                            required
                        />
                    ) : (
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
                    )}
                </div>
            </div>

            {/* 3. Detail Barang & Kuantitas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Tanggal Pengeluaran *</Label>
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

                {/* Dropdown Kode PPL */}
                <div className="space-y-1">
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
                            const cleanKode = String(selectedOpt?.value || val).split(' ')[0].trim().toLowerCase();
                            const foundId = selectedOpt?.id || barangs.find(b => 
                                b.kode_barang.toLowerCase() === cleanKode || 
                                b.kode_barang.toLowerCase() === String(val).trim().toLowerCase()
                            )?.id;
                            if (foundId) onBarangChange(rowIdx, foundId);
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

                {/* Dropdown Nama Barang */}
                <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nama Barang *</Label>
                    <HybridDropdown
                        value={currentNamaBarang}
                        options={namaOptions}
                        onChange={(val, selectedOpt) => {
                            if (!val) {
                                onBarangChange(rowIdx, '');
                                return;
                            }
                            const foundId = selectedOpt?.id || barangs.find(b => {
                                const fullName = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang;
                                return fullName.toLowerCase() === String(val).trim().toLowerCase();
                            })?.id;
                            if (foundId) onBarangChange(rowIdx, foundId);
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

                <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Part Number</Label>
                    <Input
                        disabled
                        placeholder={isWajibPn ? "Part Number" : "-"}
                        value={isWajibPn ? (targetBarang?.part_number || '') : '-'}
                        className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-mono text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Satuan / Unit</Label>
                    <Input
                        disabled
                        value={targetBarang?.deskripsi || targetBarang?.satuan || 'Unit'}
                        className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                    />
                </div>

                {/* Stepper Quantity (Tersinkron Otomatis dengan Unit Kartu di Bawah) */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Quantity *</Label>
                        {stockInOrigin !== null && (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                (Tersedia: {stockInOrigin})
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
            </div>

            {/* 4. SELEKTOR KHUSUS NON-SN: KONDISI SAMA HANYA 1 KARTU + STEPPER AKTIF + MULTI PILIH */}
            {!isWajibSn && targetBarang && (
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

                    {/* Toolbar Pencarian & Pilih Otomatis */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="relative flex-1 min-w-[160px] max-w-xs">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={nonSnSearch}
                                onChange={(e) => setNonSnSearch(e.target.value)}
                                placeholder="Cari nama barang / no IMC..."
                                className="h-7 text-[11px] pl-7 pr-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            />
                            {nonSnSearch && (
                                <button 
                                    type="button" 
                                    onClick={() => setNonSnSearch('')} 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {filteredBatches.length > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (typeof onAutoSelectNonSnBatches === 'function') {
                                        onAutoSelectNonSnBatches(rowIdx, filteredBatches, row.qty);
                                    }
                                }}
                                className="h-7 px-2 text-[10px] gap-1 border-blue-200 text-blue-600 dark:border-blue-900 dark:text-blue-400 cursor-pointer"
                            >
                                <CheckSquare className="w-3 h-3" />
                                <span>Pilih Otomatis ({row.qty})</span>
                            </Button>
                        )}
                    </div>

                    {/* Grid Kartu Non-SN: Kondisi Sama Hanya 1 Kartu */}
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
                                        {/* Bagian Atas Kartu: Checkbox, Nama/IMC, dan Badge Kondisi */}
                                        <div 
                                            className="flex items-start justify-between gap-1.5 cursor-pointer select-none"
                                            onClick={() => {
                                                if (typeof onNonSnBatchQtyChange === 'function') {
                                                    if (isChecked) {
                                                        onNonSnBatchQtyChange(rowIdx, b.key, b, 0, b.max_stock);
                                                    } else {
                                                        onNonSnBatchQtyChange(rowIdx, b.key, b, 1, b.max_stock);
                                                    }
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

                                        {/* Bagian Bawah Kartu: Mini Stepper Kuantitas */}
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
                                                        if (typeof onNonSnBatchQtyChange === 'function') {
                                                            onNonSnBatchQtyChange(rowIdx, b.key, b, currentBatchQty - 1, b.max_stock);
                                                        }
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
                                                        if (typeof onNonSnBatchQtyChange === 'function') {
                                                            onNonSnBatchQtyChange(rowIdx, b.key, b, currentBatchQty + 1, b.max_stock);
                                                        }
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

            {/* 5. SELEKTOR SERIAL NUMBER UNTUK BARANG WAJIB SN */}
            {isWajibSn && !isEditMode && (
                <ModalSerialSelector
                    rowIdx={rowIdx}
                    row={{ ...row, sub_jenis: 'TRANSFER_GUDANG' }}
                    isProcessing={isProcessing}
                    availableSnsForTransfer={availableSnsForOutbound}
                    snSearch={snSearch}
                    onSnSearchChange={onSnSearchChange}
                    onToggleTransferSn={onToggleTransferSn}
                    onAutoSelectTransferSns={onAutoSelectTransferSns}
                    onClearTransferSns={onClearTransferSns}
                />
            )}
        </div>
    );
}