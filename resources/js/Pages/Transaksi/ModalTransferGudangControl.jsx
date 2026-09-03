import { useState, useEffect, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';

export function useModalTransferGudangControl({
    isOpen,
    onClose,
    gudangs = [],
    barangs = []
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [snSearches, setSnSearches] = useState({});
    const [nonSnSearches, setNonSnSearches] = useState({});

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
        kondisi: 'Baru',
        gudang_asal_id: gudangs[0]?.id ? String(gudangs[0].id) : '',
        gudang_tujuan_id: gudangs[1]?.id ? String(gudangs[1].id) : (gudangs[0]?.id ? String(gudangs[0].id) : ''),
        barang_id: '',
        qty: 1,
        serials: [],
        non_sn_selections: {}
    }), [gudangs]);

    const [rows, setRows] = useState([createEmptyRow()]);

    useEffect(() => {
        if (isOpen) {
            setRows([createEmptyRow()]);
            setSnSearches({});
            setNonSnSearches({});
        }
    }, [isOpen, createEmptyRow]);

    const gudangOptions = useMemo(() => {
        return gudangs.map(g => ({ value: g.nama_gudang, label: g.nama_gudang, id: g.id }));
    }, [gudangs]);

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
                updated[idx].non_sn_selections = {};
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
                    serials: [],
                    non_sn_selections: {}
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
                serials: [],
                non_sn_selections: {}
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
            Object.values(selections).forEach(s => {
                kondisiParts.push(`${s.qty} ${s.kondisi}`);
            });

            updated[rowIdx] = {
                ...currentRow,
                non_sn_selections: selections,
                qty: totalUnit > 0 ? totalUnit : 1,
                kondisi: kondisiParts.length > 0 ? kondisiParts.join(', ') : 'Baru',
                // nomor_imc TIDAK LAGI DI-OVERWRITE OTOMATIS DI SINI (BIAR KOSONG / MANUAL KETIK)
            };
            return updated;
        });
    };

    const handleToggleSn = (rowIdx, snValue) => {
        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            const currentSerials = Array.isArray(currentRow.serials) ? [...currentRow.serials] : [];
            const exists = currentSerials.includes(snValue);
            const next = exists ? currentSerials.filter(s => s !== snValue) : [...currentSerials, snValue];
            updated[rowIdx] = {
                ...currentRow,
                qty: next.length > 0 ? next.length : 1,
                serials: next
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

    return {
        isProcessing,
        rows,
        setRows,
        snSearches,
        setSnSearches,
        nonSnSearches,
        setNonSnSearches,
        gudangOptions,
        getBarangStockInWarehouse,
        getBarangPplOptions,
        getBarangNamaOptions,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleNonSnBatchQtyChange,
        handleToggleSn,
        handleClearSns,
        handleSubmit,
        createEmptyRow
    };
}