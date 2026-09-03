import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowDownCircle, 
    ArrowUpCircle, 
    ArrowRightLeft 
} from 'lucide-react';

export const KONDISI_OPTIONS = [
    { value: 'ALL', label: 'Semua Kondisi' },
    { value: 'Baru', label: 'Baru' },
    { value: 'Bekas', label: 'Bekas' },
    { value: 'Rusak', label: 'Rusak' },
];

export function useHistoryMovingControl({
    movings = {},
    gudangs = [],
    barangs = [],
    filters = {}
}) {
    const [search, setSearch] = useState(filters?.search || '');
    const [jenis, setJenis] = useState(filters?.jenis || 'ALL');
    const [gudangId, setGudangId] = useState(filters?.gudang_id || 'ALL');
    const [barangId, setBarangId] = useState(filters?.barang_id || 'ALL');
    const [kondisi, setKondisi] = useState(filters?.kondisi || 'ALL');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [sortOrder, setSortOrder] = useState('desc');
    const [perPage, setPerPage] = useState(filters?.per_page || 15);
    const [perPageInput, setPerPageInput] = useState(filters?.per_page || 15);
    const [isProcessing, setIsProcessing] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    const dataList = movings?.data || [];

    // Zoom Handlers
    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 120));
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 50));
    const handleResetZoom = () => setZoomLevel(100);
    const handleFitZoom = () => setZoomLevel(75);
    const toggleSort = () => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));

    // Eksekusi Permintaan Filter ke Server
    const fetchFilteredData = useCallback((searchVal, jenisVal, gudangVal, barangVal, kondisiVal, startVal, endVal, perPageVal, page = 1) => {
        router.get(
            '/history-moving',
            {
                search: searchVal || undefined,
                jenis: jenisVal,
                gudang_id: gudangVal,
                barang_id: barangVal,
                kondisi: kondisiVal,
                start_date: startVal,
                end_date: endVal,
                per_page: perPageVal,
                page
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsProcessing(true),
                onFinish: () => setIsProcessing(false)
            }
        );
    }, []);

    // Debounce Pencarian Kata Kunci
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }
        const timer = setTimeout(() => {
            fetchFilteredData(search, jenis, gudangId, barangId, kondisi, startDate, endDate, perPage, 1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search, fetchFilteredData, jenis, gudangId, barangId, kondisi, startDate, endDate, perPage]);

    const handleFilterChange = (key, val) => {
        let newSearch = search;
        let newJenis = jenis;
        let newGudangId = gudangId;
        let newBarangId = barangId;
        let newKondisi = kondisi;
        let newStartDate = startDate;
        let newEndDate = endDate;

        if (key === 'jenis') { setJenis(val); newJenis = val; }
        if (key === 'gudang_id') { setGudangId(val); newGudangId = val; }
        if (key === 'barang_id') { setBarangId(val); newBarangId = val; }
        if (key === 'kondisi') { setKondisi(val); newKondisi = val; }
        if (key === 'start_date') { setStartDate(val); newStartDate = val; }
        if (key === 'end_date') { setEndDate(val); newEndDate = val; }

        fetchFilteredData(newSearch, newJenis, newGudangId, newBarangId, newKondisi, newStartDate, newEndDate, perPage, 1);
    };

    const handlePerPageSubmit = () => {
        let val = parseInt(perPageInput, 10);
        if (isNaN(val) || val < 1) val = 15;
        else if (val > 100) val = 100;
        setPerPageInput(val);
        if (val !== perPage) {
            setPerPage(val);
            fetchFilteredData(search, jenis, gudangId, barangId, kondisi, startDate, endDate, val, 1);
        }
    };

    const isFiltered = useMemo(() => {
        return jenis !== 'ALL' || gudangId !== 'ALL' || barangId !== 'ALL' || kondisi !== 'ALL' || search !== '';
    }, [jenis, gudangId, barangId, kondisi, search]);

    const handleResetFilters = () => {
        setSearch('');
        setJenis('ALL');
        setGudangId('ALL');
        setBarangId('ALL');
        setKondisi('ALL');
        fetchFilteredData('', 'ALL', 'ALL', 'ALL', 'ALL', startDate, endDate, perPage, 1);
    };

    const handleExportCSV = () => {
        const query = new URLSearchParams({
            search,
            jenis,
            gudang_id: gudangId,
            barang_id: barangId,
            kondisi,
            start_date: startDate,
            end_date: endDate
        }).toString();
        window.open(`/history-moving/export?${query}`, '_blank');
    };

    const gudangOptions = useMemo(() => [
        { value: 'ALL', label: 'Semua Gudang' },
        ...gudangs.map((g) => ({ value: String(g.id), label: g.nama_gudang }))
    ], [gudangs]);

    // Opsi Barang: Nama Barang sebagai label utama, Kode PPL sebagai sub-teks
    const barangOptions = useMemo(() => [
        { value: 'ALL', label: 'Semua Barang' },
        ...barangs.map((b) => {
            const nama = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang || b.kode_barang;
            return {
                value: String(b.id),
                label: nama,
                subLabel: b.kode_barang ? (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {b.kode_barang}
                    </span>
                ) : null
            };
        })
    ], [barangs]);

    const activeGudangLabel = useMemo(() => {
        if (gudangId === 'ALL') return 'Semua Titik Gudang';
        const found = gudangs.find((g) => String(g.id) === String(gudangId));
        return found ? found.nama_gudang : 'Gudang Terpilih';
    }, [gudangId, gudangs]);

    const getItemId = (item) => item?.id || item?.no_transaksi;
    const getRowNumber = (index) => {
        const currentPage = movings?.current_page || 1;
        const limit = movings?.per_page || 15;
        return (currentPage - 1) * limit + index + 1;
    };

    // Konfigurasi Kolom Tabel
    const columns = useMemo(() => [
        {
            key: 'tanggal',
            label: 'TANGGAL',
            render: (item) => (
                <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
                    {item.tanggal ? String(item.tanggal).split('T')[0] : '-'}
                </span>
            )
        },
        {
            key: 'tipe_moving',
            label: 'TIPE MOVING',
            render: (item) => {
                const jenisTrx = item.jenis_transaksi;
                const subJenis = item.sub_jenis;

                let icon = null;
                let colorText = '';
                let mainLabel = '';
                let subLabel = '';

                if (jenisTrx === 'TRANSFER' || subJenis === 'TRANSFER_GUDANG') {
                    icon = <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />;
                    colorText = 'text-blue-600 dark:text-blue-400';
                    mainLabel = 'TRANSFER';
                    subLabel = 'Antar Gudang';
                } else if (jenisTrx === 'KELUAR') {
                    icon = <ArrowUpCircle className="w-3.5 h-3.5 text-rose-500" />;
                    colorText = 'text-rose-600 dark:text-rose-400';
                    mainLabel = 'KELUAR';
                    if (subJenis === 'BARANG_KE_SITE') subLabel = 'Proyek';
                    else if (subJenis === 'PEMAKAIAN_INTERNAL') subLabel = 'Non Proyek';
                    else subLabel = subJenis ? subJenis.replace(/_/g, ' ') : 'Outbound';
                } else {
                    icon = <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-500" />;
                    colorText = 'text-emerald-600 dark:text-emerald-400';
                    mainLabel = 'MASUK';
                    if (subJenis === 'PEMBELIAN') subLabel = 'Pembelian';
                    else if (subJenis === 'PEMINJAMAN') subLabel = 'Peminjaman';
                    else if (subJenis === 'PENGEMBALIAN') subLabel = 'Pengembalian';
                    else subLabel = subJenis ? subJenis.replace(/_/g, ' ') : 'Inbound';
                }

                return (
                    <div className="flex flex-col items-start leading-tight">
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${colorText}`}>
                            {icon}
                            <span>{mainLabel}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-5 capitalize font-medium">
                            {subLabel}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'no_transaksi',
            label: 'NO TRANSAKSI & DOKUMEN',
            render: (item) => (
                <div className="flex flex-col min-w-[140px] leading-tight">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {item.no_transaksi}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {item.nomor_omc ? `OMC: ${item.nomor_omc}` : (item.nomor_imc ? `IMC: ${item.nomor_imc}` : '-')}
                    </span>
                </div>
            )
        },
        {
            key: 'nama_barang',
            label: 'KODE PPL & NAMA BARANG',
            render: (item) => {
                const detail = item.details?.[0] || {};
                const b = detail.barang || {};
                const brandNama = b.brand || b.nama_barang || '-';
                const subDeskripsi = [b.tipe, b.kategori].filter(Boolean).join(' • ');

                return (
                    <div className="flex flex-col max-w-[220px] leading-tight" title={`${brandNama} (${b.kode_barang})`}>
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {brandNama}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            <span className="font-bold text-blue-600 dark:text-blue-400">{b.kode_barang || '-'}</span>
                            {subDeskripsi && <span>• {subDeskripsi}</span>}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'qty_satuan',
            label: 'QTY',
            render: (item) => {
                const detail = item.details?.[0] || {};
                const b = detail.barang || {};
                return (
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Badge variant="outline" className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                            {detail.qty || 0}
                        </Badge>
                        <span className="text-xs text-slate-500 font-medium">
                            {b.deskripsi || 'Unit'}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'rute_pergerakan',
            label: 'ALUR PERGERAKAN',
            render: (item) => {
                const jenisTrx = item.jenis_transaksi;
                let asal = item.gudang_asal?.nama_gudang || item.pihak_asal || item.supplier?.nama_supplier || '-';
                let tujuan = item.gudang_tujuan?.nama_gudang || item.pihak_asal || '-';

                if (jenisTrx === 'KELUAR') {
                    asal = item.gudang_asal?.nama_gudang || '-';
                    tujuan = item.pihak_asal || 'Site / Proyek';
                }

                return (
                    <div className="flex flex-col gap-0.5 min-w-[170px] max-w-[250px] leading-tight text-xs py-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                                Dari:
                            </span>
                            <span className="font-semibold truncate" title={asal}>
                                {asal}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <span className="text-[10px] font-medium text-emerald-600/70 dark:text-emerald-400/70 shrink-0">
                                Ke:
                            </span>
                            <span className="font-bold truncate" title={tujuan}>
                                {tujuan}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'serials',
            label: 'SERIAL NUMBER / KONDISI',
            render: (item) => {
                const detail = item.details?.[0] || {};
                const listSn = detail.serials || [];
                const rawKondisi = String(detail.kondisi || item.kondisi || 'Baru').trim();
                const qty = detail.qty || 1;

                if (listSn.length > 0) {
                    return (
                        <div className="flex flex-wrap gap-1 max-w-[280px] max-h-24 overflow-y-auto py-1">
                            {listSn.map((s, idx) => {
                                const snVal = s.serial_number || s;
                                const k = String(s.kondisi || rawKondisi || 'Baru').toUpperCase().trim();
                                let kondisiText = 'Baru';
                                let badgeColor = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
                                if (k === 'RUSAK') {
                                    kondisiText = 'Rusak';
                                    badgeColor = 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30';
                                } else if (k.includes('BEKAS') || k.includes('SECOND')) {
                                    kondisiText = 'Bekas';
                                    badgeColor = 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
                                }

                                return (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 px-1.5 py-0.5 shrink-0 flex items-center gap-1"
                                    >
                                        <span>{snVal}</span>
                                        <span className={`text-[8px] px-1 py-0.2 rounded font-sans font-bold uppercase border ${badgeColor}`}>
                                            {kondisiText}
                                        </span>
                                    </Badge>
                                );
                            })}
                        </div>
                    );
                }

                let cleanKondisi = (!rawKondisi || rawKondisi === '-') ? 'Baru' : rawKondisi;
                if (!/^\d+/.test(cleanKondisi)) {
                    cleanKondisi = `${qty} ${cleanKondisi}`;
                }

                return (
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        No SN ({cleanKondisi})
                    </span>
                );
            }
        }
    ], []);

    return {
        search,
        setSearch,
        jenis,
        setJenis,
        gudangId,
        setGudangId,
        barangId,
        setBarangId,
        kondisi,
        setKondisi,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        sortOrder,
        toggleSort,
        perPage,
        perPageInput,
        setPerPageInput,
        handlePerPageSubmit,
        isProcessing,
        zoomLevel,
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        handleFitZoom,
        dataList,
        columns,
        getItemId,
        getRowNumber,
        gudangOptions,
        barangOptions,
        activeGudangLabel,
        isFiltered,
        handleFilterChange,
        handleResetFilters,
        handleExportCSV
    };
}