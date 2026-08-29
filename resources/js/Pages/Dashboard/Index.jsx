import React, { useState, useRef, useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Package, 
    ArrowRightLeft, 
    Filter, 
    ChevronDown, 
    Check, 
    Image as ImageIcon, 
    Loader2, 
    RotateCcw 
} from 'lucide-react';
import { toPng } from 'html-to-image';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

// Import Komponen Terpisah
import StatistikGudang from './StatistikGudang';
import GrafikTransaksi from './GrafikTransaksi';
import PetaGudang from './PetaGudang';
import TabelTransaksi from './TabelTransaksi';

export default function DashboardIndex({ 
    kpi = {}, 
    filters = {}, 
    options = {}, 
    donutPenerimaan = {},
    mapData = [], 
    chartData = [], 
    kondisiChartData = [], 
    recentTransactions = [], 
    teamMembers = [] 
}) {
    const { auth } = usePage().props;
    const user = auth?.user || { name: 'User Operator', role: 'staff' };

    const [isExporting, setIsExporting] = useState(false);
    const dashboardRef = useRef(null);

    const currentGudang = String(filters.gudang_id || 'ALL');
    const currentKondisi = String(filters.kondisi || 'ALL');

    const gudangList = useMemo(() => {
        return [
            { id: 'ALL', nama_gudang: 'Semua Gudang', kode_gudang: 'ALL' },
            ...(options.gudangs || [])
        ];
    }, [options.gudangs]);

    const kondisiList = [
        { id: 'ALL', label: 'Semua Kondisi' },
        { id: 'Baru', label: 'Baru / Baik' },
        { id: 'Bekas', label: 'Bekas' },
        { id: 'Rusak', label: 'Rusak' }
    ];

    const handleFilterChange = (key, value) => {
        router.get(
            '/dashboard',
            {
                ...filters,
                [key]: value
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true
            }
        );
    };

    const handleResetAllFilters = () => {
        router.get(
            '/dashboard',
            {},
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const isFiltered = currentGudang !== 'ALL' || currentKondisi !== 'ALL';

    const selectedGudangLabel = useMemo(() => {
        if (currentGudang === 'ALL') return 'Semua Gudang';
        const found = gudangList.find(g => String(g.id) === currentGudang);
        return found ? `${found.nama_gudang}` : 'Pilih Gudang';
    }, [currentGudang, gudangList]);

    const selectedKondisiLabel = useMemo(() => {
        if (currentKondisi === 'ALL') return 'Semua Kondisi';
        const found = kondisiList.find(k => k.id.toLowerCase() === currentKondisi.toLowerCase());
        return found ? found.label : currentKondisi;
    }, [currentKondisi]);

    const handleDownloadDashboardImage = async () => {
        if (!dashboardRef.current) return;
        setIsExporting(true);
        const isDarkMode = document.documentElement.classList.contains('dark');
        try {
            const dataUrl = await toPng(dashboardRef.current, {
                cacheBust: true,
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: isDarkMode ? '#080d24' : '#f8fafc'
            });
            const link = document.createElement('a');
            const fileName = `Dashboard_Logistik_Gudang-${currentGudang}_${new Date().toISOString().slice(0, 10)}.png`;
            link.download = fileName;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Gagal mendownload gambar dashboard:", err);
            alert("Terjadi kesalahan saat memproses gambar.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <AuthenticatedLayout header="Dashboard Logistik">
            <Head title="Dashboard - Manajemen Gudang" />

            <style>{`
                .capture-area *::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                    background: transparent !important;
                }
                .capture-area * {
                    -ms-overflow-style: none !important;
                    scrollbar-width: none !important;
                }
            `}</style>

            <div className="space-y-5 max-w-7xl mx-auto">
                {/* 1. Header Title & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Dashboard Gudang & Inventory
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Pusat kendali dan monitoring pergerakan stok, persediaan fisik, serta pemetaan hub logistik.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/barang">
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer">
                                <Package className="w-4 h-4" />
                                <span>Master Barang</span>
                            </button>
                        </Link>
                        <Link href="/transaksi">
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer">
                                <ArrowRightLeft className="w-4 h-4" />
                                <span>Transaksi Stok</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* 2. Filter Bar & Action */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider pr-1">
                            <Filter className="w-4 h-4 text-blue-600 dark:text-amber-400" />
                            <span>Filter Dashboard</span>
                        </div>
                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                        
                        {/* Filter Gudang */}
                        <div className="w-full sm:w-48">
                            <DropdownMenu>
                                <DropdownMenuTrigger className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 h-9 px-3 rounded-lg flex items-center justify-between text-xs font-medium focus:outline-none shadow-sm">
                                    <span className="truncate">{selectedGudangLabel}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 z-50">
                                    {gudangList.map((g) => {
                                        const isSelected = currentGudang === String(g.id);
                                        return (
                                            <DropdownMenuItem 
                                                key={g.id} 
                                                onClick={() => handleFilterChange('gudang_id', String(g.id))}
                                                className="flex items-center justify-between text-xs cursor-pointer px-3 py-2"
                                            >
                                                <span className="truncate">{g.nama_gudang}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400 shrink-0 ml-1" />}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Filter Kondisi */}
                        <div className="w-full sm:w-36">
                            <DropdownMenu>
                                <DropdownMenuTrigger className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 h-9 px-3 rounded-lg flex items-center justify-between text-xs font-medium focus:outline-none shadow-sm">
                                    <span className="truncate">{selectedKondisiLabel}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 z-50">
                                    {kondisiList.map((k) => {
                                        const isSelected = currentKondisi === k.id;
                                        return (
                                            <DropdownMenuItem 
                                                key={k.id} 
                                                onClick={() => handleFilterChange('kondisi', k.id)}
                                                className="flex items-center justify-between text-xs cursor-pointer px-3 py-2"
                                            >
                                                <span>{k.label}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400 shrink-0 ml-1" />}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {isFiltered && (
                            <button
                                type="button"
                                onClick={handleResetAllFilters}
                                className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset Filter</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            onClick={handleDownloadDashboardImage}
                            disabled={isExporting}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Memproses Gambar...</span>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-4 h-4" />
                                    <span>Download Dashboard (PNG)</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 3. Area Capture Dashboard */}
                <div ref={dashboardRef} className="capture-area space-y-5 p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-900 rounded-xl overflow-hidden">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-3">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Ringkasan Operasional Pergudangan</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Lokasi: {selectedGudangLabel} &bull; Kondisi: {selectedKondisiLabel} &bull; Status: Real-Time Synced
                            </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                            Exported: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>

                    <StatistikGudang kpi={kpi} />
                    <GrafikTransaksi 
                        chartData={chartData} 
                        kondisiChartData={kondisiChartData} 
                        donutPenerimaan={donutPenerimaan}
                    />
                    <PetaGudang mapData={mapData} />
                    <TabelTransaksi recentTransactions={recentTransactions} teamMembers={teamMembers} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}