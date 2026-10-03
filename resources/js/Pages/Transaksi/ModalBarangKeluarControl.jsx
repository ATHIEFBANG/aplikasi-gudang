import { useState, useEffect, useMemo, useCallback } from 'react';
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

const CUSTOMER_HISTORY_KEY = 'barang_keluar_customer_history';

const isBooleanFlag = value =>
    value === true || value === 1 || value === '1' ||
    String(value).toLowerCase() === 'true';

const resolveGudangId = (gudangs, gudangIdOrName) => {
    if (!gudangIdOrName) return null;

    const target = gudangs.find(g =>
        String(g.id) === String(gudangIdOrName) ||
        (g.nama_gudang && g.nama_gudang.toLowerCase().trim() === String(gudangIdOrName).toLowerCase().trim())
    );

    return target ? String(target.id) : String(gudangIdOrName);
};

export function useModalBarangKeluarControl({
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

        if (isBooleanFlag(barang.is_wajib_sn) && Array.isArray(barang.serials)) {
            return barang.serials.filter(s => {
                if (!s || typeof s !== 'object') return false;

                const sGudangId = s.gudang_id !== null && s.gudang_id !== undefined && String(s.gudang_id).trim() !== ''
                    ? String(s.gudang_id)
                    : null;

                const status = String(s.status || '').toUpperCase().trim();
                const kondisi = String(s.kondisi || '').toUpperCase().trim();

                return Boolean(sGudangId) &&
                    sGudangId === targetGudangId &&
                    ['IN_WAREHOUSE', 'READY', 'AVAILABLE'].includes(status) &&
                    !kondisi.includes('RUSAK') &&
                    !kondisi.includes('DAMAGED');
            }).length;
        }

        const kondisiStok = barang.kondisi_stok?.[targetGudangId];

        if (kondisiStok) {
            return Number(kondisiStok.aktif ?? (Number(kondisiStok.baru || 0) + Number(kondisiStok.bekas || 0)));
        }

        const stoksArray = barang.stoks || barang.stok || [];

        if (Array.isArray(stoksArray) && stoksArray.length > 0) {
            const stokRec = stoksArray.find(st => String(st.gudang_id || st.id || '') === targetGudangId);
            if (stokRec) return parseInt(stokRec.jumlah || stokRec.qty || 0, 10);
        }

        return 0;
    }, [gudangs]);

    const getBarangKondisiStok = useCallback((barang, gudangIdOrName) => {
        if (!barang || !gudangIdOrName) return { baru: 0, bekas: 0, rusak: 0, aktif: 0 };

        const targetGudangId = resolveGudangId(gudangs, gudangIdOrName);
        const kondisiStok = barang.kondisi_stok?.[targetGudangId];

        if (kondisiStok) {
            return {
                baru: Number(kondisiStok.baru || 0),
                bekas: Number(kondisiStok.bekas || 0),
                rusak: Number(kondisiStok.rusak || 0),
                aktif: Number(kondisiStok.aktif ?? (Number(kondisiStok.baru || 0) + Number(kondisiStok.bekas || 0)))
            };
        }

        return { baru: 0, bekas: 0, rusak: 0, aktif: getBarangStockInWarehouse(barang, gudangIdOrName) };
    }, [gudangs, getBarangStockInWarehouse]);

    const createEmptyRow = useCallback(() => {
        const gudangWithStock = gudangs.find(g => barangs.some(b => getBarangStockInWarehouse(b, g.id) > 0));
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
            qty: 0,
            harga: '',
            kondisi: 'Baru',
            serials: [],
            non_sn_selections: {}
        };
    }, [gudangs, barangs, getBarangStockInWarehouse]);

    const [rows, setRows] = useState([createEmptyRow()]);

    const [customerHistory, setCustomerHistory] = useState(() => {
        if (typeof window === 'undefined') return [];

        try {
            const saved = localStorage.getItem(CUSTOMER_HISTORY_KEY);
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    const customerOptions = useMemo(() => {
        const values = [...customerHistory, ...rows.map(row => row.nama_customer).filter(Boolean)];
        return [...new Set(values.map(value => String(value).trim()).filter(Boolean))].map(value => ({ value, label: value }));
    }, [customerHistory, rows]);

    const gudangOptions = useMemo(() => {
        if (!isOpen) return [];

        return gudangs.map(g => ({
            value: String(g.id),
            label: g.nama_gudang,
            id: String(g.id),
            subLabel: (
                <div className="flex items-center gap-1.5 text-[8.5px] leading-none mt-0.5 font-sans">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{g.stok_baru ?? 0} Baru</span>
                    <span className="text-slate-400 dark:text-slate-600 text-[7px]">&bull;</span>
                    <span className="font-bold text-amber-500 dark:text-amber-400">{g.stok_bekas ?? 0} Bekas</span>
                    <span className="text-slate-400 dark:text-slate-600 text-[7px]">&bull;</span>
                    <span className="font-bold text-rose-500 dark:text-rose-400">{g.stok_rusak ?? 0} Rusak</span>
                </div>
            )
        }));
    }, [isOpen, gudangs]);

    const getBarangPplOptionsForRow = useCallback(row => {
        if (!barangs?.length || !row?.gudang_asal_id) return [];

        const gudangId = String(row.gudang_asal_id);

        return barangs
            .filter(b => getBarangStockInWarehouse(b, gudangId) > 0)
            .map(b => {
                const stok = getBarangStockInWarehouse(b, gudangId);
                const isSn = isBooleanFlag(b.is_wajib_sn);
                const isPn = isBooleanFlag(b.is_wajib_pn);

                return {
                    value: b.kode_barang,
                    label: b.kode_barang,
                    id: String(b.id),
                    stock: stok,
                    is_wajib_sn: isSn,
                    is_wajib_pn: isPn,
                    subLabel: (
                        <div className="flex items-center gap-1 text-[8px] leading-none mt-0.5 font-sans">
                            {isSn && <span className="text-amber-500 dark:text-amber-400 font-bold">Wajib SN</span>}
                            {isSn && isPn && <span className="text-slate-400 text-[7px]">&bull;</span>}
                            {isPn && <span className="text-cyan-600 dark:text-cyan-400 font-bold">Wajib PN</span>}
                            {!isSn && !isPn && <span className="text-slate-400 font-medium">Standar</span>}
                            <span className="text-slate-400 text-[7px]">&bull;</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Stok: {stok}</span>
                        </div>
                    )
                };
            });
    }, [barangs, getBarangStockInWarehouse]);

    const getBarangNamaOptionsForRow = useCallback(row => {
        if (!barangs?.length || !row?.gudang_asal_id) return [];

        const gudangId = String(row.gudang_asal_id);

        return barangs
            .filter(b => getBarangStockInWarehouse(b, gudangId) > 0)
            .map(b => {
                const stok = getBarangStockInWarehouse(b, gudangId);
                const nama = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang || b.kode_barang;

                return {
                    value: nama,
                    label: nama,
                    id: String(b.id),
                    stock: stok,
                    subLabel: (
                        <div className="flex items-center gap-1 text-[8.5px] leading-none mt-0.5 font-sans">
                            <span className="text-slate-400 dark:text-slate-500 font-medium">Tersedia:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{stok} {b.deskripsi || b.satuan || 'Unit'}</span>
                        </div>
                    )
                };
            });
    }, [barangs, getBarangStockInWarehouse]);

    useEffect(() => {
        if (!isOpen) return;

        if (isEditMode && selectedItem) {
            const detail = selectedItem.details?.[0] || {};
            const targetBarang = barangs.find(b => String(b.id) === String(detail.barang_id));
            const isSn = isBooleanFlag(targetBarang?.is_wajib_sn);

            const existingSns = detail.serials
                ? detail.serials.map(s => typeof s === 'string' ? s : (s.serial_number || s.sn || s))
                : [];

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
    }, [isOpen, isEditMode, selectedItem, barangs, createEmptyRow]);

    const handleAddMoreRows = useCallback((count = 1) => {
        setRows(prev => {
            if (prev.length + count > MAX_ROWS_LIMIT) {
                alert(`Maksimal penambahan transaksi adalah ${MAX_ROWS_LIMIT} baris.`);
                const allowed = MAX_ROWS_LIMIT - prev.length;
                if (allowed <= 0) return prev;
                return [...prev, ...Array.from({ length: allowed }, () => createEmptyRow())];
            }

            return [...prev, ...Array.from({ length: count }, () => createEmptyRow())];
        });
    }, [createEmptyRow]);

    const handleRemoveRow = useCallback(index => {
        setRows(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
    }, []);

    const handleRowFieldChange = useCallback((rowIdx, field, value) => {
        setRows(prev => {
            const updated = [...prev];
            const current = updated[rowIdx];

            let gudangAsalId = current.gudang_asal_id;
            let barangId = current.barang_id;
            let serials = current.serials;
            let qty = current.qty;
            let pihakAsal = current.pihak_asal;
            let nomorImc = current.nomor_imc;
            let selections = current.non_sn_selections || {};

            if (field === 'gudang_asal_id') {
                const targetG = gudangs.find(g => String(g.id) === String(value) || g.nama_gudang === value);

                gudangAsalId = targetG ? String(targetG.id) : String(value);
                barangId = '';
                serials = [];
                qty = 0;
                nomorImc = '';
                selections = {};
            }

            if (field === 'sub_jenis') {
                if (value === 'PEMAKAIAN_INTERNAL') {
                    if (!LIST_KEPERLUAN_PATEN.includes(pihakAsal)) pihakAsal = LIST_KEPERLUAN_PATEN[0];
                } else if (LIST_KEPERLUAN_PATEN.includes(pihakAsal)) {
                    pihakAsal = '';
                }
            } else if (field === 'pihak_asal') {
                pihakAsal = value;
            }

            updated[rowIdx] = {
                ...current,
                [field]: value,
                gudang_asal_id: field === 'gudang_asal_id' ? gudangAsalId : current.gudang_asal_id,
                barang_id: barangId,
                serials,
                qty,
                pihak_asal: pihakAsal,
                nomor_imc: nomorImc,
                non_sn_selections: selections
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
                nomor_imc: targetBarang.kode_barang || '',
                kondisi: 'Baru',
                non_sn_selections: {}
            };

            return updated;
        });
    }, [barangs]);

    const handleSubmitForm = useCallback(e => {
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

            if (!r.pihak_asal?.trim()) {
                const labelTarget = r.sub_jenis === 'BARANG_KE_SITE' ? 'Site Tujuan / Teknisi' : 'Departemen Keperluan';
                alert(`Baris #${rowNum}: ${labelTarget} wajib diisi.`);
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

            const targetBarang = barangs.find(b => String(b.id) === String(r.barang_id));

            if (targetBarang) {
                const stockAvailable = getBarangStockInWarehouse(targetBarang, r.gudang_asal_id);

                if (stockAvailable <= 0) {
                    alert(`Baris #${rowNum}: Tidak ada stok aktif yang dapat dikeluarkan dari gudang asal.`);
                    return;
                }

                if (r.qty > stockAvailable) {
                    alert(`Baris #${rowNum}: Kuantitas pengeluaran (${r.qty}) melebihi stok yang dapat dikeluarkan (${stockAvailable} unit).`);
                    return;
                }
            }

            if (isBooleanFlag(targetBarang?.is_wajib_sn) && !isEditMode) {
                const serials = Array.isArray(r.serials) ? r.serials : [];

                if (serials.length !== Number(r.qty)) {
                    alert(`Baris #${rowNum}: Silakan pilih Serial Number tepat ${r.qty} unit.`);
                    return;
                }

                if (new Set(serials).size !== serials.length) {
                    alert(`Baris #${rowNum}: Serial Number tidak boleh dipilih lebih dari satu kali.`);
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
                nomor_imc: rows[0].nomor_imc?.trim() || null,
                pihak_asal: rows[0].pihak_asal.trim(),
                kode_projek: rows[0].kode_projek?.trim() || null,
                nama_customer: rows[0].nama_customer?.trim() || null
            }
            : {
                items: rows.map(r => ({
                    sub_jenis: r.sub_jenis,
                    tanggal: r.tanggal,
                    kondisi: r.kondisi || 'Baru',
                    nomor_omc: r.nomor_omc.trim(),
                    nomor_imc: r.nomor_imc?.trim() || null,
                    pihak_asal: r.pihak_asal.trim(),
                    kode_projek: r.kode_projek?.trim() || null,
                    nama_customer: r.nama_customer?.trim() || null,
                    gudang_asal_id: parseInt(r.gudang_asal_id, 10),
                    barang_id: parseInt(r.barang_id, 10),
                    qty: parseInt(r.qty, 10),
                    serials: r.serials || []
                }))
            };

        const targetUrl = isEditMode ? `/transaksi-keluar/${selectedItem.id}` : '/transaksi-keluar';

        router[isEditMode ? 'put' : 'post'](targetUrl, payload, {
            preserveScroll: true,
            only: ['transaksis', 'filters', 'barangs', 'gudangs'],
            onSuccess: page => {
                setIsProcessing(false);

                if (!page.props.flash?.error) {
                    const newCustomers = rows.map(row => String(row.nama_customer || '').trim()).filter(Boolean);

                    if (newCustomers.length > 0) {
                        setCustomerHistory(prev => {
                            const merged = [...new Set([...prev, ...newCustomers])];

                            try {
                                localStorage.setItem(CUSTOMER_HISTORY_KEY, JSON.stringify(merged));
                            } catch {}

                            return merged;
                        });
                    }

                    onClose();
                }
            },
            onError: () => setIsProcessing(false),
            onFinish: () => setIsProcessing(false)
        });
    }, [rows, barangs, isEditMode, selectedItem, getBarangStockInWarehouse, onClose]);

    return {
        isProcessing,
        rows,
        setRows,
        gudangOptions,
        customerOptions,
        getBarangPplOptions: getBarangPplOptionsForRow,
        getBarangPplOptionsForRow,
        getBarangNamaOptions: getBarangNamaOptionsForRow,
        getBarangNamaOptionsForRow,
        getBarangKondisiStok,
        getBarangStockInWarehouse,
        handleAddMoreRows,
        handleRemoveRow,
        handleRowFieldChange,
        handleBarangChange,
        handleSubmitForm
    };
}