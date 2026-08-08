import React, { useState, useMemo, useRef } from 'react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuSearchInput
} from '@/components/ui/dropdown-menu';
import { Filter, ChevronDown, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

// Import Komponen Terpisah
import StatistikSmartkey from './StatistikSmartkey';
import TabelSmartkey from './TabelSmartkey';

// --- SUB-KOMPONEN MULTI-SELECT FILTER ---
function FilterMultiSelect({ 
    options = [], 
    selectedValues = [], 
    onChange, 
    placeholder = "Pilih...", 
    searchPlaceholder = "Cari..." 
}) {
    const [search, setSearch] = useState('');
    const showSearch = options.length > 5;

    // Filter daftar opsi berdasarkan input pencarian dropdown
    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        return options.filter((opt) => 
            String(opt).toLowerCase().includes(search.toLowerCase())
        );
    }, [options, search]);

    // Handle toggle pilih 1 item
    const handleToggle = (opt) => {
        if (selectedValues.includes(opt)) {
            onChange(selectedValues.filter((item) => item !== opt));
        } else {
            onChange([...selectedValues, opt]);
        }
    };

    // Handle Select All / Clear All
    const handleSelectAll = () => {
        if (selectedValues.length === options.length) {
            onChange([]);
        } else {
            onChange([...options]);
        }
    };

    // Label yang tampil pada tombol Trigger
    const getTriggerLabel = () => {
        if (selectedValues.length === 0) return placeholder;
        if (selectedValues.length === 1) return selectedValues[0];
        return `${selectedValues.length} Terpilih`;
    };

    return (
        <DropdownMenu onOpenChange={(open) => { if (!open) setSearch(''); }}>
            <DropdownMenuTrigger className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 h-9 px-3 rounded-lg flex items-center justify-between text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 shadow-sm">
                <span className="truncate font-normal">{getTriggerLabel()}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 z-50 shadow-md p-1">
                {/* Search Input */}
                {showSearch && (
                    <DropdownMenuSearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 mb-1"
                    />
                )}

                {/* Header Action: Pilih Semua & Reset */}
                <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-sky-600 dark:text-sky-400 hover:underline font-medium cursor-pointer"
                    >
                        {selectedValues.length === options.length ? "Batal Semua" : "Pilih Semua"}
                    </button>
                    {selectedValues.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onChange([])}
                            className="text-slate-400 hover:text-rose-500 font-medium transition-colors cursor-pointer"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* List Option Items */}
                {filteredOptions.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">Tidak ditemukan</div>
                ) : (
                    filteredOptions.map((opt) => {
                        const isChecked = selectedValues.includes(opt);
                        return (
                            <DropdownMenuCheckboxItem
                                key={opt}
                                checked={isChecked}
                                onCheckedChange={() => handleToggle(opt)}
                                className="text-xs py-1.5 cursor-pointer text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800/60"
                            >
                                <span className="truncate">{opt}</span>
                            </DropdownMenuCheckboxItem>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// --- MAIN DASHBOARD CONTAINER SMARTKEY ---
export default function DashboardSmartkey({ data = [] }) {
    // 1. STATE FILTER & EXPORT
    const [selectedInfrako, setSelectedInfrako] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [selectedSN, setSelectedSN] = useState([]); // State Multi-Select Dropdown Serial Number (SN)
    const [isExporting, setIsExporting] = useState(false);

    const dashboardRef = useRef(null);

    // List unik tanpa opsi 'ALL' keras (di-handle dinamis oleh array kosong)
    const listInfrako = useMemo(() => [...new Set(data.map((i) => i.infrako).filter(Boolean))], [data]);
    const listStatus = useMemo(() => [...new Set(data.map((i) => i.status).filter(Boolean))], [data]);
    
    // List unik Serial Number (SN) dari masterdata
    const listSN = useMemo(() => {
        const uniqueSN = data
            .map((i) => i.serial_number || i.sn || i.serialNumber)
            .filter((sn) => sn && String(sn).trim() !== '' && String(sn).toUpperCase() !== '#N/A');
        
        return [...new Set(uniqueSN)].sort();
    }, [data]);

    // 2. LOGIKA FILTERING DATA (MULTI-SELECT INFRAKO, STATUS, & SERIAL NUMBER)
    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const matchInfrako = selectedInfrako.length === 0 || selectedInfrako.includes(item.infrako);
            const matchStatus = selectedStatus.length === 0 || selectedStatus.includes(item.status);

            const itemSN = item.serial_number || item.sn || item.serialNumber;
            const matchSN = selectedSN.length === 0 || selectedSN.includes(itemSN);

            return matchInfrako && matchStatus && matchSN;
        });
    }, [data, selectedInfrako, selectedStatus, selectedSN]);

    // EXPORT PNG SNAPSHOT (DISESUAIKAN UNTUK MENGELIMINASI GLITCH MAP)
    const handleDownloadDashboardImage = async () => {
        if (!dashboardRef.current) return;
        setIsExporting(true);

        const isDarkMode = document.documentElement.classList.contains('dark');

        try {
            // 1. Tambahkan class penanda untuk mematikan backdrop-filter sementara
            dashboardRef.current.classList.add('exporting-mode');

            // 2. Jeda singkat agar render canvas peta stabil
            await new Promise((resolve) => setTimeout(resolve, 300));

            const dataUrl = await toPng(dashboardRef.current, { 
                cacheBust: true,
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: isDarkMode ? '#020617' : '#f8fafc',
                fetchRequestInit: {
                    mode: 'cors',
                },
            });

            const link = document.createElement('a');
            const infraName = selectedInfrako.length === 0 ? 'Semua' : selectedInfrako.join('-');
            const statusName = selectedStatus.length === 0 ? 'Semua' : selectedStatus.join('-');
            const snFilterName = selectedSN.length === 0 ? 'Semua' : selectedSN.join('-');
            const fileName = `Dashboard_SmartKey_${infraName}_${statusName}_SN-${snFilterName}_${new Date().toISOString().slice(0,10)}.png`;
            
            link.download = fileName;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Gagal mendownload gambar dashboard:", err);
            alert("Terjadi kesalahan saat memproses gambar.");
        } finally {
            // 3. Kembalikan kondisi normal
            if (dashboardRef.current) {
                dashboardRef.current.classList.remove('exporting-mode');
            }
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* CSS UNTUK MENYEMBUNYIKAN SCROLLBAR DAN PERBAIKAN GLITCH CAPTURE PETA */}
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

                /* Hapus efek backdrop-blur saat export agar tidak menciptakan kotak hitam/glitch pada map */
                .capture-area.exporting-mode * {
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                }
            `}</style>

            {/* BAR KONTROL FILTER & DOWNLOAD */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider pr-1">
                        <Filter className="w-4 h-4 text-sky-500" />
                        <span>Filter SmartKey</span>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                    
                    {/* Filter Infrako (Multi-select) */}
                    <div className="w-full sm:w-48">
                        <FilterMultiSelect
                            options={listInfrako} 
                            selectedValues={selectedInfrako} 
                            onChange={setSelectedInfrako}
                            placeholder="Semua Infrako" 
                            searchPlaceholder="Cari Infrako..."
                        />
                    </div>

                    {/* Filter Status Unit (Multi-select) */}
                    <div className="w-full sm:w-44">
                        <FilterMultiSelect
                            options={listStatus} 
                            selectedValues={selectedStatus} 
                            onChange={setSelectedStatus}
                            placeholder="Semua Status Unit" 
                            searchPlaceholder="Cari Status..."
                        />
                    </div>

                    {/* Filter Serial Number / SN (Multi-select Dropdown) */}
                    <div className="w-full sm:w-52">
                        <FilterMultiSelect
                            options={listSN}
                            selectedValues={selectedSN}
                            onChange={setSelectedSN}
                            placeholder="Semua Serial Number"
                            searchPlaceholder="Cari Serial Number..."
                        />
                    </div>
                </div>

                {/* Tombol Download PNG */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        onClick={handleDownloadDashboardImage}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-400 dark:disabled:bg-sky-900 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-md shadow-sky-600/20 dark:shadow-sky-950/40 cursor-pointer"
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

            {/* AREA CAPTURE DASHBOARD */}
            <div ref={dashboardRef} className="capture-area space-y-5 p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900 rounded-xl overflow-hidden transition-colors duration-200">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Dashboard SmartKey</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Filter: Region Infrako ({selectedInfrako.length === 0 ? 'Semua' : selectedInfrako.join(', ')}) | Status Unit ({selectedStatus.length === 0 ? 'Semua' : selectedStatus.join(', ')}) | Serial Number ({selectedSN.length === 0 ? 'Semua' : selectedSN.join(', ')})
                        </p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        Generated: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>

                {/* 1. SEKSI STATISTIK & MAP */}
                <StatistikSmartkey data={filteredData} />

                {/* 2. SEKSI TABEL PIVOT KSM */}
                <TabelSmartkey data={filteredData} />
            </div>
        </div>
    );
}