import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '@/components/Modal';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, PlusCircle, Trash2, Minus, Plus } from 'lucide-react';
import { router } from '@inertiajs/react';
import HybridDropdown from '@/components/HybridDropdown';
import ModalSerialSelector from './ModalSerialSelector';

export default function ModalTransferGudang({
    isOpen,
    onClose,
    gudangs = [],
    barangs = []
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [snSearches, setSnSearches] = useState({});

    const getBarangStockInWarehouse = useCallback((barang, gudangId) => {
        if (!barang || !gudangId) return 0;
        const stokRec = barang.stoks?.find(st => String(st.gudang_id) === String(gudangId));
        const stokQty = stokRec ? parseInt(stokRec.jumlah, 10) : 0;
        const snCount = (barang.serials || []).filter(
            s => String(s.gudang_id) === String(gudangId) && s.status === 'IN_WAREHOUSE'
        ).length;
        return barang.is_wajib_sn ? snCount : Math.max(stokQty, snCount);
    }, []);

    const createEmptyRow = useCallback(() => ({
        tanggal: new Date().toISOString().slice(0, 10),
        nomor_omc: '',
        nomor_imc: '',
        gudang_asal_id: gudangs[0]?.id ? String(gudangs[0].id) : '',
        gudang_tujuan_id: gudangs[1]?.id ? String(gudangs[1].id) : '',
        barang_id: '',
        qty: 1,
        serials: []
    }), [gudangs]);

    const [rows, setRows] = useState([createEmptyRow()]);

    useEffect(() => {
        if (isOpen) {
            setRows([createEmptyRow()]);
            setSnSearches({});
        }
    }, [isOpen, createEmptyRow]);

    const gudangOptions = useMemo(() => {
        return gudangs.map(g => ({ value: g.nama_gudang, label: g.nama_gudang, id: g.id }));
    }, [gudangs]);

    // Opsi Kode PPL: SubLabel khusus Wajib SN/PN/Standar ukuran ringkas
    const getBarangPplOptions = useCallback((row) => {
        if (!row.gudang_asal_id) return [];
        return barangs
            .filter(b => getBarangStockInWarehouse(b, row.gudang_asal_id) > 0)
            .map(b => {
                const stok = getBarangStockInWarehouse(b, row.gudang_asal_id);
                const isSn = Boolean(b.is_wajib_sn === true || b.is_wajib_sn === 1 || b.is_wajib_sn === '1');
                const isPn = Boolean(b.is_wajib_pn === true || b.is_wajib_pn === 1 || b.is_wajib_pn === '1');

                return {
                    value: b.kode_barang,
                    label: b.kode_barang,
                    id: b.id,
                    stock: stok,
                    is_wajib_sn: isSn,
                    is_wajib_pn: isPn,
                    subLabel: (
                        <div className="flex items-center gap-1 text-[8px] leading-none mt-0.5 font-sans">
                            {isSn && (
                                <span className="text-amber-500 dark:text-amber-400 font-bold tracking-tight">
                                    Wajib SN
                                </span>
                            )}
                            {isSn && isPn && <span className="text-slate-400 dark:text-slate-600 text-[7px]">&bull;</span>}
                            {isPn && (
                                <span className="text-cyan-600 dark:text-cyan-400 font-bold tracking-tight">
                                    Wajib PN
                                </span>
                            )}
                            {!isSn && !isPn && (
                                <span className="text-slate-400 dark:text-slate-500 font-medium">
                                    Standar
                                </span>
                            )}
                        </div>
                    )
                };
            });
    }, [barangs, getBarangStockInWarehouse]);

    // Opsi Nama Barang: SubLabel menampilkan stok fisik yang tersedia di Gudang Asal
    const getBarangNamaOptions = useCallback((row) => {
        if (!row.gudang_asal_id) return [];
        return barangs
            .filter(b => getBarangStockInWarehouse(b, row.gudang_asal_id) > 0)
            .map(b => {
                const stok = getBarangStockInWarehouse(b, row.gudang_asal_id);
                const kombinasiNama = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang || b.kode_barang;
                return {
                    value: kombinasiNama,
                    label: kombinasiNama,
                    id: b.id,
                    stock: stok,
                    subLabel: (
                        <div className="flex items-center gap-1 text-[8.5px] leading-none mt-0.5 font-sans">
                            <span className="text-slate-400 dark:text-slate-500 font-medium">Tersedia:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {stok} {b.deskripsi || b.satuan || 'Unit'}
                            </span>
                        </div>
                    )
                };
            });
    }, [barangs, getBarangStockInWarehouse]);

    const handleRowFieldChange = (idx, field, value) => {
        setRows(prev => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: value };
            if (field === 'gudang_asal_id') {
                updated[idx].barang_id = '';
                updated[idx].serials = [];
                updated[idx].qty = 1;
            }
            return updated;
        });
    };

    const handleBarangChange = (idx, barangId) => {
        if (!barangId) {
            setRows(prev => {
                const updated = [...prev];
                updated[idx] = {
                    ...updated[idx],
                    barang_id: '',
                    qty: 1,
                    serials: []
                };
                return updated;
            });
            return;
        }

        const target = barangs.find(b => String(b.id) === String(barangId));
        setRows(prev => {
            const updated = [...prev];
            const maxStok = getBarangStockInWarehouse(target, updated[idx].gudang_asal_id);
            updated[idx] = {
                ...updated[idx],
                barang_id: String(barangId),
                qty: Math.min(updated[idx].qty || 1, maxStok || 1),
                serials: []
            };
            return updated;
        });
    };

    const handleQtyChange = (idx, val) => {
        let count = parseInt(val, 10);
        if (isNaN(count) || count < 1) count = 1;
        setRows(prev => {
            const updated = [...prev];
            const target = barangs.find(b => String(b.id) === String(updated[idx].barang_id));
            const maxStok = getBarangStockInWarehouse(target, updated[idx].gudang_asal_id);
            if (maxStok > 0 && count > maxStok) count = maxStok;
            updated[idx] = {
                ...updated[idx],
                qty: count,
                serials: updated[idx].serials.slice(0, count)
            };
            return updated;
        });
    };

    const handleToggleSn = (rowIdx, snValue) => {
        setRows(prev => {
            const updated = [...prev];
            const current = updated[rowIdx].serials || [];
            const exists = current.includes(snValue);
            const next = exists ? current.filter(s => s !== snValue) : [...current, snValue];
            updated[rowIdx] = {
                ...updated[rowIdx],
                qty: next.length > 0 ? next.length : 1,
                serials: next
            };
            return updated;
        });
    };

    const handleAutoSelectSns = (rowIdx, list) => {
        setRows(prev => {
            const updated = [...prev];
            const qty = updated[rowIdx].qty || 1;
            updated[rowIdx] = {
                ...updated[rowIdx],
                serials: list.slice(0, qty).map(s => s.serial_number)
            };
            return updated;
        });
    };

    const handleClearSns = (rowIdx) => {
        setRows(prev => {
            const updated = [...prev];
            updated[rowIdx] = { ...updated[rowIdx], serials: [] };
            return updated;
        });
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const num = i + 1;
            if (!r.gudang_asal_id || !r.gudang_tujuan_id) {
                alert(`Baris #${num}: Gudang Asal dan Tujuan wajib dipilih.`);
                return;
            }
            if (String(r.gudang_asal_id) === String(r.gudang_tujuan_id)) {
                alert(`Baris #${num}: Gudang Asal dan Tujuan tidak boleh sama.`);
                return;
            }
            if (!r.nomor_omc.trim()) {
                alert(`Baris #${num}: Nomor OMC (Surat Jalan Transfer) wajib diisi.`);
                return;
            }
            if (!r.barang_id) {
                alert(`Baris #${num}: Harap pilih barang.`);
                return;
            }
            const target = barangs.find(b => String(b.id) === String(r.barang_id));
            if (target?.is_wajib_sn && r.serials.length !== r.qty) {
                alert(`Baris #${num}: Harap centang Serial Number tepat ${r.qty} unit.`);
                return;
            }
        }
        setIsProcessing(true);
        router.post('/transaksi/transfer', { items: rows }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsProcessing(false);
                onClose();
            },
            onError: () => setIsProcessing(false),
            onFinish: () => setIsProcessing(false)
        });
    };

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

                            {/* Detail Barang, Tanggal, dan Kuantitas (2 Baris Lega) */}
                            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                {/* Baris 1: Tanggal, Kode PPL Lega, Nama Barang Lega */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                    <div className="sm:col-span-3 space-y-1">
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

                                    {/* Dropdown Kode PPL (Lega) */}
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

                                    {/* Dropdown Nama Barang (Lega) */}
                                    <div className="sm:col-span-5 space-y-1">
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

                                {/* Baris 2: Quantity (Tepat di Bawah Tanggal), Satuan / Unit, dan Part Number */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                    <div className="sm:col-span-3 space-y-1">
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

                                    {/* Kolom Satuan / Unit */}
                                    <div className="sm:col-span-3 space-y-1">
                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Satuan / Unit</Label>
                                        <Input
                                            disabled
                                            value={targetBarang?.deskripsi || targetBarang?.satuan || 'Unit'}
                                            className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Kolom Part Number */}
                                    <div className="sm:col-span-6 space-y-1">
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

                            {/* Serial Number Picker */}
                            {isWajibSn && (
                                <ModalSerialSelector
                                    rowIdx={rowIdx}
                                    row={{ ...row, sub_jenis: 'TRANSFER_GUDANG' }}
                                    availableSnsForTransfer={availableSns}
                                    snSearch={snSearches[rowIdx] || ''}
                                    onSnSearchChange={(rIdx, val) => setSnSearches(prev => ({ ...prev, [rIdx]: val }))}
                                    onToggleTransferSn={handleToggleSn}
                                    onAutoSelectTransferSns={handleAutoSelectSns}
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