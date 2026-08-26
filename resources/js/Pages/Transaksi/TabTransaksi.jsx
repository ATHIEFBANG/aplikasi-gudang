import React, { useState, useEffect, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import CrudTable from './CrudTable';
import ModalTransaksi from './ModalTransaksi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Plus, 
    ChevronLeft, 
    ChevronRight,
    ArrowDownCircle,
    ArrowUpCircle
} from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import { useConfirm } from '@/Layouts/AuthenticatedLayout';

export default function TabTransaksi({
    transaksis,
    gudangs = [],
    suppliers = [],
    barangs = [],
    filters = {}
}) {
    const { auth } = usePage().props;
    const userRole = auth?.user?.role || 'view';
    const canWrite = userRole === 'admin' || userRole === 'staff';
    const isAdmin = userRole === 'admin';
    const confirm = useConfirm();

    // State Filter & Sorting
    const [mainTab, setMainTab] = useState(filters?.jenis_transaksi || 'MASUK');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [sortOrder, setSortOrder] = useState(filters?.order || 'desc');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [perPageInput, setPerPageInput] = useState(filters?.per_page || 10);
    const [isProcessing, setIsProcessing] = useState(false);

    // State Checkbox Selection & Modal
    const [selectedIds, setSelectedIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const dataList = transaksis?.data || [];

    // Debounce Filter Pencarian
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }
        const timer = setTimeout(() => {
            fetchFilteredData(mainTab, searchTerm, sortOrder, perPage, 1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchFilteredData = (jenis, search, order, itemsPerPage, page = 1) => {
        setSelectedIds([]);
        router.get(
            '/transaksi',
            {
                jenis_transaksi: jenis,
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

    const handleMainTabChange = (tab) => {
        setMainTab(tab);
        fetchFilteredData(tab, searchTerm, sortOrder, perPage, 1);
    };

    const toggleSort = () => {
        const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        setSortOrder(nextOrder);
        fetchFilteredData(mainTab, searchTerm, nextOrder, perPage, 1);
    };

    const handlePerPageSubmit = () => {
        let val = parseInt(perPageInput, 10);
        if (isNaN(val) || val < 1) val = 10;
        else if (val > 100) val = 100;
        setPerPageInput(val);
        if (val !== perPage) {
            setPerPage(val);
            fetchFilteredData(mainTab, searchTerm, sortOrder, val, 1);
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
        const exportUrl = `/transaksi/export?jenis_transaksi=${mainTab}&order=${sortOrder}`;
        window.open(exportUrl, '_blank');
    };

    const handleDeleteSelected = () => {
        if (!isAdmin || selectedIds.length === 0) return;
        confirm({
            title: 'Hapus Transaksi',
            message: `Apakah Anda yakin ingin MENGHAPUS ${selectedIds.length} transaksi terpilih?`,
            variant: 'danger',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            onConfirm: () => {
                router.post('/transaksi/bulk-delete', { ids: selectedIds }, {
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
            title: 'Kosongkan Data Transaksi',
            message: 'Apakah Anda yakin ingin MENGOSONGKAN SELURUH riwayat transaksi? Tindakan ini tidak dapat dibatalkan.',
            variant: 'danger',
            confirmText: 'Ya, Kosongkan',
            cancelText: 'Batal',
            onConfirm: () => {
                router.post('/transaksi/reset', {}, {
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
        if (!transaksis) return index + 1;
        const currentPage = transaksis.current_page || 1;
        const limit = transaksis.per_page || 10;
        return (currentPage - 1) * limit + index + 1;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
            {/* 1. TOOLBAR LENGKAP: SORTIR, RESET, EXPORT & SEARCH */}
            <Toolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchClear={() => setSearchTerm('')}
                sortOrder={sortOrder}
                onToggleSort={toggleSort}
                selectedCount={selectedIds.length}
                onDeleteSelected={isAdmin ? handleDeleteSelected : undefined}
                onReset={isAdmin ? handleReset : undefined}
                onExport={handleExport}
                isProcessing={isProcessing}
                leftContent={
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => handleMainTabChange('MASUK')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mainTab === 'MASUK'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                            <span>Barang Masuk</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleMainTabChange('KELUAR')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mainTab === 'KELUAR'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            <span>Barang Keluar</span>
                        </button>
                    </div>
                }
            />

            {/* 2. SUB-HEADER BAR */}
            <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {mainTab === 'MASUK' ? 'Daftar Transaksi Barang Masuk (Inbound)' : 'Daftar Transaksi Barang Keluar (Outbound)'}
                </span>
                {canWrite && mainTab === 'MASUK' && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleOpenAdd}
                        className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs shadow-emerald-600/20 cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Data Masuk</span>
                    </Button>
                )}
            </div>

            {/* 3. TABEL DATA DENGAN CHECKBOX & EDIT ACTION */}
            <div className="w-full overflow-x-auto relative border-b border-slate-200 dark:border-slate-800">
                <CrudTable
                    dataList={dataList}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectRow={handleSelectRow}
                    onEditRow={canWrite ? handleOpenEdit : undefined}
                    getRowNumber={getRowNumber}
                />
            </div>

            {/* 4. FOOTER PAGINATION */}
            {transaksis && (
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
                        Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{transaksis.from || 0}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{transaksis.to || 0}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{transaksis.total || 0}</span> data
                    </div>
                    <div className="flex items-center gap-1">
                        {transaksis.links?.map((link, idx) => {
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

            {/* 5. MODAL FORM STOK MASUK (TAMBAH & EDIT) */}
            <ModalTransaksi
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedItem(null);
                }}
                isEditMode={isEditMode}
                selectedItem={selectedItem}
                gudangs={gudangs}
                barangs={barangs}
            />
        </div>
    );
}