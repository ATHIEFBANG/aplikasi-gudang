import { useMemo, useState, useCallback } from 'react';

export const AVAILABLE_SERIAL_STATUSES = ['IN_WAREHOUSE', 'READY', 'AVAILABLE'];

export const isBooleanFlag = value =>
    value === true || value === 1 || value === '1' ||
    String(value).toLowerCase() === 'true';

export const isRusakCondition = kondisi => {
    const value = String(kondisi || '').toUpperCase().trim();
    return value.includes('RUSAK') || value.includes('DAMAGED');
};

export const normalizeKondisi = kondisi => {
    const value = String(kondisi || 'BARU').toUpperCase().trim();

    if (value.includes('RUSAK') || value.includes('DAMAGED')) return 'Rusak';
    if (value.includes('BEKAS') || value.includes('SECOND') || value.includes('USED')) return 'Bekas';

    return 'Baru';
};

export const getSnValue = serial => {
    if (typeof serial === 'string') return serial;
    return serial?.serial_number || serial?.sn || '';
};

export const getKondisiBadgeClass = kondisi => {
    if (kondisi === 'Bekas') {
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    }

    if (kondisi === 'Rusak') {
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    }

    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
};

const resolveGudangId = (gudangs, gudangIdOrName) => {
    if (!gudangIdOrName) return null;

    const targetGudang = gudangs.find(g =>
        String(g.id) === String(gudangIdOrName) ||
        (
            g.nama_gudang &&
            g.nama_gudang.toLowerCase().trim() ===
            String(gudangIdOrName).toLowerCase().trim()
        )
    );

    return targetGudang ? String(targetGudang.id) : String(gudangIdOrName);
};

