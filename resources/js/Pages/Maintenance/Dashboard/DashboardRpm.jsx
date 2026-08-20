import React, { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSearchInput
} from '@/components/ui/dropdown-menu';
import { Filter, ChevronDown, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

// 👉 Import Komponen Terpisah
import StatistikRpm from './StatistikRpm';
import GrafikRpm from './GrafikRpm'; // <-- Import file baru
import TabelRpm from './TabelRpm';

// --- SUB-KOMPONEN FILTER SELECT ---
function FilterSelect({ options = [], value, onChange, placeholder = "Pilih...", searchPlaceholder = "Cari...", formatLabel }) {
    const [search, setSearch] = useState('');
    const showSearch = options.length > 10;

    const filteredOptions = options.filter((opt) => {
        if (!search.trim() || !showSearch) return true;
        const label = formatLabel ? formatLabel(opt) : (opt === 'ALL' ? placeholder : String(opt));
        return label.toLowerCase().includes(search.toLowerCase());
    });

    const currentLabel = formatLabel ? formatLabel(value) : (value === 'ALL' ? placeholder : value);

    return (
        <DropdownMenu onOpenChange={(open) => { if (!open) setSearch(''); }}>
            <DropdownMenuTrigger className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 h-9 px-3 rounded-lg flex items-center justify-between text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 shadow-sm">
                <span className="truncate">{currentLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 z-50 shadow-md">
                {showSearch && (
                    <DropdownMenuSearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                    />
                )}
                {filteredOptions.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">Tidak ditemukan</div>
                ) : (
                    filteredOptions.map((opt) => {
                        const isSelected = value === opt;
                        const itemLabel = formatLabel ? formatLabel(opt) : (opt === 'ALL' ? placeholder : opt);
                        return (
                            <DropdownMenuItem
                                key={opt}
                                onClick={() => onChange(opt)}
                                className={`flex items-center justify-between text-xs cursor-pointer px-3 py-2 rounded-md transition-colors ${
                                    isSelected 
                                        ? "text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-slate-800/50" 
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                }`}
                            >
                                <span className="truncate">{itemLabel}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 ml-1" />}
                            </DropdownMenuItem>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// --- MAIN DASHBOARD CONTAINER ---
export default function DashboardRpm({ summary = {}, options = {}, filters = {} }) {
    const [isExporting, setIsExporting] = useState(false);
    const dashboardRef = useRef(null);

    const listTahun = ['ALL', ...(options.tahun || [])];
    const listRtp = ['ALL', ...(options.rtp || [])];

    const selectedTahun = filters.tahun || 'ALL';
    const selectedRtp = filters.rtp || 'ALL';

    const handleFilterChange = (key, value) => {
        router.get(
            window.location.pathname,
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

    // EXPORT PNG SNAPSHOT
    const handleDownloadDashboardImage = async () => {
        if (!dashboardRef.current) return;
        setIsExporting(true);

        const isDarkMode = document.documentElement.classList.contains('dark');

        try {
            const dataUrl = await toPng(dashboardRef.current, { 
                cacheBust: true,
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: isDarkMode ? '#020617' : '#f8fafc'
            });

            const link = document.createElement('a');
            const fileName = `Dashboard_RPM_${selectedTahun}_${selectedRtp}_${new Date().toISOString().slice(0,10)}.png`;
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
        <div className="space-y-5">
            {/* CSS UNTUK MENYEMBUNYIKAN SEMUA SCROLLBAR DI AREA CAPTURE & TABEL */}
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

            {/* BAR KONTROL FILTER & DOWNLOAD */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        <Filter className="w-4 h-4 text-rose-500" />
                        <span>Filter Data RPM</span>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                    <div className="w-full sm:w-44">
                        <FilterSelect
                            options={listTahun} 
                            value={selectedTahun} 
                            onChange={(val) => handleFilterChange('tahun', val)}
                            placeholder="Semua Tahun" 
                            searchPlaceholder="Cari tahun..."
                            formatLabel={(t) => t === 'ALL' ? 'Semua Tahun' : `Tahun ${t}`}
                        />
                    </div>
                    <div className="w-full sm:w-56">
                        <FilterSelect
                            options={listRtp} 
                            value={selectedRtp} 
                            onChange={(val) => handleFilterChange('rtp', val)}
                            placeholder="Semua RTP/Area" 
                            searchPlaceholder="Cari RTP / Area..."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        onClick={handleDownloadDashboardImage}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400 dark:disabled:bg-rose-900 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-md shadow-rose-600/20 dark:shadow-rose-950/40 cursor-pointer"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating Image...</span>
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

            {/* CAPTURE AREA */}
            <div ref={dashboardRef} className="capture-area space-y-5 p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900 rounded-xl overflow-hidden transition-colors duration-200">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Dashboard RPM</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Filter: Tahun ({selectedTahun === 'ALL' ? 'Semua' : selectedTahun}) | RTP/Area ({selectedRtp === 'ALL' ? 'Semua' : selectedRtp})
                        </p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        Generated: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>

                {/* 1. SEKSI KARTU STATISTIK KPI */}
                <StatistikRpm summary={summary} />

                {/* 2. SEKSI GRAFIK RPM */}
                <GrafikRpm summary={summary} />

                {/* 3. SEKSI TABEL PIVOT */}
                <TabelRpm monthlyPivot={summary.monthlyPivot || {}} rtpPivot={summary.rtpPivot || []} />
            </div>
        </div>
    );
}