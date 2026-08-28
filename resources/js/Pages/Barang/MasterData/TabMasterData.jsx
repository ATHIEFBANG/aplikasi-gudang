import React, { useState, useEffect, useRef, useMemo } from 'react';
import Toolbar from '@/components/Toolbar';
import CrudTable from './CrudTable';
import ModalBarang from './ModalBarang';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Plus, 
    Search,
    X,
    ChevronLeft, 
    ChevronRight,
    Package
} from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import { useConfirm } from '@/Layouts/AuthenticatedLayout';

export default function TabMasterData({
    barangs,
    existingOptions = {},
    filters = {}
}) {
    const { auth } = usePage().props;
    const userRole = auth?.user?.role || 'view';
    const canWrite = userRole === 'admin' || userRole === 'staff';
    const isAdmin = userRole === 'admin';
    const confirm = useConfirm();

    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [sortOrder, setSortOrder] = useState(filters?.order || 'desc');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [perPageInput, setPerPageInput] = useState(filters?.per_page || 10);
    const [isProcessing, setIsProcessing] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    const [selectedIds, setSelectedIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const dataList = barangs?.data || [];

    // Opsi dinamis gabungan dari Database + Data Tabel yang tampil (100% Real Data)
    const resolvedExistingOptions = useMemo(() => {
        const brands = new Set(existingOptions?.brandList || []);
        const tipes = new Set(existingOptions?.tipeList || []);
        const kategoris = new Set(existingOptions?.kategoriList || []);
        const satuans = new Set(existingOptions?.satuanList || []);

        dataList.forEach((item) => {
            if (item.brand) brands.add(item.brand);
            if (item.tipe) tipes.add(item.tipe);
            if (item.kategori) kategoris.add(item.kategori);
            if (item.satuan || item.deskripsi) satuans.add(item.satuan || item.deskripsi);
        });

        return {
            brandList: Array.from(brands).filter(Boolean),
            tipeList: Array.from(tipes).filter(Boolean),
            kategoriList: Array.from(kategoris).filter(Boolean),
            satuanList: Array.from(satuans).filter(Boolean),
        };
    }, [existingOptions, dataList]);

    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 120));
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 50));
    const handleResetZoom = () => setZoomLevel(100);
    const handleFitZoom = () => setZoomLevel(75);

    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }
        const timer = setTimeout(() => {
            fetchFilteredData(searchTerm, sortOrder, perPage, 1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchFilteredData = (search, order, itemsPerPage, page = 1) => {
        setSelectedIds([]);
        router.get(
            '/barang',
            {
                search: search || undefined,
                order: order,
                per_page: itemsPerPage,
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
    };

    const toggleSort = () => {
        const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        setSortOrder(nextOrder);
        fetchFilteredData(searchTerm, nextOrder, perPage, 1);
    };

    const handlePerPageSubmit = () => {
        let val = parseInt(perPageInput, 10);
        if (isNaN(val) || val < 1) val = 10;
        else if (val > 100) val = 100;
        setPerPageInput(val);
        if (val !== perPage) {
            setPerPage(val);
            fetchFilteredData(searchTerm, sortOrder, val, 1);
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = dataList.map((item) => item.id).filter(Boolean);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleExport = () => {
        window.open(`/barang/export?order=${sortOrder}`, '_blank');
    };

    const handleDeleteSelected = () => {
        if (!isAdmin || selectedIds.length === 0) return;
        confirm({
            title: 'Hapus Master Barang',
            message: `Apakah Anda yakin ingin MENGHAPUS ${selectedIds.length} master barang terpilih?`,
            variant: 'danger',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            onConfirm: () => {
                router.post('/barang/bulk-delete', { ids: selectedIds }, {
                    preserveScroll: true,
                    onStart: () => setIsProcessing(true),
                    onSuccess: () => setSelectedIds([]),
                    onFinish: () => setIsProcessing(false)
                });
            }
        });
    };

    const handleReset = () => {
        if (!isAdmin) return;
        confirm({
            title: 'Kosongkan Master Barang',
            message: 'Apakah Anda yakin ingin MENGOSONGKAN SELURUH data master barang? Tindakan ini tidak dapat dibatalkan.',
            variant: 'danger',
            confirmText: 'Ya, Kosongkan',
            cancelText: 'Batal',
            onConfirm: () => {
                router.post('/barang/reset', {}, {
                    preserveScroll: true,
                    onStart: () => setIsProcessing(true),
                    onSuccess: () => setSelectedIds([]),
                    onFinish: () => setIsProcessing(false)
                });
            }
        });
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setIsEditMode(true);
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const getRowNumber = (index) => {
        if (!barangs) return index + 1;
        const currentPage = barangs.current_page || 1;
        const limit = barangs.per_page || 10;
        return (currentPage - 1) * limit + index + 1;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
            {/* 1. TOOLBAR ATAS */}
            <Toolbar
                sortOrder={sortOrder}
                onToggleSort={toggleSort}
                selectedCount={selectedIds.length}
                onDeleteSelected={isAdmin ? handleDeleteSelected : undefined}
                onReset={isAdmin ? handleReset : undefined}
                onExport={handleExport}
                isProcessing={isProcessing}
                zoomLevel={zoomLevel}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                onFitZoom={handleFitZoom}
                leftContent={
                    <div className="flex items-center gap-2">
                        <Badge 
                            variant="secondary" 
                            className="bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-bold gap-1.5"
                        >
                            <Package className="w-3.5 h-3.5" />
                            <span>SKU Aktif ({barangs?.total || 0})</span>
                        </Badge>
                    </div>
                }
            />

            {/* 2. SUB-HEADER */}
            <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Daftar Master Barang (Kode PPL)
                </span>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <div className="relative w-full sm:w-56">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari data..."
                            disabled={isProcessing}
                            className="h-8 pl-8 pr-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {canWrite && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleOpenAdd}
                            className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs shadow-blue-600/20 shrink-0 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Data Baru</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* 3. TABEL DATA */}
            <div className="w-full overflow-x-auto relative border-b border-slate-200 dark:border-slate-800">
                <CrudTable
                    dataList={dataList}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectRow={handleSelectRow}
                    onEditRow={canWrite ? handleOpenEdit : undefined}
                    getRowNumber={getRowNumber}
                    zoomLevel={zoomLevel}
                />
            </div>

            {/* 4. PAGINATION FOOTER */}
            {barangs && (
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
                        Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{barangs.from || 0}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{barangs.to || 0}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{barangs.total || 0}</span> data
                    </div>
                    <div className="flex items-center gap-1">
                        {barangs.links?.map((link, idx) => {
                            let label = link.label;
                            if (label.includes('Previous') || label.includes('&laquo;')) label = <ChevronLeft className="w-3.5 h-3.5" />;
                            else if (label.includes('Next') || label.includes('&raquo;')) label = <ChevronRight className="w-3.5 h-3.5" />;
                            return (
                                <Button
                                    key={`page-${idx}`}
                                    type="button"
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    disabled={!link.url || isProcessing}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                    className={`h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 ${
                                        link.active ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 5. MODAL MASTER BARANG */}
            <ModalBarang
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedItem(null);
                }}
                isEditMode={isEditMode}
                selectedItem={selectedItem}
                existingOptions={resolvedExistingOptions}
            />
        </div>
    );
}