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

    const getBarangPplOptions = (row) => {
        if (!row.gudang_asal_id) return [];
        return barangs
            .filter(b => getBarangStockInWarehouse(b, row.gudang_asal_id) > 0)
            .map(b => ({
                value: b.kode_barang,
                label: `${b.kode_barang} (Stok: ${getBarangStockInWarehouse(b, row.gudang_asal_id)})`,
                id: b.id,
            }));
    };

    const getBarangNamaOptions = (row) => {
        if (!row.gudang_asal_id) return [];
        return barangs
            .filter(b => getBarangStockInWarehouse(b, row.gudang_asal_id) > 0)
            .map(b => {
                const kombinasiNama = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang;
                return {
                    value: kombinasiNama,
                    label: `${kombinasiNama} (Stok: ${getBarangStockInWarehouse(b, row.gudang_asal_id)})`,
                    id: b.id,
                };
            });
    };

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
                    const stockInOrigin = targetBarang && row.gudang_asal_id 
                        ? getBarangStockInWarehouse(targetBarang, row.gudang_asal_id) 
                        : null;
                    const availableSns = (targetBarang?.serials || []).filter(
                        s => String(s.gudang_id) === String(row.gudang_asal_id) && s.status === 'IN_WAREHOUSE'
                    );

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
                                        className="h-7 px-2 text-rose-500 hover:text-rose-700 text-xs gap-1"
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
                                            onChange={(val) => {
                                                const found = gudangs.find(g => g.nama_gudang.toLowerCase() === val.toLowerCase());
                                                handleRowFieldChange(rowIdx, 'gudang_asal_id', found ? String(found.id) : '');
                                            }}
                                            placeholder="Pilih Gudang Asal..."
                                            inputClassName="h-8 text-xs font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nomor OMC (Surat Jalan Asal) *</Label>
                                        <Input
                                            placeholder="Ketik nomor OMC..."
                                            value={row.nomor_omc}
                                            onChange={(e) => handleRowFieldChange(rowIdx, 'nomor_omc', e.target.value)}
                                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono"
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
                                            onChange={(val) => {
                                                const found = gudangs.find(g => g.nama_gudang.toLowerCase() === val.toLowerCase());
                                                handleRowFieldChange(rowIdx, 'gudang_tujuan_id', found ? String(found.id) : '');
                                            }}
                                            placeholder="Pilih Gudang Penerima..."
                                            inputClassName="h-8 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nomor IMC (Opsional)</Label>
                                        <Input
                                            placeholder="Ketik nomor IMC..."
                                            value={row.nomor_imc}
                                            onChange={(e) => handleRowFieldChange(rowIdx, 'nomor_imc', e.target.value)}
                                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Detail Barang & QTY */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Tanggal *</Label>
                                    <Input
                                        type="date"
                                        value={row.tanggal}
                                        onChange={(e) => handleRowFieldChange(rowIdx, 'tanggal', e.target.value)}
                                        className="h-8 text-xs bg-white dark:bg-slate-900"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kode PPL *</Label>
                                    <HybridDropdown
                                        value={targetBarang?.kode_barang || ''}
                                        options={getBarangPplOptions(row)}
                                        onChange={(val) => {
                                            const found = barangs.find(b => b.kode_barang.toLowerCase() === val.split(' ')[0].toLowerCase());
                                            if (found) handleBarangChange(rowIdx, found.id);
                                        }}
                                        placeholder="Pilih Kode PPL..."
                                        inputClassName="h-8 text-xs font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nama Barang *</Label>
                                    <HybridDropdown
                                        value={targetBarang ? ([targetBarang.brand, targetBarang.tipe, targetBarang.kategori].filter(Boolean).join(' ') || targetBarang.nama_barang) : ''}
                                        options={getBarangNamaOptions(row)}
                                        onChange={(val) => {
                                            const cleanVal = val.split(' (Stok:')[0].trim().toLowerCase();
                                            const found = barangs.find(b => {
                                                const fullName = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang;
                                                return fullName.toLowerCase() === cleanVal || b.kode_barang.toLowerCase() === cleanVal;
                                            });
                                            if (found) handleBarangChange(rowIdx, found.id);
                                        }}
                                        placeholder="Pilih Barang..."
                                        inputClassName="h-8 text-xs"
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
                                            className="h-8 w-8 rounded-l-lg border border-r-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={stockInOrigin || 50}
                                            value={row.qty}
                                            onChange={(e) => handleQtyChange(rowIdx, e.target.value)}
                                            className="h-8 w-full text-center font-bold text-xs rounded-none bg-white dark:bg-slate-900"
                                            required
                                        />
                                        <button
                                            type="button"
                                            disabled={stockInOrigin !== null && row.qty >= stockInOrigin}
                                            onClick={() => handleQtyChange(rowIdx, row.qty + 1)}
                                            className="h-8 w-8 rounded-r-lg border border-l-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
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