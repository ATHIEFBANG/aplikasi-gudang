import React, { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/Modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { 
    AlertCircle, 
    Check, 
    ShoppingBag, 
    Layers, 
    RotateCcw, 
    ArrowRightLeft, 
    PackageCheck, 
    QrCode,
    ChevronDown
} from 'lucide-react';
import { router } from '@inertiajs/react';

const SelectDropdown = ({ value, options = [], onChange, placeholder = "Pilih...", disabled = false, triggerClassName = '' }) => {
    const selected = options.find(o => String(o.value) === String(value));
    return (
        <DropdownMenu>
            <DropdownMenuTrigger 
                disabled={disabled}
                className={`flex h-8 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${triggerClassName}`}
            >
                <span className="truncate font-medium">
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-[14rem] max-h-56 overflow-y-auto text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 z-[100] shadow-md p-1"
            >
                {options.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-400 text-center">Tidak ada pilihan</div>
                ) : (
                    options.map(opt => {
                        const isSelected = String(value) === String(opt.value);
                        return (
                            <DropdownMenuItem 
                                key={opt.value} 
                                onClick={() => onChange(opt.value)}
                                className={`cursor-pointer px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                                    isSelected 
                                        ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-slate-800/60" 
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                            >
                                <span className="truncate">{opt.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />}
                            </DropdownMenuItem>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default function ModalTransaksi({
    isOpen,
    onClose,
    isEditMode = false,
    selectedItem = null,
    gudangs = [],
    barangs = []
}) {
    const [subJenis, setSubJenis] = useState('PEMBELIAN');
    const [selectedBarangId, setSelectedBarangId] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
    const [qty, setQty] = useState(1);
    const [kondisi, setKondisi] = useState('Baru');
    const [nomorImc, setNomorImc] = useState('');
    const [nomorOmc, setNomorOmc] = useState('');
    const [pihakAsal, setPihakAsal] = useState('');
    const [gudangAsalId, setGudangAsalId] = useState('');
    const [gudangTujuanId, setGudangTujuanId] = useState('');
    const [serials, setSerials] = useState(['']);
    const [isProcessing, setIsProcessing] = useState(false);

    const selectedBarang = useMemo(() => {
        return barangs.find((b) => String(b.id) === String(selectedBarangId)) || null;
    }, [barangs, selectedBarangId]);

    const isWajibSn = useMemo(() => {
        return Boolean(selectedBarang?.is_wajib_sn === true || selectedBarang?.is_wajib_sn === 1 || selectedBarang?.is_wajib_sn === '1');
    }, [selectedBarang]);

    const isWajibPn = useMemo(() => {
        return Boolean(selectedBarang?.is_wajib_pn === true || selectedBarang?.is_wajib_pn === 1 || selectedBarang?.is_wajib_pn === '1');
    }, [selectedBarang]);

    const statusItemText = useMemo(() => {
        if (isWajibSn && isWajibPn) return 'Wajib SN & PN';
        if (isWajibSn) return 'Wajib SN';
        if (isWajibPn) return 'Wajib PN';
        return 'Tidak Wajib (Standar)';
    }, [isWajibSn, isWajibPn]);

    const displayedPartNumber = useMemo(() => {
        if (!selectedBarang || !isWajibPn) return '';
        return selectedBarang.part_number || '';
    }, [selectedBarang, isWajibPn]);

    const displayedSatuan = useMemo(() => {
        if (!selectedBarang) return 'Unit';
        return selectedBarang.deskripsi || selectedBarang.satuan || 'Unit';
    }, [selectedBarang]);

    const barangPplOptions = useMemo(() => {
        return barangs.map(b => ({ value: b.id, label: b.kode_barang }));
    }, [barangs]);

    const barangNamaOptions = useMemo(() => {
        return barangs.map(b => {
            const kombinasiNama = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ');
            return {
                value: b.id,
                label: kombinasiNama || b.nama_barang || b.kode_barang
            };
        });
    }, [barangs]);

    const gudangOptions = useMemo(() => {
        return gudangs.map(g => ({ value: g.id, label: g.nama_gudang }));
    }, [gudangs]);

    const kondisiOptions = useMemo(() => {
        if (subJenis === 'TRANSFER_GUDANG' || subJenis === 'PENGEMBALIAN') {
            return [
                { value: 'Baru', label: 'Kondisi Baru (Segel)' },
                { value: 'Bekas', label: 'Kondisi Bekas (Second)' },
                { value: 'Rusak', label: 'Kondisi Rusak' },
            ];
        }
        return [
            { value: 'Baru', label: 'Kondisi Baru (Segel)' },
            { value: 'Bekas', label: 'Kondisi Bekas (Second)' },
        ];
    }, [subJenis]);

    useEffect(() => {
        if ((subJenis === 'PEMBELIAN' || subJenis === 'PEMINJAMAN') && kondisi === 'Rusak') {
            setKondisi('Baru');
        }
    }, [subJenis, kondisi]);

    // Inisialisasi State Tambah vs Edit
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && selectedItem) {
                const detail = selectedItem.details?.[0] || {};
                setSubJenis(selectedItem.sub_jenis || 'PEMBELIAN');
                setSelectedBarangId(detail.barang_id ? String(detail.barang_id) : (barangs[0]?.id ? String(barangs[0].id) : ''));
                setTanggal(selectedItem.tanggal ? String(selectedItem.tanggal).split('T')[0] : new Date().toISOString().slice(0, 10));
                setQty(detail.qty || 1);
                setKondisi(selectedItem.kondisi || 'Baru');
                setNomorImc(selectedItem.nomor_imc || '');
                setNomorOmc(selectedItem.nomor_omc || '');
                setPihakAsal(selectedItem.pihak_asal || '');
                setGudangAsalId(selectedItem.gudang_asal_id ? String(selectedItem.gudang_asal_id) : '');
                setGudangTujuanId(selectedItem.gudang_tujuan_id ? String(selectedItem.gudang_tujuan_id) : '');
                
                const existingSns = detail.serials ? detail.serials.map(s => s.serial_number || s) : [];
                setSerials(existingSns.length > 0 ? existingSns : ['']);
            } else if (barangs.length > 0) {
                const defaultBarang = barangs[0];
                setSelectedBarangId(String(defaultBarang.id));
                setTanggal(new Date().toISOString().slice(0, 10));
                setQty(1);
                setKondisi('Baru');
                setNomorImc('');
                setNomorOmc('');
                setPihakAsal('');
                setGudangAsalId(gudangs[0]?.id ? String(gudangs[0].id) : '');
                setGudangTujuanId(gudangs[0]?.id ? String(gudangs[0].id) : '');
                setSerials(defaultBarang?.is_wajib_sn ? [''] : []);
            }
        }
    }, [isOpen, isEditMode, selectedItem, barangs, gudangs]);

    const handleBarangChange = (id) => {
        setSelectedBarangId(id);
        const item = barangs.find((b) => String(b.id) === String(id));
        const itemIsSn = Boolean(item?.is_wajib_sn === true || item?.is_wajib_sn === 1 || item?.is_wajib_sn === '1');
        
        if (itemIsSn) {
            setSerials(Array(qty).fill(''));
        } else {
            setSerials([]);
        }
    };

    const handleQtyChange = (val) => {
        let count = parseInt(val, 10);
        if (isNaN(count) || count < 1) count = 1;
        if (count > 10) count = 10;

        setQty(count);

        if (isWajibSn) {
            setSerials((prev) => {
                const updated = [...prev];
                while (updated.length < count) updated.push('');
                return updated.slice(0, count);
            });
        }
    };

    const handleSerialChange = (index, value) => {
        setSerials((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const handleSubmitForm = (e) => {
        e?.preventDefault();

        if (!selectedBarangId) {
            alert('Harap pilih barang terlebih dahulu.');
            return;
        }

        if (!nomorImc.trim()) {
            alert('Nomor IMC wajib diisi.');
            return;
        }

        if (!gudangTujuanId) {
            alert('Gudang Tujuan penerimaan wajib dipilih.');
            return;
        }

        if (subJenis === 'TRANSFER_GUDANG') {
            if (!gudangAsalId) {
                alert('Gudang Asal pengirim wajib dipilih.');
                return;
            }
            if (String(gudangAsalId) === String(gudangTujuanId)) {
                alert('Gudang Asal dan Gudang Tujuan tidak boleh sama.');
                return;
            }
            if (!nomorOmc.trim()) {
                alert('Nomor OMC wajib diisi.');
                return;
            }
        } else if (!pihakAsal.trim()) {
            alert('Nama Supplier / Pihak Pengirim wajib diisi.');
            return;
        }

        if (isWajibSn && !isEditMode) {
            const emptyIndex = serials.findIndex((sn) => !sn.trim());
            if (emptyIndex !== -1) {
                alert(`Serial Number unit ke-${emptyIndex + 1} wajib diisi lengkap.`);
                return;
            }
        }

        setIsProcessing(true);

        const payload = {
            jenis_transaksi: 'MASUK',
            sub_jenis: subJenis,
            tanggal,
            kondisi,
            nomor_imc: nomorImc.trim(),
            nomor_omc: subJenis === 'TRANSFER_GUDANG' ? nomorOmc.trim() : null,
            pihak_asal: subJenis !== 'TRANSFER_GUDANG' ? pihakAsal.trim() : null,
            gudang_asal_id: subJenis === 'TRANSFER_GUDANG' ? parseInt(gudangAsalId, 10) : null,
            gudang_tujuan_id: parseInt(gudangTujuanId, 10),
            items: [
                {
                    barang_id: parseInt(selectedBarangId, 10),
                    qty: parseInt(qty, 10),
                    kondisi: kondisi === 'Rusak' ? 'RUSAK' : 'BAIK',
                    serials: isWajibSn ? serials : []
                }
            ]
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

    const getPihakAsalLabel = () => {
        if (subJenis === 'PEMBELIAN') return 'Supplier / Vendor Asal *';
        if (subJenis === 'PEMINJAMAN') return 'Peminjam / Vendor Terkait *';
        if (subJenis === 'PENGEMBALIAN') return 'Dikembalikan Oleh *';
        return 'Pihak Terkait *';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Transaksi Barang Masuk' : 'Tambah Transaksi Barang Masuk'}
            onSubmit={handleSubmitForm}
            submitLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            isProcessing={isProcessing}
            headerExtra={
                <div className="flex items-center gap-2">
                    <Badge 
                        variant="secondary" 
                        className="bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-mono font-bold px-2.5 py-0.5"
                    >
                        MODE: {subJenis.replace('_', ' ')}
                    </Badge>
                </div>
            }
        >
            <Alert className="shrink-0 mb-3 bg-blue-950/40 border-blue-800/60 text-blue-300 p-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <AlertDescription className="text-[11px] leading-relaxed">
                    <strong>Pencatatan Stok Masuk:</strong> Pastikan rincian item, kuantitas, dokumen IMC/OMC, dan tujuan gudang telah sesuai dengan barang fisik.
                </AlertDescription>
            </Alert>

            <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 relative space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <PackageCheck className="w-4 h-4" /> {isEditMode ? 'Formulir Edit Data Transaksi' : 'Formulir Rincian Barang Masuk'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                            Status Item: <strong className="text-blue-600 dark:text-blue-400 font-bold">{statusItemText}</strong>
                        </span>
                    </div>

                    {!isEditMode && (
                        <div className="space-y-1 pt-1">
                            <Label className="text-[11px] font-medium">Jenis Penerimaan *</Label>
                            <div className="flex flex-wrap items-center gap-2">
                                {categories.map((cat) => {
                                    const Icon = cat.icon;
                                    const isSelected = subJenis === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSubJenis(cat.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            <span>{cat.label}</span>
                                            {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium">Kode PPL *</Label>
                            <SelectDropdown
                                value={selectedBarangId}
                                options={barangPplOptions}
                                onChange={handleBarangChange}
                                placeholder="Pilih Kode PPL..."
                                disabled={isProcessing || isEditMode}
                                triggerClassName="font-mono font-bold"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium">Nama Barang *</Label>
                            <SelectDropdown
                                value={selectedBarangId}
                                options={barangNamaOptions}
                                onChange={handleBarangChange}
                                placeholder="Pilih Nama Barang..."
                                disabled={isProcessing || isEditMode}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                Part Number Original
                            </Label>
                            <Input
                                disabled
                                placeholder={isWajibPn ? "Part Number" : "-"}
                                value={displayedPartNumber}
                                className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-mono text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                Satuan / Unit *
                            </Label>
                            <Input
                                disabled
                                value={displayedSatuan}
                                className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium">Tanggal Transaksi *</Label>
                            <Input
                                type="date"
                                disabled={isProcessing}
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-medium">Quantity *</Label>
                                <span className="text-[9px] text-slate-400 font-mono">Maks. 10</span>
                            </div>
                            <Input
                                type="number"
                                min={1}
                                max={10}
                                disabled={isProcessing || isEditMode}
                                value={qty}
                                onChange={(e) => handleQtyChange(e.target.value)}
                                className="h-8 text-xs bg-white dark:bg-slate-900 font-bold border-slate-200 dark:border-slate-700"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium">Kondisi Fisik *</Label>
                            <SelectDropdown
                                value={kondisi}
                                options={kondisiOptions}
                                onChange={setKondisi}
                                placeholder="Pilih Kondisi..."
                                disabled={isProcessing}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium">Nomor IMC *</Label>
                            <Input
                                placeholder="Contoh: IMC-00123"
                                disabled={isProcessing}
                                value={nomorImc}
                                onChange={(e) => setNomorImc(e.target.value)}
                                className="h-8 text-xs bg-white dark:bg-slate-900 font-mono border-slate-200 dark:border-slate-700"
                                required
                            />
                        </div>

                        {subJenis === 'TRANSFER_GUDANG' ? (
                            <>
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium">Gudang Asal*</Label>
                                    <SelectDropdown
                                        value={gudangAsalId}
                                        options={gudangOptions}
                                        onChange={setGudangAsalId}
                                        placeholder="Pilih Gudang Asal..."
                                        disabled={isProcessing || isEditMode}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium">Nomor OMC *</Label>
                                    <Input
                                        placeholder="Contoh: OMC-2026-01"
                                        disabled={isProcessing}
                                        value={nomorOmc}
                                        onChange={(e) => setNomorOmc(e.target.value)}
                                        className="h-8 text-xs bg-white dark:bg-slate-900 font-mono border-slate-200 dark:border-slate-700"
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1 sm:col-span-2">
                                <Label className="text-[11px] font-medium">{getPihakAsalLabel()}</Label>
                                <Input
                                    placeholder="Nama supplier atau pihak terkait..."
                                    disabled={isProcessing}
                                    value={pihakAsal}
                                    onChange={(e) => setPihakAsal(e.target.value)}
                                    className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1 sm:col-span-2">
                            <Label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                Gudang Tujuan (Penerima Fisik) *
                            </Label>
                            <SelectDropdown
                                value={gudangTujuanId}
                                options={gudangOptions}
                                onChange={setGudangTujuanId}
                                placeholder="Pilih Gudang Penerima..."
                                disabled={isProcessing}
                                triggerClassName="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold"
                            />
                        </div>

                        {isWajibSn && !isEditMode && (
                            <div className="space-y-2 col-span-1 sm:col-span-2 lg:col-span-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <QrCode className="w-3.5 h-3.5 text-amber-500" />
                                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                            Daftar Serial Number ({serials.length} Unit) *
                                        </Label>
                                    </div>
                                    <span className="text-[10px] text-amber-500 font-semibold">
                                        Wajib Terisi Sesuai Qty ({qty})
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto p-1.5 bg-white/40 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {serials.map((sn, idx) => (
                                        <div key={idx} className="space-y-0.5">
                                            <Label className="text-[10px] text-slate-400 font-mono">
                                                SN Unit #{idx + 1}
                                            </Label>
                                            <Input
                                                placeholder={`Serial Number #${idx + 1}`}
                                                disabled={isProcessing}
                                                value={sn}
                                                onChange={(e) => handleSerialChange(idx, e.target.value)}
                                                className="h-8 text-xs bg-white dark:bg-slate-900 font-mono border-slate-200 dark:border-slate-700"
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}