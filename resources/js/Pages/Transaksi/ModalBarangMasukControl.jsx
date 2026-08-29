import { useState, useEffect, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { ShoppingBag, Layers, RotateCcw, ArrowRightLeft } from 'lucide-react';

export const MAX_ROWS_LIMIT = 50;

export const CATEGORIES_MASUK = [
    { id: 'PEMBELIAN', label: 'Pembelian', icon: ShoppingBag },
    { id: 'PEMINJAMAN', label: 'Peminjaman', icon: Layers },
    { id: 'PENGEMBALIAN', label: 'Pengembalian', icon: RotateCcw },
    { id: 'TRANSFER_GUDANG', label: 'Transfer Gudang', icon: ArrowRightLeft },
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

    const createEmptyRow = useCallback(() => {
        return {
            sub_jenis: 'PEMBELIAN',
            tanggal: new Date().toISOString().slice(0, 10),
            nomor_imc: '',
            nomor_omc: '',
            pihak_asal: '',
            gudang_asal_id: gudangs[0]?.id ? String(gudangs[0].id) : '',
            gudang_tujuan_id: gudangs[0]?.id ? String(gudangs[0].id) : '',
            barang_id: barangs[0]?.id ? String(barangs[0].id) : '',
            qty: 1,
            harga: '',
            kondisi: 'Baru',
            serials: barangs[0]?.is_wajib_sn ? [''] : []
        };
    }, [barangs, gudangs]);

    const [rows, setRows] = useState([createEmptyRow()]);

    const gudangOptions = useMemo(() => {
        return gudangs.map(g => ({ value: g.nama_gudang, label: g.nama_gudang, id: g.id }));
    }, [gudangs]);

    const supplierOptions = useMemo(() => {
        return (suppliers || []).map(s => s.nama_supplier || s);
    }, [suppliers]);

    const getBarangPplOptionsForRow = useCallback((row) => {
        if (row.sub_jenis === 'TRANSFER_GUDANG') {
            if (!row.gudang_asal_id) return [];
            return barangs
                .filter(b => getBarangStockInWarehouse(b, row.gudang_asal_id) > 0)
                .map(b => {
                    const stok = getBarangStockInWarehouse(b, row.gudang_asal_id);
                    return {
                        value: b.kode_barang,
                        label: `${b.kode_barang} (Stok: ${stok})`,
                        id: b.id,
                        stock: stok
                    };
                });
        }
        return barangs.map(b => ({ value: b.kode_barang, label: b.kode_barang, id: b.id }));
    }, [barangs, getBarangStockInWarehouse]);

    const getBarangNamaOptionsForRow = useCallback((row) => {
        if (row.sub_jenis === 'TRANSFER_GUDANG') {
            if (!row.gudang_asal_id) return [];
            return barangs
                .filter(b => getBarangStockInWarehouse(b, row.gudang_asal_id) > 0)
                .map(b => {
                    const stok = getBarangStockInWarehouse(b, row.gudang_asal_id);
                    const kombinasiNama = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang || b.kode_barang;
                    return {
                        value: kombinasiNama,
                        label: `${kombinasiNama} (Stok: ${stok})`,
                        id: b.id,
                        stock: stok
                    };
                });
        }
        return barangs.map(b => {
            const kombinasiNama = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang || b.kode_barang;
            return {
                value: kombinasiNama,
                label: kombinasiNama,
                id: b.id
            };
        });
    }, [barangs, getBarangStockInWarehouse]);

    useEffect(() => {
        if (isOpen) {
            setSnSearches({});
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
                    barang_id: detail.barang_id ? String(detail.barang_id) : '',
                    qty: detail.qty || 1,
                    harga: detail.harga || '',
                    kondisi: selectedItem.kondisi || (detail.kondisi === 'RUSAK' ? 'Rusak' : 'Baru'),
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
            
            let newBarangId = currentRow.barang_id;
            let newSerials = currentRow.serials;
            let newQty = currentRow.qty;

            if (field === 'gudang_asal_id' && currentRow.sub_jenis === 'TRANSFER_GUDANG') {
                const targetBarang = barangs.find(b => String(b.id) === String(newBarangId));
                const stockInNewWh = getBarangStockInWarehouse(targetBarang, value);
                if (stockInNewWh <= 0) {
                    newBarangId = '';
                    newSerials = [];
                    newQty = 1;
                } else {
                    newSerials = [];
                    newQty = 1;
                }
            }

            if (field === 'sub_jenis') {
                if (value === 'TRANSFER_GUDANG') {
                    const targetBarang = barangs.find(b => String(b.id) === String(newBarangId));
                    const stockInWh = getBarangStockInWarehouse(targetBarang, currentRow.gudang_asal_id);
                    if (stockInWh <= 0) newBarangId = '';
                    newSerials = [];
                    newQty = 1;
                } else {
                    const targetBarang = barangs.find(b => String(b.id) === String(newBarangId));
                    newSerials = targetBarang?.is_wajib_sn ? Array(newQty || 1).fill('') : [];
                }
            }

            updated[rowIdx] = { 
                ...currentRow, 
                [field]: value, 
                barang_id: newBarangId, 
                serials: newSerials,
                qty: newQty
            };
            return updated;
        });
    };

    const handleBarangChange = (rowIdx, newBarangId) => {
        const targetBarang = barangs.find(b => String(b.id) === String(newBarangId));
        const isSn = Boolean(targetBarang?.is_wajib_sn === true || targetBarang?.is_wajib_sn === 1 || targetBarang?.is_wajib_sn === '1');
        
        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            let currentQty = currentRow.qty || 1;

            if (currentRow.sub_jenis === 'TRANSFER_GUDANG') {
                const maxStok = getBarangStockInWarehouse(targetBarang, currentRow.gudang_asal_id);
                if (currentQty > maxStok && maxStok > 0) currentQty = maxStok;
            }

            updated[rowIdx] = {
                ...currentRow,
                barang_id: String(newBarangId),
                qty: currentQty,
                serials: isSn ? (currentRow.sub_jenis === 'TRANSFER_GUDANG' ? [] : Array(currentQty).fill('')) : []
            };
            return updated;
        });
    };

    const handleQtyChange = (rowIdx, val) => {
        let count = parseInt(val, 10);
        if (isNaN(count) || count < 1) count = 1;

        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            const targetBarang = barangs.find(b => String(b.id) === String(currentRow.barang_id));
            const isSn = Boolean(targetBarang?.is_wajib_sn === true || targetBarang?.is_wajib_sn === 1 || targetBarang?.is_wajib_sn === '1');
            
            if (currentRow.sub_jenis === 'TRANSFER_GUDANG' && targetBarang && currentRow.gudang_asal_id) {
                const maxStok = getBarangStockInWarehouse(targetBarang, currentRow.gudang_asal_id);
                if (maxStok > 0 && count > maxStok) count = maxStok;
            } else if (count > 50) {
                count = 50;
            }

            let newSerials = currentRow.serials || [];
            if (isSn) {
                if (currentRow.sub_jenis === 'TRANSFER_GUDANG') {
                    newSerials = newSerials.slice(0, count);
                } else {
                    newSerials = [...newSerials];
                    while (newSerials.length < count) newSerials.push('');
                    newSerials = newSerials.slice(0, count);
                }
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

    const handleToggleTransferSn = (rowIdx, snValue) => {
        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            const currentSerials = Array.isArray(currentRow.serials) ? [...currentRow.serials] : [];
            const exists = currentSerials.includes(snValue);
            
            let newSerials;
            if (exists) {
                newSerials = currentSerials.filter(s => s !== snValue);
            } else {
                newSerials = [...currentSerials, snValue];
            }

            const newQty = newSerials.length > 0 ? newSerials.length : 1;

            updated[rowIdx] = {
                ...currentRow,
                qty: newQty,
                serials: newSerials
            };
            return updated;
        });
    };

    const handleAutoSelectTransferSns = (rowIdx, availableList) => {
        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            const targetQty = currentRow.qty || 1;
            const autoSelected = availableList.slice(0, targetQty).map(s => s.serial_number);

            updated[rowIdx] = {
                ...currentRow,
                qty: autoSelected.length > 0 ? autoSelected.length : targetQty,
                serials: autoSelected
            };
            return updated;
        });
    };

    const handleClearTransferSns = (rowIdx) => {
        setRows(prev => {
            const updated = [...prev];
            updated[rowIdx] = {
                ...updated[rowIdx],
                qty: 1,
                serials: []
            };
            return updated;
        });
    };

    const getAvailableSerialsForTransfer = (barangId, gudangAsalId) => {
        if (!barangId || !gudangAsalId) return [];
        const targetBarang = barangs.find(b => String(b.id) === String(barangId));
        if (!targetBarang || !targetBarang.serials) return [];
        return targetBarang.serials.filter(
            s => String(s.gudang_id) === String(gudangAsalId) && s.status === 'IN_WAREHOUSE'
        );
    };

    const handleSubmitForm = (e) => {
        e?.preventDefault();
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const rowNum = i + 1;

            if (r.sub_jenis === 'TRANSFER_GUDANG') {
                if (!r.gudang_asal_id) {
                    alert(`Baris #${rowNum}: Gudang Asal pengirim wajib dipilih.`);
                    return;
                }
                if (!r.gudang_tujuan_id) {
                    alert(`Baris #${rowNum}: Gudang Tujuan penerima wajib dipilih.`);
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
                if (!r.nomor_imc.trim()) {
                    alert(`Baris #${rowNum}: Nomor IMC wajib diisi.`);
                    return;
                }
            } else {
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
            }

            if (!r.barang_id) {
                alert(`Baris #${rowNum}: Harap pilih barang terlebih dahulu.`);
                return;
            }

            const targetBarang = barangs.find(b => String(b.id) === String(r.barang_id));
            if (r.sub_jenis === 'TRANSFER_GUDANG' && targetBarang) {
                const stockAvailable = getBarangStockInWarehouse(targetBarang, r.gudang_asal_id);
                if (stockAvailable <= 0) {
                    alert(`Baris #${rowNum}: Stok barang '${targetBarang.nama_barang || targetBarang.kode_barang}' di gudang asal habis.`);
                    return;
                }
                if (r.qty > stockAvailable) {
                    alert(`Baris #${rowNum}: Kuantitas transfer (${r.qty}) melebihi stok yang tersedia (${stockAvailable} unit).`);
                    return;
                }
            }

            const isSn = Boolean(targetBarang?.is_wajib_sn === true || targetBarang?.is_wajib_sn === 1 || targetBarang?.is_wajib_sn === '1');
            if (isSn && !isEditMode) {
                if (r.serials.length !== r.qty) {
                    alert(`Baris #${rowNum}: Jumlah Serial Number terpilih (${r.serials.length}) harus tepat sesuai dengan Quantity (${r.qty} unit).`);
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
        snSearches,
        setSnSearches,
        gudangOptions,
        supplierOptions,
        getBarangPplOptionsForRow,
        getBarangNamaOptionsForRow,
        getBarangStockInWarehouse,
        handleAddMoreRows,
        handleRemoveRow,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleManualSerialChange,
        handleToggleTransferSn,
        handleAutoSelectTransferSns,
        handleClearTransferSns,
        getAvailableSerialsForTransfer,
        handleSubmitForm,
    };
}