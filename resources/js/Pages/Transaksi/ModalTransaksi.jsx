import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '@/components/Modal';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    AlertCircle, 
    Check, 
    ShoppingBag, 
    Layers, 
    RotateCcw, 
    ArrowRightLeft, 
    PackageCheck, 
    QrCode,
    PlusCircle,
    Trash2
} from 'lucide-react';
import { router } from '@inertiajs/react';
import HybridDropdown from '@/components/HybridDropdown';

const MAX_ROWS_LIMIT = 50;

export default function ModalTransaksi({
    isOpen,
    onClose,
    isEditMode = false,
    selectedItem = null,
    gudangs = [],
    suppliers = [],
    barangs = []
}) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Helper membuat 1 baris transaksi utuh dan independen
    const createEmptyRow = useCallback(() => {
        const defaultBarang = barangs[0] || null;
        const isSn = Boolean(defaultBarang?.is_wajib_sn === true || defaultBarang?.is_wajib_sn === 1 || defaultBarang?.is_wajib_sn === '1');
        return {
            sub_jenis: 'PEMBELIAN',
            tanggal: new Date().toISOString().slice(0, 10),
            nomor_imc: '',
            nomor_omc: '',
            pihak_asal: '',
            gudang_asal_id: gudangs[0]?.id ? String(gudangs[0].id) : '',
            gudang_tujuan_id: gudangs[0]?.id ? String(gudangs[0].id) : '',
            barang_id: defaultBarang ? String(defaultBarang.id) : '',
            qty: 1,
            kondisi: 'Baru',
            serials: isSn ? [''] : []
        };
    }, [barangs, gudangs]);

    const [rows, setRows] = useState([createEmptyRow()]);

    // Opsi Dropdown Master
    const barangPplOptions = useMemo(() => {
        return barangs.map(b => ({ value: b.kode_barang, label: b.kode_barang, id: b.id }));
    }, [barangs]);

    const barangNamaOptions = useMemo(() => {
        return barangs.map(b => {
            const kombinasiNama = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang || b.kode_barang;
            return {
                value: kombinasiNama,
                label: kombinasiNama,
                id: b.id
            };
        });
    }, [barangs]);

    const gudangOptions = useMemo(() => {
        return gudangs.map(g => ({ value: g.nama_gudang, label: g.nama_gudang, id: g.id }));
    }, [gudangs]);

    const supplierOptions = useMemo(() => {
        return (suppliers || []).map(s => s.nama_supplier || s);
    }, [suppliers]);

    // Inisialisasi saat Modal dibuka
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && selectedItem) {
                const detail = selectedItem.details?.[0] || {};
                const targetBarang = barangs.find(b => String(b.id) === String(detail.barang_id));
                const isSn = Boolean(targetBarang?.is_wajib_sn);
                const existingSns = detail.serials ? detail.serials.map(s => s.serial_number || s) : [];

                setRows([{
                    id: selectedItem.id,
                    sub_jenis: selectedItem.sub_jenis || 'PEMBELIAN',
                    tanggal: selectedItem.tanggal ? String(selectedItem.tanggal).split('T')[0] : new Date().toISOString().slice(0, 10),
                    nomor_imc: selectedItem.nomor_imc || '',
                    nomor_omc: selectedItem.nomor_omc || '',
                    pihak_asal: selectedItem.pihak_asal || '',
                    gudang_asal_id: selectedItem.gudang_asal_id ? String(selectedItem.gudang_asal_id) : '',
                    gudang_tujuan_id: selectedItem.gudang_tujuan_id ? String(selectedItem.gudang_tujuan_id) : '',
                    barang_id: detail.barang_id ? String(detail.barang_id) : (barangs[0]?.id ? String(barangs[0].id) : ''),
                    qty: detail.qty || 1,
                    kondisi: selectedItem.kondisi || (detail.kondisi === 'RUSAK' ? 'Rusak' : 'Baru'),
                    serials: isSn ? (existingSns.length > 0 ? existingSns : ['']) : []
                }]);
            } else {
                setRows([createEmptyRow()]);
            }
        }
    }, [isOpen, isEditMode, selectedItem, barangs, gudangs, createEmptyRow]);

    // Handler Tambah & Hapus Baris
    const handleAddMoreRows = (count = 1) => {
        setRows(prev => {
            if (prev.length + count > MAX_ROWS_LIMIT) {
                alert(`Maksimal penambahan transaksi adalah ${MAX_ROWS_LIMIT} baris.`);
                const allowed = MAX_ROWS_LIMIT - prev.length;
                if (allowed <= 0) return prev;
                return [...prev, ...Array.from({ length: allowed }, () => createEmptyRow())];
            }
            return [...prev, ...Array.from({ length: count }, () => createEmptyRow())];
        });
    };

    const handleRemoveRow = (index) => {
        if (rows.length <= 1) return;
        setRows(prev => prev.filter((_, i) => i !== index));
    };

    const handleRowFieldChange = (rowIdx, field, value) => {
        setRows(prev => {
            const updated = [...prev];
            updated[rowIdx] = { ...updated[rowIdx], [field]: value };
            return updated;
        });
    };

    const handleBarangChange = (rowIdx, newBarangId) => {
        const targetBarang = barangs.find(b => String(b.id) === String(newBarangId));
        const isSn = Boolean(targetBarang?.is_wajib_sn === true || targetBarang?.is_wajib_sn === 1 || targetBarang?.is_wajib_sn === '1');

        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            const currentQty = currentRow.qty || 1;
            updated[rowIdx] = {
                ...currentRow,
                barang_id: String(newBarangId),
                serials: isSn ? Array(currentQty).fill('') : []
            };
            return updated;
        });
    };

    const handleQtyChange = (rowIdx, val) => {
        let count = parseInt(val, 10);
        if (isNaN(count) || count < 1) count = 1;
        if (count > 50) count = 50;

        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            const targetBarang = barangs.find(b => String(b.id) === String(currentRow.barang_id));
            const isSn = Boolean(targetBarang?.is_wajib_sn === true || targetBarang?.is_wajib_sn === 1 || targetBarang?.is_wajib_sn === '1');

            let newSerials = currentRow.serials || [];
            if (isSn) {
                newSerials = [...newSerials];
                while (newSerials.length < count) newSerials.push('');
                newSerials = newSerials.slice(0, count);
            }

            updated[rowIdx] = {
                ...currentRow,
                qty: count,
                serials: newSerials
            };
            return updated;
        });
    };

    const handleSerialChange = (rowIdx, snIdx, val) => {
        setRows(prev => {
            const updated = [...prev];
            const currentSerials = [...(updated[rowIdx].serials || [])];
            currentSerials[snIdx] = val;
            updated[rowIdx] = { ...updated[rowIdx], serials: currentSerials };
            return updated;
        });
    };

    // Ambil SN aktif di Gudang Asal per baris untuk Transfer Gudang
    const getAvailableSerialsForTransfer = (barangId, gudangAsalId) => {
        if (!barangId || !gudangAsalId) return [];
        const targetBarang = barangs.find(b => String(b.id) === String(barangId));
        if (!targetBarang || !targetBarang.serials) return [];

        return targetBarang.serials.filter(
            s => String(s.gudang_id) === String(gudangAsalId) && s.status === 'IN_WAREHOUSE'
        );
    };

    // Submit Handler
    const handleSubmitForm = (e) => {
        e?.preventDefault();

        // Validasi Seluruh Baris
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const rowNum = i + 1;

            if (!r.barang_id) {
                alert(`Baris #${rowNum}: Harap pilih barang terlebih dahulu.`);
                return;
            }
            if (!r.nomor_imc.trim()) {
                alert(`Baris #${rowNum}: Nomor IMC wajib diisi.`);
                return;
            }
            if (!r.gudang_tujuan_id) {
                alert(`Baris #${rowNum}: Gudang Tujuan penerimaan wajib dipilih.`);
                return;
            }

            if (r.sub_jenis === 'TRANSFER_GUDANG') {
                if (!r.gudang_asal_id) {
                    alert(`Baris #${rowNum}: Gudang Asal pengirim wajib dipilih.`);
                    return;
                }
                if (String(r.gudang_asal_id) === String(r.gudang_tujuan_id)) {
                    alert(`Baris #${rowNum}: Gudang Asal dan Gudang Tujuan tidak boleh sama.`);
                    return;
                }
                if (!r.nomor_omc.trim()) {
                    alert(`Baris #${rowNum}: Nomor OMC wajib diisi untuk Transfer Gudang.`);
                    return;
                }
            } else if (!r.pihak_asal.trim()) {
                alert(`Baris #${rowNum}: Pihak Asal / Supplier wajib diisi.`);
                return;
            }

            const targetBarang = barangs.find(b => String(b.id) === String(r.barang_id));
            const isSn = Boolean(targetBarang?.is_wajib_sn === true || targetBarang?.is_wajib_sn === 1 || targetBarang?.is_wajib_sn === '1');

            if (isSn && !isEditMode) {
                const emptySnIndex = r.serials.findIndex(sn => !sn || !sn.trim());
                if (emptySnIndex !== -1) {
                    alert(`Baris #${rowNum}: Serial Number unit ke-${emptySnIndex + 1} (${targetBarang.nama_barang || targetBarang.kode_barang}) wajib diisi.`);
                    return;
                }

                const uniqueSnCount = new Set(r.serials.map(s => s.trim())).size;
                if (uniqueSnCount !== r.serials.length) {
                    alert(`Baris #${rowNum}: Terdapat Serial Number duplikat. Setiap unit wajib memiliki SN yang unik.`);
                    return;
                }
            }
        }

        setIsProcessing(true);

        const payload = isEditMode
            ? {
                tanggal: rows[0].tanggal,
                kondisi: rows[0].kondisi,
                nomor_imc: rows[0].nomor_imc.trim(),
                nomor_omc: rows[0].sub_jenis === 'TRANSFER_GUDANG' ? rows[0].nomor_omc.trim() : null,
                pihak_asal: rows[0].sub_jenis !== 'TRANSFER_GUDANG' ? rows[0].pihak_asal.trim() : null,
                gudang_tujuan_id: parseInt(rows[0].gudang_tujuan_id, 10),
            }
            : {
                items: rows.map(r => ({
                    sub_jenis: r.sub_jenis,
                    tanggal: r.tanggal,
                    kondisi: r.kondisi === 'Rusak' ? 'RUSAK' : 'BAIK',
                    nomor_imc: r.nomor_imc.trim(),
                    nomor_omc: r.sub_jenis === 'TRANSFER_GUDANG' ? r.nomor_omc.trim() : null,
                    pihak_asal: r.sub_jenis !== 'TRANSFER_GUDANG' ? r.pihak_asal.trim() : null,
                    gudang_asal_id: r.sub_jenis === 'TRANSFER_GUDANG' ? parseInt(r.gudang_asal_id, 10) : null,
                    gudang_tujuan_id: parseInt(r.gudang_tujuan_id, 10),
                    barang_id: parseInt(r.barang_id, 10),
                    qty: parseInt(r.qty, 10),
                    serials: r.serials || []
                }))
            };

        const targetUrl = isEditMode ? `/transaksi/${selectedItem.id}` : '/transaksi';
        const method = isEditMode ? 'put' : 'post';

        router[method](targetUrl, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsProcessing(false);
                onClose();
            },
            onError: () => setIsProcessing(false),
            onFinish: () => setIsProcessing(false)
        });
    };

    const categories = [
        { id: 'PEMBELIAN', label: 'Pembelian', icon: ShoppingBag },
        { id: 'PEMINJAMAN', label: 'Peminjaman', icon: Layers },
        { id: 'PENGEMBALIAN', label: 'Pengembalian', icon: RotateCcw },
        { id: 'TRANSFER_GUDANG', label: 'Transfer Gudang', icon: ArrowRightLeft },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Data Transaksi' : 'Tambah Data Transaksi'}
            onSubmit={handleSubmitForm}
            submitLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Semua Data'}
            isProcessing={isProcessing}
            headerExtra={
                !isEditMode && (
                    <Badge 
                        variant="secondary" 
                        className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold px-2.5 py-0.5"
                    >
                        {rows.length} / {MAX_ROWS_LIMIT} Baris
                    </Badge>
                )
            }
        >
            {!isEditMode && (
                <Alert className="shrink-0 mb-3 bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-[11px] leading-relaxed">
                        <strong>Input Multi-Baris Transaksi:</strong> Setiap baris memiliki kategori penerimaan, dokumen IMC/OMC, gudang asal/tujuan, serta rincian barang sendiri. Untuk <strong>Transfer Gudang</strong>, Serial Number otomatis berupa pilihan unit aktif di gudang asal.
                    </AlertDescription>
                </Alert>
            )}

            {/* DAFTAR BARIS TRANSAKSI DINAMIS */}
            <div className="space-y-4">
                {rows.map((row, rowIdx) => {
                    const targetBarang = barangs.find(b => String(b.id) === String(row.barang_id));
                    const isWajibSn = Boolean(targetBarang?.is_wajib_sn === true || targetBarang?.is_wajib_sn === 1 || targetBarang?.is_wajib_sn === '1');
                    const isWajibPn = Boolean(targetBarang?.is_wajib_pn === true || targetBarang?.is_wajib_pn === 1 || targetBarang?.is_wajib_pn === '1');

                    const statusText = isWajibSn && isWajibPn 
                        ? 'Wajib SN & PN' 
                        : isWajibSn 
                        ? 'Wajib SN' 
                        : isWajibPn 
                        ? 'Wajib PN' 
                        : 'Standar';

                    const availableSnsForTransfer = row.sub_jenis === 'TRANSFER_GUDANG' 
                        ? getAvailableSerialsForTransfer(row.barang_id, row.gudang_asal_id)
                        : [];

                    const kondisiOptions = row.sub_jenis === 'TRANSFER_GUDANG' || row.sub_jenis === 'PENGEMBALIAN'
                        ? ['Baru', 'Bekas', 'Rusak']
                        : ['Baru', 'Bekas'];

                    const pihakAsalLabel = row.sub_jenis === 'PEMBELIAN' 
                        ? 'Supplier / Vendor Asal *' 
                        : row.sub_jenis === 'PEMINJAMAN' 
                        ? 'Peminjam / Vendor Terkait *' 
                        : row.sub_jenis === 'PENGEMBALIAN' 
                        ? 'Dikembalikan Oleh *' 
                        : 'Pihak Terkait *';

                    return (
                        <div 
                            key={`row-${rowIdx}`}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 relative group space-y-3 transition-all"
                        >
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

                                {rows.length > 1 && !isEditMode && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveRow(rowIdx)}
                                        className="h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs gap-1 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Hapus Baris
                                    </Button>
                                )}
                            </div>

                            {/* 1. Pilih Kategori / Sub-Jenis per Baris */}
                            {!isEditMode && (
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Jenis Penerimaan *</Label>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {categories.map((cat) => {
                                            const Icon = cat.icon;
                                            const isSelected = row.sub_jenis === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => handleRowFieldChange(rowIdx, 'sub_jenis', cat.id)}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
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

                            {/* 2. Grid Input Kolom Baris */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {/* Tanggal Transaksi */}
                                <div className="space-y-1">
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
                                        onChange={(e) => handleRowFieldChange(rowIdx, 'tanggal', e.target.value)}
                                        className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 cursor-pointer"
                                        required
                                    />
                                </div>

                                {/* Kode PPL */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kode PPL *</Label>
                                    <HybridDropdown
                                        value={targetBarang?.kode_barang || ''}
                                        options={barangPplOptions}
                                        onChange={(val) => {
                                            const found = barangs.find(b => b.kode_barang.toLowerCase() === val.toLowerCase());
                                            if (found) handleBarangChange(rowIdx, found.id);
                                        }}
                                        placeholder="Pilih PPL..."
                                        searchPlaceholder="Cari Kode PPL..."
                                        disabled={isProcessing || isEditMode}
                                        inputClassName="h-8 text-xs font-mono font-bold"
                                    />
                                </div>

                                {/* Nama Barang */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nama Barang *</Label>
                                    <HybridDropdown
                                        value={targetBarang ? ([targetBarang.brand, targetBarang.tipe, targetBarang.kategori].filter(Boolean).join(' ') || targetBarang.nama_barang) : ''}
                                        options={barangNamaOptions}
                                        onChange={(val) => {
                                            const found = barangs.find(b => {
                                                const fullName = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang;
                                                return fullName.toLowerCase() === val.toLowerCase() || b.kode_barang.toLowerCase() === val.toLowerCase();
                                            });
                                            if (found) handleBarangChange(rowIdx, found.id);
                                        }}
                                        placeholder="Pilih Barang..."
                                        searchPlaceholder="Cari Nama Barang..."
                                        disabled={isProcessing || isEditMode}
                                        inputClassName="h-8 text-xs"
                                    />
                                </div>

                                {/* Part Number */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Part Number</Label>
                                    <Input
                                        disabled
                                        placeholder={isWajibPn ? "Part Number" : "-"}
                                        value={isWajibPn ? (targetBarang?.part_number || '') : '-'}
                                        className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-mono text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                                    />
                                </div>

                                {/* Satuan / Unit */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Satuan / Unit</Label>
                                    <Input
                                        disabled
                                        value={targetBarang?.deskripsi || targetBarang?.satuan || 'Unit'}
                                        className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                                    />
                                </div>

                                {/* Quantity */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Quantity *</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={50}
                                        disabled={isProcessing || isEditMode}
                                        value={row.qty}
                                        onChange={(e) => handleQtyChange(rowIdx, e.target.value)}
                                        className="h-8 text-xs bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                        required
                                    />
                                </div>

                                {/* Kondisi Fisik */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kondisi Fisik *</Label>
                                    <HybridDropdown
                                        value={row.kondisi}
                                        options={kondisiOptions}
                                        onChange={(val) => handleRowFieldChange(rowIdx, 'kondisi', val)}
                                        placeholder="Pilih Kondisi..."
                                        searchPlaceholder="Cari Kondisi..."
                                        disabled={isProcessing}
                                        inputClassName="h-8 text-xs"
                                    />
                                </div>

                                {/* Nomor IMC */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nomor IMC *</Label>
                                    <Input
                                        placeholder="Contoh: IMC-00123"
                                        disabled={isProcessing}
                                        value={row.nomor_imc}
                                        onChange={(e) => handleRowFieldChange(rowIdx, 'nomor_imc', e.target.value)}
                                        className="h-8 text-xs bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                        required
                                    />
                                </div>

                                {/* Gudang Tujuan (Penerima) */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                        Gudang Tujuan (Penerima) *
                                    </Label>
                                    <HybridDropdown
                                        value={gudangs.find(g => String(g.id) === String(row.gudang_tujuan_id))?.nama_gudang || ''}
                                        options={gudangOptions}
                                        onChange={(val) => {
                                            const found = gudangs.find(g => g.nama_gudang.toLowerCase() === val.toLowerCase());
                                            handleRowFieldChange(rowIdx, 'gudang_tujuan_id', found ? String(found.id) : '');
                                        }}
                                        placeholder="Pilih Gudang Penerima..."
                                        searchPlaceholder="Cari Gudang Penerima..."
                                        disabled={isProcessing}
                                        inputClassName="h-8 text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold"
                                    />
                                </div>

                                {/* Dynamic Fields: Transfer Gudang vs Pembelian/Peminjaman */}
                                {row.sub_jenis === 'TRANSFER_GUDANG' ? (
                                    <>
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Gudang Asal (Pengirim) *</Label>
                                            <HybridDropdown
                                                value={gudangs.find(g => String(g.id) === String(row.gudang_asal_id))?.nama_gudang || ''}
                                                options={gudangOptions}
                                                onChange={(val) => {
                                                    const found = gudangs.find(g => g.nama_gudang.toLowerCase() === val.toLowerCase());
                                                    handleRowFieldChange(rowIdx, 'gudang_asal_id', found ? String(found.id) : '');
                                                }}
                                                placeholder="Pilih Gudang Asal..."
                                                searchPlaceholder="Cari Gudang Asal..."
                                                disabled={isProcessing || isEditMode}
                                                inputClassName="h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nomor OMC *</Label>
                                            <Input
                                                placeholder="Contoh: OMC-2026-01"
                                                disabled={isProcessing}
                                                value={row.nomor_omc}
                                                onChange={(e) => handleRowFieldChange(rowIdx, 'nomor_omc', e.target.value)}
                                                className="h-8 text-xs bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                                required
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-1 sm:col-span-2">
                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{pihakAsalLabel}</Label>
                                        <HybridDropdown
                                            value={row.pihak_asal}
                                            options={supplierOptions}
                                            onChange={(val) => handleRowFieldChange(rowIdx, 'pihak_asal', val)}
                                            placeholder="Ketik atau pilih Supplier / Pengirim..."
                                            searchPlaceholder="Cari Pengirim..."
                                            disabled={isProcessing}
                                            inputClassName="h-8 text-xs"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 3. Serial Number Section per Baris */}
                            {isWajibSn && !isEditMode && (
                                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <QrCode className="w-3.5 h-3.5 text-amber-500" />
                                            <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                {row.sub_jenis === 'TRANSFER_GUDANG' 
                                                    ? `Pilih Serial Number Gudang Asal (${row.serials.length} Unit) *`
                                                    : `Daftar Serial Number (${row.serials.length} Unit) *`
                                                }
                                            </Label>
                                        </div>
                                        <span className="text-[10px] text-amber-500 font-semibold">
                                            Wajib Terisi Sesuai Qty ({row.qty})
                                        </span>
                                    </div>

                                    {row.sub_jenis === 'TRANSFER_GUDANG' ? (
                                        !row.gudang_asal_id ? (
                                            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                                                Pilih <strong>Gudang Asal</strong> pada baris ini untuk memuat daftar Serial Number yang tersedia.
                                            </div>
                                        ) : availableSnsForTransfer.length === 0 ? (
                                            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-300">
                                                Tidak ditemukan Serial Number berstatus aktif di gudang asal terpilih untuk barang ini.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                                {row.serials.map((sn, snIdx) => {
                                                    const currentOptions = availableSnsForTransfer.map(s => ({
                                                        value: s.serial_number,
                                                        label: `${s.serial_number} (${s.kondisi || 'BAIK'})`
                                                    }));

                                                    return (
                                                        <div key={`sn-select-${rowIdx}-${snIdx}`} className="space-y-0.5">
                                                            <Label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                                SN Unit #{snIdx + 1}
                                                            </Label>
                                                            <HybridDropdown
                                                                value={sn}
                                                                options={currentOptions}
                                                                onChange={(val) => handleSerialChange(rowIdx, snIdx, val)}
                                                                placeholder={`Pilih SN #${snIdx + 1}...`}
                                                                searchPlaceholder="Cari Serial Number..."
                                                                disabled={isProcessing}
                                                                inputClassName="h-8 text-xs font-mono"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                            {row.serials.map((sn, snIdx) => (
                                                <div key={`sn-input-${rowIdx}-${snIdx}`} className="space-y-0.5">
                                                    <Label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                        SN Unit #{snIdx + 1}
                                                    </Label>
                                                    <Input
                                                        placeholder={`Ketik Serial Number #${snIdx + 1}`}
                                                        disabled={isProcessing}
                                                        value={sn}
                                                        onChange={(e) => handleSerialChange(rowIdx, snIdx, e.target.value)}
                                                        className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono border-slate-200 dark:border-slate-700"
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Tombol Tambah Baris */}
                {!isEditMode && (
                    <div className="flex items-center gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddMoreRows(1)}
                            disabled={isProcessing || rows.length >= MAX_ROWS_LIMIT}
                            className="h-8 text-xs gap-1.5 cursor-pointer"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Tambah 1 Baris</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddMoreRows(5)}
                            disabled={isProcessing || rows.length >= MAX_ROWS_LIMIT}
                            className="h-8 text-xs gap-1.5 cursor-pointer"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Tambah 5 Baris</span>
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}