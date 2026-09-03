import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Truck, Wrench } from 'lucide-react';

export const MAX_ROWS_LIMIT = 50;

export const CATEGORIES_KELUAR = [
    { id: 'BARANG_KE_SITE', label: 'Proyek', icon: Truck },
    { id: 'PEMAKAIAN_INTERNAL', label: 'Non Proyek', icon: Wrench },
];

export const LIST_KEPERLUAN_PATEN = [
    'General Affair',
    'Operasional',
    'Finance',
    'Sales',
    'Bill-co',
    'Compliance',
    'Purchasing'
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

    // Kalkulasi Stok Fisik: Menghitung total transaksi masuk riil di gudang jika data stoks belum sinkron
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
        return {
            sub_jenis: 'BARANG_KE_SITE',
            tanggal: new Date().toISOString().slice(0, 10),
            nomor_omc: '',
            nomor_imc: '',
            pihak_asal: '',
            gudang_asal_id: gudangs[0]?.id ? String(gudangs[0].id) : '',
            barang_id: '',
            qty: 1,
            harga: '',
            kondisi: 'Baru',
            serials: [],
            non_sn_selections: {}
        };
    }, [gudangs]);

    const [rows, setRows] = useState([createEmptyRow()]);

    const gudangOptions = useMemo(() => {
        return gudangs.map(g => {
            let baru  = g.stok_baru;
            let bekas = g.stok_bekas;
            let rusak = g.stok_rusak;

            if (baru === undefined || bekas === undefined || rusak === undefined) {
                let countBaru = 0;
                let countBekas = 0;
                let countRusak = 0;

                barangs.forEach(b => {
                    if (b.is_wajib_sn) {
                        (b.serials || []).forEach(s => {
                            if (String(s.gudang_id) === String(g.id) && s.status === 'IN_WAREHOUSE') {
                                const k = String(s.kondisi || 'Baru').toUpperCase();
                                if (k === 'RUSAK') countRusak++;
                                else if (k.includes('BEKAS') || k.includes('SECOND')) countBekas++;
                                else countBaru++;
                            }
                        });
                    } else {
                        const stokRec = (b.stoks || []).find(st => String(st.gudang_id) === String(g.id));
                        if (stokRec && stokRec.jumlah > 0) {
                            countBaru += parseInt(stokRec.jumlah, 10);
                        }
                    }
                });

                baru  = countBaru;
                bekas = countBekas;
                rusak = countRusak;
            }

            return {
                value: g.nama_gudang,
                label: g.nama_gudang,
                id: g.id,
                subLabel: (
                    <div className="flex items-center gap-1.5 text-[8.5px] leading-none mt-0.5 font-sans">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {baru} Baru
                        </span>
                        <span className="text-slate-400 dark:text-slate-600 text-[7px]">&bull;</span>
                        <span className="font-bold text-amber-500 dark:text-amber-400">
                            {bekas} Bekas
                        </span>
                        <span className="text-slate-400 dark:text-slate-600 text-[7px]">&bull;</span>
                        <span className="font-bold text-rose-500 dark:text-rose-400">
                            {rusak} Rusak
                        </span>
                    </div>
                )
            };
        });
    }, [gudangs, barangs]);

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
                            <span className="text-slate-400 dark:text-slate-500 font-medium">Tersedia:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
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
            let newPihakAsal = currentRow.pihak_asal;
            let newNomorImc = currentRow.nomor_imc;
            let newSelections = currentRow.non_sn_selections || {};

            if (field === 'gudang_asal_id') {
                newBarangId = '';
                newSerials = [];
                newQty = 1;
                newNomorImc = '';
                newSelections = {};
            }

            if (field === 'sub_jenis') {
                if (value === 'PEMAKAIAN_INTERNAL') {
                    if (!LIST_KEPERLUAN_PATEN.includes(newPihakAsal)) {
                        newPihakAsal = LIST_KEPERLUAN_PATEN[0];
                    }
                } else {
                    if (LIST_KEPERLUAN_PATEN.includes(newPihakAsal)) {
                        newPihakAsal = '';
                    }
                }
            } else if (field === 'pihak_asal') {
                newPihakAsal = value;
            }

            updated[rowIdx] = { 
                ...currentRow, 
                [field]: value,
                barang_id: newBarangId,
                serials: newSerials,
                qty: newQty,
                pihak_asal: newPihakAsal,
                nomor_imc: newNomorImc,
                non_sn_selections: newSelections
            };
            return updated;
        });
    };

    const handleBarangChange = (rowIdx, newBarangId) => {
        const targetBarang = barangs.find(b => String(b.id) === String(newBarangId));
        
        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            let currentQty = 1;
            const maxStok = getBarangStockInWarehouse(targetBarang, currentRow.gudang_asal_id);
            if (currentQty > maxStok && maxStok > 0) currentQty = maxStok;

            updated[rowIdx] = {
                ...currentRow,
                barang_id: String(newBarangId),
                qty: currentQty,
                serials: [],
                nomor_imc: '',
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

    // Handler Penambahan / Pengurangan Stepper Pada Kartu Non-SN
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

            // Total Qty otomatis mengikuti jumlah seluruh kartu terpilih
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

    // Handler Pilih Otomatis Batch Non-SN
    const handleAutoSelectNonSnBatches = (rowIdx, batches, targetQty) => {
        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            const selections = {};
            let remaining = targetQty || 1;

            for (const b of batches) {
                if (remaining <= 0) break;
                const allocate = Math.min(remaining, b.max_stock);
                if (allocate > 0) {
                    selections[b.key] = {
                        nomor_imc: b.nomor_imc,
                        kondisi: b.kondisi,
                        qty: allocate
                    };
                    remaining -= allocate;
                }
            }

            const totalUnit = Object.values(selections).reduce((acc, curr) => acc + (curr.qty || 0), 0);
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
            if (!r.pihak_asal || !r.pihak_asal.trim()) {
                const labelTarget = r.sub_jenis === 'BARANG_KE_SITE' ? 'Site Tujuan / Teknisi' : 'Departemen Keperluan';
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
                kondisi: rows[0].kondisi || 'Baru',
                nomor_omc: rows[0].nomor_omc.trim(),
                nomor_imc: rows[0].nomor_imc ? rows[0].nomor_imc.trim() : null,
                pihak_asal: rows[0].pihak_asal.trim(),
            }
            : {
                items: rows.map(r => ({
                    sub_jenis: r.sub_jenis,
                    tanggal: r.tanggal,
                    kondisi: r.kondisi || 'Baru',
                    nomor_omc: r.nomor_omc.trim(),
                    nomor_imc: r.nomor_imc ? r.nomor_imc.trim() : null,
                    pihak_asal: r.pihak_asal.trim(),
                    gudang_asal_id: parseInt(r.gudang_asal_id, 10),
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
        handleNonSnBatchQtyChange,
        handleAutoSelectNonSnBatches,
        handleToggleTransferSn,
        handleAutoSelectTransferSns,
        handleClearTransferSns,
        getAvailableSerialsForOutbound,
        handleSubmitForm,
    };
}