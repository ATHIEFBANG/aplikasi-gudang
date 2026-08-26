import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, Trash2, ClipboardPaste, AlertCircle, QrCode, Hash, Check } from 'lucide-react';
import { router } from '@inertiajs/react';

const MAX_ROWS_LIMIT = 500;

export default function ModalBarang({
    isOpen,
    onClose,
    isEditMode = false,
    selectedItem = null,
    existingOptions = {}
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [editData, setEditData] = useState({});
    const [addItems, setAddItems] = useState([]);

    // Helper Otomatisasi Format Kode PPL (PPL + Maks 8 Digit Angka)
    const formatKodePPL = (input = '') => {
        if (!input) return '';
        const upper = input.toUpperCase();
        // Ambil murni angka saja dan batasi maksimal 8 digit
        const digits = upper.replace(/[^0-9]/g, '').slice(0, 8);
        
        if (digits.length === 0) {
            return upper.startsWith('PPL') ? 'PPL' : '';
        }
        return `PPL${digits}`;
    };

    const createEmptyRow = useCallback(() => ({
        kode_barang: '',
        brand: '',
        tipe: '',
        kategori: '',
        part_number: '',
        nama_barang: '',
        satuan: '',
        is_wajib_sn: false,
        is_wajib_pn: false,
        deskripsi: ''
    }), []);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && selectedItem) {
                setEditData({
                    id: selectedItem.id,
                    kode_barang: formatKodePPL(selectedItem.kode_barang || ''),
                    brand: selectedItem.brand || '',
                    tipe: selectedItem.tipe || '',
                    kategori: selectedItem.kategori || '',
                    part_number: selectedItem.part_number || selectedItem.nama_barang || '',
                    nama_barang: selectedItem.nama_barang || selectedItem.part_number || '',
                    satuan: selectedItem.satuan || selectedItem.deskripsi || '',
                    min_stock: selectedItem.min_stock ?? 0,
                    is_wajib_sn: Boolean(selectedItem.is_wajib_sn),
                    is_wajib_pn: Boolean(selectedItem.is_wajib_pn),
                });
            } else {
                setAddItems([createEmptyRow()]);
            }
        } else {
            setEditData({});
            setAddItems([]);
            setIsProcessing(false);
        }
    }, [isOpen, isEditMode, selectedItem, createEmptyRow]);

    const parseAndApplyExcelData = useCallback((pastedText) => {
        if (!pastedText) return false;
        let rawRows = pastedText.trim().split(/\r\n|\n|\r/).filter(row => row.trim().length > 0);
        if (rawRows.length === 1 && !rawRows[0].includes('\t')) return false;

        if (rawRows.length > MAX_ROWS_LIMIT) {
            alert(`Perhatian: Data paste dibatasi maksimal ${MAX_ROWS_LIMIT} baris.`);
            rawRows = rawRows.slice(0, MAX_ROWS_LIMIT);
        }

        const parsedItems = rawRows.map(rowStr => {
            const cells = rowStr.split('\t').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
            const rowObj = createEmptyRow();
            
            rowObj.kode_barang = formatKodePPL(cells[0] ?? '');
            rowObj.brand       = cells[1] ?? '';
            rowObj.tipe        = cells[2] ?? '';
            rowObj.kategori    = cells[3] ?? '';
            rowObj.part_number = cells[4] ?? '';
            rowObj.nama_barang = cells[4] || cells[0] || 'Barang';
            rowObj.satuan      = cells[5] ?? '';
            rowObj.deskripsi   = cells[5] ?? '';
            
            if (cells[6]) {
                const c6 = String(cells[6]).toLowerCase();
                rowObj.is_wajib_sn = c6.includes('ya') || c6 === '1' || c6.includes('sn');
            }
            if (cells[7]) {
                const c7 = String(cells[7]).toLowerCase();
                rowObj.is_wajib_pn = c7.includes('ya') || c7 === '1' || c7.includes('pn');
            }

            return rowObj;
        });

        if (parsedItems.length > 0) {
            setAddItems(parsedItems);
            return true;
        }
        return false;
    }, [createEmptyRow]);

    const handleContainerPaste = useCallback((e) => {
        if (isEditMode) return;
        const pastedText = e.clipboardData.getData('text');
        if (parseAndApplyExcelData(pastedText)) {
            e.preventDefault();
        }
    }, [isEditMode, parseAndApplyExcelData]);

    const handlePasteFromClipboardButton = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text && !parseAndApplyExcelData(text)) {
                alert("Format teks clipboard bukan urutan tabel Excel yang valid.");
            }
        } catch (err) {
            alert("Gagal membaca clipboard. Izinkan akses clipboard browser atau gunakan Ctrl+V.");
        }
    }, [parseAndApplyExcelData]);

    const handleAddMoreRows = useCallback((count = 1) => {
        setAddItems(prev => {
            if (prev.length + count > MAX_ROWS_LIMIT) {
                alert(`Maksimal penambahan data sekaligus adalah ${MAX_ROWS_LIMIT} baris.`);
                return prev;
            }
            return [...prev, ...Array.from({ length: count }, () => createEmptyRow())];
        });
    }, [createEmptyRow]);

    const handleRemoveAddRow = useCallback((index) => {
        if (addItems.length <= 1) return;
        setAddItems(prev => prev.filter((_, i) => i !== index));
    }, [addItems.length]);

    const handleAddItemChange = useCallback((index, field, value) => {
        setAddItems(prev => {
            const updated = [...prev];
            const finalVal = field === 'kode_barang' ? formatKodePPL(value) : value;
            updated[index] = { ...updated[index], [field]: finalVal };
            
            if (field === 'part_number' && !updated[index].nama_barang) {
                updated[index].nama_barang = value;
            }
            if (field === 'satuan') {
                updated[index].deskripsi = value;
            }
            return updated;
        });
    }, []);

    const handleToggleSN = (index = null) => {
        if (isEditMode) {
            setEditData(prev => ({ ...prev, is_wajib_sn: !prev.is_wajib_sn }));
        } else if (index !== null) {
            setAddItems(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], is_wajib_sn: !updated[index].is_wajib_sn };
                return updated;
            });
        }
    };

    const handleTogglePN = (index = null) => {
        if (isEditMode) {
            setEditData(prev => {
                const nextPn = !prev.is_wajib_pn;
                return {
                    ...prev,
                    is_wajib_pn: nextPn,
                    part_number: nextPn ? prev.part_number : ''
                };
            });
        } else if (index !== null) {
            setAddItems(prev => {
                const updated = [...prev];
                const nextPn = !updated[index].is_wajib_pn;
                updated[index] = {
                    ...updated[index],
                    is_wajib_pn: nextPn,
                    part_number: nextPn ? updated[index].part_number : ''
                };
                return updated;
            });
        }
    };

    const getStatusText = (sn, pn) => {
        if (sn && pn) return 'Wajib SN & PN';
        if (sn) return 'Wajib SN';
        if (pn) return 'Wajib PN';
        return 'Tidak Wajib (Standar)';
    };

    const handleSubmitForm = (e) => {
        e?.preventDefault();

        if (isEditMode) {
            if (!editData.kode_barang || editData.kode_barang.length !== 11) {
                alert('Kode PPL harus berformat PPL diikuti 8 digit angka (contoh: PPL01000701).');
                return;
            }
            if (!editData.brand?.trim() || !editData.tipe?.trim() || !editData.kategori?.trim() || !editData.satuan?.trim()) {
                alert('Harap lengkapi formulir utama (Brand, Tipe, Kategori, Satuan).');
                return;
            }
            if (editData.is_wajib_pn && !editData.part_number?.trim()) {
                alert('Part Number wajib diisi jika Anda mengaktifkan Wajib PN.');
                return;
            }

            setIsProcessing(true);
            
            const payload = {
                ...editData,
                is_wajib_sn: Boolean(editData.is_wajib_sn),
                is_wajib_pn: Boolean(editData.is_wajib_pn),
                part_number: editData.is_wajib_pn ? editData.part_number : null,
                nama_barang: editData.is_wajib_pn 
                    ? editData.part_number 
                    : `${editData.brand} ${editData.tipe}`.trim(),
                deskripsi: editData.satuan || ''
            };

            router.put(`/barang/${editData.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsProcessing(false);
                    onClose();
                },
                onError: () => setIsProcessing(false),
                onFinish: () => setIsProcessing(false),
            });
        } else {
            for (let i = 0; i < addItems.length; i++) {
                const item = addItems[i];
                if (!item.kode_barang || item.kode_barang.length !== 11) {
                    alert(`Baris #${i + 1}: Kode PPL harus berformat PPL diikuti 8 digit angka (contoh: PPL01000701).`);
                    return;
                }
                if (!item.brand?.trim() || !item.tipe?.trim() || !item.kategori?.trim() || !item.satuan?.trim()) {
                    alert(`Baris #${i + 1}: Harap lengkapi semua kolom (Brand, Tipe, Kategori, Satuan).`);
                    return;
                }
                if (item.is_wajib_pn && !item.part_number?.trim()) {
                    alert(`Baris #${i + 1}: Part Number wajib diisi jika Wajib PN aktif.`);
                    return;
                }
            }

            setIsProcessing(true);
            addItems.forEach((item, idx) => {
                const payload = {
                    ...item,
                    is_wajib_sn: Boolean(item.is_wajib_sn),
                    is_wajib_pn: Boolean(item.is_wajib_pn),
                    part_number: item.is_wajib_pn ? item.part_number : null,
                    nama_barang: item.is_wajib_pn 
                        ? item.part_number 
                        : `${item.brand} ${item.tipe}`.trim(),
                    deskripsi: item.satuan || ''
                };
                
                router.post('/barang', payload, {
                    preserveScroll: true,
                    onSuccess: () => {
                        if (idx === addItems.length - 1) {
                            setIsProcessing(false);
                            onClose();
                        }
                    },
                    onError: () => setIsProcessing(false),
                    onFinish: () => setIsProcessing(false),
                });
            });
        }
    };

    return (
        <>
            <datalist id="list-brand">
                {existingOptions?.brandList?.map((opt, i) => <option key={i} value={opt} />)}
            </datalist>
            <datalist id="list-tipe">
                {existingOptions?.tipeList?.map((opt, i) => <option key={i} value={opt} />)}
            </datalist>
            <datalist id="list-kategori">
                {existingOptions?.kategoriList?.map((opt, i) => <option key={i} value={opt} />)}
            </datalist>
            <datalist id="list-partnumber">
                {existingOptions?.partNumberList?.map((opt, i) => <option key={i} value={opt} />)}
            </datalist>
            <datalist id="list-satuan">
                {existingOptions?.satuanList?.map((opt, i) => <option key={i} value={opt} />)}
            </datalist>

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
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                                }`}
                            >
                                {addItems.length} / {MAX_ROWS_LIMIT} Baris
                            </Badge>
                        </div>
                    )
                }
            >
                {!isEditMode && (
                    <Alert className="shrink-0 mb-3 bg-blue-950/40 border-blue-800/60 text-blue-300 p-2.5 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <AlertDescription className="text-[11px] leading-relaxed">
                            <strong>Smart Paste (Maks {MAX_ROWS_LIMIT} Baris):</strong> Tekan <strong>Ctrl + V</strong> untuk menempelkan data dari Excel.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    {isEditMode ? (
                        /* MODE EDIT SINGLE */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Kode PPL (8 Digit Angka) *</Label>
                                <Input 
                                    disabled={isProcessing} 
                                    maxLength={11}
                                    value={editData.kode_barang || ''} 
                                    onChange={(e) => setEditData({ ...editData, kode_barang: formatKodePPL(e.target.value) })} 
                                    placeholder="Contoh: PPL01000701" 
                                    className="font-mono font-bold"
                                    required 
                                />
                                <p className="text-[10px] text-slate-400">Otomatis berawalan PPL + maks 8 digit angka</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Brand / Merk *</Label>
                                <Input 
                                    list="list-brand"
                                    disabled={isProcessing} 
                                    value={editData.brand || ''} 
                                    onChange={(e) => setEditData({ ...editData, brand: e.target.value })} 
                                    placeholder="Pilih atau ketik Brand" 
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Tipe / Jenis *</Label>
                                <Input 
                                    list="list-tipe"
                                    disabled={isProcessing} 
                                    value={editData.tipe || ''} 
                                    onChange={(e) => setEditData({ ...editData, tipe: e.target.value })} 
                                    placeholder="Pilih atau ketik Tipe" 
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Kategori *</Label>
                                <Input 
                                    list="list-kategori"
                                    disabled={isProcessing} 
                                    value={editData.kategori || ''} 
                                    onChange={(e) => setEditData({ ...editData, kategori: e.target.value })} 
                                    placeholder="Pilih atau ketik Kategori" 
                                    required
                                />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs font-semibold">Satuan *</Label>
                                <Input 
                                    list="list-satuan"
                                    disabled={isProcessing} 
                                    value={editData.satuan || ''} 
                                    onChange={(e) => setEditData({ ...editData, satuan: e.target.value })} 
                                    placeholder="Ketik Satuan (Pcs, Box, Roll, Meter, Batang, Unit, dll)" 
                                    required
                                />
                            </div>

                            {/* TOGGLE INDEPENDEN SN & PN */}
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
                                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
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
                                                ? 'bg-cyan-500 text-white border-cyan-600 shadow-sm'
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
                                        list="list-partnumber"
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
                        /* MODE TAMBAH MULTI-ROW */
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
                                            <Input list="list-brand" disabled={isProcessing} value={item.brand} onChange={(e) => handleAddItemChange(idx, 'brand', e.target.value)} placeholder="Pilih / ketik Brand" className="h-8 text-xs bg-white dark:bg-slate-900" required />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-medium">Tipe / Jenis *</Label>
                                            <Input list="list-tipe" disabled={isProcessing} value={item.tipe} onChange={(e) => handleAddItemChange(idx, 'tipe', e.target.value)} placeholder="Pilih / ketik Tipe" className="h-8 text-xs bg-white dark:bg-slate-900" required />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-medium">Kategori *</Label>
                                            <Input list="list-kategori" disabled={isProcessing} value={item.kategori} onChange={(e) => handleAddItemChange(idx, 'kategori', e.target.value)} placeholder="Pilih / ketik Kategori" className="h-8 text-xs bg-white dark:bg-slate-900" required />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                                            <Label className="text-[11px] font-medium">Satuan *</Label>
                                            <Input list="list-satuan" disabled={isProcessing} value={item.satuan} onChange={(e) => handleAddItemChange(idx, 'satuan', e.target.value)} placeholder="Ketik Satuan (Pcs, Box, Roll, Meter, Batang, dll)" className="h-8 text-xs bg-white dark:bg-slate-900" required />
                                        </div>

                                        {/* TOGGLE INDEPENDEN SN & PN MULTI-ROW */}
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
                                                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                                                    }`}
                                                >
                                                    <QrCode className="w-3.5 h-3.5" />
                                                    <span>Wajib SN</span>
                                                    {item.is_wajib_sn && <Check className="w-3 h-3 ml-0.5" />}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePN(idx)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                                        item.is_wajib_pn
                                                            ? 'bg-cyan-500 text-white border-cyan-600 shadow-sm'
                                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                                                    }`}
                                                >
                                                    <Hash className="w-3.5 h-3.5" />
                                                    <span>Wajib PN</span>
                                                    {item.is_wajib_pn && <Check className="w-3 h-3 ml-0.5" />}
                                                </button>
                                            </div>
                                        </div>

                                        {item.is_wajib_pn && (
                                            <div className="space-y-1 lg:col-span-3 p-2.5 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800 rounded-lg animate-in fade-in duration-200">
                                                <Label className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400">Part Number Original *</Label>
                                                <Input 
                                                    list="list-partnumber"
                                                    disabled={isProcessing} 
                                                    value={item.part_number} 
                                                    onChange={(e) => handleAddItemChange(idx, 'part_number', e.target.value)} 
                                                    placeholder="Pilih / ketik Part Number" 
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
        </>
    );
}