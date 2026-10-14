import React, { useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from 'lucide-react';
import HybridDropdown from '@/components/HybridDropdown';
import DatePicker from '@/components/DatePicker';
import ModalBarangSelectorUI from './ModalBarangSelectorUI';
import { CATEGORIES_KELUAR, LIST_KEPERLUAN_PATEN } from './ModalBarangKeluarControl';

const toBooleanFlag = value =>
    value === true || value === 1 || value === '1' ||
    String(value).toLowerCase() === 'true';

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
    customerOptions = [],
    stockInOrigin,
    setRows,
    onRemoveRow,
    onFieldChange,
    onBarangChange
}) {
    const targetBarang = useMemo(() => {
        if (!row.barang_id) return null;
        return barangs.find(b => String(b.id) === String(row.barang_id)) || null;
    }, [barangs, row.barang_id]);

    const isWajibSn = toBooleanFlag(targetBarang?.is_wajib_sn);
    const isWajibPn = toBooleanFlag(targetBarang?.is_wajib_pn);

    const statusText =
        isWajibSn && isWajibPn ? 'Wajib SN & PN' :
        isWajibSn ? 'Wajib SN' :
        isWajibPn ? 'Wajib PN' :
        'Standar';

    const isProyek = row.sub_jenis === 'BARANG_KE_SITE';

    const currentNamaBarang = targetBarang
        ? ([targetBarang.brand, targetBarang.tipe, targetBarang.kategori].filter(Boolean).join(' ') || targetBarang.nama_barang || targetBarang.kode_barang || '')
        : '';

    return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 relative group space-y-3 transition-all">
            {/* HEADER BARIS */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        Baris #{rowIdx + 1}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        (Status Item:{' '}
                        <strong className="text-rose-600 dark:text-rose-400">{statusText}</strong>)
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
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Baris
                    </Button>
                )}
            </div>

            {/* 1. KATEGORI PENGELUARAN */}
            {!isEditMode && (
                <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Kategori Pengeluaran *
                    </Label>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {CATEGORIES_KELUAR.map(cat => {
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

            {/* 2. GUDANG ASAL, OMC, PROYEK / DEPARTEMEN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-2.5">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            Gudang Asal (Ambil Stok) *
                        </Label>
                        <HybridDropdown
                            value={gudangs.find(g => String(g.id) === String(row.gudang_asal_id) || g.nama_gudang === row.gudang_asal_id)?.nama_gudang || ''}
                            options={gudangOptions}
                            onChange={(val, selectedOpt) => {
                                const targetId = selectedOpt?.id || gudangs.find(g => g.nama_gudang.toLowerCase().trim() === String(val).toLowerCase().trim())?.id;
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
                            onChange={e => onFieldChange(rowIdx, 'nomor_omc', e.target.value)}
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
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                        Kode Proyek
                                    </Label>
                                    <Input
                                        placeholder="Ketik Kode..."
                                        disabled={isProcessing}
                                        value={row.kode_projek || ''}
                                        onChange={e => onFieldChange(rowIdx, 'kode_projek', e.target.value)}
                                        className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                        Nama Customer
                                    </Label>
                                    <HybridDropdown
                                        value={row.nama_customer || ''}
                                        options={customerOptions}
                                        allowCustom={true}
                                        onChange={val => onFieldChange(rowIdx, 'nama_customer', val)}
                                        placeholder="Nama Customer..."
                                        searchPlaceholder="Cari Nama Customer..."
                                        disabled={isProcessing}
                                        inputClassName="h-8 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
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
                                    onChange={e => onFieldChange(rowIdx, 'pihak_asal', e.target.value)}
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
                                onChange={val => onFieldChange(rowIdx, 'pihak_asal', val)}
                                placeholder="Pilih Departemen..."
                                searchPlaceholder="Cari Departemen..."
                                disabled={isProcessing}
                                inputClassName="h-8 text-xs font-semibold"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 3. DETAIL BARANG */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
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
                                    String(b.kode_barang || '').toLowerCase().trim() === String(val).toLowerCase().trim()
                                )?.id;

                                if (targetId) onBarangChange(rowIdx, String(targetId));
                            }}
                            placeholder={!row.gudang_asal_id ? 'Pilih Gudang Asal Dulu...' : (pplOptions.length === 0 ? 'Stok Kosong di Gudang Ini' : 'Pilih PPL...')}
                            searchPlaceholder="Cari Kode PPL..."
                            disabled={isProcessing || isEditMode || !row.gudang_asal_id}
                            inputClassName="h-8 text-xs font-mono font-bold"
                        />
                    </div>

                    <div className="sm:col-span-8 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Nama Barang *
                        </Label>
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
                                    return fullName.toLowerCase().trim() === String(val).toLowerCase().trim() || String(b.id) === String(selectedOpt?.id);
                                })?.id;

                                if (targetId) onBarangChange(rowIdx, String(targetId));
                            }}
                            placeholder={!row.gudang_asal_id ? 'Pilih Gudang Asal Dulu...' : (namaOptions.length === 0 ? 'Stok Kosong di Gudang Ini' : 'Pilih Barang...')}
                            searchPlaceholder="Cari Nama Barang..."
                            disabled={isProcessing || isEditMode || !row.gudang_asal_id}
                            inputClassName="h-8 text-xs"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Tanggal Keluar *
                        </Label>
                        <DatePicker
                            disabled={isProcessing}
                            value={row.tanggal}
                            onChange={newDate => onFieldChange(rowIdx, 'tanggal', newDate)}
                            inputClassName="h-8 text-xs font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                Quantity *
                            </Label>
                            {stockInOrigin !== null && stockInOrigin !== undefined && (
                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                    (Maks: {stockInOrigin})
                                </span>
                            )}
                        </div>
                        <Input
                            type="number"
                            value={row.qty ?? 0}
                            readOnly
                            tabIndex={-1}
                            className="h-8 w-full text-center font-bold text-xs bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Satuan / Unit
                        </Label>
                        <Input
                            disabled
                            value={targetBarang?.deskripsi || targetBarang?.satuan || 'Unit'}
                            className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            Part Number
                        </Label>
                        <Input
                            disabled
                            placeholder={isWajibPn ? 'Part Number' : '-'}
                            value={isWajibPn ? (targetBarang?.part_number || '-') : '-'}
                            className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-mono text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            {/* 4. SELECTOR SN / NON-SN */}
            {!isEditMode && targetBarang && (
                <ModalBarangSelectorUI
                    row={row}
                    rowIdx={rowIdx}
                    targetBarang={targetBarang}
                    gudangs={gudangs}
                    setRows={setRows}
                    isProcessing={isProcessing}
                    isEditMode={isEditMode}
                    stockInOrigin={stockInOrigin}
                />
            )}
        </div>
    );
}