import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, 
    KeyRound, 
    Activity, 
    Download, 
    Trash2, 
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    X,
    RotateCcw,
    Loader2
} from 'lucide-react';
import { router } from '@inertiajs/react';

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Komponen Tabel CRUD Utama
import CrudTable from './CrudTable';

// Helper Proteksi Route Helper (Ziggy)
const safeRoute = (name, params) => {
    if (typeof window !== 'undefined' && typeof window.route === 'function') {
        return window.route(name, params);
    }
    if (typeof route === 'function') {
        return route(name, params);
    }
    return '#';
};

// Helper konsistensi pencarian ID
const getItemId = (item) => item?.id || item?.rpm_id || item?.serial_number;

export default function TabMasterData({ rpmMasters, smartkeyMasters, filters }) {
    const [subTab, setSubTab] = useState(filters?.tab || 'rpm');
    
    // State Filter & Pagination
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [sortOrder, setSortOrder] = useState(filters?.order || 'asc');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [perPageInput, setPerPageInput] = useState(filters?.per_page || 10);
    const [isProcessing, setIsProcessing] = useState(false);

    // State Row Checkboxes
    const [selectedIds, setSelectedIds] = useState([]);

    const currentPagination = subTab === 'rpm' ? rpmMasters : smartkeyMasters;
    const dataList = currentPagination?.data || [];

    // --- FITUR DEBOUNCE PENCARIAN ---
    const isMounted = useRef(false);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        const timer = setTimeout(() => {
            fetchFilteredData(searchTerm, sortOrder, perPage, subTab, 1);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Synchronize state perPage jika props filters berubah
    useEffect(() => {
        if (filters?.per_page) {
            setPerPage(filters.per_page);
            setPerPageInput(filters.per_page);
        }
    }, [filters?.per_page]);

    // --- HANDLER SUBMIT INPUT PER PAGE ---
    const handlePerPageSubmit = () => {
        let val = parseInt(perPageInput, 10);
        
        if (isNaN(val) || val < 1) {
            val = 10; // Default jika kosong atau 0
        } else if (val > 100) {
            val = 100; // Batas maksimal 100
        }

        setPerPageInput(val);
        if (val !== perPage) {
            setPerPage(val);
            fetchFilteredData(searchTerm, sortOrder, val, subTab, 1);
        }
    };

    // --- FETCH DATA / ROUTING HANDLER ---
    const fetchFilteredData = (newSearch, newOrder, newPerPage, targetTab = subTab, page = 1) => {
        setSelectedIds([]); // Reset ID terpilih saat fetch data baru
        router.get(
            safeRoute('maintenance.data-management.index'), 
            { 
                tab: targetTab,
                search: newSearch, 
                order: newOrder, 
                per_page: newPerPage,
                page: page
            }, 
            { 
                preserveState: true, 
                preserveScroll: true, 
                replace: true,
                onStart: () => setIsProcessing(true),
                onFinish: () => setIsProcessing(false)
            }
        );
    };

    const handleSubTabSwitch = (tab) => {
        if (tab === subTab) return;
        setSubTab(tab);
        setSelectedIds([]);
        fetchFilteredData(searchTerm, sortOrder, perPage, tab, 1);
    };

    const getRowNumber = (index) => {
        if (!currentPagination) return index + 1;
        const currentPage = currentPagination.current_page || 1;
        const limit = currentPagination.per_page || 10;
        return (currentPage - 1) * limit + index + 1;
    };

    const toggleSort = () => {
        const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        setSortOrder(nextOrder);
        fetchFilteredData(searchTerm, nextOrder, perPage, subTab, 1);
    };

    const handlePageChange = (url) => {
        if (url) {
            setSelectedIds([]);
            router.get(url, {}, { 
                preserveState: true, 
                preserveScroll: true, 
                replace: true,
                onStart: () => setIsProcessing(true),
                onFinish: () => setIsProcessing(false)
            });
        }
    };

    // --- CHECKBOX HANDLERS (SINKRON DENGAN CRUDTABLE) ---
    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = dataList.map(item => getItemId(item)).filter(Boolean);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // --- EXPORT HANDLER ---
    const handleExportData = () => {
        const routeName = subTab === 'rpm' 
            ? 'maintenance.data-management.export-rpm' 
            : 'maintenance.data-management.export-smartkey';
        
        const exportUrl = safeRoute(routeName);
        if (exportUrl !== '#') {
            window.open(exportUrl, '_blank');
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin MENGHAPUS ${selectedIds.length} data terpilih?`)) return;

        const routeName = subTab === 'rpm' 
            ? 'maintenance.data-management.destroy-rpm' 
            : 'maintenance.data-management.destroy-smartkey';

        router.delete(safeRoute(routeName), {
            data: { ids: selectedIds },
            preserveScroll: true,
            onStart: () => setIsProcessing(true),
            onSuccess: () => setSelectedIds([]),
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleResetTable = () => {
        if (!confirm(`Apakah Anda yakin ingin MENGOSONGKAN SELURUH data Master ${subTab.toUpperCase()}?`)) return;
        
        const routeName = subTab === 'rpm' 
            ? 'maintenance.data-management.reset-rpm' 
            : 'maintenance.data-management.reset-smartkey';

        router.post(safeRoute(routeName), {}, {
            preserveScroll: true,
            onStart: () => setIsProcessing(true),
            onSuccess: () => setSelectedIds([]),
            onFinish: () => setIsProcessing(false),
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            
            {/* HEADER & SUB-TAB SWITCHER */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
                    <Button 
                        type="button"
                        variant={subTab === 'rpm' ? 'default' : 'ghost'}
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleSubTabSwitch('rpm')}
                        className={`text-xs font-bold gap-2 transition-all ${
                            subTab === 'rpm' 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                                : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        <Activity className="w-3.5 h-3.5" /> 
                        <span>Master RPM ({rpmMasters?.total || 0})</span>
                    </Button>
                    <Button 
                        type="button"
                        variant={subTab === 'smartkey' ? 'default' : 'ghost'}
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleSubTabSwitch('smartkey')}
                        className={`text-xs font-bold gap-2 transition-all ${
                            subTab === 'smartkey' 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                                : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        <KeyRound className="w-3.5 h-3.5" /> 
                        <span>Master Smart Key ({smartkeyMasters?.total || 0})</span>
                    </Button>
                </div>

                {/* TOOLBAR BUTTONS */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* INPUT CARI DATA DENGAN TOMBOL RESET CLEAR */}
                    <form onSubmit={(e) => e.preventDefault()} className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari data..." 
                            className="pl-9 pr-8 w-full sm:w-48 h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </form>

                    {/* URUTKAN */}
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={toggleSort} 
                        disabled={isProcessing}
                        className="h-9 gap-1 text-xs dark:border-slate-800"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
                        <span className="uppercase">{sortOrder}</span>
                    </Button>

                    {/* HAPUS TERPILIH */}
                    {selectedIds.length > 0 && (
                        <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            onClick={handleDeleteSelected} 
                            disabled={isProcessing} 
                            className="h-9 gap-1.5 text-xs animate-in fade-in duration-200"
                        >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            <span>Hapus ({selectedIds.length})</span>
                        </Button>
                    )}

                    {/* RESET SEMUA DATA */}
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleResetTable} 
                        disabled={isProcessing} 
                        className="h-9 gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                    </Button>

                    {/* EXPORT DATA */}
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleExportData} 
                        disabled={isProcessing}
                        className="h-9 gap-1.5 text-xs dark:border-slate-800"
                    >
                        <Download className="w-3.5 h-3.5 text-emerald-600" /> Export
                    </Button>
                </div>
            </div>

            {/* CONTAINER TABEL CRUD */}
            <div className="w-full overflow-x-auto relative">
                {isProcessing && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-30 flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span>Memuat data...</span>
                        </div>
                    </div>
                )}

                <CrudTable 
                    dataList={dataList}
                    subTab={subTab}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectRow={handleSelectRow}
                    getRowNumber={getRowNumber}
                />
            </div>

            {/* PAGINATION CONTROLS & FOOTER NAVIGASI */}
            {currentPagination && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <span>Tampilkan</span>
                        
                        {/* KOTAK INPUT ANGKA (MAX 100) MENGGANTIKAN DROPDOWN SELECT */}
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={perPageInput}
                            disabled={isProcessing}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val !== '' && Number(val) > 100) {
                                    setPerPageInput(100);
                                } else {
                                    setPerPageInput(val);
                                }
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

                        <span>data per halaman <span className="text-[10px] text-slate-400 font-normal">(Maks. 100)</span></span>
                    </div>

                    <div className="text-slate-500">
                        Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPagination.from || 0}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPagination.to || 0}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPagination.total || 0}</span> data
                    </div>

                    <div className="flex items-center gap-1">
                        {currentPagination.links?.map((link, index) => {
                            let label = link.label;
                            if (label.includes('Previous') || label.includes('&laquo;')) {
                                label = <ChevronLeft className="w-3.5 h-3.5" />;
                            } else if (label.includes('Next') || label.includes('&raquo;')) {
                                label = <ChevronRight className="w-3.5 h-3.5" />;
                            }

                            return (
                                <Button
                                    key={`pagination-link-${index}`}
                                    type="button"
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    disabled={!link.url || isProcessing}
                                    onClick={() => handlePageChange(link.url)}
                                    className={`h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 ${
                                        link.active 
                                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}