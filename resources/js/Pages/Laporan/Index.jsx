import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Input } from "@/components/ui/input";
import HybridDropdown from '@/components/HybridDropdown';
import Toolbar from '@/components/Toolbar';
import TabelRekonsiliasi from './TabelRekonsiliasi';
import TabelJurnal from './TabelJurnal';
import { 
    Boxes,
    BookOpen,
    Search, 
    X,
    FileSpreadsheet
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

export default function LaporanIndex({
    laporanStok = [],
    jurnalMutasi = [],
    gudangs = [],
    filters = {}
}) {
    const [subTab, setSubTab] = useState('rekonsiliasi'); // 'rekonsiliasi' | 'jurnal'
    const [bulan, setBulan] = useState(String(filters.bulan || new Date().getMonth() + 1));
    const [tahun, setTahun] = useState(String(filters.tahun || 2026));
    const [gudangId, setGudangId] = useState(String(filters.gudang_id || 'ALL'));
    const [search, setSearch] = useState(filters.search || '');
    const [sortOrder, setSortOrder] = useState('asc');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isProcessing, setIsProcessing] = useState(false);

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

    const handleFilterChange = (key, val) => {
        const newParams = {
            bulan,
            tahun,
            gudang_id: gudangId,
            search,
            [key]: val,
        };
        if (key === 'bulan') setBulan(val);
        if (key === 'tahun') setTahun(val);
        if (key === 'gudang_id') setGudangId(val);

        router.get('/laporan', newParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsProcessing(true),
            onFinish: () => setIsProcessing(false)
        });
    };

    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }
        const timer = setTimeout(() => {
            router.get('/laporan', { bulan, tahun, gudang_id: gudangId, search }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsProcessing(true),
                onFinish: () => setIsProcessing(false)
            });
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleExportCSV = () => {
        window.open(`/laporan/export?bulan=${bulan}&tahun=${tahun}&gudang_id=${gudangId}`, '_blank');
    };

    // Perhitungan Total Akumulasi Angka untuk Baris Footer
    const totalSummary = useMemo(() => {
        return laporanStok.reduce((acc, row) => ({
            stok_awal: acc.stok_awal + (row.stok_awal || 0),
            masuk: acc.masuk + (row.masuk || 0),
            keluar: acc.keluar + (row.keluar || 0),
            transfer_net: acc.transfer_net + (row.transfer_net || 0),
            stok_akhir: acc.stok_akhir + (row.stok_akhir || 0),
            kondisi_baru: acc.kondisi_baru + (row.kondisi_baru || 0),
            kondisi_bekas: acc.kondisi_bekas + (row.kondisi_bekas || 0),
            kondisi_rusak: acc.kondisi_rusak + (row.kondisi_rusak || 0),
        }), {
            stok_awal: 0, masuk: 0, keluar: 0, transfer_net: 0, stok_akhir: 0,
            kondisi_baru: 0, kondisi_bekas: 0, kondisi_rusak: 0
        });
    }, [laporanStok]);

    return (
        <AuthenticatedLayout header="Laporan Bulanan">
            <Head title={`Laporan Logistik - ${activeBulanLabel} ${tahun}`} />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* HEADER CAPTION & TITLE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <span>Laporan & Rekonsiliasi Logistik</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Pusat audit saldo mutasi periodik, riwayat pergerakan fisik gudang, dan buku jurnal logistik.
                        </p>
                    </div>
                </div>

                {/* CONTAINER UTAMA (PERSIS SEPERTI TRANSAKSI & MASTER BARANG) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
                    
                    {/* 1. TOOLBAR ATAS DENGAN TAB SWITCHER & CONTROLS */}
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
                            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setSubTab('rekonsiliasi')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        subTab === 'rekonsiliasi'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Boxes className="w-3.5 h-3.5" />
                                    <span>Rekonsiliasi Stok ({laporanStok.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSubTab('jurnal')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        subTab === 'jurnal'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>Buku Jurnal ({jurnalMutasi.length})</span>
                                </button>
                            </div>
                        }
                    />

                    {/* 2. SUB-HEADER: TITLE & FILTER INTEGRASI */}
                    <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                        <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                {subTab === 'rekonsiliasi' ? 'Rekonsiliasi Saldo Stok SKU' : 'Buku Jurnal Mutasi Logistik'}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">
                                Periode: <strong className="text-slate-700 dark:text-slate-300">{activeBulanLabel} {tahun}</strong> • Lokasi: <strong className="text-slate-700 dark:text-slate-300">{activeGudangLabel}</strong>
                            </span>
                        </div>

                        {/* Komponen Filter Sejajar */}
                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                            <div className="w-28 sm:w-32">
                                <HybridDropdown
                                    value={bulan}
                                    options={MONTH_NAMES}
                                    onChange={(val) => handleFilterChange('bulan', val)}
                                    placeholder="Pilih Bulan..."
                                    disabled={isProcessing}
                                    inputClassName="h-8 font-semibold text-xs bg-white dark:bg-slate-900"
                                />
                            </div>

                            <div className="w-24 sm:w-28">
                                <HybridDropdown
                                    value={tahun}
                                    options={yearOptions}
                                    onChange={(val) => handleFilterChange('tahun', val)}
                                    placeholder="Pilih Tahun..."
                                    disabled={isProcessing}
                                    inputClassName="h-8 font-semibold text-xs bg-white dark:bg-slate-900"
                                />
                            </div>

                            <div className="w-36 sm:w-44">
                                <HybridDropdown
                                    value={gudangId}
                                    options={gudangOptions}
                                    onChange={(val) => handleFilterChange('gudang_id', val)}
                                    placeholder="Semua Gudang..."
                                    disabled={isProcessing}
                                    inputClassName="h-8 font-semibold text-xs bg-white dark:bg-slate-900"
                                />
                            </div>

                            <div className="relative w-full sm:w-52">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Cari Kode PPL / Barang..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    disabled={isProcessing}
                                    className="h-8 pl-8 pr-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. TABEL DATA */}
                    <div className="w-full overflow-x-auto relative border-b border-slate-200 dark:border-slate-800">
                        {subTab === 'rekonsiliasi' ? (
                            <TabelRekonsiliasi dataList={laporanStok} zoomLevel={zoomLevel} />
                        ) : (
                            <TabelJurnal dataList={jurnalMutasi} zoomLevel={zoomLevel} />
                        )}
                    </div>

                    {/* 4. FOOTER SUMMARY BAR (TOTAL MUTASI & KONDISI FISIK) */}
                    {subTab === 'rekonsiliasi' && (
                        <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs border-t border-slate-100 dark:border-slate-800/60">
                            <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                Total Rekonsiliasi ({laporanStok.length} SKU)
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5 text-[11px] font-mono">
                                <div>Awal: <strong className="text-slate-800 dark:text-slate-200 font-bold">{totalSummary.stok_awal}</strong></div>
                                <div>Masuk: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+{totalSummary.masuk}</strong></div>
                                <div>Keluar: <strong className="text-rose-600 dark:text-rose-400 font-bold">-{totalSummary.keluar}</strong></div>
                                <div>Transfer Net: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{totalSummary.transfer_net >= 0 ? `+${totalSummary.transfer_net}` : totalSummary.transfer_net}</strong></div>
                                <div className="px-2.5 py-0.5 rounded-md bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">
                                    Akhir: {totalSummary.stok_akhir} Unit
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 pl-1 border-l border-slate-300 dark:border-slate-700">
                                    ({totalSummary.kondisi_baru} Baru • {totalSummary.kondisi_bekas} Bekas • {totalSummary.kondisi_rusak} Rusak)
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}