import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import HybridDropdown from '@/components/HybridDropdown';
import Toolbar from '@/components/Toolbar';
import TabelRekonsiliasi from './TabelRekonsiliasi';
import { 
    Boxes,
    FileSpreadsheet,
    Filter,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    RotateCcw
} from 'lucide-react';

const MONTH_NAMES = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
];

const KONDISI_OPTIONS = [
    { value: 'ALL', label: 'Semua Kondisi' },
    { value: 'Baru', label: 'Baru' },
    { value: 'Bekas', label: 'Bekas' },
    { value: 'Rusak', label: 'Rusak' },
];

export default function LaporanIndex({
    laporanStok = [],
    gudangs = [],
    filters = {}
}) {
    const [bulan, setBulan] = useState(String(filters.bulan || new Date().getMonth() + 1));
    const [tahun, setTahun] = useState(String(filters.tahun || 2026));
    const [gudangId, setGudangId] = useState(String(filters.gudang_id || 'ALL'));
    const [kondisi, setKondisi] = useState(String(filters.kondisi || 'ALL'));

    // State pencarian lokal dan query aktif
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [sortOrder, setSortOrder] = useState('asc');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isProcessing, setIsProcessing] = useState(false);

    // State Pagination Tabel
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [perPageInput, setPerPageInput] = useState(10);

    // Zoom Handlers
    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 120));
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 50));
    const handleResetZoom = () => setZoomLevel(100);
    const handleFitZoom = () => setZoomLevel(75);

    const toggleSort = () => {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    };

    const yearOptions = useMemo(() => [
        { value: '2024', label: '2024' },
        { value: '2025', label: '2025' },
        { value: '2026', label: '2026' },
        { value: '2027', label: '2027' },
        { value: '2028', label: '2028' },
    ], []);

    const gudangOptions = useMemo(() => [
        { value: 'ALL', label: 'Semua Gudang' },
        ...gudangs.map(g => ({ value: String(g.id), label: g.nama_gudang }))
    ], [gudangs]);

    const activeBulanLabel = useMemo(() => {
        const found = MONTH_NAMES.find(m => m.value === String(bulan));
        return found ? found.label : `Bulan ${bulan}`;
    }, [bulan]);

    const activeGudangLabel = useMemo(() => {
        if (gudangId === 'ALL') return 'Semua Titik Gudang';
        const found = gudangs.find(g => String(g.id) === String(gudangId));
        return found ? found.nama_gudang : 'Gudang Terpilih';
    }, [gudangId, gudangs]);

    const activeKondisiLabel = useMemo(() => {
        const found = KONDISI_OPTIONS.find(k => k.value === kondisi);
        return found ? found.label : 'Semua Kondisi';
    }, [kondisi]);

    // Data Sorting
    const sortedList = useMemo(() => {
        const list = [...laporanStok];
        list.sort((a, b) => {
            const keyA = a.kode_barang || a.nama_barang || '';
            const keyB = b.kode_barang || b.nama_barang || '';
            if (sortOrder === 'asc') return String(keyA).localeCompare(String(keyB));
            return String(keyB).localeCompare(String(keyA));
        });
        return list;
    }, [laporanStok, sortOrder]);

    // Client-Side Pagination
    const totalData = sortedList.length;
    const totalPages = Math.ceil(totalData / perPage) || 1;
    const fromIndex = totalData > 0 ? (currentPage - 1) * perPage + 1 : 0;
    const toIndex = Math.min(currentPage * perPage, totalData);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return sortedList.slice(start, start + perPage);
    }, [sortedList, currentPage, perPage]);

    const getRowNumber = (index) => (currentPage - 1) * perPage + index + 1;

    useEffect(() => {
        setCurrentPage(1);
    }, [bulan, tahun, gudangId, kondisi, searchQuery]);

    const handlePerPageSubmit = () => {
        let val = parseInt(perPageInput, 10);
        if (isNaN(val) || val < 1) val = 10;
        else if (val > 100) val = 100;
        setPerPageInput(val);
        setPerPage(val);
        setCurrentPage(1);
    };

    const handleFilterChange = (key, val) => {
        const newParams = {
            bulan,
            tahun,
            gudang_id: gudangId,
            kondisi,
            search: searchQuery || undefined,
            [key]: val,
        };
        if (key === 'bulan') setBulan(val);
        if (key === 'tahun') setTahun(val);
        if (key === 'gudang_id') setGudangId(val);
        if (key === 'kondisi') setKondisi(val);

        router.get('/laporan', newParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsProcessing(true),
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleSearchSubmit = () => {
        const trimmed = searchInput.trim();
        setSearchQuery(trimmed);
        router.get('/laporan', {
            bulan,
            tahun,
            gudang_id: gudangId,
            kondisi,
            search: trimmed || undefined
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsProcessing(true),
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setSearchQuery('');
        router.get('/laporan', {
            bulan,
            tahun,
            gudang_id: gudangId,
            kondisi,
            search: undefined
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsProcessing(true),
            onFinish: () => setIsProcessing(false)
        });
    };

    const isFiltered = bulan !== String(new Date().getMonth() + 1) || tahun !== '2026' || gudangId !== 'ALL' || kondisi !== 'ALL' || searchQuery !== '';

    const handleResetFilters = () => {
        const defaultBulan = String(new Date().getMonth() + 1);
        const defaultTahun = '2026';
        setBulan(defaultBulan);
        setTahun(defaultTahun);
        setGudangId('ALL');
        setKondisi('ALL');
        setSearchInput('');
        setSearchQuery('');
        router.get('/laporan', { 
            bulan: defaultBulan, 
            tahun: defaultTahun, 
            gudang_id: 'ALL', 
            kondisi: 'ALL',
            search: undefined
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsProcessing(true),
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleExportCSV = () => {
        window.open(`/laporan/export?bulan=${bulan}&tahun=${tahun}&gudang_id=${gudangId}&kondisi=${kondisi}&search=${searchQuery}`, '_blank');
    };

    return (
        <AuthenticatedLayout header="Laporan Bulanan">
            <Head title={`Laporan Logistik - ${activeBulanLabel} ${tahun}`} />

            <div className="space-y-4 max-w-7xl mx-auto">
                {/* 1. Header Caption & Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <span>Laporan & Rekonsiliasi Logistik</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Pusat audit saldo mutasi periodik, rekonsiliasi stok awal/akhir, dan kondisi fisik barang gudang.
                        </p>
                    </div>
                </div>

                {/* 2. Standalone Filter Card */}
                <div className="bg-white dark:bg-slate-900/70 p-3.5 sm:p-4 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider pr-1">
                        <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Filter Laporan</span>
                    </div>

                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                    {/* Filter Bulan */}
                    <div className="w-36">
                        <HybridDropdown
                            value={bulan}
                            options={MONTH_NAMES}
                            allowCustom={false}
                            onChange={(val) => handleFilterChange('bulan', val)}
                            placeholder="Pilih Bulan..."
                            disabled={isProcessing}
                            inputClassName="h-9 font-semibold text-xs bg-slate-50 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80"
                        />
                    </div>

                    {/* Filter Tahun */}
                    <div className="w-28">
                        <HybridDropdown
                            value={tahun}
                            options={yearOptions}
                            allowCustom={false}
                            onChange={(val) => handleFilterChange('tahun', val)}
                            placeholder="Pilih Tahun..."
                            disabled={isProcessing}
                            inputClassName="h-9 font-semibold text-xs bg-slate-50 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80"
                        />
                    </div>

                    {/* Filter Gudang */}
                    <div className="w-48">
                        <HybridDropdown
                            value={gudangId}
                            options={gudangOptions}
                            allowCustom={false}
                            onChange={(val) => handleFilterChange('gudang_id', val)}
                            placeholder="Semua Gudang..."
                            disabled={isProcessing}
                            inputClassName="h-9 font-semibold text-xs bg-slate-50 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80"
                        />
                    </div>

                    {/* Filter Kondisi */}
                    <div className="w-40">
                        <HybridDropdown
                            value={kondisi}
                            options={KONDISI_OPTIONS}
                            allowCustom={false}
                            onChange={(val) => handleFilterChange('kondisi', val)}
                            placeholder="Semua Kondisi..."
                            disabled={isProcessing}
                            inputClassName="h-9 font-semibold text-xs bg-slate-50 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80"
                        />
                    </div>

                    {isFiltered && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer ml-auto"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Filter</span>
                        </button>
                    )}
                </div>

                {/* 3. Card Container Tabel Utama */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
                    {/* Toolbar Atas */}
                    <Toolbar
                        sortOrder={sortOrder}
                        onToggleSort={toggleSort}
                        onExport={handleExportCSV}
                        isProcessing={isProcessing}
                        zoomLevel={zoomLevel}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onResetZoom={handleResetZoom}
                        onFitZoom={handleFitZoom}
                        leftContent={
                            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-xs font-bold font-mono">
                                <Boxes className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span>Rekonsiliasi Saldo Stok ({laporanStok.length} SKU)</span>
                            </div>
                        }
                    />

                    {/* Sub-Header: Informasi Konteks & Kolom Pencarian */}
                    <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                Daftar Rekonsiliasi Saldo Stok SKU
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">
                                Periode: <strong className="text-slate-700 dark:text-slate-300">{activeBulanLabel} {tahun}</strong> &bull; Lokasi: <strong className="text-slate-700 dark:text-slate-300">{activeGudangLabel}</strong> &bull; Kondisi: <strong className="text-slate-700 dark:text-slate-300">{activeKondisiLabel}</strong>
                            </span>
                        </div>

                        {/* Input Pencarian dengan Enter */}
                        <div className="relative w-full sm:w-60">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <Input
                                placeholder="Cari barang lalu tekan Enter..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearchSubmit();
                                    }
                                }}
                                disabled={isProcessing}
                                className="h-8 pl-8 pr-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabel Data Rekonsiliasi Stok */}
                    <div className="w-full overflow-x-auto relative border-b border-slate-200 dark:border-slate-800">
                        <TabelRekonsiliasi
                            dataList={paginatedData}
                            getRowNumber={getRowNumber}
                            zoomLevel={zoomLevel}
                        />
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <span>Tampilkan</span>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={perPageInput}
                                disabled={isProcessing}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val !== '' && Number(val) > 100) setPerPageInput(100);
                                    else setPerPageInput(val);
                                }}
                                onBlur={handlePerPageSubmit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handlePerPageSubmit();
                                    }
                                }}
                                className="h-8 w-16 text-center text-xs font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span>data per halaman</span>
                        </div>

                        <div className="text-slate-500">
                            Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{fromIndex}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{toIndex}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{totalData}</span> data
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1 || isProcessing}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                                Math.max(0, currentPage - 3),
                                Math.min(totalPages, currentPage + 2)
                            ).map((pageNum) => (
                                <Button
                                    key={`page-${pageNum}`}
                                    type="button"
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 ${
                                        currentPage === pageNum
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {pageNum}
                                </Button>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages || isProcessing}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}