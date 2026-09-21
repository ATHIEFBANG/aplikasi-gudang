import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';

export const MAX_ROWS_LIMIT = 50;

export function useModalTransferGudangControl({
    isOpen,
    isEditMode = false,
    selectedItem = null,
    gudangs = [],
    barangs = [],
    onClose
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [snSearches, setSnSearches] = useState({});
    const [nonSnSearches, setNonSnSearches] = useState({});

    // Kalkulasi Stok Fisik di Gudang Asal
    const getBarangStockInWarehouse = useCallback((barang, gudangId) => {
        if (!barang || !gudangId) return 0;
        if (barang.is_wajib_sn) {
            return (barang.serials || []).filter(
                s => String(s.gudang_id) === String(gudangId) && s.status === 'IN_WAREHOUSE'
            ).length;
        }

        const stokRec = barang.stoks?.find(st => String(st.gudang_id) === String(gudangId));
        const stokQty = stokRec ? parseInt(stokRec.jumlah, 10) : 0;

        const details = barang.transaksi_details || barang.transaksiDetails || [];
        const matchingMasuk = details
            .filter(td => td.transaksi && String(td.transaksi.gudang_tujuan_id) === String(gudangId))
            .reduce((sum, td) => sum + (parseInt(td.qty, 10) || 0), 0);

        return Math.max(stokQty, matchingMasuk);
    }, []);

    const createEmptyRow = useCallback(() => {
        const defaultAsal = gudangs[0]?.id ? String(gudangs[0].id) : '';
        const defaultTujuan = gudangs[1]?.id ? String(gudangs[1].id) : defaultAsal;
        return {
            sub_jenis: 'TRANSFER_GUDANG',
            tanggal: new Date().toISOString().slice(0, 10),
            nomor_omc: '',
            nomor_imc: '',
            gudang_asal_id: defaultAsal,
            gudang_tujuan_id: defaultTujuan,
            barang_id: '',
            qty: 1,
            kondisi: 'Baru',
            serials: [],
            non_sn_selections: {}
        };
    }, [gudangs]);

    const [rows, setRows] = useState([createEmptyRow()]);

    const gudangOptions = useMemo(() => {
        if (!isOpen) return [];

        return gudangs.map(g => ({
            value: g.nama_gudang,
            label: g.nama_gudang,
            id: g.id
        }));
    }, [isOpen, gudangs]);

    const getBarangPplOptionsForRow = useCallback((row) => {
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
                            {isSn && <span className="text-amber-500 font-bold">Wajib SN</span>}
                            {isSn && isPn && <span className="text-slate-400">&bull;</span>}
                            {isPn && <span className="text-cyan-600 font-bold">Wajib PN</span>}
                            {!isSn && !isPn && <span className="text-slate-400 font-medium">Standar</span>}
                        </div>
                    )
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
                    label: kombinasiNama,
                    id: b.id,
                    stock: stok,
                    subLabel: (
                        <div className="flex items-center gap-1 text-[8.5px] leading-none mt-0.5 font-sans">
                            <span className="text-slate-400 font-medium">Tersedia:</span>
                            <span className="font-mono font-bold text-emerald-600">
                                {stok} {b.deskripsi || b.satuan || 'Unit'}
                            </span>
                        </div>
                    )
                };
            });
    }, [barangs, getBarangStockInWarehouse]);

    useEffect(() => {
        if (isOpen) {
            setSnSearches({});
            setNonSnSearches({});
            if (isEditMode && selectedItem) {
                const detail = selectedItem.details?.[0] || {};
                const targetBarang = barangs.find(b => String(b.id) === String(detail.barang_id));
                const isSn = Boolean(targetBarang?.is_wajib_sn);
                const existingSns = detail.serials ? detail.serials.map(s => s.serial_number || s) : [];

                setRows([{
                    id: selectedItem.id,
                    sub_jenis: 'TRANSFER_GUDANG',
                    tanggal: selectedItem.tanggal ? String(selectedItem.tanggal).split('T')[0] : new Date().toISOString().slice(0, 10),
                    nomor_omc: selectedItem.nomor_omc || '',
                    nomor_imc: selectedItem.nomor_imc || '',
                    gudang_asal_id: selectedItem.gudang_asal_id ? String(selectedItem.gudang_asal_id) : '',
                    gudang_tujuan_id: selectedItem.gudang_tujuan_id ? String(selectedItem.gudang_tujuan_id) : '',
                    barang_id: detail.barang_id ? String(detail.barang_id) : '',
                    qty: detail.qty || 1,
                    kondisi: selectedItem.kondisi && selectedItem.kondisi !== '-' ? selectedItem.kondisi : 'Baru',
                    serials: isSn ? existingSns : [],
                    non_sn_selections: {}
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
            let newSelections = currentRow.non_sn_selections || {};

            if (field === 'gudang_asal_id') {
                newBarangId = '';
                newSerials = [];
                newQty = 1;
                newSelections = {};
            }

            updated[rowIdx] = { 
                ...currentRow, 
                [field]: value,
                barang_id: newBarangId,
                serials: newSerials,
                qty: newQty,
                non_sn_selections: newSelections
            };
            return updated;
        });
    };

    const handleBarangChange = (rowIdx, newBarangId) => {
        if (!newBarangId) {
            setRows(prev => {
                const updated = [...prev];
                updated[rowIdx] = {
                    ...updated[rowIdx],
                    barang_id: '',
                    qty: 1,
                    serials: [],
                    kondisi: 'Baru',
                    non_sn_selections: {}
                };
                return updated;
            });
            return;
        }

        const targetBarang = barangs.find(b => String(b.id) === String(newBarangId) || b.kode_barang?.toLowerCase() === String(newBarangId).toLowerCase());
        const realId = targetBarang ? String(targetBarang.id) : '';

        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            let currentQty = 1;
            const maxStok = getBarangStockInWarehouse(targetBarang, currentRow.gudang_asal_id);
            if (currentQty > maxStok && maxStok > 0) currentQty = maxStok;

            updated[rowIdx] = {
                ...currentRow,
                barang_id: realId,
                qty: currentQty,
                serials: [],
                kondisi: 'Baru',
                non_sn_selections: {}
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

    // Handler Stepper Non-SN
    const handleNonSnBatchQtyChange = (rowIdx, batchKey, batchData, nextQty, maxBatchStock) => {
        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            const selections = { ...(currentRow.non_sn_selections || {}) };

            const targetBarang = barangs.find(b => String(b.id) === String(currentRow.barang_id));
            const maxTotalStock = getBarangStockInWarehouse(targetBarang, currentRow.gudang_asal_id);

            let safeQty = parseInt(nextQty, 10);
            if (isNaN(safeQty) || safeQty <= 0) {
                delete selections[batchKey];
            } else {
                if (safeQty > maxBatchStock) safeQty = maxBatchStock;
                selections[batchKey] = {
                    nomor_imc: batchData.nomor_imc,
                    kondisi: batchData.kondisi,
                    qty: safeQty
                };
            }

            let totalUnit = Object.values(selections).reduce((acc, curr) => acc + (curr.qty || 0), 0);
            if (maxTotalStock > 0 && totalUnit > maxTotalStock) {
                totalUnit = maxTotalStock;
            }

            const kondisiParts = [];
            const imcParts = [];
            Object.values(selections).forEach(s => {
                kondisiParts.push(`${s.qty} ${s.kondisi}`);
                if (s.nomor_imc && !imcParts.includes(s.nomor_imc)) {
                    imcParts.push(s.nomor_imc);
                }
            });

            updated[rowIdx] = {
                ...currentRow,
                non_sn_selections: selections,
                qty: totalUnit > 0 ? totalUnit : 1,
                kondisi: kondisiParts.length > 0 ? kondisiParts.join(', ') : 'Baru',
                nomor_imc: imcParts.join(', ')
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
                serials: newSerials
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
            if (!r.gudang_asal_id) {
                alert(`Baris #${rowNum}: Gudang Asal wajib dipilih.`);
                return;
            }
            if (!r.gudang_tujuan_id) {
                alert(`Baris #${rowNum}: Gudang Tujuan wajib dipilih.`);
                return;
            }
            if (String(r.gudang_asal_id) === String(r.gudang_tujuan_id)) {
                alert(`Baris #${rowNum}: Gudang Tujuan tidak boleh sama dengan Gudang Asal.`);
                return;
            }
            if (!r.nomor_omc.trim()) {
                alert(`Baris #${rowNum}: Nomor OMC / Surat Transfer wajib diisi.`);
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
                    alert(`Baris #${rowNum}: Kuantitas transfer (${r.qty}) melebihi stok yang ada (${stockAvailable} unit).`);
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
                nomor_omc: rows[0].nomor_omc.trim(),
                gudang_asal_id: parseInt(rows[0].gudang_asal_id, 10),
                gudang_tujuan_id: parseInt(rows[0].gudang_tujuan_id, 10),
                qty: parseInt(rows[0].qty, 10),
            }
            : {
                items: rows.map(r => ({
                    tanggal: r.tanggal,
                    nomor_omc: r.nomor_omc.trim(),
                    gudang_asal_id: parseInt(r.gudang_asal_id, 10),
                    gudang_tujuan_id: parseInt(r.gudang_tujuan_id, 10),
                    barang_id: parseInt(r.barang_id, 10),
                    qty: parseInt(r.qty, 10),
                    serials: r.serials || []
                }))
            };

        const targetUrl = isEditMode ? `/transaksi-transfer/${selectedItem.id}` : '/transaksi-transfer';
        const method = isEditMode ? 'put' : 'post';
        router[method](targetUrl, payload, {
            preserveScroll: true,
            only: ['transaksis', 'filters'],
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
        setRows,
        snSearches,
        setSnSearches,
        nonSnSearches,
        setNonSnSearches,
        gudangOptions,
        getBarangPplOptions: getBarangPplOptionsForRow,
        getBarangNamaOptions: getBarangNamaOptionsForRow,
        getBarangStockInWarehouse,
        handleAddMoreRows,
        handleRemoveRow,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleNonSnBatchQtyChange,
        handleToggleSn: handleToggleTransferSn,
        handleClearSns: handleClearTransferSns,
        getAvailableSerialsForTransfer,
        handleSubmit: handleSubmitForm,
        createEmptyRow,
    };
}