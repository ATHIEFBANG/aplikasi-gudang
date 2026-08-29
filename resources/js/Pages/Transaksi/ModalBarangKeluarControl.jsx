import { useState, useEffect, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Truck, ArrowRightLeft, Wrench } from 'lucide-react';

export const MAX_ROWS_LIMIT = 50;

export const CATEGORIES_KELUAR = [
    { id: 'BARANG_KE_SITE', label: 'Barang ke Site', icon: Truck },
    { id: 'TRANSFER_GUDANG', label: 'Transfer Gudang', icon: ArrowRightLeft },
    { id: 'PEMAKAIAN_INTERNAL', label: 'Pemakaian Internal', icon: Wrench },
];

export function useModalBarangKeluarControl({
    isOpen,
    isEditMode = false,
    selectedItem = null,
    gudangs = [],
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
            sub_jenis: 'BARANG_KE_SITE',
            tanggal: new Date().toISOString().slice(0, 10),
            nomor_omc: '',
            nomor_imc: '',
            pihak_asal: '',
            gudang_asal_id: gudangs[0]?.id ? String(gudangs[0].id) : '',
            gudang_tujuan_id: '',
            barang_id: '',
            qty: 1,
            harga: '',
            kondisi: '-',
            serials: []
        };
    }, [gudangs]);

    const [rows, setRows] = useState([createEmptyRow()]);

    const gudangOptions = useMemo(() => {
        return gudangs.map(g => ({ value: g.nama_gudang, label: g.nama_gudang, id: g.id }));
    }, [gudangs]);

    const getBarangPplOptionsForRow = useCallback((row) => {
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
    }, [barangs, getBarangStockInWarehouse]);

    const getBarangNamaOptionsForRow = useCallback((row) => {
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
                    sub_jenis: selectedItem.sub_jenis || 'BARANG_KE_SITE',
                    tanggal: selectedItem.tanggal ? String(selectedItem.tanggal).split('T')[0] : new Date().toISOString().slice(0, 10),
                    nomor_omc: selectedItem.nomor_omc || '',
                    nomor_imc: selectedItem.nomor_imc || '',
                    pihak_asal: selectedItem.pihak_asal || '',
                    gudang_asal_id: selectedItem.gudang_asal_id ? String(selectedItem.gudang_asal_id) : '',
                    gudang_tujuan_id: selectedItem.gudang_tujuan_id ? String(selectedItem.gudang_tujuan_id) : '',
                    barang_id: detail.barang_id ? String(detail.barang_id) : '',
                    qty: detail.qty || 1,
                    kondisi: '-',
                    serials: isSn ? existingSns : []
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

            if (field === 'gudang_asal_id') {
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

            updated[rowIdx] = { 
                ...currentRow, 
                [field]: value, 
                barang_id: newBarangId, 
                serials: newSerials,
                qty: newQty,
                kondisi: '-'
            };
            return updated;
        });
    };

    const handleBarangChange = (rowIdx, newBarangId) => {
        const targetBarang = barangs.find(b => String(b.id) === String(newBarangId));
        
        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            let currentQty = currentRow.qty || 1;
            const maxStok = getBarangStockInWarehouse(targetBarang, currentRow.gudang_asal_id);
            if (currentQty > maxStok && maxStok > 0) currentQty = maxStok;

            updated[rowIdx] = {
                ...currentRow,
                barang_id: String(newBarangId),
                qty: currentQty,
                serials: []
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
            const isSn = Boolean(targetBarang?.is_wajib_sn);
            
            if (targetBarang && currentRow.gudang_asal_id) {
                const maxStok = getBarangStockInWarehouse(targetBarang, currentRow.gudang_asal_id);
                if (maxStok > 0 && count > maxStok) count = maxStok;
            }

            let newSerials = currentRow.serials || [];
            if (isSn) {
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

    const handleToggleTransferSn = (rowIdx, snValue) => {
        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            const currentSerials = Array.isArray(currentRow.serials) ? [...currentRow.serials] : [];
            const exists = currentSerials.includes(snValue);
            
            let newSerials = exists ? currentSerials.filter(s => s !== snValue) : [...currentSerials, snValue];
            const newQty = newSerials.length > 0 ? newSerials.length : 1;

            updated[rowIdx] = {
                ...currentRow,
                qty: newQty,
                kondisi: '-',
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
                kondisi: '-',
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

    const getAvailableSerialsForOutbound = (barangId, gudangAsalId) => {
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

            if (!r.gudang_asal_id) {
                alert(`Baris #${rowNum}: Gudang Asal tempat barang diambil wajib dipilih.`);
                return;
            }
            if (!r.nomor_omc.trim()) {
                alert(`Baris #${rowNum}: Nomor OMC (Surat Jalan Keluar) wajib diisi.`);
                return;
            }
            if (r.sub_jenis === 'TRANSFER_GUDANG') {
                if (!r.gudang_tujuan_id) {
                    alert(`Baris #${rowNum}: Gudang Tujuan penerima wajib dipilih.`);
                    return;
                }
                if (String(r.gudang_asal_id) === String(r.gudang_tujuan_id)) {
                    alert(`Baris #${rowNum}: Gudang Asal dan Tujuan tidak boleh sama.`);
                    return;
                }
            } else if (!r.pihak_asal.trim()) {
                const labelTarget = r.sub_jenis === 'BARANG_KE_SITE' ? 'Site Tujuan / Teknisi' : 'Keperluan / PIC Pemakai';
                alert(`Baris #${rowNum}: ${labelTarget} wajib diisi.`);
                return;
            }

            if (!r.barang_id) {
                alert(`Baris #${rowNum}: Harap pilih barang terlebih dahulu.`);
                return;
            }

            const targetBarang = barangs.find(b => String(b.id) === String(r.barang_id));
            if (targetBarang) {
                const stockAvailable = getBarangStockInWarehouse(targetBarang, r.gudang_asal_id);
                if (stockAvailable <= 0) {
                    alert(`Baris #${rowNum}: Stok barang '${targetBarang.nama_barang}' di gudang asal habis.`);
                    return;
                }
                if (r.qty > stockAvailable) {
                    alert(`Baris #${rowNum}: Kuantitas pengeluaran (${r.qty}) melebihi stok yang ada (${stockAvailable} unit).`);
                    return;
                }
            }

            const isSn = Boolean(targetBarang?.is_wajib_sn);
            if (isSn && !isEditMode) {
                if (r.serials.length !== r.qty) {
                    alert(`Baris #${rowNum}: Silakan centang Serial Number tepat ${r.qty} unit.`);
                    return;
                }
            }
        }

        setIsProcessing(true);
        const payload = isEditMode
            ? {
                tanggal: rows[0].tanggal,
                kondisi: '-',
                nomor_omc: rows[0].nomor_omc.trim(),
                nomor_imc: rows[0].nomor_imc ? rows[0].nomor_imc.trim() : null,
                pihak_asal: rows[0].pihak_asal.trim(),
                gudang_tujuan_id: rows[0].sub_jenis === 'TRANSFER_GUDANG' ? parseInt(rows[0].gudang_tujuan_id, 10) : null,
            }
            : {
                items: rows.map(r => ({
                    sub_jenis: r.sub_jenis,
                    tanggal: r.tanggal,
                    kondisi: '-',
                    nomor_omc: r.nomor_omc.trim(),
                    nomor_imc: r.nomor_imc ? r.nomor_imc.trim() : null,
                    pihak_asal: r.pihak_asal.trim(),
                    gudang_asal_id: parseInt(r.gudang_asal_id, 10),
                    gudang_tujuan_id: r.sub_jenis === 'TRANSFER_GUDANG' ? parseInt(r.gudang_tujuan_id, 10) : null,
                    barang_id: parseInt(r.barang_id, 10),
                    qty: parseInt(r.qty, 10),
                    serials: r.serials || []
                }))
            };

        const targetUrl = isEditMode ? `/transaksi-keluar/${selectedItem.id}` : '/transaksi-keluar';
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
        getBarangPplOptionsForRow,
        getBarangNamaOptionsForRow,
        getBarangStockInWarehouse,
        handleAddMoreRows,
        handleRemoveRow,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleToggleTransferSn,
        handleAutoSelectTransferSns,
        handleClearTransferSns,
        getAvailableSerialsForOutbound,
        handleSubmitForm,
    };
}