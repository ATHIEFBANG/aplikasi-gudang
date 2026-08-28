import { useState, useEffect, useCallback, useMemo } from 'react';
import { router } from '@inertiajs/react';

export const MAX_ROWS_LIMIT = 500;

export function useModalBarangControl({ isOpen, isEditMode, selectedItem, existingOptions, onClose }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [editData, setEditData] = useState({});
    const [addItems, setAddItems] = useState([]);

    // MURNI MENGAMBIL DARI DATABASE (TANPA DUMMY)
    const brandOptions = useMemo(() => existingOptions?.brandList || [], [existingOptions?.brandList]);
    const tipeOptions = useMemo(() => existingOptions?.tipeList || [], [existingOptions?.tipeList]);
    const kategoriOptions = useMemo(() => existingOptions?.kategoriList || [], [existingOptions?.kategoriList]);
    const satuanOptions = useMemo(() => existingOptions?.satuanList || [], [existingOptions?.satuanList]);

    const formatKodePPL = (input = '') => {
        if (!input) return '';
        const upper = input.toUpperCase();
        const digits = upper.replace(/[^0-9]/g, '').slice(0, 8);
        if (digits.length === 0) return upper.startsWith('PPL') ? 'PPL' : '';
        return `PPL${digits}`;
    };

    const createEmptyRow = useCallback(() => ({
        kode_barang: '',
        brand: '',
        tipe: '',
        kategori: '',
        part_number: '',
        nama_barang: '',
        satuan: '',
        is_wajib_sn: false,
        is_wajib_pn: false,
        deskripsi: ''
    }), []);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && selectedItem) {
                setEditData({
                    id: selectedItem.id,
                    kode_barang: formatKodePPL(selectedItem.kode_barang || ''),
                    brand: selectedItem.brand || '',
                    tipe: selectedItem.tipe || '',
                    kategori: selectedItem.kategori || '',
                    part_number: selectedItem.part_number || selectedItem.nama_barang || '',
                    nama_barang: selectedItem.nama_barang || selectedItem.part_number || '',
                    satuan: selectedItem.satuan || selectedItem.deskripsi || '',
                    min_stock: selectedItem.min_stock ?? 0,
                    is_wajib_sn: Boolean(selectedItem.is_wajib_sn),
                    is_wajib_pn: Boolean(selectedItem.is_wajib_pn),
                });
            } else {
                setAddItems([createEmptyRow()]);
            }
        } else {
            setEditData({});
            setAddItems([]);
            setIsProcessing(false);
        }
    }, [isOpen, isEditMode, selectedItem, createEmptyRow]);

    const parseAndApplyExcelData = useCallback((pastedText) => {
        if (!pastedText) return false;
        let rawRows = pastedText.trim().split(/\r\n|\n|\r/).filter(row => row.trim().length > 0);
        if (rawRows.length === 1 && !rawRows[0].includes('\t')) return false;

        if (rawRows.length > MAX_ROWS_LIMIT) {
            alert(`Perhatian: Data paste dibatasi maksimal ${MAX_ROWS_LIMIT} baris.`);
            rawRows = rawRows.slice(0, MAX_ROWS_LIMIT);
        }

        const parsedItems = rawRows.map(rowStr => {
            const cells = rowStr.split('\t').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
            const rowObj = createEmptyRow();
            
            rowObj.kode_barang = formatKodePPL(cells[0] ?? '');
            rowObj.brand       = cells[1] ?? '';
            rowObj.tipe        = cells[2] ?? '';
            rowObj.kategori    = cells[3] ?? '';
            rowObj.part_number = cells[4] ?? '';
            rowObj.nama_barang = cells[4] || cells[0] || 'Barang';
            rowObj.satuan      = cells[5] ?? '';
            rowObj.deskripsi   = cells[5] ?? '';
            
            if (cells[6]) {
                const c6 = String(cells[6]).toLowerCase();
                rowObj.is_wajib_sn = c6.includes('ya') || c6 === '1' || c6.includes('sn');
            }
            if (cells[7]) {
                const c7 = String(cells[7]).toLowerCase();
                rowObj.is_wajib_pn = c7.includes('ya') || c7 === '1' || c7.includes('pn');
            }

            return rowObj;
        });

        if (parsedItems.length > 0) {
            setAddItems(parsedItems);
            return true;
        }
        return false;
    }, [createEmptyRow]);

    const handleContainerPaste = useCallback((e) => {
        if (isEditMode) return;
        const pastedText = e.clipboardData.getData('text');
        if (parseAndApplyExcelData(pastedText)) e.preventDefault();
    }, [isEditMode, parseAndApplyExcelData]);

    const handlePasteFromClipboardButton = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text && !parseAndApplyExcelData(text)) {
                alert("Format teks clipboard bukan urutan tabel Excel yang valid.");
            }
        } catch (err) {
            alert("Gagal membaca clipboard. Izinkan akses clipboard browser atau gunakan Ctrl+V.");
        }
    }, [parseAndApplyExcelData]);

    const handleAddMoreRows = useCallback((count = 1) => {
        setAddItems(prev => {
            if (prev.length + count > MAX_ROWS_LIMIT) {
                alert(`Maksimal penambahan data sekaligus adalah ${MAX_ROWS_LIMIT} baris.`);
                return prev;
            }
            return [...prev, ...Array.from({ length: count }, () => createEmptyRow())];
        });
    }, [createEmptyRow]);

    const handleRemoveAddRow = useCallback((index) => {
        if (addItems.length <= 1) return;
        setAddItems(prev => prev.filter((_, i) => i !== index));
    }, [addItems.length]);

    const handleAddItemChange = useCallback((index, field, value) => {
        setAddItems(prev => {
            const updated = [...prev];
            const finalVal = field === 'kode_barang' ? formatKodePPL(value) : value;
            updated[index] = { ...updated[index], [field]: finalVal };
            if (field === 'part_number' && !updated[index].nama_barang) updated[index].nama_barang = value;
            if (field === 'satuan') updated[index].deskripsi = value;
            return updated;
        });
    }, []);

    const handleToggleSN = (index = null) => {
        if (isEditMode) {
            setEditData(prev => ({ ...prev, is_wajib_sn: !prev.is_wajib_sn }));
        } else if (index !== null) {
            setAddItems(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], is_wajib_sn: !updated[index].is_wajib_sn };
                return updated;
            });
        }
    };

    const handleTogglePN = (index = null) => {
        if (isEditMode) {
            setEditData(prev => {
                const nextPn = !prev.is_wajib_pn;
                return { ...prev, is_wajib_pn: nextPn, part_number: nextPn ? prev.part_number : '' };
            });
        } else if (index !== null) {
            setAddItems(prev => {
                const updated = [...prev];
                const nextPn = !updated[index].is_wajib_pn;
                updated[index] = { ...updated[index], is_wajib_pn: nextPn, part_number: nextPn ? updated[index].part_number : '' };
                return updated;
            });
        }
    };

    const getStatusText = (sn, pn) => {
        if (sn && pn) return 'Wajib SN & PN';
        if (sn) return 'Wajib SN';
        if (pn) return 'Wajib PN';
        return 'Tidak Wajib (Standar)';
    };

    const handleSubmitForm = (e) => {
        e?.preventDefault();

        if (isEditMode) {
            if (!editData.kode_barang || editData.kode_barang.length !== 11) {
                alert('Kode PPL harus berformat PPL diikuti 8 digit angka (contoh: PPL01000701).');
                return;
            }
            if (!editData.brand?.trim() || !editData.tipe?.trim() || !editData.kategori?.trim() || !editData.satuan?.trim()) {
                alert('Harap lengkapi formulir utama (Brand, Tipe, Kategori, Satuan).');
                return;
            }
            if (editData.is_wajib_pn && !editData.part_number?.trim()) {
                alert('Part Number wajib diisi jika Anda mengaktifkan Wajib PN.');
                return;
            }

            setIsProcessing(true);
            const payload = {
                ...editData,
                is_wajib_sn: Boolean(editData.is_wajib_sn),
                is_wajib_pn: Boolean(editData.is_wajib_pn),
                part_number: editData.is_wajib_pn ? editData.part_number : null,
                nama_barang: editData.is_wajib_pn ? editData.part_number : `${editData.brand} ${editData.tipe}`.trim(),
                deskripsi: editData.satuan || ''
            };

            router.put(`/barang/${editData.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsProcessing(false);
                    onClose();
                },
                onError: () => setIsProcessing(false),
                onFinish: () => setIsProcessing(false),
            });
        } else {
            const kodeSet = new Set();
            for (let i = 0; i < addItems.length; i++) {
                const item = addItems[i];
                if (!item.kode_barang || item.kode_barang.length !== 11) {
                    alert(`Baris #${i + 1}: Kode PPL harus berformat PPL diikuti 8 digit angka (contoh: PPL01000701).`);
                    return;
                }
                if (kodeSet.has(item.kode_barang)) {
                    alert(`Baris #${i + 1}: Kode PPL "${item.kode_barang}" terduplikasi pada form ini.`);
                    return;
                }
                kodeSet.add(item.kode_barang);

                if (!item.brand?.trim() || !item.tipe?.trim() || !item.kategori?.trim() || !item.satuan?.trim()) {
                    alert(`Baris #${i + 1}: Harap lengkapi semua kolom (Brand, Tipe, Kategori, Satuan).`);
                    return;
                }
                if (item.is_wajib_pn && !item.part_number?.trim()) {
                    alert(`Baris #${i + 1}: Part Number wajib diisi jika Wajib PN aktif.`);
                    return;
                }
            }

            setIsProcessing(true);

            const formattedItems = addItems.map(item => ({
                ...item,
                is_wajib_sn: Boolean(item.is_wajib_sn),
                is_wajib_pn: Boolean(item.is_wajib_pn),
                part_number: item.is_wajib_pn ? item.part_number : null,
                nama_barang: item.is_wajib_pn 
                    ? item.part_number 
                    : `${item.brand} ${item.tipe}`.trim(),
                deskripsi: item.satuan || ''
            }));

            router.post('/barang', { items: formattedItems }, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsProcessing(false);
                    onClose();
                },
                onError: () => setIsProcessing(false),
                onFinish: () => setIsProcessing(false),
            });
        }
    };

    return {
        isProcessing,
        editData,
        setEditData,
        addItems,
        handleContainerPaste,
        handlePasteFromClipboardButton,
        handleAddMoreRows,
        handleRemoveAddRow,
        handleAddItemChange,
        handleToggleSN,
        handleTogglePN,
        getStatusText,
        handleSubmitForm,
        brandOptions,
        tipeOptions,
        kategoriOptions,
        satuanOptions,
        formatKodePPL
    };
}