export function useModalBarangSelectorLogic({
    row,
    rowIdx,
    targetBarang,
    gudangs = [],
    barangs = [],
    setRows,
    isProcessing = false,
    isEditMode = false,
    stockInOrigin = 0,
    allowRusak = false
}) {
    const [snSearch, setSnSearch] = useState('');
    const [nonSnSearch, setNonSnSearch] = useState('');

    const isWajibSn =
        isBooleanFlag(targetBarang?.is_wajib_sn) ||
        isBooleanFlag(targetBarang?.is_sn);

    const selectedSerials = useMemo(
        () => Array.isArray(row?.serials) ? row.serials : [],
        [row?.serials]
    );

    const currentNamaBarang = useMemo(() => {
        if (!targetBarang) return '';

        return [
            targetBarang.brand,
            targetBarang.tipe,
            targetBarang.kategori
        ].filter(Boolean).join(' ') ||
            targetBarang.nama_barang ||
            targetBarang.kode_barang ||
            '';
    }, [targetBarang]);

    /* =========================================================
     * GUDANG
     * ========================================================= */

    const targetGudangId = useMemo(
        () => resolveGudangId(gudangs, row?.gudang_asal_id),
        [gudangs, row?.gudang_asal_id]
    );

    /* =========================================================
     * SN SOURCE
     * ========================================================= */

    const availableEligibleSns = useMemo(() => {
        if (
            !isWajibSn ||
            !targetBarang ||
            !targetGudangId ||
            !Array.isArray(targetBarang.serials)
        ) {
            return [];
        }

        return targetBarang.serials.filter(serial => {
            if (!serial || typeof serial !== 'object') return false;

            const snValue = getSnValue(serial);
            if (!snValue) return false;

            const serialGudangId =
                serial.gudang_id !== null &&
                serial.gudang_id !== undefined &&
                String(serial.gudang_id).trim() !== ''
                    ? String(serial.gudang_id)
                    : null;

            if (!serialGudangId || serialGudangId !== targetGudangId) {
                return false;
            }

            const status = String(serial.status || '').toUpperCase().trim();

            if (!AVAILABLE_SERIAL_STATUSES.includes(status)) {
                return false;
            }

            if (!allowRusak && isRusakCondition(serial.kondisi)) {
                return false;
            }

            return true;
        });
    }, [isWajibSn, targetBarang, targetGudangId, allowRusak]);

    const getAvailableSerialsForOutbound = useCallback(
        () => availableEligibleSns,
        [availableEligibleSns]
    );

    const filteredAvailableSns = useMemo(() => {
        const search = String(snSearch || '').toLowerCase().trim();

        if (!search) return availableEligibleSns;

        return availableEligibleSns.filter(serial =>
            getSnValue(serial).toLowerCase().includes(search)
        );
    }, [availableEligibleSns, snSearch]);

    const availableSnCount = availableEligibleSns.length;
    const selectedSnCount = selectedSerials.length;

    const selectedSnItems = useMemo(() => {
        return selectedSerials
            .map(snValue =>
                availableEligibleSns.find(
                    serial => getSnValue(serial) === snValue
                )
            )
            .filter(Boolean);
    }, [selectedSerials, availableEligibleSns]);

    const getSnKondisiLabel = useCallback(
        serial => normalizeKondisi(serial?.kondisi),
        []
    );

    const isSnSelectionComplete =
        selectedSnCount > 0 &&
        selectedSnCount === Number(row?.qty || 0);

    /* =========================================================
     * SN HANDLERS
     * ========================================================= */

    const handleSnSearchChange = useCallback(value => {
        setSnSearch(value);
    }, []);

    const handleToggleSn = useCallback(snValue => {
        if (!snValue || isProcessing || !setRows) return;

        const selectedSerial = availableEligibleSns.find(
            serial => getSnValue(serial) === snValue
        );

        if (!selectedSerial) return;

        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];

            if (!currentRow) return prev;

            const currentSerials = Array.isArray(currentRow.serials)
                ? [...currentRow.serials]
                : [];

            const exists = currentSerials.some(
                serial => String(serial) === String(snValue)
            );

            if (!exists && currentSerials.length >= availableEligibleSns.length) {
                return prev;
            }

            const newSerials = exists
                ? currentSerials.filter(
                    serial => String(serial) !== String(snValue)
                )
                : [...currentSerials, snValue];

            updated[rowIdx] = {
                ...currentRow,
                serials: newSerials,
                qty: newSerials.length
            };

            return updated;
        });
    }, [availableEligibleSns, isProcessing, rowIdx, setRows]);

    const handleClearSns = useCallback(() => {
        if (isProcessing || !setRows) return;

        setRows(prev => {
            const updated = [...prev];

            if (!updated[rowIdx]) return prev;

            updated[rowIdx] = {
                ...updated[rowIdx],
                serials: [],
                qty: 0
            };

            return updated;
        });
    }, [isProcessing, rowIdx, setRows]);

    const handleAutoSelectSns = useCallback(() => {
        if (isProcessing || !setRows) return;

        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];

            if (!currentRow) return prev;

            const targetQty = Math.min(
                Number(currentRow.qty || 0),
                availableEligibleSns.length
            );

            const selected = availableEligibleSns
                .slice(0, targetQty)
                .map(serial => getSnValue(serial))
                .filter(Boolean);

            updated[rowIdx] = {
                ...currentRow,
                serials: selected,
                qty: selected.length
            };

            return updated;
        });
    }, [availableEligibleSns, isProcessing, rowIdx, setRows]);

    /* =========================================================
     * NON-SN BATCH
     * ========================================================= */

    const groupedNonSnBatches = useMemo(() => {
        if (isWajibSn || !targetBarang || !targetGudangId) {
            return [];
        }

        const kondisiStok = targetBarang.kondisi_stok?.[targetGudangId];
        if (!kondisiStok) return [];

        const details =
            targetBarang.transaksi_details ||
            targetBarang.transaksiDetails ||
            [];

        const imcMap = {
            Baru: [],
            Bekas: [],
            Rusak: []
        };

        details.forEach(detail => {
            const transaksi = detail?.transaksi;

            if (
                !transaksi ||
                String(transaksi.gudang_tujuan_id) !== targetGudangId
            ) {
                return;
            }

            const kondisiRaw = String(
                detail.kondisi ||
                transaksi.kondisi ||
                'Baru'
            ).toUpperCase().trim();

            const nomorImc =
                transaksi.nomor_imc ||
                transaksi.no_transaksi ||
                '';

            if (!nomorImc) return;

            const kondisi = normalizeKondisi(kondisiRaw);

            if (imcMap[kondisi] && !imcMap[kondisi].includes(nomorImc)) {
                imcMap[kondisi].push(nomorImc);
            }
        });

        const result = [];
        const stokBaru = Number(kondisiStok.baru || 0);
        const stokBekas = Number(kondisiStok.bekas || 0);
        const stokRusak = Number(kondisiStok.rusak || 0);

        if (stokBaru > 0) {
            result.push({
                key: 'Baru',
                kondisi: 'Baru',
                max_stock: stokBaru,
                nomor_imc: imcMap.Baru.length > 0
                    ? imcMap.Baru.join(', ')
                    : (targetBarang.kode_barang || 'IMC-IN'),
                badgeClass: getKondisiBadgeClass('Baru')
            });
        }

        if (stokBekas > 0) {
            result.push({
                key: 'Bekas',
                kondisi: 'Bekas',
                max_stock: stokBekas,
                nomor_imc: imcMap.Bekas.length > 0
                    ? imcMap.Bekas.join(', ')
                    : (targetBarang.kode_barang || 'IMC-IN'),
                badgeClass: getKondisiBadgeClass('Bekas')
            });
        }

        if (allowRusak && stokRusak > 0) {
            result.push({
                key: 'Rusak',
                kondisi: 'Rusak',
                max_stock: stokRusak,
                nomor_imc: imcMap.Rusak.length > 0
                    ? imcMap.Rusak.join(', ')
                    : (targetBarang.kode_barang || 'IMC-IN'),
                badgeClass: getKondisiBadgeClass('Rusak')
            });
        }

        return result;
    }, [isWajibSn, targetBarang, targetGudangId, allowRusak]);

    const filteredBatches = useMemo(() => {
        const search = String(nonSnSearch || '').toLowerCase().trim();

        if (!search) return groupedNonSnBatches;

        return groupedNonSnBatches.filter(batch => {
            const nomorImc = String(batch.nomor_imc || '').toLowerCase();
            const kondisi = String(batch.kondisi || '').toLowerCase();
            const namaBarang = currentNamaBarang.toLowerCase();

            return (
                nomorImc.includes(search) ||
                kondisi.includes(search) ||
                namaBarang.includes(search)
            );
        });
    }, [groupedNonSnBatches, nonSnSearch, currentNamaBarang]);

    const nonSnSelections = row?.non_sn_selections || {};

    const selectedBatchTotal = useMemo(
        () => Object.values(nonSnSelections).reduce(
            (total, item) => total + (parseInt(item?.qty, 10) || 0),
            0
        ),
        [nonSnSelections]
    );

    const availableNonSnStock = useMemo(() => {
        if (!targetBarang || !targetGudangId) {
            return Number(stockInOrigin || 0);
        }

        const kondisiStok = targetBarang.kondisi_stok?.[targetGudangId];

        if (kondisiStok) {
            const baru = Number(kondisiStok.baru || 0);
            const bekas = Number(kondisiStok.bekas || 0);
            const rusak = allowRusak ? Number(kondisiStok.rusak || 0) : 0;

            return baru + bekas + rusak;
        }

        return Number(stockInOrigin || 0);
    }, [targetBarang, targetGudangId, stockInOrigin, allowRusak]);

    /* =========================================================
     * NON-SN SEARCH
     * ========================================================= */

    const handleNonSnSearchChange = useCallback(value => {
        setNonSnSearch(value);
    }, []);

    const clearNonSnSearch = useCallback(() => {
        setNonSnSearch('');
    }, []);

    /* =========================================================
     * NON-SN SELECTION
     * ========================================================= */

    const getBatchSelection = useCallback(
        batchKey => nonSnSelections?.[batchKey] || null,
        [nonSnSelections]
    );

    const getBatchSelectedQty = useCallback(
        batchKey => Number(nonSnSelections?.[batchKey]?.qty || 0),
        [nonSnSelections]
    );

    const isBatchSelected = useCallback(
        batchKey => getBatchSelectedQty(batchKey) > 0,
        [getBatchSelectedQty]
    );

    const updateNonSnBatchQty = useCallback((batch, nextQty) => {
        if (!batch || isProcessing || !setRows) return;

        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];

            if (!currentRow) return prev;

            const selections = {
                ...(currentRow.non_sn_selections || {})
            };

            const otherSelectedTotal = Object.entries(selections).reduce(
                (total, [key, selection]) => {
                    if (key === batch.key) return total;
                    return total + (parseInt(selection?.qty, 10) || 0);
                },
                0
            );

            const remainingTotal = Math.max(
                0,
                availableNonSnStock - otherSelectedTotal
            );

            const batchMax = Number(batch.max_stock || 0);
            const safeMax = Math.min(batchMax, remainingTotal);

            let safeQty = parseInt(nextQty, 10);

            if (Number.isNaN(safeQty) || safeQty <= 0) {
                delete selections[batch.key];
            } else {
                safeQty = Math.min(safeQty, safeMax);

                if (safeQty <= 0) {
                    delete selections[batch.key];
                } else {
                    selections[batch.key] = {
                        nomor_imc: batch.nomor_imc || '',
                        kondisi: normalizeKondisi(batch.kondisi),
                        qty: safeQty
                    };
                }
            }

            const activeSelections = Object.values(selections).filter(
                selection => (parseInt(selection?.qty, 10) || 0) > 0
            );

            const totalQty = activeSelections.reduce(
                (total, selection) =>
                    total + (parseInt(selection?.qty, 10) || 0),
                0
            );

            const conditionSummary = activeSelections.reduce(
                (result, selection) => {
                    const kondisi = normalizeKondisi(selection?.kondisi);
                    const qty = parseInt(selection?.qty, 10) || 0;
                    const existing = result.find(
                        item => item.kondisi === kondisi
                    );

                    if (existing) {
                        existing.qty += qty;
                    } else {
                        result.push({ kondisi, qty });
                    }

                    return result;
                },
                []
            );

            const imcParts = activeSelections
                .map(selection => String(selection?.nomor_imc || '').trim())
                .filter(Boolean)
                .filter((value, index, arr) => arr.indexOf(value) === index);

            updated[rowIdx] = {
                ...currentRow,
                non_sn_selections: selections,
                qty: totalQty,
                kondisi: conditionSummary.length > 0
                    ? conditionSummary
                        .map(item => `${item.qty} ${item.kondisi}`)
                        .join(', ')
                    : 'Baru',
                nomor_imc: imcParts.join(', ')
            };

            return updated;
        });
    }, [availableNonSnStock, isProcessing, rowIdx, setRows]);

    const handleNonSnBatchQtyChange = useCallback(
        (batch, nextQty) => {
            updateNonSnBatchQty(batch, nextQty);
        },
        [updateNonSnBatchQty]
    );

    const handleToggleNonSnBatch = useCallback(batch => {
        if (!batch || isProcessing) return;

        const currentQty = getBatchSelectedQty(batch.key);

        updateNonSnBatchQty(
            batch,
            currentQty > 0 ? 0 : 1
        );
    }, [getBatchSelectedQty, isProcessing, updateNonSnBatchQty]);

    const incrementNonSnBatch = useCallback(batch => {
        if (!batch || isProcessing) return;

        const currentQty = getBatchSelectedQty(batch.key);

        if (currentQty >= Number(batch.max_stock || 0)) {
            return;
        }

        updateNonSnBatchQty(batch, currentQty + 1);
    }, [getBatchSelectedQty, isProcessing, updateNonSnBatchQty]);

    const decrementNonSnBatch = useCallback(batch => {
        if (!batch || isProcessing) return;

        const currentQty = getBatchSelectedQty(batch.key);

        if (currentQty <= 0) return;

        updateNonSnBatchQty(batch, currentQty - 1);
    }, [getBatchSelectedQty, isProcessing, updateNonSnBatchQty]);

    return {
        isWajibSn,
        isNonSn: !isWajibSn,
        isEditMode,
        allowRusak,
        currentNamaBarang,

        snSearch,
        setSnSearch,
        selectedSerials,
        selectedSnItems,
        selectedSnCount,
        availableSnCount,
        availableEligibleSns,
        filteredAvailableSns,
        isSnSelectionComplete,
        getSnValue,
        getSnKondisiLabel,
        getAvailableSerialsForOutbound,
        handleSnSearchChange,
        handleToggleSn,
        handleClearSns,
        handleAutoSelectSns,

        nonSnSearch,
        setNonSnSearch,
        handleNonSnSearchChange,
        clearNonSnSearch,
        groupedNonSnBatches,
        filteredBatches,
        nonSnSelections,
        selectedBatchTotal,
        availableNonSnStock,
        getBatchSelection,
        getBatchSelectedQty,
        isBatchSelected,
        handleNonSnBatchQtyChange,
        handleToggleNonSnBatch,
        incrementNonSnBatch,
        decrementNonSnBatch,
        getKondisiBadgeClass
    };
}

export default useModalBarangSelectorLogic;