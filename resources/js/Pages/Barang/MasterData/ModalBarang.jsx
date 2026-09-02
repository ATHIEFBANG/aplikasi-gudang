import React from 'react';
import Modal from '@/components/Modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    PlusCircle, 
    Trash2, 
    ClipboardPaste, 
    AlertCircle, 
    QrCode, 
    Hash, 
    Check 
} from 'lucide-react';
import HybridDropdown from '@/components/HybridDropdown';

import { 
    useModalBarangControl, 
    MAX_ROWS_LIMIT,
    LIST_SATUAN_PATEN
} from './ModalBarangControl';

export default function ModalBarang({
    isOpen,
    onClose,
    isEditMode = false,
    selectedItem = null,
    existingOptions = {}
}) {
    const {
        isProcessing,
        editData,
        setEditData,
        addItems,
        brandOptions,
        tipeOptions,
        kategoriOptions,
        formatKodePPL,
        handleContainerPaste,
        handlePasteFromClipboardButton,
        handleAddMoreRows,
        handleRemoveAddRow,
        handleAddItemChange,
        handleToggleSN,
        handleTogglePN,
        getStatusText,
        handleSubmitForm
    } = useModalBarangControl({ isOpen, isEditMode, selectedItem, existingOptions, onClose });

    const handleFilteredPaste = (e) => {
        const targetTag = e.target?.tagName;
        if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
            return;
        }
        handleContainerPaste?.(e);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Data Barang' : 'Tambah Master Barang PPL'}
            onSubmit={handleSubmitForm}
            submitLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Semua Data'}
            isProcessing={isProcessing}
            onPaste={!isEditMode ? handleFilteredPaste : undefined}
            headerExtra={
                !isEditMode && (
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePasteFromClipboardButton}
                            className="h-7 text-xs gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                        >
                            <ClipboardPaste className="w-3.5 h-3.5" />
                            <span>Paste dari Excel</span>
                        </Button>
                        <Badge 
                            variant="secondary" 
                            className={`text-[11px] font-mono font-bold ${
                                addItems.length >= MAX_ROWS_LIMIT
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            {addItems.length} / {MAX_ROWS_LIMIT} Baris
                        </Badge>
                    </div>
                )
            }
        >
            {!isEditMode && (
                <Alert className="shrink-0 mb-3 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-300 p-3 rounded-xl flex items-start gap-2.5 shadow-xs">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-xs leading-relaxed">
                        <strong>Smart Input (Maks {MAX_ROWS_LIMIT} Baris):</strong> Anda dapat mengetik manual, menempelkan teks per kolom, atau menggunakan tombol <strong>Paste dari Excel</strong> di pojok kanan atas.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                {isEditMode ? (
                    <div className="space-y-3 p-1">
                        {/* Baris 1: Kode PPL, Brand, Kategori (Masing-masing 4/12 grid) */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-4 space-y-1.5">
                                <Label className="text-xs font-semibold">Kode PPL (8 Digit Angka) *</Label>
                                <Input 
                                    disabled={isProcessing} 
                                    maxLength={11}
                                    value={editData.kode_barang || ''} 
                                    onChange={(e) => setEditData({ ...editData, kode_barang: formatKodePPL(e.target.value) })} 
                                    placeholder="Contoh: PPL12345678" 
                                    className="h-8 text-xs font-mono font-bold"
                                    required 
                                />
                            </div>

                            <div className="sm:col-span-4 space-y-1.5">
                                <Label className="text-xs font-semibold">Brand / Merk *</Label>
                                <HybridDropdown
                                    value={editData.brand || ''}
                                    options={brandOptions}
                                    onChange={(val) => setEditData({ ...editData, brand: val })}
                                    placeholder="Ketik atau pilih Brand..."
                                    searchPlaceholder="Cari Brand..."
                                    disabled={isProcessing}
                                />
                            </div>

                            <div className="sm:col-span-4 space-y-1.5">
                                <Label className="text-xs font-semibold">Kategori *</Label>
                                <HybridDropdown
                                    value={editData.tipe || ''}
                                    options={tipeOptions}
                                    onChange={(val) => setEditData({ ...editData, tipe: val })}
                                    placeholder="Ketik atau pilih Kategori..."
                                    searchPlaceholder="Cari Kategori..."
                                    disabled={isProcessing}
                                />
                            </div>
                        </div>

                        {/* Baris 2: Nama Barang (Lebar 9/12) & Satuan Paten Tanpa Ketik Bebas (3/12) */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-9 space-y-1.5">
                                <Label className="text-xs font-semibold">Nama Barang *</Label>
                                <HybridDropdown
                                    value={editData.kategori || ''}
                                    options={kategoriOptions}
                                    onChange={(val) => setEditData({ ...editData, kategori: val })}
                                    placeholder="Ketik atau pilih Nama Barang..."
                                    searchPlaceholder="Cari Nama Barang..."
                                    disabled={isProcessing}
                                />
                            </div>

                            <div className="sm:col-span-3 space-y-1.5">
                                <Label className="text-xs font-semibold">Satuan *</Label>
                                <HybridDropdown
                                    value={editData.satuan || 'Unit'}
                                    options={LIST_SATUAN_PATEN}
                                    onChange={(val) => setEditData({ ...editData, satuan: val })}
                                    placeholder="Pilih Satuan..."
                                    searchPlaceholder="Cari Satuan..."
                                    allowCustom={false}
                                    disabled={isProcessing}
                                    inputClassName="font-semibold"
                                />
                            </div>
                        </div>

                        {/* Baris 3: Status SN / PN */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Keterangan SN / PN</Label>
                                <span className="text-[10px] text-slate-400">
                                    Status:{' '}
                                    <strong className="text-blue-600 dark:text-blue-400">
                                        {getStatusText(editData.is_wajib_sn, editData.is_wajib_pn)}
                                    </strong>
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleToggleSN()}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                        editData.is_wajib_sn
                                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                                    }`}
                                >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>Wajib SN</span>
                                    {editData.is_wajib_sn && <Check className="w-3.5 h-3.5 ml-1" />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleTogglePN()}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                        editData.is_wajib_pn
                                            ? 'bg-cyan-500 text-white border-cyan-600 shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                                    }`}
                                >
                                    <Hash className="w-3.5 h-3.5" />
                                    <span>Wajib PN</span>
                                    {editData.is_wajib_pn && <Check className="w-3.5 h-3.5 ml-1" />}
                                </button>
                            </div>
                        </div>

                        {editData.is_wajib_pn && (
                            <div className="space-y-1.5 p-3 bg-cyan-50/50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800/50 rounded-xl animate-in fade-in duration-200">
                                <Label className="text-xs font-bold text-cyan-700 dark:text-cyan-400">Part Number Original *</Label>
                                <Input 
                                    disabled={isProcessing} 
                                    value={editData.part_number || ''} 
                                    onChange={(e) => setEditData({ ...editData, part_number: e.target.value })} 
                                    placeholder="Ketik Part Number..." 
                                    className="h-8 text-xs bg-white dark:bg-slate-900 font-mono mt-1" 
                                    required
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {addItems.map((item, idx) => (
                            <div key={`add-row-${idx}`} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 relative space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        Baris #{idx + 1}
                                    </span>
                                    {addItems.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveAddRow(idx)}
                                            className="h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 text-xs gap-1 cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Hapus Baris
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {/* Baris 1: Kode PPL, Brand, Kategori */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                        <div className="sm:col-span-4 space-y-1">
                                            <Label className="text-[11px] font-medium">Kode PPL (8 Digit Angka) *</Label>
                                            <Input 
                                                disabled={isProcessing} 
                                                maxLength={11}
                                                value={item.kode_barang} 
                                                onChange={(e) => handleAddItemChange(idx, 'kode_barang', e.target.value)} 
                                                placeholder="Ketik angka..." 
                                                className="h-8 text-xs bg-white dark:bg-slate-900 font-mono font-bold" 
                                                required 
                                            />
                                        </div>

                                        <div className="sm:col-span-4 space-y-1">
                                            <Label className="text-[11px] font-medium">Brand / Merk *</Label>
                                            <HybridDropdown
                                                value={item.brand}
                                                options={brandOptions}
                                                onChange={(val) => handleAddItemChange(idx, 'brand', val)}
                                                placeholder="Ketik atau pilih Brand..."
                                                searchPlaceholder="Cari Brand..."
                                                disabled={isProcessing}
                                            />
                                        </div>

                                        <div className="sm:col-span-4 space-y-1">
                                            <Label className="text-[11px] font-medium">Kategori *</Label>
                                            <HybridDropdown
                                                value={item.tipe}
                                                options={tipeOptions}
                                                onChange={(val) => handleAddItemChange(idx, 'tipe', val)}
                                                placeholder="Ketik atau pilih Kategori..."
                                                searchPlaceholder="Cari Kategori..."
                                                disabled={isProcessing}
                                            />
                                        </div>
                                    </div>

                                    {/* Baris 2: Nama Barang (Lebar 9/12) & Satuan Paten (3/12) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                        <div className="sm:col-span-9 space-y-1">
                                            <Label className="text-[11px] font-medium">Nama Barang *</Label>
                                            <HybridDropdown
                                                value={item.kategori}
                                                options={kategoriOptions}
                                                onChange={(val) => handleAddItemChange(idx, 'kategori', val)}
                                                placeholder="Ketik atau pilih Nama Barang..."
                                                searchPlaceholder="Cari Nama Barang..."
                                                disabled={isProcessing}
                                            />
                                        </div>

                                        <div className="sm:col-span-3 space-y-1">
                                            <Label className="text-[11px] font-medium">Satuan *</Label>
                                            <HybridDropdown
                                                value={item.satuan || 'Unit'}
                                                options={LIST_SATUAN_PATEN}
                                                onChange={(val) => handleAddItemChange(idx, 'satuan', val)}
                                                placeholder="Pilih Satuan..."
                                                searchPlaceholder="Cari Satuan..."
                                                allowCustom={false}
                                                disabled={isProcessing}
                                                inputClassName="font-semibold"
                                            />
                                        </div>
                                    </div>

                                    {/* Baris 3: Tombol SN / PN */}
                                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Keterangan SN / PN</Label>
                                            <span className="text-[10px] text-slate-400">
                                                Status:{' '}
                                                <strong className="text-blue-600 dark:text-blue-400">
                                                    {getStatusText(item.is_wajib_sn, item.is_wajib_pn)}
                                                </strong>
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleSN(idx)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                                    item.is_wajib_sn
                                                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                                                }`}
                                            >
                                                <QrCode className="w-3.5 h-3.5" />
                                                <span>Wajib SN</span>
                                                {item.is_wajib_sn && <Check className="w-3.5 h-3.5 ml-0.5" />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleTogglePN(idx)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                                    item.is_wajib_pn
                                                        ? 'bg-cyan-500 text-white border-cyan-600 shadow-xs'
                                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                                                }`}
                                            >
                                                <Hash className="w-3.5 h-3.5" />
                                                <span>Wajib PN</span>
                                                {item.is_wajib_pn && <Check className="w-3.5 h-3.5 ml-0.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {item.is_wajib_pn && (
                                        <div className="space-y-1 p-2.5 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800 rounded-lg animate-in fade-in duration-200">
                                            <Label className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400">Part Number Original *</Label>
                                            <Input 
                                                disabled={isProcessing} 
                                                value={item.part_number} 
                                                onChange={(e) => handleAddItemChange(idx, 'part_number', e.target.value)} 
                                                placeholder="Ketik Part Number..." 
                                                className="h-8 text-xs bg-white dark:bg-slate-900 font-mono mt-1" 
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="flex items-center gap-2 pt-1">
                            <Button type="button" variant="outline" size="sm" onClick={() => handleAddMoreRows(1)} className="h-8 text-xs gap-1.5 cursor-pointer">
                                <PlusCircle className="w-3.5 h-3.5" /> <span>Tambah 1 Baris</span>
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => handleAddMoreRows(5)} className="h-8 text-xs gap-1.5 cursor-pointer">
                                <PlusCircle className="w-3.5 h-3.5" /> <span>Tambah 5 Baris</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}