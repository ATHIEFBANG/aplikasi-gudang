import React, { useMemo } from 'react';
import Modal from '@/components/Modal';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, PlusCircle, Trash2, Minus, Plus, PackageCheck, Search, X, Check } from 'lucide-react';
import HybridDropdown from '@/components/HybridDropdown';
import ModalSerialSelector from './ModalSerialSelector';
import { useModalTransferGudangControl } from './ModalTransferGudangControl';

export default function ModalTransferGudang({
    isOpen,
    onClose,
    gudangs = [],
    barangs = []
}) {
    const {
        isProcessing,
        rows,
        setRows,
        snSearches,
        setSnSearches,
        nonSnSearches,
        setNonSnSearches,
        gudangOptions,
        getBarangStockInWarehouse,
        getBarangPplOptions,
        getBarangNamaOptions,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleNonSnBatchQtyChange,
        handleToggleSn,
        handleClearSns,
        handleSubmit,
        createEmptyRow
    } = useModalTransferGudangControl({
        isOpen,
        onClose,
        gudangs,
        barangs
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Tambah Transfer Antar-Gudang"
            onSubmit={handleSubmit}
            submitLabel="Simpan Transfer Gudang"
            isProcessing={isProcessing}
            headerExtra={
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono font-bold">
                    {rows.length} Baris
                </Badge>
            }
        >
            <Alert className="shrink-0 mb-3 bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 p-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <AlertDescription className="text-[11px] leading-relaxed">
                    <strong>Mutasi Internal:</strong> Transfer akan memotong stok di <strong>Gudang Asal</strong> dan menambahkannya ke <strong>Gudang Tujuan</strong> secara langsung.
                </AlertDescription>
            </Alert>
            <div className="space-y-4">
                {rows.map((row, rowIdx) => {
                    const targetBarang = barangs.find(b => String(b.id) === String(row.barang_id));
                    const isWajibSn = Boolean(targetBarang?.is_wajib_sn);
                    const isWajibPn = Boolean(targetBarang?.is_wajib_pn);
                    const currentNamaBarang = targetBarang 
                        ? ([targetBarang.brand, targetBarang.tipe, targetBarang.kategori].filter(Boolean).join(' ') || targetBarang.nama_barang || targetBarang.kode_barang)
                        : '';
                    const stockInOrigin = targetBarang && row.gudang_asal_id 
                        ? getBarangStockInWarehouse(targetBarang, row.gudang_asal_id) 
                        : null;
                    const availableSns = (targetBarang?.serials || []).filter(
                        s => String(s.gudang_id) === String(row.gudang_asal_id) && s.status === 'IN_WAREHOUSE'
                    );
                    const pplOptions = getBarangPplOptions(row);
                    const namaOptions = getBarangNamaOptions(row);
                    const nonSnSearch = nonSnSearches[rowIdx] || '';

                    // Grouping Non-SN Batches by condition for Transfer
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
                        <div key={`trf-row-${rowIdx}`} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                    Transfer #{rowIdx + 1}
                                </span>
                                {rows.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setRows(prev => prev.filter((_, i) => i !== rowIdx))}
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
                                                const targetId = selectedOpt?.id || gudangs.find(g => g.nama_gudang.toLowerCase() === val.toLowerCase())?.id;
                                                handleRowFieldChange(rowIdx, 'gudang_asal_id', targetId ? String(targetId) : '');
                                            }}
                                            placeholder="Pilih Gudang Asal..."
                                            searchPlaceholder="Cari Gudang Asal..."
                                            inputClassName="h-8 text-xs font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nomor OMC (Surat Jalan Asal) *</Label>
                                        <Input
                                            placeholder="Ketik nomor OMC..."
                                            value={row.nomor_omc}
                                            onChange={(e) => handleRowFieldChange(rowIdx, 'nomor_omc', e.target.value)}
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
                                                const targetId = selectedOpt?.id || gudangs.find(g => g.nama_gudang.toLowerCase() === val.toLowerCase())?.id;
                                                handleRowFieldChange(rowIdx, 'gudang_tujuan_id', targetId ? String(targetId) : '');
                                            }}
                                            placeholder="Pilih Gudang Penerima..."
                                            searchPlaceholder="Cari Gudang Penerima..."
                                            inputClassName="h-8 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nomor IMC (Opsional)</Label>
                                        <Input
                                            placeholder="Ketik nomor IMC..."
                                            value={row.nomor_imc}
                                            onChange={(e) => handleRowFieldChange(rowIdx, 'nomor_imc', e.target.value)}
                                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Detail Barang, Tanggal, dan Kuantitas (Nama Barang Diperlebar sm:col-span-8) */}
                            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                {/* BARIS 1: KODE PPL (4/12) & NAMA BARANG (8/12 - LEGA DAN LEBAR) */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                    <div className="sm:col-span-4 space-y-1">
                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kode PPL *</Label>
                                        <HybridDropdown
                                            value={targetBarang?.kode_barang || ''}
                                            options={pplOptions}
                                            onChange={(val, selectedOpt) => {
                                                if (!val) {
                                                    handleBarangChange(rowIdx, '');
                                                    return;
                                                }
                                                const cleanKode = String(selectedOpt?.value || val).split(' ')[0].trim().toLowerCase();
                                                const foundId = selectedOpt?.id || barangs.find(b => 
                                                    b.kode_barang.toLowerCase() === cleanKode || 
                                                    b.kode_barang.toLowerCase() === String(val).trim().toLowerCase()
                                                )?.id;
                                                if (foundId) handleBarangChange(rowIdx, foundId);
                                            }}
                                            placeholder={
                                                !row.gudang_asal_id
                                                    ? "Pilih Gudang Asal Dulu..."
                                                    : (pplOptions.length === 0 ? "Stok Kosong di Gudang Ini" : "Pilih PPL...")
                                            }
                                            searchPlaceholder="Cari Kode PPL..."
                                            disabled={isProcessing || !row.gudang_asal_id}
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
                                                    handleBarangChange(rowIdx, '');
                                                    return;
                                                }
                                                const foundId = selectedOpt?.id || barangs.find(b => {
                                                    const fullName = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang;
                                                    return fullName.toLowerCase() === String(val).trim().toLowerCase();
                                                })?.id;
                                                if (foundId) handleBarangChange(rowIdx, foundId);
                                            }}
                                            placeholder={
                                                !row.gudang_asal_id
                                                    ? "Pilih Gudang Asal Dulu..."
                                                    : (namaOptions.length === 0 ? "Stok Kosong di Gudang Ini" : "Pilih Barang...")
                                            }
                                            searchPlaceholder="Cari Nama Barang..."
                                            disabled={isProcessing || !row.gudang_asal_id}
                                            inputClassName="h-8 text-xs"
                                        />
                                    </div>
                                </div>

                                {/* BARIS 2: TANGGAL, QUANTITY, SATUAN, PART NUMBER */}
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
                                            onChange={(e) => handleRowFieldChange(rowIdx, 'tanggal', e.target.value)}
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
                                                onClick={() => handleQtyChange(rowIdx, row.qty - 1)}
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
                                                onChange={(e) => handleQtyChange(rowIdx, e.target.value)}
                                                className="h-8 w-full text-center font-bold text-xs rounded-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                                required
                                            />
                                            <button
                                                type="button"
                                                disabled={stockInOrigin !== null && row.qty >= stockInOrigin}
                                                onClick={() => handleQtyChange(rowIdx, row.qty + 1)}
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

                            {/* Selektor Non-SN dengan Stepper di Kartu untuk Transfer */}
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

                                    <div className="relative w-full sm:w-72">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <Input
                                            value={nonSnSearch}
                                            onChange={(e) => setNonSnSearches(prev => ({ ...prev, [rowIdx]: e.target.value }))}
                                            placeholder="Cari nama barang / no IMC..."
                                            className="h-7 text-[11px] pl-7 pr-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                        />
                                        {nonSnSearch && (
                                            <button 
                                                type="button" 
                                                onClick={() => setNonSnSearches(prev => ({ ...prev, [rowIdx]: '' }))} 
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
                                                                    handleNonSnBatchQtyChange(rowIdx, b.key, b, 0, b.max_stock);
                                                                } else {
                                                                    handleNonSnBatchQtyChange(rowIdx, b.key, b, 1, b.max_stock);
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
                                                                        handleNonSnBatchQtyChange(rowIdx, b.key, b, currentBatchQty - 1, b.max_stock);
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
                                                                        handleNonSnBatchQtyChange(rowIdx, b.key, b, currentBatchQty + 1, b.max_stock);
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
                            {isWajibSn && (
                                <ModalSerialSelector
                                    rowIdx={rowIdx}
                                    row={{ ...row, sub_jenis: 'TRANSFER_GUDANG' }}
                                    availableSnsForTransfer={availableSns}
                                    snSearch={snSearches[rowIdx] || ''}
                                    onSnSearchChange={(rIdx, val) => setSnSearches(prev => ({ ...prev, [rIdx]: val }))}
                                    onToggleTransferSn={handleToggleSn}
                                    onClearTransferSns={handleClearSns}
                                />
                            )}
                        </div>
                    );
                })}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRows(prev => [...prev, createEmptyRow()])}
                    className="h-8 text-xs gap-1.5 cursor-pointer"
                >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambah Baris Transfer</span>
                </Button>
            </div>
        </Modal>
    );
}