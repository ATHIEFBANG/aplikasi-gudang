import React, { useState, useEffect, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import CrudTable from './CrudTable';
import ModalTransaksi from './ModalTransaksi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronLeft, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';

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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [jenisTransaksi, setJenisTransaksi] = useState(filters?.jenis_transaksi || 'ALL');
    const [perPageInput, setPerPageInput] = useState(filters?.per_page || 10);
    const [isProcessing, setIsProcessing] = useState(false);

    const dataList = transaksis?.data || [];

    // Debounce Search
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }
        const timer = setTimeout(() => {
            fetchFiltered(searchTerm, jenisTransaksi, perPageInput, 1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchFiltered = (search, jenis, perPage, page = 1) => {
        router.get(
            '/transaksi',
            {
                search,
                jenis_transaksi: jenis,
                per_page: perPage,
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

    const handleJenisChange = (jenis) => {
        setJenisTransaksi(jenis);
        fetchFiltered(searchTerm, jenis, perPageInput, 1);
    };

    const getRowNumber = (index) => {
        if (!transaksis) return index + 1;
        const currentPage = transaksis.current_page || 1;
        const limit = transaksis.per_page || 10;
        return (currentPage - 1) * limit + index + 1;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Toolbar Atas */}
            <Toolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchClear={() => setSearchTerm('')}
                isProcessing={isProcessing}
                leftContent={
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                        {['ALL', 'MASUK', 'KELUAR', 'TRANSFER', 'PINJAM', 'KEMBALI'].map((tipe) => (
                            <button
                                key={tipe}
                                type="button"
                                onClick={() => handleJenisChange(tipe)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    jenisTransaksi === tipe
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                {tipe === 'ALL' ? 'Semua' : tipe}
                            </button>
                        ))}
                    </div>
                }
                actionButton={
                    canWrite && (
                        <Button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Transaksi Baru</span>
                        </Button>
                    )
                }
            />

            {/* Tabel List Transaksi */}
            <div className="w-full overflow-x-auto relative">
                <CrudTable
                    dataList={dataList}
                    getRowNumber={getRowNumber}
                />
            </div>

            {/* Pagination Controls */}
            {transaksis && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
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
                                    className={`h-8 min-w-[32px] px-2 text-xs font-semibold ${link.active ? 'bg-blue-600 text-white' : ''}`}
                                >
                                    {label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modal Input Form Transaksi */}
            <ModalTransaksi
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                gudangs={gudangs}
                suppliers={suppliers}
                barangs={barangs}
            />
        </div>
    );
}