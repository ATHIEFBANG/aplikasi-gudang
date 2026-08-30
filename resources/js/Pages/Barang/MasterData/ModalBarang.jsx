import React from 'react';
import Modal from '@/components/Modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, Trash2, ClipboardPaste, AlertCircle, QrCode, Hash, Check } from 'lucide-react';

// IMPORT LANGSUNG DARI COMPONENTS
import HybridDropdown from '@/components/HybridDropdown';

import { 
    useModalBarangControl, 
    MAX_ROWS_LIMIT 
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
        satuanOptions,
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Data Barang' : 'Tambah Master Barang PPL'}
            onSubmit={handleSubmitForm}
            submitLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Semua Data'}
            isProcessing={isProcessing}
            onPaste={handleContainerPaste}
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
            {/* Alert Card Info dengan perbaikan warna mode terang & gelap */}
            {!isEditMode && (
                <Alert className="shrink-0 mb-3 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-300 p-3 rounded-xl flex items-start gap-2.5 shadow-xs">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-xs leading-relaxed">
                        <strong>Smart Paste (Maks {MAX_ROWS_LIMIT} Baris):</strong> Tekan <strong>Ctrl + V</strong> untuk menempelkan data dari Excel.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                {isEditMode ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Kode PPL (8 Digit Angka) *</Label>
                            <Input 
                                disabled={isProcessing} 
                                maxLength={11}
                                value={editData.kode_barang || ''} 
                                onChange={(e) => setEditData({ ...editData, kode_barang: formatKodePPL(e.target.value) })} 
                                placeholder="Contoh: PPL01000701" 
                                className="h-8 text-xs font-mono font-bold"
                                required 
                            />
                            <p className="text-[10px] text-slate-400">Otomatis berawalan PPL + maks 8 digit angka</p>
                        </div>

                        <div className="space-y-1.5">
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

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Tipe / Jenis *</Label>
                            <HybridDropdown
                                value={editData.tipe || ''}
                                options={tipeOptions}
                                onChange={(val) => setEditData({ ...editData, tipe: val })}
                                placeholder="Ketik atau pilih Tipe..."
                                searchPlaceholder="Cari Tipe..."
                                disabled={isProcessing}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Kategori *</Label>
                            <HybridDropdown
                                value={editData.kategori || ''}
                                options={kategoriOptions}
                                onChange={(val) => setEditData({ ...editData, kategori: val })}
                                placeholder="Ketik atau pilih Kategori..."
                                searchPlaceholder="Cari Kategori..."
                                disabled={isProcessing}
                            />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <Label className="text-xs font-semibold">Satuan *</Label>
                            <HybridDropdown
                                value={editData.satuan || ''}
                                options={satuanOptions}
                                onChange={(val) => setEditData({ ...editData, satuan: val })}
                                placeholder="Ketik atau pilih Satuan..."
                                searchPlaceholder="Cari Satuan..."
                                disabled={isProcessing}
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                            <div className="space-y-1.5 sm:col-span-2 p-3 bg-cyan-50/50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800/50 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                                <Label className="text-xs font-bold text-cyan-700 dark:text-cyan-400">Part Number Original *</Label>
                                <Input 
                                    disabled={isProcessing} 
                                    value={editData.part_number || ''} 
                                    onChange={(e) => setEditData({ ...editData, part_number: e.target.value })} 
                                    placeholder="Contoh: 3654312" 
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
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-medium">Kode PPL (8 Digit Angka) *</Label>
                                        <Input 
                                            disabled={isProcessing} 
                                            maxLength={11}
                                            value={item.kode_barang} 
                                            onChange={(e) => handleAddItemChange(idx, 'kode_barang', e.target.value)} 
                                            placeholder="Ketik angka, misal: 01000701" 
                                            className="h-8 text-xs bg-white dark:bg-slate-900 font-mono font-bold" 
                                            required 
                                        />
                                    </div>

                                    <div className="space-y-1">
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

                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-medium">Tipe / Jenis *</Label>
                                        <HybridDropdown
                                            value={item.tipe}
                                            options={tipeOptions}
                                            onChange={(val) => handleAddItemChange(idx, 'tipe', val)}
                                            placeholder="Ketik atau pilih Tipe..."
                                            searchPlaceholder="Cari Tipe..."
                                            disabled={isProcessing}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-medium">Kategori *</Label>
                                        <HybridDropdown
                                            value={item.kategori}
                                            options={kategoriOptions}
                                            onChange={(val) => handleAddItemChange(idx, 'kategori', val)}
                                            placeholder="Ketik atau pilih Kategori..."
                                            searchPlaceholder="Cari Kategori..."
                                            disabled={isProcessing}
                                        />
                                    </div>

                                    <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                                        <Label className="text-[11px] font-medium">Satuan *</Label>
                                        <HybridDropdown
                                            value={item.satuan}
                                            options={satuanOptions}
                                            onChange={(val) => handleAddItemChange(idx, 'satuan', val)}
                                            placeholder="Ketik atau pilih Satuan..."
                                            searchPlaceholder="Cari Satuan..."
                                            disabled={isProcessing}
                                        />
                                    </div>

                                    <div className="space-y-2 lg:col-span-3 pt-2 border-t border-slate-200 dark:border-slate-700">
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
                                        <div className="space-y-1 lg:col-span-3 p-2.5 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800 rounded-lg animate-in fade-in duration-200">
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