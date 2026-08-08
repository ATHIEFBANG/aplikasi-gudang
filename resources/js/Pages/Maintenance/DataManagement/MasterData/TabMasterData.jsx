import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, 
    KeyRound, 
    Activity, 
    ClipboardPaste, 
    Download, 
    Loader2, 
    Trash2, 
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Info
} from 'lucide-react';
import { router } from '@inertiajs/react';

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Komponen Tabel CRUD Utama
import CrudTable from './CrudTable';

export default function TabMasterData({ rpmMasters, smartkeyMasters, filters }) {
    const [subTab, setSubTab] = useState(filters?.tab || 'rpm');
    
    // State Filter & Pagination
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [sortOrder, setSortOrder] = useState(filters?.order || 'asc');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    
    // State Processing & Bulk Paste Modal
    const [isProcessing, setIsProcessing] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkRawText, setBulkRawText] = useState('');

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
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // --- FETCH DATA / ROUTING HANDLER ---
    const fetchFilteredData = (newSearch, newOrder, newPerPage, targetTab = subTab, page = 1) => {
        router.get(
            route('maintenance.data-management.index'), 
            { 
                tab: targetTab,
                search: newSearch, 
                order: newOrder, 
                per_page: newPerPage,
                page: page
            }, 
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleSubTabSwitch = (tab) => {
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
            router.get(url, {}, { preserveState: true, preserveScroll: true, replace: true });
        }
    };

    // --- CHECKBOX HANDLERS ---
    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = dataList.map(item => item.id).filter(Boolean);
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

    // --- BULK PASTE HANDLER ---
    const handleBulkPasteSubmit = (e) => {
        e.preventDefault();
        if (!bulkRawText.trim()) return alert('Silakan tempelkan (paste) data dari Excel lebih dulu!');

        const routeName = subTab === 'rpm' 
            ? 'maintenance.data-management.bulk-paste-rpm' 
            : 'maintenance.data-management.bulk-paste-smartkey';

        router.post(route(routeName), { raw_data: bulkRawText }, {
            preserveScroll: true,
            onStart: () => setIsProcessing(true),
            onSuccess: () => {
                setShowBulkModal(false);
                setBulkRawText('');
                setIsProcessing(false);
            },
            onError: () => setIsProcessing(false),
            onFinish: () => setIsProcessing(false)
        });
    };

    // --- EXPORT HANDLER ---
    const handleExportData = () => {
        const exportUrl = route(subTab === 'rpm' 
            ? 'maintenance.data-management.export-rpm' 
            : 'maintenance.data-management.export-smartkey'
        );
        window.open(exportUrl, '_blank');
    };

    const handleDeleteSelected = () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin MENGHAPUS ${selectedIds.length} data terpilih?`)) return;

        const routeName = subTab === 'rpm' 
            ? 'maintenance.data-management.destroy-rpm' 
            : 'maintenance.data-management.destroy-smartkey';

        router.delete(route(routeName), {
            data: { ids: selectedIds },
            preserveScroll: true,
            onStart: () => setIsProcessing(true),
            onSuccess: () => {
                setSelectedIds([]);
                setIsProcessing(false);
            },
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleResetTable = () => {
        if (!confirm(`Apakah Anda yakin ingin MENGOSONGKAN SELURUH data Master ${subTab.toUpperCase()}?`)) return;
        const routeName = subTab === 'rpm' 
            ? 'maintenance.data-management.reset-rpm' 
            : 'maintenance.data-management.reset-smartkey';

        router.post(route(routeName), {}, {
            preserveScroll: true,
            onStart: () => setIsProcessing(true),
            onFinish: () => setIsProcessing(false),
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            
            {/* Header & Sub-Tab Switcher */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
                    <Button 
                        type="button"
                        variant={subTab === 'rpm' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleSubTabSwitch('rpm')}
                        className={`text-xs font-bold gap-2 transition-all ${subTab === 'rpm' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        <Activity className="w-3.5 h-3.5" /> Master RPM ({rpmMasters?.total || 0})
                    </Button>
                    <Button 
                        type="button"
                        variant={subTab === 'smartkey' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleSubTabSwitch('smartkey')}
                        className={`text-xs font-bold gap-2 transition-all ${subTab === 'smartkey' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        <KeyRound className="w-3.5 h-3.5" /> Master Smart Key ({smartkeyMasters?.total || 0})
                    </Button>
                </div>

                {/* Toolbar Option Buttons */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <form onSubmit={(e) => e.preventDefault()} className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari data..." 
                            className="pl-9 w-full sm:w-48 h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                        />
                    </form>

                    <Button type="button" variant="outline" size="sm" onClick={toggleSort} className="h-9 gap-1 text-xs dark:border-slate-800">
                        <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
                        <span className="uppercase">{sortOrder}</span>
                    </Button>

                    {selectedIds.length > 0 && (
                        <Button type="button" variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={isProcessing} className="h-9 gap-1.5 text-xs">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus ({selectedIds.length})</span>
                        </Button>
                    )}

                    <Button type="button" variant="outline" size="sm" onClick={handleResetTable} disabled={isProcessing} className="h-9 gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset</span>
                    </Button>

                    <Button type="button" variant="outline" size="sm" onClick={handleExportData} className="h-9 gap-1.5 text-xs dark:border-slate-800">
                        <Download className="w-3.5 h-3.5 text-emerald-600" /> Export
                    </Button>

                    {/* TOMBOL BULK PASTE (Menggantikan Tombol Import File) */}
                    <Button 
                        type="button" 
                        size="sm" 
                        onClick={() => setShowBulkModal(true)} 
                        className="h-9 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                    >
                        <ClipboardPaste className="w-3.5 h-3.5" /> Bulk Paste
                    </Button>
                </div>
            </div>

            {/* Container Tabel dengan Horizontal Scrollbar */}
            <div className="w-full overflow-x-auto">
                <CrudTable 
                    dataList={dataList}
                    subTab={subTab}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectRow={handleSelectRow}
                    getRowNumber={getRowNumber}
                />
            </div>

            {/* Pagination Controls & Footer Navigasi */}
            {currentPagination && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                    
                    {/* Item Per Page Selector */}
                    <div className="flex items-center gap-2">
                        <span>Tampilkan</span>
                        <Select
                            value={String(perPage)}
                            onValueChange={(value) => {
                                setPerPage(value);
                                fetchFilteredData(searchTerm, sortOrder, value, subTab, 1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px] text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder={String(perPage)} />
                            </SelectTrigger>
                            
                            <SelectContent align="start" className="min-w-[70px] text-xs">
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>data per halaman</span>
                    </div>

                    {/* Informasi Total Data */}
                    <div className="text-slate-500">
                        Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPagination.from || 0}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPagination.to || 0}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPagination.total || 0}</span> data
                    </div>

                    {/* Tombol Halaman (Pagination Links) */}
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
                                    key={index}
                                    type="button"
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    disabled={!link.url}
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

            {/* --- MODAL SHADCN: BULK PASTE MASTER --- */}
            <Dialog open={showBulkModal} onOpenChange={(open) => {
                setShowBulkModal(open);
                if (!open) setBulkRawText('');
            }}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <ClipboardPaste className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Input Data Massal / Bulk Paste ({subTab.toUpperCase()})
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Salin (copy) baris data dari Excel / Spreadsheet, lalu tempelkan langsung ke area di bawah.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleBulkPasteSubmit} className="space-y-3 py-2">
                        <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-lg text-amber-700 dark:text-amber-400 text-xs">
                            <Info className="w-4 h-4 shrink-0" />
                            <span>Pastikan urutan kolom sesuai dengan struktur data Master {subTab.toUpperCase()}.</span>
                        </div>

                        <Textarea 
                            rows={8}
                            placeholder="Tempelkan data dari Excel di sini...&#10;Contoh:&#10;SN001	SITE_A	JAKARTA&#10;SN002	SITE_B	BANDUNG"
                            value={bulkRawText}
                            onChange={(e) => setBulkRawText(e.target.value)}
                            disabled={isProcessing}
                            className="font-mono text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                        />

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowBulkModal(false)} 
                                disabled={isProcessing}
                            >
                                Batal
                            </Button>
                            <Button 
                                type="submit" 
                                size="sm" 
                                disabled={isProcessing || !bulkRawText.trim()} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-semibold"
                            >
                                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <span>Proses Data Bulk</span>
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}