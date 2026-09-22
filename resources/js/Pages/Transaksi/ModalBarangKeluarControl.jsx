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
    'Purchasing',
    'Gudang'
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

    // 💡 Helper presisi menghitung stok barang di gudang tertentu
    const getBarangStockInWarehouse = useCallback((barang, gudangIdOrName) => {
        if (!barang || !gudangIdOrName) return 0;

        const targetGudang = gudangs.find(g => 
            String(g.id) === String(gudangIdOrName) || 
            (g.nama_gudang && g.nama_gudang.toLowerCase().trim() === String(gudangIdOrName).toLowerCase().trim())
        );

        const targetGudangId = targetGudang ? String(targetGudang.id) : String(gudangIdOrName);
        const targetGudangName = targetGudang ? targetGudang.nama_gudang.toLowerCase().trim() : String(gudangIdOrName).toLowerCase().trim();

        const isSn = Boolean(barang.is_wajib_sn === true || barang.is_wajib_sn === 1 || barang.is_wajib_sn === '1');

        // 1. Jika Wajib SN, hitung serial number yang siap pakai di gudang tersebut
        if (isSn && Array.isArray(barang.serials) && barang.serials.length > 0) {
            const matchedSns = barang.serials.filter(s => {
                const sGudangId = String(s.gudang_id || '');
                const sGudangName = String(s.gudang?.nama_gudang || s.nama_gudang || '').toLowerCase().trim();
                const isMatch = sGudangId === targetGudangId || (sGudangName && (targetGudangName.includes(sGudangName) || sGudangName.includes(targetGudangName)));
                const isAvailable = !s.status || s.status === 'IN_WAREHOUSE' || s.status === 'READY' || s.status === 'AVAILABLE';
                return isMatch && isAvailable;
            });
            if (matchedSns.length > 0) return matchedSns.length;
        }

        // 2. Cek dari array relasi `stoks`
        const stoksArray = barang.stoks || barang.stok || [];
        if (Array.isArray(stoksArray) && stoksArray.length > 0) {
            const stokRec = stoksArray.find(st => {
                const stGudangId = String(st.gudang_id || st.id || '');
                const stGudangName = String(st.gudang?.nama_gudang || st.nama_gudang || '').toLowerCase().trim();
                return stGudangId === targetGudangId || (stGudangName && targetGudangName.includes(stGudangName));
            });
            if (stokRec) {
                return parseInt(stokRec.jumlah || stokRec.qty || 0, 10);
            }
        }

        // 3. Fallback pencocokan riwayat transaksi_details
        const details = barang.transaksi_details || barang.transaksiDetails || [];
        if (Array.isArray(details) && details.length > 0) {
            const matchingMasuk = details
                .filter(td => {
                    const tr = td.transaksi || {};
                    const gTujuanId = String(tr.gudang_tujuan_id || tr.gudang_id || td.gudang_tujuan_id || '');
                    const gTujuanName = String(tr.gudang_tujuan?.nama_gudang || tr.gudang?.nama_gudang || '').toLowerCase().trim();
                    return gTujuanId === targetGudangId || (gTujuanName && targetGudangName.includes(gTujuanName));
                })
                .reduce((sum, td) => sum + (parseInt(td.qty, 10) || 0), 0);

            if (matchingMasuk > 0) return matchingMasuk;
        }

        return 0;
    }, [gudangs]);

    const createEmptyRow = useCallback(() => {
        // Otomatis pilih gudang pertama yang punya stok
        const gudangWithStock = gudangs.find(g => {
            return barangs.some(b => getBarangStockInWarehouse(b, g.id) > 0);
        });
        const defaultGudangId = gudangWithStock ? String(gudangWithStock.id) : (gudangs[0]?.id ? String(gudangs[0].id) : '');

        return {
            sub_jenis: 'BARANG_KE_SITE',
            tanggal: new Date().toISOString().slice(0, 10),
            nomor_omc: '',
            nomor_imc: '',
            pihak_asal: '',
            kode_projek: '',
            nama_customer: '',
            gudang_asal_id: defaultGudangId,
            barang_id: '',
            qty: 1,
            harga: '',
            kondisi: 'Baru',
            serials: [],
            non_sn_selections: {}
        };
    }, [gudangs, barangs, getBarangStockInWarehouse]);

    const [rows, setRows] = useState([createEmptyRow()]);

    // 💡 Ringkasan Pilihan Gudang Asal
    const gudangOptions = useMemo(() => {
        if (!isOpen) return [];

        return gudangs.map(g => {
            let countBaru = 0;
            let countBekas = 0;
            let countRusak = 0;

            barangs.forEach(b => {
                const stokQty = getBarangStockInWarehouse(b, g.id);
                countBaru += stokQty;
            });

            return {
                value: String(g.id),
                label: g.nama_gudang,
                id: g.id,
                subLabel: (
                    <div className="flex items-center gap-1.5 text-[8.5px] leading-none mt-0.5 font-sans">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {countBaru} Baru
                        </span>
                        <span className="text-slate-400 dark:text-slate-600 text-[7px]">&bull;</span>
                        <span className="font-bold text-amber-500 dark:text-amber-400">
                            {countBekas} Bekas
                        </span>
                        <span className="text-slate-400 dark:text-slate-600 text-[7px]">&bull;</span>
                        <span className="font-bold text-rose-500 dark:text-rose-400">
                            {countRusak} Rusak
                        </span>
                    </div>
                )
            };
        });
    }, [isOpen, gudangs, barangs, getBarangStockInWarehouse]);

    // 💡 Opsi Kode PPL: HANYA MENAMPILKAN BARANG YANG ADA STOK DI GUDANG ASAL TERPILIH
    const getBarangPplOptionsForRow = useCallback((row) => {
        if (!barangs || barangs.length === 0 || !row?.gudang_asal_id) return [];

        const targetGudangId = String(row.gudang_asal_id);

        return barangs
            .filter(b => getBarangStockInWarehouse(b, targetGudangId) > 0)
            .map(b => {
                const stok = getBarangStockInWarehouse(b, targetGudangId);
                const isSn = Boolean(b.is_wajib_sn === true || b.is_wajib_sn === 1 || b.is_wajib_sn === '1');
                const isPn = Boolean(b.is_wajib_pn === true || b.is_wajib_pn === 1 || b.is_wajib_pn === '1');

                return {
                    value: b.kode_barang,
                    label: b.kode_barang,
                    id: String(b.id),
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
                            <span className="text-slate-400 dark:text-slate-600 text-[7px]">&bull;</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                Stok: {stok}
                            </span>
                        </div>
                    )
                };
            });
    }, [barangs, getBarangStockInWarehouse]);

    // 💡 Opsi Nama Barang: HANYA MENAMPILKAN BARANG YANG ADA STOK DI GUDANG ASAL TERPILIH
    const getBarangNamaOptionsForRow = useCallback((row) => {
        if (!barangs || barangs.length === 0 || !row?.gudang_asal_id) return [];

        const targetGudangId = String(row.gudang_asal_id);

        return barangs
            .filter(b => getBarangStockInWarehouse(b, targetGudangId) > 0)
            .map(b => {
                const stok = getBarangStockInWarehouse(b, targetGudangId);
                const kombinasiNama = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang || b.kode_barang;
                return {
                    value: kombinasiNama,
                    label: kombinasiNama,
                    id: String(b.id),
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
                    kode_projek: selectedItem.kode_projek || '',
                    nama_customer: selectedItem.nama_customer || '',
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
            
            let newGudangAsalId = currentRow.gudang_asal_id;
            let newBarangId = currentRow.barang_id;
            let newSerials = currentRow.serials;
            let newQty = currentRow.qty;
            let newPihakAsal = currentRow.pihak_asal;
            let newNomorImc = currentRow.nomor_imc;
            let newSelections = currentRow.non_sn_selections || {};

            if (field === 'gudang_asal_id') {
                const targetG = gudangs.find(g => String(g.id) === String(value) || g.nama_gudang === value);
                newGudangAsalId = targetG ? String(targetG.id) : String(value);
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
                gudang_asal_id: field === 'gudang_asal_id' ? newGudangAsalId : currentRow.gudang_asal_id,
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

    // 💡 PENANGANAN PRESISI: Mengatasi Bug Kedip & Set ID Barang
    const handleBarangChange = (rowIdx, newBarangId) => {
        if (!newBarangId) {
            setRows(prev => {
                const updated = [...prev];
                updated[rowIdx] = {
                    ...updated[rowIdx],
                    barang_id: '',
                    qty: 1,
                    serials: [],
                    nomor_imc: '',
                    kondisi: 'Baru',
                    non_sn_selections: {}
                };
                return updated;
            });
            return;
        }

        const searchStr = String(newBarangId).toLowerCase().trim();
        const targetBarang = barangs.find(b => {
            if (String(b.id) === searchStr) return true;
            if (b.kode_barang && String(b.kode_barang).toLowerCase().trim() === searchStr) return true;
            if (b.nama_barang && String(b.nama_barang).toLowerCase().trim() === searchStr) return true;
            const combo = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ').toLowerCase().trim();
            if (combo && combo === searchStr) return true;
            return false;
        });

        if (!targetBarang) return;

        const realId = String(targetBarang.id);

        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];
            let currentQty = 1;

            if (currentRow.gudang_asal_id) {
                const maxStok = getBarangStockInWarehouse(targetBarang, currentRow.gudang_asal_id);
                if (currentQty > maxStok && maxStok > 0) currentQty = maxStok;
            }

            updated[rowIdx] = {
                ...currentRow,
                barang_id: realId,
                qty: currentQty,
                serials: [],
                nomor_imc: targetBarang.kode_barang || '',
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

    // 💡 PENANGANAN SERIAL NUMBER: Pencocokan gudang_id dan status IN_WAREHOUSE
    const getAvailableSerialsForOutbound = (barangId, gudangAsalId) => {
        if (!barangId || !gudangAsalId) return [];
        const targetBarang = barangs.find(b => String(b.id) === String(barangId));
        if (!targetBarang || !Array.isArray(targetBarang.serials)) return [];

        const targetGudangObj = gudangs.find(g => 
            String(g.id) === String(gudangAsalId) || 
            (g.nama_gudang && g.nama_gudang.toLowerCase().trim() === String(gudangAsalId).toLowerCase().trim())
        );
        const targetGudangId = targetGudangObj ? String(targetGudangObj.id) : String(gudangAsalId);

        return targetBarang.serials.filter(s => {
            const matchGudang = String(s.gudang_id) === targetGudangId;
            const matchStatus = !s.status || s.status === 'IN_WAREHOUSE' || s.status === 'READY' || s.status === 'AVAILABLE';
            return matchGudang && matchStatus;
        });
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
                if (stockAvailable > 0 && r.qty > stockAvailable) {
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
                kode_projek: rows[0].kode_projek ? rows[0].kode_projek.trim() : null,
                nama_customer: rows[0].nama_customer ? rows[0].nama_customer.trim() : null,
            }
            : {
                items: rows.map(r => ({
                    sub_jenis: r.sub_jenis,
                    tanggal: r.tanggal,
                    kondisi: r.kondisi || 'Baru',
                    nomor_omc: r.nomor_omc.trim(),
                    nomor_imc: r.nomor_imc ? r.nomor_imc.trim() : null,
                    pihak_asal: r.pihak_asal.trim(),
                    kode_projek: r.kode_projek ? r.kode_projek.trim() : null,
                    nama_customer: r.nama_customer ? r.nama_customer.trim() : null,
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
            only: ['transaksis', 'filters'],
            onSuccess: (page) => {
                setIsProcessing(false);
                if (!page.props.flash?.error) {
                    onClose();
                }
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
        getBarangPplOptions: getBarangPplOptionsForRow,
        getBarangNamaOptions: getBarangNamaOptionsForRow,
        getBarangPplOptionsForRow,
        getBarangNamaOptionsForRow,
        getBarangStockInWarehouse,
        handleAddMoreRows,
        handleRemoveRow,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleNonSnBatchQtyChange,
        handleToggleTransferSn,
        handleAutoSelectTransferSns,
        handleClearTransferSns,
        getAvailableSerialsForOutbound,
        handleSubmitForm,
    };
}