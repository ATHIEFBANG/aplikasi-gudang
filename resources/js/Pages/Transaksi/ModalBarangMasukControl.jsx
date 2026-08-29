import { useState, useEffect, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { ShoppingBag, Layers, RotateCcw } from 'lucide-react';

export const MAX_ROWS_LIMIT = 50;

export const CATEGORIES_MASUK = [
    { id: 'PEMBELIAN', label: 'Pembelian', icon: ShoppingBag },
    { id: 'PEMINJAMAN', label: 'Peminjaman', icon: Layers },
    { id: 'PENGEMBALIAN', label: 'Pengembalian', icon: RotateCcw },
];

export function useModalBarangMasukControl({
    isOpen,
    isEditMode = false,
    selectedItem = null,
    gudangs = [],
    suppliers = [],
    barangs = [],
    onClose
}) {
    const [isProcessing, setIsProcessing] = useState(false);

    const createEmptyRow = useCallback(() => {
        const defaultBarang = barangs[0] || null;
        const isSn = Boolean(defaultBarang?.is_wajib_sn);
        return {
            sub_jenis: 'PEMBELIAN',
            tanggal: new Date().toISOString().slice(0, 10),
            nomor_imc: '',
            pihak_asal: '',
            gudang_tujuan_id: gudangs[0]?.id ? String(gudangs[0].id) : '',
            barang_id: defaultBarang?.id ? String(defaultBarang.id) : '',
            qty: 1,
            harga: '',
            kondisi: 'Baru',
            serials: isSn ? [''] : []
        };
    }, [barangs, gudangs]);

    const [rows, setRows] = useState([createEmptyRow()]);

    const gudangOptions = useMemo(() => {
        return gudangs.map(g => ({ value: g.nama_gudang, label: g.nama_gudang, id: g.id }));
    }, [gudangs]);

    const supplierOptions = useMemo(() => {
        return (suppliers || []).map(s => s.nama_supplier || s);
    }, [suppliers]);

    const getBarangPplOptionsForRow = useCallback(() => {
        return barangs.map(b => ({ value: b.kode_barang, label: b.kode_barang, id: b.id }));
    }, [barangs]);

    const getBarangNamaOptionsForRow = useCallback(() => {
        return barangs.map(b => {
            const kombinasiNama = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang || b.kode_barang;
            return {
                value: kombinasiNama,
                label: kombinasiNama,
                id: b.id
            };
        });
    }, [barangs]);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && selectedItem) {
                const detail = selectedItem.details?.[0] || {};
                const targetBarang = barangs.find(b => String(b.id) === String(detail.barang_id));
                const isSn = Boolean(targetBarang?.is_wajib_sn);
                const existingSns = detail.serials ? detail.serials.map(s => s.serial_number || s) : [];

                let cleanKondisi = selectedItem.kondisi || detail.kondisi || 'Baru';
                if (cleanKondisi.toUpperCase() === 'BAIK') cleanKondisi = 'Baru';

                setRows([{
                    id: selectedItem.id,
                    sub_jenis: selectedItem.sub_jenis || 'PEMBELIAN',
                    tanggal: selectedItem.tanggal ? String(selectedItem.tanggal).split('T')[0] : new Date().toISOString().slice(0, 10),
                    nomor_imc: selectedItem.nomor_imc || '',
                    pihak_asal: selectedItem.pihak_asal || '',
                    gudang_tujuan_id: selectedItem.gudang_tujuan_id ? String(selectedItem.gudang_tujuan_id) : '',
                    barang_id: detail.barang_id ? String(detail.barang_id) : '',
                    qty: detail.qty || 1,
                    harga: detail.harga !== undefined && detail.harga !== null ? String(detail.harga) : '',
                    kondisi: cleanKondisi,
                    serials: isSn ? (existingSns.length > 0 ? existingSns : ['']) : []
                }]);
            } else {
                setRows([createEmptyRow()]);
            }
        }
    }, [isOpen, isEditMode, selectedItem, barangs, gudangs, createEmptyRow]);

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
            const currentRow = updated[rowIdx];
            let newKondisi = field === 'kondisi' ? value : currentRow.kondisi;

            if (newKondisi && newKondisi.toUpperCase() === 'BAIK') {
                newKondisi = 'Baru';
            }

            if (field === 'sub_jenis') {
                if ((value === 'PEMBELIAN' || value === 'PEMINJAMAN') && newKondisi === 'Rusak') {
                    newKondisi = 'Baru';
                }
            }

            updated[rowIdx] = { 
                ...currentRow, 
                [field]: value, 
                kondisi: newKondisi
            };
            return updated;
        });
    };

    const handleBarangChange = (rowIdx, newBarangId) => {
        const targetBarang = barangs.find(b => String(b.id) === String(newBarangId));
        const isSn = Boolean(targetBarang?.is_wajib_sn);
        
        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            const currentQty = currentRow.qty || 1;

            updated[rowIdx] = {
                ...currentRow,
                barang_id: String(newBarangId),
                qty: currentQty,
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
            const isSn = Boolean(targetBarang?.is_wajib_sn);

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

    const handleManualSerialChange = (rowIdx, snIdx, val) => {
        setRows(prev => {
            const updated = [...prev];
            const currentSerials = [...(updated[rowIdx].serials || [])];
            currentSerials[snIdx] = val;
            updated[rowIdx] = { ...updated[rowIdx], serials: currentSerials };
            return updated;
        });
    };

    const handleSubmitForm = (e) => {
        e?.preventDefault();
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const rowNum = i + 1;

            if (!r.pihak_asal.trim()) {
                alert(`Baris #${rowNum}: Pihak Asal / Supplier wajib diisi.`);
                return;
            }
            if (!r.gudang_tujuan_id) {
                alert(`Baris #${rowNum}: Gudang Tujuan penerimaan wajib dipilih.`);
                return;
            }
            if (!r.nomor_imc.trim()) {
                alert(`Baris #${rowNum}: Nomor IMC wajib diisi.`);
                return;
            }
            if (!r.barang_id) {
                alert(`Baris #${rowNum}: Harap pilih barang terlebih dahulu.`);
                return;
            }

            const targetBarang = barangs.find(b => String(b.id) === String(r.barang_id));
            const isSn = Boolean(targetBarang?.is_wajib_sn);
            if (isSn && !isEditMode) {
                if (r.serials.length !== r.qty) {
                    alert(`Baris #${rowNum}: Jumlah Serial Number (${r.serials.length}) harus sesuai dengan Quantity (${r.qty} unit).`);
                    return;
                }
                const emptySnIndex = r.serials.findIndex(sn => !sn || !sn.trim());
                if (emptySnIndex !== -1) {
                    alert(`Baris #${rowNum}: Serial Number unit ke-${emptySnIndex + 1} wajib terisi.`);
                    return;
                }
                const uniqueSnCount = new Set(r.serials.map(s => s.trim())).size;
                if (uniqueSnCount !== r.serials.length) {
                    alert(`Baris #${rowNum}: Terdapat Serial Number duplikat.`);
                    return;
                }
            }
        }

        setIsProcessing(true);
        const payload = isEditMode
            ? {
                tanggal: rows[0].tanggal,
                kondisi: rows[0].kondisi || 'Baru',
                nomor_imc: rows[0].nomor_imc.trim(),
                pihak_asal: rows[0].pihak_asal.trim(),
                gudang_tujuan_id: parseInt(rows[0].gudang_tujuan_id, 10),
                qty: parseInt(rows[0].qty, 10) || 1,
                harga: rows[0].sub_jenis === 'PEMBELIAN' && rows[0].harga !== '' ? parseFloat(rows[0].harga) : 0,
            }
            : {
                items: rows.map(r => ({
                    sub_jenis: r.sub_jenis,
                    tanggal: r.tanggal,
                    kondisi: r.kondisi || 'Baru',
                    nomor_imc: r.nomor_imc.trim(),
                    pihak_asal: r.pihak_asal.trim(),
                    gudang_tujuan_id: parseInt(r.gudang_tujuan_id, 10),
                    barang_id: parseInt(r.barang_id, 10),
                    qty: parseInt(r.qty, 10),
                    harga: r.sub_jenis === 'PEMBELIAN' && r.harga !== '' ? parseFloat(r.harga) : 0,
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

    return {
        isProcessing,
        rows,
        gudangOptions,
        supplierOptions,
        getBarangPplOptionsForRow,
        getBarangNamaOptionsForRow,
        handleAddMoreRows,
        handleRemoveRow,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleManualSerialChange,
        handleSubmitForm,
    };
}