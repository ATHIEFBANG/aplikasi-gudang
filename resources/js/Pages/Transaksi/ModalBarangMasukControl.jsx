import { useState, useEffect, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { ShoppingBag, Layers, RotateCcw } from 'lucide-react';

export const MAX_ROWS_LIMIT = 50;
export const CATEGORIES_MASUK = [
    { id: 'PEMBELIAN', label: 'Pembelian', icon: ShoppingBag },
    { id: 'PEMINJAMAN', label: 'Peminjaman', icon: Layers },
    { id: 'PENGEMBALIAN', label: 'Pengembalian', icon: RotateCcw },
];

// Helper parsing teks tabel dari clipboard Excel
const parseClipboardText = (text) => {
    if (!text) return [];
    return text
        .split(/\r?\n/)
        .map(row => row.split('\t').map(cell => {
            if (!cell) return '';
            return cell
                .replace(/[\u00a0\r\n]/g, ' ')
                .replace(/^"(.*)"$/, '$1')
                .trim();
        }))
        .filter(row => row.some(cell => cell.length > 0));
};

// Helper Konversi Tanggal Excel ke Format ISO (YYYY-MM-DD)
const formatToISODate = (rawStr) => {
    if (!rawStr || rawStr === '-' || rawStr.trim() === '') {
        return new Date().toISOString().slice(0, 10);
    }

    const cleanStr = String(rawStr).trim();

    // 1. Format YYYY-MM-DD / YYYY/MM/DD
    const ymdMatch = cleanStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
        const [, y, m, d] = ymdMatch;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // 2. Format DD/MM/YYYY / DD-MM-YYYY / DD.MM.YYYY
    const dmyMatch = cleanStr.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // 3. Fallback Parser
    const parsedDate = new Date(cleanStr);
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().slice(0, 10);
    }

    return new Date().toISOString().slice(0, 10);
};

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
        return barangs.map(b => ({
            value: b.kode_barang,
            label: b.kode_barang,
            id: b.id
        }));
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
                    tanggal: formatToISODate(selectedItem.tanggal),
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
        setRows(prev => {
            const updated = [...prev];
            const currentRow = updated[rowIdx];

            if (!newBarangId) {
                updated[rowIdx] = {
                    ...currentRow,
                    barang_id: '',
                    serials: []
                };
                return updated;
            }

            const targetBarang = barangs.find(b => String(b.id) === String(newBarangId) || b.kode_barang.toLowerCase() === String(newBarangId).toLowerCase());
            const realId = targetBarang ? String(targetBarang.id) : '';
            const isSn = Boolean(targetBarang?.is_wajib_sn);
            const currentQty = currentRow.qty || 1;

            updated[rowIdx] = {
                ...currentRow,
                barang_id: realId,
                qty: currentQty,
                serials: isSn ? Array(currentQty).fill('') : []
            };
            return updated;
        });
    };

    const handleQtyChange = (rowIdx, val) => {
        let count = parseInt(val, 10);
        if (isNaN(count) || count < 1) count = 1;
        if (count > 10) count = 10;
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

    const handleBulkPasteExcel = (pastedText) => {
        const parsedRows = parseClipboardText(pastedText);
        if (parsedRows.length === 0) return;

        let missingCount = 0;
        let rowsToProcess = [...parsedRows];

        const firstRowJoin = rowsToProcess[0].join(' ').toUpperCase();
        const isHeaderRow = ['KODE', 'PPL', 'BARANG', 'QTY', 'QUANTITY', 'IMC', 'SUPPLIER', 'VENDOR', 'ASAL', 'HARGA', 'SERIAL', 'NO TRANSAKSI'].some(
            keyword => firstRowJoin.includes(keyword)
        );

        let colIndexMap = {
            subJenis: -1,
            kodePpl: -1,
            namaBarang: -1,
            tanggal: -1,
            qty: -1,
            harga: -1,
            kondisi: -1,
            nomorImc: -1,
            pihakAsal: -1,
            gudangTujuan: -1,
            serials: -1,
        };

        if (isHeaderRow) {
            const headerRow = rowsToProcess[0];
            headerRow.forEach((colHeader, idx) => {
                const h = colHeader.toUpperCase().trim();
                if (h.includes('SUB JENIS') || h.includes('JENIS TRANSAKSI')) colIndexMap.subJenis = idx;
                else if (h.includes('PPL') || h.includes('KODE')) colIndexMap.kodePpl = idx;
                else if (h.includes('NAMA BARANG') || h.includes('BARANG')) colIndexMap.namaBarang = idx;
                else if (h.includes('TANGGAL')) colIndexMap.tanggal = idx;
                else if (h.includes('QTY') || h.includes('QUANTITY') || h.includes('JUMLAH')) colIndexMap.qty = idx;
                else if (h.includes('HARGA SATUAN') || h.includes('HARGA')) colIndexMap.harga = idx;
                else if (h.includes('KONDISI')) colIndexMap.kondisi = idx;
                else if (h.includes('IMC')) colIndexMap.nomorImc = idx;
                else if (h.includes('GUDANG ASAL') || h.includes('PIHAK ASAL') || h.includes('SUPPLIER') || h.includes('VENDOR')) colIndexMap.pihakAsal = idx;
                else if (h.includes('GUDANG TUJUAN') || h.includes('SITE') || h.includes('PENERIMA')) colIndexMap.gudangTujuan = idx;
                else if (h.includes('SERIAL')) colIndexMap.serials = idx;
            });
            rowsToProcess.shift();
        }

        if (rowsToProcess.length === 0) return;

        const normalizedBarangs = barangs.map(b => {
            const cleanKode = (b.kode_barang || '').toUpperCase().replace(/\s+/g, '');
            const cleanNama = (b.nama_barang || '').toLowerCase().trim();
            const comboNama = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ').toLowerCase().trim();
            return { ...b, cleanKode, cleanNama, comboNama };
        });

        const mappedRows = rowsToProcess.map((cols) => {
            let rawSubJenis = 'PEMBELIAN';
            let rawKodePpl = '';
            let rawNamaBarang = '';
            let rawTanggal = '';
            let rawQty = '1';
            let rawHarga = '';
            let rawKondisi = 'Baru';
            let rawNomorImc = '';
            let rawPihakAsal = '';
            let rawGudangTujuan = '';
            let rawSerialsText = '';

            if (isHeaderRow) {
                if (colIndexMap.subJenis !== -1 && cols[colIndexMap.subJenis]) rawSubJenis = cols[colIndexMap.subJenis];
                if (colIndexMap.kodePpl !== -1 && cols[colIndexMap.kodePpl]) rawKodePpl = cols[colIndexMap.kodePpl];
                if (colIndexMap.namaBarang !== -1 && cols[colIndexMap.namaBarang]) rawNamaBarang = cols[colIndexMap.namaBarang];
                if (colIndexMap.tanggal !== -1 && cols[colIndexMap.tanggal]) rawTanggal = cols[colIndexMap.tanggal];
                if (colIndexMap.qty !== -1 && cols[colIndexMap.qty]) rawQty = cols[colIndexMap.qty];
                if (colIndexMap.harga !== -1 && cols[colIndexMap.harga]) rawHarga = cols[colIndexMap.harga];
                if (colIndexMap.kondisi !== -1 && cols[colIndexMap.kondisi]) rawKondisi = cols[colIndexMap.kondisi];
                if (colIndexMap.nomorImc !== -1 && cols[colIndexMap.nomorImc]) rawNomorImc = cols[colIndexMap.nomorImc];
                if (colIndexMap.pihakAsal !== -1 && cols[colIndexMap.pihakAsal]) rawPihakAsal = cols[colIndexMap.pihakAsal];
                if (colIndexMap.gudangTujuan !== -1 && cols[colIndexMap.gudangTujuan]) rawGudangTujuan = cols[colIndexMap.gudangTujuan];
                if (colIndexMap.serials !== -1 && cols[colIndexMap.serials]) rawSerialsText = cols[colIndexMap.serials];
            } else {
                if (cols.length >= 10) {
                    rawKodePpl = cols[2] || '';
                    rawNamaBarang = cols[3] || '';
                    rawTanggal = cols[6] || '';
                    rawQty = cols[7] || '1';
                    rawHarga = cols[8] || '';
                    rawKondisi = cols[10] || 'Baru';
                    rawNomorImc = cols[11] || '';
                    rawPihakAsal = cols[15] || '';
                    rawGudangTujuan = cols[16] || '';
                    rawSerialsText = cols[17] || '';
                } else {
                    rawKodePpl = cols[0] || '';
                    rawQty = cols[1] || '1';
                    rawNomorImc = cols[2] || '';
                    rawPihakAsal = cols[3] || '';
                }
            }

            const finalTanggal = formatToISODate(rawTanggal);

            let cleanSubJenis = 'PEMBELIAN';
            const upperSub = rawSubJenis.toUpperCase();
            if (upperSub.includes('PEMINJAMAN')) cleanSubJenis = 'PEMINJAMAN';
            else if (upperSub.includes('PENGEMBALIAN')) cleanSubJenis = 'PENGEMBALIAN';

            const searchKode = rawKodePpl.toUpperCase().replace(/\s+/g, '');
            const searchNama = rawNamaBarang.toLowerCase().trim();

            let targetBarang = null;
            if (searchKode) {
                targetBarang = normalizedBarangs.find(b => b.cleanKode === searchKode);
            }
            if (!targetBarang && searchNama) {
                targetBarang = normalizedBarangs.find(b => b.cleanNama === searchNama || b.comboNama === searchNama);
            }

            if (!targetBarang && (rawKodePpl || rawNamaBarang)) {
                missingCount++;
            }

            let parsedQty = parseInt(String(rawQty).replace(/[^0-9]/g, ''), 10);
            if (isNaN(parsedQty) || parsedQty < 1) parsedQty = 1;
            if (parsedQty > 10) parsedQty = 10;

            let parsedHarga = '';
            if (rawHarga && rawHarga !== '-') {
                const cleanPriceStr = String(rawHarga).replace(/[^0-9]/g, '');
                if (cleanPriceStr) {
                    parsedHarga = cleanPriceStr;
                }
            }

            let cleanKondisi = 'Baru';
            const upperKondisi = rawKondisi.toUpperCase().trim();
            if (upperKondisi.includes('BEKAS') || upperKondisi.includes('SECOND')) cleanKondisi = 'Bekas';
            else if (upperKondisi.includes('RUSAK')) cleanKondisi = 'Rusak';

            let targetGudangId = gudangs[0]?.id ? String(gudangs[0].id) : '';
            if (rawGudangTujuan && rawGudangTujuan !== '-') {
                const foundG = gudangs.find(g => 
                    g.nama_gudang.toLowerCase().trim() === rawGudangTujuan.toLowerCase().trim() ||
                    rawGudangTujuan.toLowerCase().includes(g.nama_gudang.toLowerCase().trim())
                );
                if (foundG) targetGudangId = String(foundG.id);
            }

            const isSn = Boolean(targetBarang?.is_wajib_sn);
            let extractedSerials = [];
            if (isSn && rawSerialsText && rawSerialsText !== '-') {
                extractedSerials = rawSerialsText
                    .split(',')
                    .map(s => s.replace(/\s*\([^)]*\)/g, '').trim())
                    .filter(Boolean);
            }

            let finalSerials = [];
            if (isSn) {
                finalSerials = extractedSerials.slice(0, parsedQty);
                while (finalSerials.length < parsedQty) {
                    finalSerials.push('');
                }
            }

            return {
                sub_jenis: cleanSubJenis,
                tanggal: finalTanggal,
                nomor_imc: rawNomorImc === '-' ? '' : rawNomorImc,
                pihak_asal: (rawPihakAsal && rawPihakAsal !== '-') ? rawPihakAsal : (suppliers[0]?.nama_supplier || suppliers[0] || ''),
                gudang_tujuan_id: targetGudangId,
                barang_id: targetBarang ? String(targetBarang.id) : '',
                qty: parsedQty,
                harga: parsedHarga,
                kondisi: cleanKondisi,
                serials: finalSerials
            };
        });

        if (missingCount > 0) {
            alert(`⚠️ Terdapat ${missingCount} baris dengan Kode PPL/Barang yang tidak terdeteksi di Master Data.\n\nBaris tersebut tetap dimasukkan. Silakan pilih barang manual pada baris terkait.`);
        }

        setRows(prev => {
            const isFirstRowEmpty = prev.length === 1 && !prev[0].barang_id && !prev[0].nomor_imc && !prev[0].pihak_asal;
            const baseRows = isFirstRowEmpty ? [] : prev;
            return [...baseRows, ...mappedRows].slice(0, MAX_ROWS_LIMIT);
        });
    };

    const handleSubmitForm = (e) => {
        e?.preventDefault();

        // Set pelacak Serial Number yang sedang diinput pada form ini (mencegah duplikat internal)
        const usedSerialsInForm = new Set();

        // Set pelacak Serial Number yang sudah ada di Database / Master Data
        const existingDatabaseSerials = new Set();
        barangs.forEach(b => {
            (b.serials || []).forEach(s => {
                const snVal = (s.serial_number || s).toString().trim().toLowerCase();
                if (snVal) existingDatabaseSerials.add(snVal);
            });
        });

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

                // 🔍 Validasi Tiap Unit Serial Number
                for (let snIdx = 0; snIdx < r.serials.length; snIdx++) {
                    const rawSn = r.serials[snIdx];
                    const cleanSn = (rawSn || '').trim();

                    if (!cleanSn) {
                        alert(`Baris #${rowNum}: Serial Number unit ke-${snIdx + 1} wajib terisi.`);
                        return;
                    }

                    const lowerSn = cleanSn.toLowerCase();

                    // 1. Cek duplikat di dalam form yang sama
                    if (usedSerialsInForm.has(lowerSn)) {
                        alert(`Baris #${rowNum}: Serial Number "${cleanSn}" ganda / sudah digunakan pada form ini.`);
                        return;
                    }
                    usedSerialsInForm.add(lowerSn);

                    // 2. Cek duplikat terhadap database / master data
                    if (existingDatabaseSerials.has(lowerSn)) {
                        alert(`Baris #${rowNum}: Serial Number "${cleanSn}" sudah terdaftar di sistem. Harap gunakan Serial Number yang unik.`);
                        return;
                    }
                }
            }
        }

        setIsProcessing(true);
        const payload = isEditMode
            ? {
                tanggal: rows[0].tanggal,
                kondisi: rows[0].kondisi ? (rows[0].kondisi.toUpperCase() === 'BAIK' ? 'Baru' : rows[0].kondisi) : 'Baru',
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
                    kondisi: r.kondisi ? (r.kondisi.toUpperCase() === 'BAIK' ? 'Baru' : r.kondisi) : 'Baru',
                    nomor_imc: r.nomor_imc.trim(),
                    pihak_asal: r.pihak_asal.trim(),
                    gudang_tujuan_id: parseInt(r.gudang_tujuan_id, 10),
                    barang_id: parseInt(r.barang_id, 10),
                    qty: parseInt(r.qty, 10),
                    harga: r.sub_jenis === 'PEMBELIAN' && r.harga !== '' ? parseFloat(r.harga) : 0,
                    serials: r.serials || []
                }))
            };

        const targetUrl = isEditMode ? `/transaksi-masuk/${selectedItem.id}` : '/transaksi-masuk';
        const method = isEditMode ? 'put' : 'post';

        router[method](targetUrl, payload, {
            preserveScroll: true,
            onSuccess: (page) => {
                setIsProcessing(false);
                // 💡 Hanya tutup modal jika tidak ada error dari flash session backend
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
        handleBulkPasteExcel,
        handleSubmitForm,
    };
}