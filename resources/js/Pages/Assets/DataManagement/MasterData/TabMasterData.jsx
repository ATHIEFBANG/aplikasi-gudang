import React, { useState, useEffect, useRef } from 'react';
import { Radio, FolderPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import Toolbar from '@/components/Toolbar';
import CrudTable from './CrudTable';
import { useConfirm } from '@/Layouts/AuthenticatedLayout';

const safeRoute = (name, params) => {
    if (typeof window !== 'undefined' && typeof window.route === 'function') {
        return window.route(name, params);
    }
    if (typeof route === 'function') {
        return route(name, params);
    }
    return '#';
};

const getItemId = (item) => item?.id || item?.combat_id || item?.asset_name || item?.asset_code;

export default function TabMasterData({ combatMasters, templateMasters, filters }) {
    const { auth } = usePage().props;
    const userRole = auth?.user?.role || 'view';
    const isAdmin = userRole === 'admin';

    const confirm = useConfirm();
    const [subTab, setSubTab] = useState(filters?.tab || 'combat');
    
    // State Filter & Pagination
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [sortOrder, setSortOrder] = useState(filters?.order || 'asc');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [perPageInput, setPerPageInput] = useState(filters?.per_page || 10);
    const [isProcessing, setIsProcessing] = useState(false);

    // State Row Checkboxes
    const [selectedIds, setSelectedIds] = useState([]);

    const currentPagination = subTab === 'combat' ? combatMasters : templateMasters;
    const dataList = currentPagination?.data || [];

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

    useEffect(() => {
        if (filters?.per_page) {
            setPerPage(filters.per_page);
            setPerPageInput(filters.per_page);
        }
    }, [filters?.per_page]);

    const handlePerPageSubmit = () => {
        let val = parseInt(perPageInput, 10);
        if (isNaN(val) || val < 1) val = 10;
        else if (val > 100) val = 100;

        setPerPageInput(val);
        if (val !== perPage) {
            setPerPage(val);
            fetchFilteredData(searchTerm, sortOrder, val, subTab, 1);
        }
    };

    const fetchFilteredData = (newSearch, newOrder, newPerPage, targetTab = subTab, page = 1) => {
        setSelectedIds([]);
        router.get(
            safeRoute('assets.data-management.index'), 
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

    const handleExportData = () => {
        const routeName = subTab === 'combat' 
            ? 'assets.data-management.export-combat' 
            : 'assets.data-management.export-template';
        
        const exportUrl = safeRoute(routeName);
        if (exportUrl !== '#') window.open(exportUrl, '_blank');
    };

    const handleDeleteSelected = () => {
        if (!isAdmin || selectedIds.length === 0) return;

        confirm({
            title: `Hapus Data Master ${subTab.toUpperCase()}`,
            message: `Apakah Anda yakin ingin MENGHAPUS ${selectedIds.length} data terpilih?`,
            variant: 'danger',
            confirmText: 'Ya, Hapus Data',
            cancelText: 'Batal',
            onConfirm: () => {
                const routeName = subTab === 'combat' 
                    ? 'assets.data-management.destroy-combat' 
                    : 'assets.data-management.destroy-template';

                router.delete(safeRoute(routeName), {
                    data: { ids: selectedIds },
                    preserveScroll: true,
                    onStart: () => setIsProcessing(true),
                    onSuccess: () => setSelectedIds([]),
                    onFinish: () => setIsProcessing(false)
                });
            }
        });
    };

    const handleResetTable = () => {
        if (!isAdmin) return;

        confirm({
            title: `Kosongkan Master Data ${subTab.toUpperCase()}`,
            message: `Apakah Anda yakin ingin MENGOSONGKAN SELURUH data Master ${subTab.toUpperCase()}?`,
            variant: 'danger',
            confirmText: 'Ya, Kosongkan',
            cancelText: 'Batal',
            onConfirm: () => {
                const routeName = subTab === 'combat' 
                    ? 'assets.data-management.reset-combat' 
                    : 'assets.data-management.reset-template';

                router.post(safeRoute(routeName), {}, {
                    preserveScroll: true,
                    onStart: () => setIsProcessing(true),
                    onSuccess: () => setSelectedIds([]),
                    onFinish: () => setIsProcessing(false),
                });
            }
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* TOOLBAR */}
            <Toolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchClear={() => setSearchTerm('')}
                sortOrder={sortOrder}
                onToggleSort={toggleSort}
                selectedCount={selectedIds.length}
                onDeleteSelected={isAdmin ? handleDeleteSelected : undefined}
                onReset={isAdmin ? handleResetTable : undefined}
                onExport={handleExportData}
                isProcessing={isProcessing}
                leftContent={
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
                        <Button 
                            type="button"
                            variant={subTab === 'combat' ? 'default' : 'ghost'}
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleSubTabSwitch('combat')}
                            className={`text-xs font-bold gap-2 transition-all ${
                                subTab === 'combat' 
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm' 
                                    : 'text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            <Radio className="w-3.5 h-3.5" /> 
                            <span>Master COMBAT ({combatMasters?.total || 0})</span>
                        </Button>
                        <Button 
                            type="button"
                            variant={subTab === 'template' ? 'default' : 'ghost'}
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleSubTabSwitch('template')}
                            className={`text-xs font-bold gap-2 transition-all ${
                                subTab === 'template' 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                                    : 'text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            <FolderPlus className="w-3.5 h-3.5" /> 
                            <span>Master Data 2 ({templateMasters?.total || 0})</span>
                        </Button>
                    </div>
                }
            />

            {/* TABEL CRUD */}
            <div className="w-full overflow-x-auto relative">
                <CrudTable 
                    dataList={dataList}
                    subTab={subTab}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectRow={handleSelectRow}
                    getRowNumber={getRowNumber}
                />
            </div>

            {/* PAGINATION */}
            {currentPagination && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <span>Tampilkan</span>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={perPageInput}
                            disabled={isProcessing}
                            onChange={(e) => setPerPageInput(e.target.value)}
                            onBlur={handlePerPageSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handlePerPageSubmit()}
                            className="h-8 w-16 text-center text-xs font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        />
                        <span>data per halaman</span>
                    </div>

                    <div className="text-slate-500">
                        Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPagination.from || 0}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPagination.to || 0}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{currentPagination.total || 0}</span> data
                    </div>

                    <div className="flex items-center gap-1">
                        {currentPagination.links?.map((link, index) => (
                            <Button
                                key={`pagination-link-${index}`}
                                type="button"
                                variant={link.active ? "default" : "outline"}
                                size="sm"
                                disabled={!link.url || isProcessing}
                                onClick={() => handlePageChange(link.url)}
                                className={`h-8 min-w-[32px] px-2 text-xs font-semibold ${
                                    link.active ? 'bg-red-600 text-white hover:bg-red-700' : 'text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                {link.label.includes('Previous') ? <ChevronLeft className="w-3.5 h-3.5" /> : link.label.includes('Next') ? <ChevronRight className="w-3.5 h-3.5" /> : link.label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}