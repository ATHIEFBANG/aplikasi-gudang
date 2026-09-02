import React, { useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, Minus, Plus, Coins } from 'lucide-react';
import HybridDropdown from '@/components/HybridDropdown';
import { CATEGORIES_MASUK } from './ModalBarangMasukControl';

export default function ModalBarangMasukRow({
    row,
    rowIdx,
    rowsCount,
    isEditMode,
    isProcessing,
    barangs = [],
    gudangs,
    gudangOptions,
    supplierOptions,
    pplOptions,
    namaOptions,
    onRemoveRow,
    onFieldChange,
    onBarangChange,
    onQtyChange,
    onManualSerialChange
}) {
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

    const kondisiOptions = (row.sub_jenis === 'PEMBELIAN' || row.sub_jenis === 'PEMINJAMAN')
        ? [
            { value: 'Baru', label: 'Baru' },
            { value: 'Bekas', label: 'Bekas' }
          ]
        : [
            { value: 'Baru', label: 'Baru' },
            { value: 'Bekas', label: 'Bekas' },
            { value: 'Rusak', label: 'Rusak' }
          ];

    const pihakAsalLabel = 'Asal Barang *';
    const pihakAsalPlaceholder = 'ketik pihak asal...';

    const hargaSatuanNum = parseFloat(row.harga) || 0;
    const qtyNum = parseInt(row.qty, 10) || 1;
    const subtotalBeli = row.sub_jenis === 'PEMBELIAN' ? hargaSatuanNum * qtyNum : 0;

    const currentNamaBarang = targetBarang 
        ? ([targetBarang.brand, targetBarang.tipe, targetBarang.kategori].filter(Boolean).join(' ') || targetBarang.nama_barang || targetBarang.kode_barang)
        : '';

    // Opsi Kode PPL dengan teks sub-keterangan murni tanpa card/badge
    const activePplOptions = useMemo(() => {
        if (!barangs || barangs.length === 0) return pplOptions;
        return barangs.map((b) => {
            const isSn = Boolean(b.is_wajib_sn === true || b.is_wajib_sn === 1 || b.is_wajib_sn === '1');
            const isPn = Boolean(b.is_wajib_pn === true || b.is_wajib_pn === 1 || b.is_wajib_pn === '1');

            return {
                value: b.kode_barang,
                label: b.kode_barang,
                id: b.id,
                is_wajib_sn: isSn,
                is_wajib_pn: isPn,
                subLabel: (
                    <div className="flex items-center gap-1 text-[9px] leading-tight mt-0.5">
                        {isSn && (
                            <span className="text-amber-500 dark:text-amber-400 font-semibold">
                                Wajib SN
                            </span>
                        )}
                        {isSn && isPn && <span className="text-slate-400 dark:text-slate-600">&bull;</span>}
                        {isPn && (
                            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                                Wajib PN
                            </span>
                        )}
                        {!isSn && !isPn && (
                            <span className="text-slate-400 dark:text-slate-500 font-normal">
                                Standar
                            </span>
                        )}
                    </div>
                )
            };
        });
    }, [barangs, pplOptions]);

    return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 relative group space-y-3 transition-all">
            {/* Header Baris */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        Baris #{rowIdx + 1}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        (Status Item: <strong className="text-blue-600 dark:text-blue-400">{statusText}</strong>)
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

            {/* 1. Kategori Jenis Penerimaan */}
            {!isEditMode && (
                <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Jenis Penerimaan *</Label>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {CATEGORIES_MASUK.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = row.sub_jenis === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => onFieldChange(rowIdx, 'sub_jenis', cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
                                        isSelected
                                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
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

            {/* 2. Pengirim & Gudang Tujuan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{pihakAsalLabel}</Label>
                    <Input
                        placeholder={pihakAsalPlaceholder}
                        disabled={isProcessing}
                        value={row.pihak_asal}
                        onChange={(e) => onFieldChange(rowIdx, 'pihak_asal', e.target.value)}
                        className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                        required
                    />
                </div>

                <div className="space-y-2.5">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Gudang Tujuan (Penerima) *
                        </Label>
                        <HybridDropdown
                            value={gudangs.find(g => String(g.id) === String(row.gudang_tujuan_id))?.nama_gudang || ''}
                            options={gudangOptions}
                            onChange={(val, selectedOpt) => {
                                const targetId = selectedOpt?.id || gudangs.find(g => g.nama_gudang.toLowerCase() === val.toLowerCase())?.id;
                                onFieldChange(rowIdx, 'gudang_tujuan_id', targetId ? String(targetId) : '');
                            }}
                            placeholder="Pilih Gudang Penerima..."
                            searchPlaceholder="Cari Gudang..."
                            disabled={isProcessing}
                            inputClassName="h-8 text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Nomor IMC (Inbound Material Control) *
                        </Label>
                        <Input
                            placeholder="ketik nomor IMC..."
                            disabled={isProcessing}
                            value={row.nomor_imc}
                            onChange={(e) => onFieldChange(rowIdx, 'nomor_imc', e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* 3. Detail Barang, Kuantitas, Harga & Kondisi */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                {/* BARIS ATAS: Tanggal Transaksi, Kode PPL, Nama Barang */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Tanggal Transaksi *</Label>
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

                    {/* Dropdown Kode PPL dengan subLabel teks kecil bersih */}
                    <div className="sm:col-span-4 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Kode PPL *
                        </Label>
                        <HybridDropdown
                            value={targetBarang?.kode_barang || ''}
                            options={activePplOptions}
                            renderOption={(opt) => {
                                const isSn = Boolean(opt?.is_wajib_sn);
                                const isPn = Boolean(opt?.is_wajib_pn);
                                const kode = opt?.kode_barang || opt?.value || '-';
                                return (
                                    <div className="flex flex-col items-start min-w-0 pr-2 leading-tight">
                                        <span className="truncate font-mono font-bold text-xs">
                                            {kode}
                                        </span>
                                        <div className="flex items-center gap-1 text-[7px] leading-none mt-1">
                                            {isSn && (
                                                <span className="text-amber-500 dark:text-amber-400 font-semibold">
                                                    Wajib SN
                                                </span>
                                            )}
                                            {isSn && isPn && <span className="text-slate-400 dark:text-slate-600">&bull;</span>}
                                            {isPn && (
                                                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                                                    Wajib PN
                                                </span>
                                            )}
                                            {!isSn && !isPn && (
                                                <span className="text-slate-400 dark:text-slate-500 font-normal">
                                                    Standar
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }}
                            onChange={(val, selectedOpt) => {
                                if (!val) {
                                    onBarangChange(rowIdx, '');
                                    return;
                                }
                                const cleanKode = String(selectedOpt?.value || val).split(' ')[0].trim().toLowerCase();
                                const found = barangs.find(b => 
                                    b.id === selectedOpt?.id || 
                                    b.kode_barang.toLowerCase() === cleanKode || 
                                    b.kode_barang.toLowerCase() === String(val).trim().toLowerCase()
                                );
                                if (found) onBarangChange(rowIdx, found.id);
                            }}
                            placeholder="Pilih PPL..."
                            searchPlaceholder="Cari Kode PPL..."
                            disabled={isProcessing || isEditMode}
                            inputClassName="h-8 text-xs font-mono font-bold"
                        />
                    </div>

                    {/* Dropdown Nama Barang */}
                    <div className="sm:col-span-5 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nama Barang *</Label>
                        <HybridDropdown
                            value={currentNamaBarang}
                            options={namaOptions}
                            onChange={(val, selectedOpt) => {
                                if (!val) {
                                    onBarangChange(rowIdx, '');
                                    return;
                                }
                                const found = barangs.find(b => {
                                    if (b.id === selectedOpt?.id) return true;
                                    const fullName = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang;
                                    return fullName.toLowerCase() === val.trim().toLowerCase() || b.kode_barang.toLowerCase() === val.trim().toLowerCase();
                                });
                                if (found) onBarangChange(rowIdx, found.id);
                            }}
                            placeholder="Pilih Barang..."
                            searchPlaceholder="Cari Nama Barang..."
                            disabled={isProcessing || isEditMode}
                            inputClassName="h-8 text-xs"
                        />
                    </div>
                </div>

                {/* BARIS BAWAH: Part Number, Satuan / Unit, Quantity, Kondisi Fisik */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

                    {/* Stepper Quantity */}
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Quantity *</Label>
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
                                max={50}
                                disabled={isProcessing}
                                value={row.qty}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => onQtyChange(rowIdx, e.target.value)}
                                className="h-8 w-full text-center font-bold text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                required
                            />
                            <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => onQtyChange(rowIdx, row.qty + 1)}
                                className="h-8 w-8 rounded-r-lg border border-l-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Kondisi Fisik */}
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kondisi Fisik *</Label>
                        <HybridDropdown
                            value={row.kondisi || ''}
                            options={kondisiOptions}
                            onChange={(val, selectedOpt) => {
                                const resVal = selectedOpt?.value !== undefined ? selectedOpt.value : (val ?? '');
                                onFieldChange(rowIdx, 'kondisi', resVal);
                            }}
                            placeholder="Pilih Kondisi..."
                            searchPlaceholder="Cari Kondisi..."
                            disabled={isProcessing}
                            inputClassName="h-8 text-xs font-semibold"
                        />
                    </div>
                </div>

                {/* Form Harga Satuan: Setengah Lebar (sm:w-1/2 max-w-sm) */}
                {row.sub_jenis === 'PEMBELIAN' && (
                    <div className="w-full sm:w-1/2 max-w-sm space-y-1 pt-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Coins className="w-3 h-3" />
                                <span>Harga Satuan (Rp) *</span>
                            </Label>
                            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                Total: <strong className="text-emerald-600 dark:text-emerald-400">Rp {subtotalBeli.toLocaleString('id-ID')}</strong>
                            </span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                Rp
                            </span>
                            <Input
                                type="number"
                                min={0}
                                step={100}
                                placeholder="Contoh: 1500000"
                                disabled={isProcessing}
                                value={row.harga}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => onFieldChange(rowIdx, 'harga', e.target.value)}
                                className="h-8 pl-8 text-xs bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                required
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Input Manual Serial Number */}
            {isWajibSn && !isEditMode && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Daftar Serial Number ({row.serials.length} Unit) *
                        </Label>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {row.serials.filter(s => Boolean(s?.trim())).length} / {row.qty} Terisi
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto p-1">
                        {row.serials.map((sn, snIdx) => (
                            <div key={`sn-inbound-${rowIdx}-${snIdx}`} className="space-y-0.5">
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
                </div>
            )}
        </div>
    );
}