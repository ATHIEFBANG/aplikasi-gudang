import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';

export const MAX_ROWS_LIMIT = 50;

const isBooleanFlag = value =>
    value === true || value === 1 || value === '1' ||
    String(value).toLowerCase() === 'true';

const resolveGudangId = (gudangs, gudangIdOrName) => {
    if (!gudangIdOrName) return null;

    const target = gudangs.find(g =>
        String(g.id) === String(gudangIdOrName) ||
        (g.nama_gudang &&
            g.nama_gudang.toLowerCase().trim() ===
            String(gudangIdOrName).toLowerCase().trim())
    );

    return target ? String(target.id) : String(gudangIdOrName);
};

export function useModalTransferGudangControl({
    isOpen,
    isEditMode = false,
    selectedItem = null,
    gudangs = [],
    barangs = [],
    onClose
}) {
    const [isProcessing, setIsProcessing] = useState(false);

    const getBarangStockInWarehouse = useCallback((barang, gudangIdOrName) => {
        if (!barang || !gudangIdOrName) return 0;

        const targetGudangId = resolveGudangId(gudangs, gudangIdOrName);
        if (!targetGudangId) return 0;

        const isSn =
            isBooleanFlag(barang.is_wajib_sn) ||
            isBooleanFlag(barang.is_sn);

        const serialList = Array.isArray(barang.serials)
            ? barang.serials
            : Array.isArray(barang.serial_numbers)
                ? barang.serial_numbers
                : Array.isArray(barang.serialNumbers)
                    ? barang.serialNumbers
                    : [];

        // Transfer Gudang boleh memindahkan Baru, Bekas, maupun Rusak.
        if (isSn && serialList.length > 0) {
            return serialList.filter(s => {
                if (!s || typeof s !== 'object') return false;

                const sGudangId =
                    s.gudang_id ??
                    s.gudang?.id ??
                    s.pivot?.gudang_id ??
                    s.warehouse_id;

                const status = String(s.status || '').toUpperCase().trim();

                return (
                    String(sGudangId) === targetGudangId &&
                    ['IN_WAREHOUSE', 'READY', 'AVAILABLE'].includes(status)
                );
            }).length;
        }

        const kondisiStok = barang.kondisi_stok?.[targetGudangId];

        if (kondisiStok) {
            const baru = Number(kondisiStok.baru || 0);
            const bekas = Number(kondisiStok.bekas || 0);
            const rusak = Number(kondisiStok.rusak || 0);

            return baru + bekas + rusak;
        }

        const stoksArray = barang.stoks || barang.stok || [];
        const stokRec = Array.isArray(stoksArray)
            ? stoksArray.find(
                st => String(st.gudang_id || st.id || '') === targetGudangId
            )
            : null;

        return stokRec
            ? parseInt(stokRec.jumlah || stokRec.qty || 0, 10)
            : 0;
    }, [gudangs]);

    const getBarangKondisiStok = useCallback((barang, gudangIdOrName) => {
        if (!barang || !gudangIdOrName) {
            return {
                baru: 0,
                bekas: 0,
                rusak: 0,
                aktif: 0
            };
        }

        const gudangId = resolveGudangId(gudangs, gudangIdOrName);
        const kondisiStok = barang.kondisi_stok?.[gudangId];

        if (kondisiStok) {
            const baru = Number(kondisiStok.baru || 0);
            const bekas = Number(kondisiStok.bekas || 0);
            const rusak = Number(kondisiStok.rusak || 0);

            return {
                baru,
                bekas,
                rusak,
                aktif: baru + bekas + rusak
            };
        }

        return {
            baru: 0,
            bekas: 0,
            rusak: 0,
            aktif: getBarangStockInWarehouse(barang, gudangIdOrName)
        };
    }, [gudangs, getBarangStockInWarehouse]);

    const createEmptyRow = useCallback(() => {
        const defaultAsal = gudangs[0]?.id
            ? String(gudangs[0].id)
            : '';

        const defaultTujuan = gudangs[1]?.id
            ? String(gudangs[1].id)
            : defaultAsal;

        return {
            sub_jenis: 'TRANSFER_GUDANG',
            tanggal: new Date().toISOString().slice(0, 10),
            nomor_omc: '',
            nomor_imc: '',
            gudang_asal_id: defaultAsal,
            gudang_tujuan_id: defaultTujuan,
            barang_id: '',
            qty: 0,
            kondisi: 'Baru',
            serials: [],
            non_sn_selections: {}
        };
    }, [gudangs]);

    const [rows, setRows] = useState([createEmptyRow()]);

    const gudangOptions = useMemo(() => {
        if (!isOpen) return [];

        return gudangs.map(g => ({
            value: String(g.id),
            label: g.nama_gudang,
            id: String(g.id),
            subLabel: (
                <div className="flex items-center gap-1.5 text-[8.5px] leading-none mt-0.5 font-sans">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {g.stok_baru ?? 0} Baru
                    </span>

                    <span className="text-slate-400 dark:text-slate-600 text-[7px]">
                        &bull;
                    </span>

                    <span className="font-bold text-amber-500 dark:text-amber-400">
                        {g.stok_bekas ?? 0} Bekas
                    </span>

                    <span className="text-slate-400 dark:text-slate-600 text-[7px]">
                        &bull;
                    </span>

                    <span className="font-bold text-rose-500 dark:text-rose-400">
                        {g.stok_rusak ?? 0} Rusak
                    </span>
                </div>
            )
        }));
    }, [isOpen, gudangs]);

    const getBarangPplOptionsForRow = useCallback(row => {
        if (!row?.gudang_asal_id) return [];

        const gudangId = String(row.gudang_asal_id);

        return barangs
            .filter(b => getBarangStockInWarehouse(b, gudangId) > 0)
            .map(b => {
                const stok = getBarangStockInWarehouse(b, gudangId);
                const isSn =
                    isBooleanFlag(b.is_wajib_sn) ||
                    isBooleanFlag(b.is_sn);

                const isPn =
                    isBooleanFlag(b.is_wajib_pn) ||
                    isBooleanFlag(b.is_pn);

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
                                <span className="text-amber-500 font-bold">
                                    Wajib SN
                                </span>
                            )}

                            {isSn && isPn && (
                                <span className="text-slate-400">
                                    &bull;
                                </span>
                            )}

                            {isPn && (
                                <span className="text-cyan-600 font-bold">
                                    Wajib PN
                                </span>
                            )}

                            {!isSn && !isPn && (
                                <span className="text-slate-400 font-medium">
                                    Standar
                                </span>
                            )}

                            <span className="text-slate-400">
                                &bull;
                            </span>

                            <span className="font-mono font-bold text-emerald-600">
                                Stok: {stok}
                            </span>
                        </div>
                    )
                };
            });
    }, [barangs, getBarangStockInWarehouse]);

    const getBarangNamaOptionsForRow = useCallback(row => {
        if (!row?.gudang_asal_id) return [];

        const gudangId = String(row.gudang_asal_id);

        return barangs
            .filter(b => getBarangStockInWarehouse(b, gudangId) > 0)
            .map(b => {
                const stok = getBarangStockInWarehouse(b, gudangId);

                const nama =
                    [b.brand, b.tipe, b.kategori]
                        .filter(Boolean)
                        .join(' ') ||
                    b.nama_barang ||
                    b.kode_barang;

                return {
                    value: nama,
                    label: nama,
                    id: String(b.id),
                    stock: stok,
                    subLabel: (
                        <div className="flex items-center gap-1 text-[8.5px] leading-none mt-0.5 font-sans">
                            <span className="text-slate-400 font-medium">
                                Tersedia:
                            </span>

                            <span className="font-mono font-bold text-emerald-600">
                                {stok} {b.deskripsi || b.satuan || 'Unit'}
                            </span>
                        </div>
                    )
                };
            });
    }, [barangs, getBarangStockInWarehouse]);

    useEffect(() => {
        if (!isOpen) return;

        if (isEditMode && selectedItem) {
            const detail = selectedItem.details?.[0] || {};

            const targetBarang = barangs.find(
                b => String(b.id) === String(detail.barang_id)
            );

            const isSn =
                isBooleanFlag(targetBarang?.is_wajib_sn) ||
                isBooleanFlag(targetBarang?.is_sn);

            const existingSns = detail.serials
                ? detail.serials.map(s =>
                    typeof s === 'string'
                        ? s
                        : (
                            s.serial_number ||
                            s.sn ||
                            s.serial ||
                            s
                        )
                )
                : [];

            setRows([{
                id: selectedItem.id,
                sub_jenis: 'TRANSFER_GUDANG',
                tanggal: selectedItem.tanggal
                    ? String(selectedItem.tanggal).split('T')[0]
                    : new Date().toISOString().slice(0, 10),
                nomor_omc: selectedItem.nomor_omc || '',
                nomor_imc: selectedItem.nomor_imc || '',
                gudang_asal_id: selectedItem.gudang_asal_id
                    ? String(selectedItem.gudang_asal_id)
                    : '',
                gudang_tujuan_id: selectedItem.gudang_tujuan_id
                    ? String(selectedItem.gudang_tujuan_id)
                    : '',
                barang_id: detail.barang_id
                    ? String(detail.barang_id)
                    : '',
                qty: detail.qty || 1,
                kondisi:
                    selectedItem.kondisi &&
                    selectedItem.kondisi !== '-'
                        ? selectedItem.kondisi
                        : 'Baru',
                serials: isSn ? existingSns : [],
                non_sn_selections: {}
            }]);
        } else {
            setRows([createEmptyRow()]);
        }
    }, [
        isOpen,
        isEditMode,
        selectedItem,
        barangs,
        createEmptyRow
    ]);

    const handleAddMoreRows = useCallback((count = 1) => {
        setRows(prev => {
            if (prev.length + count > MAX_ROWS_LIMIT) {
                alert(
                    `Maksimal penambahan transaksi adalah ${MAX_ROWS_LIMIT} baris.`
                );

                const allowed = MAX_ROWS_LIMIT - prev.length;

                if (allowed <= 0) return prev;

                return [
                    ...prev,
                    ...Array.from(
                        { length: allowed },
                        () => createEmptyRow()
                    )
                ];
            }

            return [
                ...prev,
                ...Array.from(
                    { length: count },
                    () => createEmptyRow()
                )
            ];
        });
    }, [createEmptyRow]);

    const handleRemoveRow = useCallback(rowIdx => {
        setRows(prev =>
            prev.length <= 1
                ? prev
                : prev.filter((_, index) => index !== rowIdx)
        );
    }, []);

    const handleRowFieldChange = useCallback((rowIdx, field, value) => {
        setRows(prev => {
            const updated = [...prev];
            const current = updated[rowIdx];

            if (field === 'gudang_asal_id') {
                const targetGudang = gudangs.find(
                    g =>
                        String(g.id) === String(value) ||
                        g.nama_gudang === value
                );

                updated[rowIdx] = {
                    ...current,
                    gudang_asal_id: targetGudang
                        ? String(targetGudang.id)
                        : String(value),
                    barang_id: '',
                    qty: 0,
                    serials: [],
                    kondisi: 'Baru',
                    nomor_imc: '',
                    non_sn_selections: {}
                };

                return updated;
            }

            updated[rowIdx] = {
                ...current,
                [field]: value
            };

            return updated;
        });
    }, [gudangs]);

    const handleBarangChange = useCallback((rowIdx, newBarangId) => {
        if (!newBarangId) {
            setRows(prev => {
                const updated = [...prev];

                updated[rowIdx] = {
                    ...updated[rowIdx],
                    barang_id: '',
                    qty: 0,
                    serials: [],
                    kondisi: 'Baru',
                    nomor_imc: '',
                    non_sn_selections: {}
                };

                return updated;
            });

            return;
        }

        const searchStr = String(newBarangId)
            .toLowerCase()
            .trim();

        const targetBarang = barangs.find(b => {
            if (String(b.id) === searchStr) return true;

            if (
                b.kode_barang &&
                String(b.kode_barang).toLowerCase().trim() === searchStr
            ) {
                return true;
            }

            if (
                b.nama_barang &&
                String(b.nama_barang).toLowerCase().trim() === searchStr
            ) {
                return true;
            }

            const combo = [b.brand, b.tipe, b.kategori]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .trim();

            return Boolean(combo && combo === searchStr);
        });

        if (!targetBarang) return;

        setRows(prev => {
            const updated = [...prev];
            const current = updated[rowIdx];

            updated[rowIdx] = {
                ...current,
                barang_id: String(targetBarang.id),
                qty: 0,
                serials: [],
                kondisi: 'Baru',
                nomor_imc: targetBarang.kode_barang || '',
                non_sn_selections: {}
            };

            return updated;
        });
    }, [barangs]);

    const handleSubmit = useCallback(e => {
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

            if (
                String(r.gudang_asal_id) ===
                String(r.gudang_tujuan_id)
            ) {
                alert(
                    `Baris #${rowNum}: Gudang Asal dan Gudang Tujuan tidak boleh sama.`
                );
                return;
            }

            if (!r.nomor_omc?.trim()) {
                alert(`Baris #${rowNum}: Nomor OMC wajib diisi.`);
                return;
            }

            if (!r.barang_id) {
                alert(`Baris #${rowNum}: Harap pilih barang terlebih dahulu.`);
                return;
            }

            if (Number(r.qty) <= 0) {
                alert(`Baris #${rowNum}: Silakan pilih minimal 1 unit barang.`);
                return;
            }

            const targetBarang = barangs.find(
                b => String(b.id) === String(r.barang_id)
            );

            if (!targetBarang) {
                alert(`Baris #${rowNum}: Data barang tidak ditemukan.`);
                return;
            }

            const stockAvailable = getBarangStockInWarehouse(
                targetBarang,
                r.gudang_asal_id
            );

            if (stockAvailable <= 0) {
                alert(
                    `Baris #${rowNum}: Tidak ada stok yang dapat ditransfer dari gudang asal.`
                );
                return;
            }

            if (r.qty > stockAvailable) {
                alert(
                    `Baris #${rowNum}: Kuantitas transfer (${r.qty}) melebihi stok yang tersedia (${stockAvailable} unit).`
                );
                return;
            }

            const isSn =
                isBooleanFlag(targetBarang.is_wajib_sn) ||
                isBooleanFlag(targetBarang.is_sn);

            if (isSn && !isEditMode) {
                const serials = Array.isArray(r.serials)
                    ? r.serials
                    : [];

                if (serials.length !== Number(r.qty)) {
                    alert(
                        `Baris #${rowNum}: Silakan pilih Serial Number tepat ${r.qty} unit.`
                    );
                    return;
                }

                if (new Set(serials).size !== serials.length) {
                    alert(
                        `Baris #${rowNum}: Serial Number tidak boleh dipilih lebih dari satu kali.`
                    );
                    return;
                }
            }

            if (!isSn && !isEditMode) {
                const selections = r.non_sn_selections || {};

                const selectedNonSnQty = Object.values(selections).reduce(
                    (total, selection) =>
                        total + (parseInt(selection?.qty, 10) || 0),
                    0
                );

                if (selectedNonSnQty !== Number(r.qty)) {
                    alert(
                        `Baris #${rowNum}: Total pilihan kondisi Non-SN (${selectedNonSnQty}) harus sama dengan Qty transfer (${r.qty}).`
                    );
                    return;
                }
            }
        }

        setIsProcessing(true);

        const payload = isEditMode
            ? {
                tanggal: rows[0].tanggal,
                kondisi: rows[0].kondisi || 'Baru',
                nomor_omc: rows[0].nomor_omc?.trim(),
                gudang_asal_id: parseInt(
                    rows[0].gudang_asal_id,
                    10
                ),
                gudang_tujuan_id: parseInt(
                    rows[0].gudang_tujuan_id,
                    10
                ),
                qty: parseInt(rows[0].qty, 10)
            }
            : {
                items: rows.map(r => ({
                    tanggal: r.tanggal,
                    kondisi: r.kondisi || 'Baru',
                    nomor_omc: r.nomor_omc?.trim(),
                    nomor_imc: r.nomor_imc?.trim() || null,
                    gudang_asal_id: parseInt(
                        r.gudang_asal_id,
                        10
                    ),
                    gudang_tujuan_id: parseInt(
                        r.gudang_tujuan_id,
                        10
                    ),
                    barang_id: parseInt(r.barang_id, 10),
                    qty: parseInt(r.qty, 10),
                    serials: r.serials || [],
                    non_sn_selections: r.non_sn_selections || {}
                }))
            };

        const targetUrl = isEditMode
            ? `/transaksi-transfer/${selectedItem.id}`
            : '/transaksi-transfer';

        router[isEditMode ? 'put' : 'post'](
            targetUrl,
            payload,
            {
                preserveScroll: true,
                only: [
                    'transaksis',
                    'filters',
                    'barangs',
                    'gudangs'
                ],
                onSuccess: page => {
                    setIsProcessing(false);

                    if (!page.props.flash?.error) {
                        onClose();
                    }
                },
                onError: () => setIsProcessing(false),
                onFinish: () => setIsProcessing(false)
            }
        );
    }, [
        rows,
        barangs,
        isEditMode,
        selectedItem,
        getBarangStockInWarehouse,
        onClose
    ]);

    return {
        isProcessing,
        rows,
        setRows,
        gudangOptions,
        getBarangStockInWarehouse,
        getBarangKondisiStok,
        getBarangPplOptions: getBarangPplOptionsForRow,
        getBarangPplOptionsForRow,
        getBarangNamaOptions: getBarangNamaOptionsForRow,
        getBarangNamaOptionsForRow,
        handleAddMoreRows,
        handleRemoveRow,
        handleRowFieldChange,
        handleBarangChange,
        handleSubmit,
        createEmptyRow
    };
}