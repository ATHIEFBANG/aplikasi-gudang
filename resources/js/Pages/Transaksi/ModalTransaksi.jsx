import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, ArrowRightLeft, Package } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function ModalTransaksi({
    isOpen,
    onClose,
    gudangs = [],
    suppliers = [],
    barangs = []
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [jenisTransaksi, setJenisTransaksi] = useState('MASUK');
    const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
    const [gudangAsalId, setGudangAsalId] = useState('');
    const [gudangTujuanId, setGudangTujuanId] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [items, setItems] = useState([
        { barang_id: '', qty: 1 }
    ]);

    // Reset Form saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            setTanggal(new Date().toISOString().slice(0, 10));
            setGudangAsalId('');
            setGudangTujuanId('');
            setSupplierId('');
            setKeterangan('');
            setItems([{ barang_id: barangs[0]?.id ? String(barangs[0].id) : '', qty: 1 }]);
        }
    }, [isOpen, barangs]);

    const handleAddItem = () => {
        setItems(prev => [...prev, { barang_id: barangs[0]?.id ? String(barangs[0].id) : '', qty: 1 }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length <= 1) return;
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, val) => {
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: val };
            return updated;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);

        const payload = {
            jenis_transaksi: jenisTransaksi,
            tanggal,
            gudang_asal_id: ['KELUAR', 'TRANSFER', 'PINJAM'].includes(jenisTransaksi) ? gudangAsalId : null,
            gudang_tujuan_id: ['MASUK', 'TRANSFER', 'KEMBALI'].includes(jenisTransaksi) ? gudangTujuanId : null,
            supplier_id: jenisTransaksi === 'MASUK' ? (supplierId || null) : null,
            keterangan,
            items: items.map(item => ({
                barang_id: parseInt(item.barang_id, 10),
                qty: parseInt(item.qty, 10) || 1
            }))
        };

        router.post('/transaksi', payload, {
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
            title={`Buat Transaksi Stok (${jenisTransaksi})`}
            onSubmit={handleSubmit}
            submitLabel="Simpan & Mutasi Stok"
            isProcessing={isProcessing}
        >
            <div className="space-y-4">
                {/* 1. Pemilihan Jenis Transaksi */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tipe Transaksi *</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        {['MASUK', 'KELUAR', 'TRANSFER', 'PINJAM', 'KEMBALI'].map((tipe) => (
                            <button
                                key={tipe}
                                type="button"
                                onClick={() => setJenisTransaksi(tipe)}
                                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    jenisTransaksi === tipe
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/50'
                                }`}
                            >
                                {tipe}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Informasi Tanggal & Rute / Pihak Terkait */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium">Tanggal Transaksi *</Label>
                        <Input
                            type="date"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            disabled={isProcessing}
                            className="h-8 text-xs bg-white dark:bg-slate-900"
                            required
                        />
                    </div>

                    {/* Jika MASUK: Pilihan Supplier */}
                    {jenisTransaksi === 'MASUK' && (
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium">Supplier (Opsional)</Label>
                            <select
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                disabled={isProcessing}
                                className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-xs px-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            >
                                <option value="">Pilih Supplier...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.nama_supplier}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Jika KELUAR / TRANSFER / PINJAM: Gudang Asal */}
                    {['KELUAR', 'TRANSFER', 'PINJAM'].includes(jenisTransaksi) && (
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium">Gudang Asal (Sumber Stok) *</Label>
                            <select
                                value={gudangAsalId}
                                onChange={(e) => setGudangAsalId(e.target.value)}
                                disabled={isProcessing}
                                required
                                className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-xs px-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            >
                                <option value="">Pilih Gudang Asal...</option>
                                {gudangs.map(g => (
                                    <option key={g.id} value={g.id}>{g.nama_gudang}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Jika MASUK / TRANSFER / KEMBALI: Gudang Tujuan */}
                    {['MASUK', 'TRANSFER', 'KEMBALI'].includes(jenisTransaksi) && (
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium">Gudang Tujuan *</Label>
                            <select
                                value={gudangTujuanId}
                                onChange={(e) => setGudangTujuanId(e.target.value)}
                                disabled={isProcessing}
                                required
                                className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-xs px-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            >
                                <option value="">Pilih Gudang Tujuan...</option>
                                {gudangs.map(g => (
                                    <option key={g.id} value={g.id}>{g.nama_gudang}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[11px] font-medium">Keterangan / Keperluan</Label>
                        <Input
                            placeholder="Contoh: Pengadaan proyek tower baru / Peminjaman teknisi"
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            disabled={isProcessing}
                            className="h-8 text-xs bg-white dark:bg-slate-900"
                        />
                    </div>
                </div>

                {/* 3. Dynamic Items Repeater */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-blue-500" /> Daftar Barang
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddItem}
                            className="h-7 text-xs gap-1 cursor-pointer"
                        >
                            <PlusCircle className="w-3.5 h-3.5" /> Tambah Baris
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[11px] font-mono font-bold text-slate-400 w-5 text-center">
                                    #{idx + 1}
                                </span>
                                <div className="flex-1">
                                    <select
                                        value={item.barang_id}
                                        onChange={(e) => handleItemChange(idx, 'barang_id', e.target.value)}
                                        className="w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 text-xs px-2 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                                        required
                                    >
                                        <option value="">Pilih Barang...</option>
                                        {barangs.map(b => (
                                            <option key={b.id} value={b.id}>
                                                [{b.kode_barang}] {b.nama_barang}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.qty}
                                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                                        placeholder="Qty"
                                        className="h-8 text-xs text-center font-bold"
                                        required
                                    />
                                </div>
                                {items.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
}