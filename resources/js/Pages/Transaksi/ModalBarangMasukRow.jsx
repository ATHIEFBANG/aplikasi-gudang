import React, { useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, Minus, Plus, Coins } from 'lucide-react';
import HybridDropdown from '@/components/gabungan/HybridDropdown';
import DatePicker from '@/components/gabungan/DatePicker';
import { CATEGORIES_MASUK } from './ModalBarangMasukControl';
import ModalBarangSelectorUI from './ModalBarangSelectorUI';

const normalizeSerialCondition = value => {
    const condition = String(value || '').toUpperCase().trim();
    if (condition.includes('RUSAK') || condition.includes('DAMAGED')) return 'Rusak';
    if (condition.includes('BEKAS') || condition.includes('SECOND') || condition.includes('USED')) return 'Bekas';
    return 'Baru';
};

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
    projectOptions = [],
    pplOptions,
    namaOptions,
    onRemoveRow,
    onFieldChange,
    onBarangChange,
    onQtyChange,
    onManualSerialChange,
    onToggleProjectSerial,
    setRows
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

    const isProjectReturn = row.sub_jenis === 'PENGEMBALIAN' && row.return_source !== 'MANUAL';
    const isProjectSnReturn = isProjectReturn && isWajibSn;
    const projectSerialOptions = targetBarang?.project_serials?.[String(row.kode_projek)] || [];
    const selectedProjectSerialConditions = [...new Set(projectSerialOptions
        .filter(serial => (row.serials || []).includes(String(serial.serial_number || '')))
        .map(serial => normalizeSerialCondition(serial.kondisi)))];
    const displayedProjectSnCondition = selectedProjectSerialConditions.length > 1
        ? 'Campuran'
        : selectedProjectSerialConditions[0] || 'Pilih SN terlebih dahulu';

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

    const { pihakAsalLabel, pihakAsalPlaceholder } = useMemo(() => {
        switch (row.sub_jenis) {
            case 'PEMBELIAN':
                return {
                    pihakAsalLabel: 'Asal Barang *',
                    pihakAsalPlaceholder: 'Ketik asal Toko / Vendor...'
                };
            case 'PEMINJAMAN':
                return {
                    pihakAsalLabel: 'Asal Barang *',
                    pihakAsalPlaceholder: 'Ketik dari Vendor / Peminjaman...'
                };
            case 'PENGEMBALIAN':
                return {
                    pihakAsalLabel: 'Asal Barang *',
                    pihakAsalPlaceholder: 'Ketik asal barang / pihak pengembali...'
                };
            default:
                return {
                    pihakAsalLabel: 'Asal Barang *',
                    pihakAsalPlaceholder: 'Ketik pihak asal...'
                };
        }
    }, [row.sub_jenis]);

    const hargaSatuanNum = parseFloat(row.harga) || 0;
    const qtyNum = parseInt(row.qty, 10) || 1;
    const subtotalBeli = row.sub_jenis === 'PEMBELIAN' ? hargaSatuanNum * qtyNum : 0;
    const currentNamaBarang = targetBarang
        ? ([targetBarang.brand, targetBarang.tipe, targetBarang.kategori].filter(Boolean).join(' ') || targetBarang.nama_barang || targetBarang.kode_barang)
        : '';

    const activePplOptions = useMemo(() => {
        if (!barangs || barangs.length === 0) return pplOptions;
        return barangs.filter(b => {
            if (row.sub_jenis !== 'PENGEMBALIAN' || !row.kode_projek) return true;
            const code = String(row.kode_projek);
            if (b.is_wajib_sn === true || b.is_wajib_sn === 1 || b.is_wajib_sn === '1') return (b.project_serials?.[code] || []).length > 0;
            const stock = b.project_stocks?.[code] || {};
            return Number(stock.aktif ?? (Number(stock.baru || 0) + Number(stock.bekas || 0) + Number(stock.rusak || 0))) > 0;
        }).map((b) => {
            const isSn = Boolean(b.is_wajib_sn === true || b.is_wajib_sn === 1 || b.is_wajib_sn === '1');
            const isPn = Boolean(b.is_wajib_pn === true || b.is_wajib_pn === 1 || b.is_wajib_pn === '1');
            return {
                value: b.kode_barang,
                label: b.kode_barang,
                id: b.id,
                is_wajib_sn: isSn,
                is_wajib_pn: isPn,
                subLabel: (
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] leading-tight mt-0.5 font-sans">
                        {isSn && <span className="text-amber-500 dark:text-amber-400 font-semibold">Wajib SN</span>}
                        {isSn && isPn && <span className="text-slate-400 dark:text-slate-600">&bull;</span>}
                        {isPn && <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Wajib PN</span>}
                        {!isSn && !isPn && <span className="text-slate-400 dark:text-slate-500 font-normal">Standar</span>}
                        {row.sub_jenis === 'PENGEMBALIAN' && row.kode_projek && (
                            <>
                                <span className="text-slate-400">&bull;</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    Stok: {isSn
                                        ? (b.project_serials?.[String(row.kode_projek)] || []).length
                                        : Number(b.project_stocks?.[String(row.kode_projek)]?.aktif ?? (
                                            Number(b.project_stocks?.[String(row.kode_projek)]?.baru || 0) +
                                            Number(b.project_stocks?.[String(row.kode_projek)]?.bekas || 0) +
                                            Number(b.project_stocks?.[String(row.kode_projek)]?.rusak || 0)
                                        ))}
                                </span>
                            </>
                        )}
                    </div>
                )
            };
        });
    }, [barangs, pplOptions, row.sub_jenis, row.kode_projek]);

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

            {/* 2. Pengirim/Asal & Gudang Tujuan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="space-y-1">
                {row.sub_jenis === 'PENGEMBALIAN' ? (
                    <div className="-space-y-1">
                        <div className="flex min-h-6 flex-wrap items-center justify-between gap-1">
                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                Asal Barang *
                            </Label>

                            <div className="-translate-y-2 flex items-center gap-1.5">
                                {[
                                    { value: 'PROJECT', label: 'Proyek' },
                                    { value: 'MANUAL', label: 'Manual' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => onFieldChange(rowIdx, 'return_source', option.value)}
                                        disabled={isProcessing || isEditMode}
                                        className={`rounded-md border px-1 py-1 text-[8px] font-semibold transition-colors ${
                                            ((row.return_source || 'PROJECT') === option.value)
                                                ? 'border-blue-500 bg-blue-600 text-white'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {isProjectReturn ? (
                            <HybridDropdown
                                value={row.kode_projek || ''}
                                options={projectOptions}
                                renderOption={(option, isSelected) => {
                                        const namaProyek = option?.nama_projek || option?.nama_proyek || option?.project_name || '';
                                        const namaCustomer = option?.nama_customer || option?.customer_name || '';
                                        return (
                                            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 py-0.5">
                                                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                                    <span className={`truncate font-semibold ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                                                        {option?.label || option?.kode_projek || option?.value || ''}
                                                    </span>
                                                    {Number(option?.available_count || 0) > 0 && (
                                                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${isSelected ? 'bg-white/15 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                                                            Ada: {Number(option.available_count).toLocaleString('id-ID')} barang
                                                        </span>
                                                    )}
                                                </div>
                                                {namaProyek && (
                                                    <span className={`truncate text-[10px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        {namaProyek}
                                                    </span>
                                                )}
                                                {namaCustomer && (
                                                    <span className={`truncate text-[10px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        Customer: {namaCustomer}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    }}
                                allowCustom={false}
                                onChange={value => onFieldChange(rowIdx, 'kode_projek', value)}
                                placeholder="Pilih proyek asal..."
                                searchPlaceholder="Cari kode proyek..."
                                disabled={isProcessing || isEditMode}
                                inputClassName="h-8 text-xs font-semibold"
                            />
                        ) : (
                            <Input
                                placeholder="Ketik asal barang / pihak pengembali..."
                                disabled={isProcessing || isEditMode}
                                value={row.pihak_asal || ''}
                                onChange={e => onFieldChange(rowIdx, 'pihak_asal', e.target.value)}
                                className="h-8 text-xs bg-slate-50 font-medium text-slate-900 dark:bg-slate-950 dark:text-slate-100"
                                required
                            />
                        )}
                    </div>
                    ) : (
                        <>
                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{pihakAsalLabel}</Label>
                            <Input placeholder={pihakAsalPlaceholder} disabled={isProcessing} value={row.pihak_asal} onChange={(e) => onFieldChange(rowIdx, 'pihak_asal', e.target.value)} className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700" required />
                        </>
                    )}
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
                            placeholder="Ketik Nomor IMC..."
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
                {/* BARIS 1: KODE PPL & NAMA BARANG */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Kode PPL *
                        </Label>
                        <HybridDropdown
                            value={targetBarang?.kode_barang || ''}
                            options={activePplOptions}
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

                {/* BARIS 2: TANGGAL, SATUAN, QUANTITY, KONDISI FISIK */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${isProjectReturn ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3`}>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Tanggal *</Label>
                        <DatePicker
                            disabled={isProcessing}
                            value={row.tanggal}
                            onChange={(newDate) => onFieldChange(rowIdx, 'tanggal', newDate)}
                            inputClassName="h-8 text-xs font-medium"
                            required
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

                    {/* Quantity pengembalian mengikuti pilihan selector, seperti transfer */}
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Qty {isWajibSn && <span className="font-normal text-slate-400">(maks. 10 SN)</span>}</Label>
                        {isProjectReturn ? (
                            <div className="flex h-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-cyan-300">
                                {Number(row.qty || 0)}
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <button type="button" disabled={isProcessing || (isEditMode && !isWajibSn) || Number(row.qty) <= 1} onClick={() => onQtyChange(rowIdx, Number(row.qty || 1) - 1)} className="h-8 w-8 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors"><Minus className="w-3 h-3" /></button>
                                <Input type="number" min={1} max={isWajibSn ? 10 : undefined} disabled={isProcessing || (isEditMode && !isWajibSn)} value={row.qty} onFocus={(e) => e.target.select()} onChange={(e) => onQtyChange(rowIdx, e.target.value)} className="h-8 w-full text-center font-bold text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-1 focus-visible:ring-blue-500" required />
                                <button type="button" disabled={isProcessing || (isEditMode && !isWajibSn) || (isWajibSn && Number(row.qty) >= 10)} onClick={() => onQtyChange(rowIdx, Number(row.qty || 0) + 1)} className="h-8 w-8 rounded-r-lg border border-l-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors"><Plus className="w-3 h-3" /></button>
                            </div>
                        )}
                    </div>

                    {!isProjectReturn && (
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kondisi Fisik *</Label>
                            <HybridDropdown value={row.kondisi || ''} options={kondisiOptions} onChange={(val, selectedOpt) => onFieldChange(rowIdx, 'kondisi', selectedOpt?.value !== undefined ? selectedOpt.value : (val ?? ''))} placeholder="Pilih Kondisi..." searchPlaceholder="Cari Kondisi..." disabled={isProcessing} inputClassName="h-8 text-xs font-semibold" />
                        </div>
                    )}
                </div>

                {/* BARIS 3: PART NUMBER & HARGA SATUAN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Part Number</Label>
                        <Input
                            disabled
                            placeholder={isWajibPn ? "Part Number" : "-"}
                            value={isWajibPn ? (targetBarang?.part_number || '') : '-'}
                            className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-mono text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        />
                    </div>

                    {row.sub_jenis === 'PEMBELIAN' && (
                        <div className="space-y-1">
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
            </div>

            {/* 4. Selector bersama SN / Non-SN untuk pengembalian dari proyek */}
            {isProjectReturn && Boolean(row.kode_projek) && !isEditMode ? (
                <ModalBarangSelectorUI
                    row={row}
                    rowIdx={rowIdx}
                    targetBarang={targetBarang}
                    gudangs={gudangs}
                    setRows={setRows}
                    isProcessing={isProcessing}
                    isEditMode={false}
                    allowRusak
                />
            ) : isWajibSn ? (
                <div className="space-y-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Daftar Serial Number ({row.serials.length} Unit) *</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{row.serials.filter(s => Boolean(String(s ?? '').trim())).length} / {row.qty} Terisi</span>

                        </div>
                    </div>
                    <div className="grid max-h-44 grid-cols-1 gap-2.5 overflow-y-auto p-1 sm:grid-cols-2 lg:grid-cols-3">{row.serials.map((sn, snIdx) => <div key={`sn-inbound-${rowIdx}-${snIdx}`} className="space-y-0.5"><Label className="text-[10px] font-mono text-slate-500 dark:text-slate-400">SN Unit #{snIdx + 1}</Label><Input placeholder={`Ketik Serial Number #${snIdx + 1}`} disabled={isProcessing} value={typeof sn === 'object' && sn !== null ? (sn.serial_number || '') : (sn || '')} onChange={e => onManualSerialChange(rowIdx, snIdx, e.target.value)} className="h-8 border-slate-200 bg-white text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" required /></div>)}</div>
                    {isEditMode && <p className="text-[10px] text-slate-500 dark:text-slate-400">Atur Qty dengan tombol − / +. Jumlah kotak SN mengikuti Qty, maksimal 10 unit.</p>}
                </div>
            ) : null}
        </div>
    );
}
