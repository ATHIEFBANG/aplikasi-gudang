import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatistikRincianAset from './StatistikRincianAset';
import TabelRincianAset from './TabelRincianAset';
import {
    ArrowLeft,
    Box,
    Boxes,
    Warehouse,
} from 'lucide-react';

const TAB_CONFIG = {
    TERPASANG: { label: 'Aset Project Terpasang', icon: Boxes },
    GUDANG: { label: 'Aset Project di Gudang', icon: Box },
    STOK: { label: 'Stok per Gudang', icon: Warehouse },
};

const getPageData = (tab, terpasang, asetGudang, stokGudang) => {
    if (tab === 'GUDANG') return asetGudang || { data: [] };
    if (tab === 'STOK') return stokGudang || { data: [] };
    return terpasang || { data: [] };
};

export default function RincianAsetIndex({
    activeTab = 'TERPASANG',
    terpasang = { data: [] },
    asetGudang = { data: [] },
    stokGudang = { data: [] },
    summary = {},
    gudangs = [],
    projectOptions = [],
    filters = {},
}) {
    const initialTab = TAB_CONFIG[activeTab] ? activeTab : 'TERPASANG';
    const [currentTab, setCurrentTab] = useState(initialTab);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [project, setProject] = useState(filters?.project || '');
    const [gudangId, setGudangId] = useState(filters?.gudang_id || 'ALL');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [sortOrder, setSortOrder] = useState('desc');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setCurrentTab(TAB_CONFIG[activeTab] ? activeTab : 'TERPASANG');
    }, [activeTab]);

    useEffect(() => {
        setSearchTerm(filters?.search || '');
        setProject(filters?.project || '');
        setGudangId(filters?.gudang_id || 'ALL');
        setStartDate(filters?.start_date || '');
        setEndDate(filters?.end_date || '');
        setPerPage(filters?.per_page || 10);
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm === (filters?.search || '')) return;
            navigateWithFilters({ search: searchTerm, page: 1 });
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const gudangOptions = useMemo(() => [
        { value: 'ALL', label: 'Semua Gudang' },
        ...gudangs.map(gudang => ({
            value: String(gudang.id),
            label: gudang.nama_gudang,
        })),
    ], [gudangs]);

    const projectFilterOptions = useMemo(
        () => projectOptions.map(item => ({ value: item, label: item })),
        [projectOptions]
    );

    const activeData = getPageData(currentTab, terpasang, asetGudang, stokGudang);

    const navigateWithFilters = (params = {}) => {
        setIsProcessing(true);

        const query = {
            tab: params.tab ?? currentTab,
            search: params.search ?? searchTerm,
            project: params.project ?? project,
            gudang_id: params.gudang_id ?? gudangId,
            start_date: params.start_date ?? startDate,
            end_date: params.end_date ?? endDate,
            per_page: params.per_page ?? perPage,
            page: params.page ?? 1,
        };

        Object.keys(query).forEach(key => {
            if (query[key] === '' || query[key] === 'ALL' || query[key] === undefined || query[key] === null) {
                delete query[key];
            }
        });

        router.get('/rincian-aset', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setIsProcessing(false),
        });
    };

    const handleTabChange = tab => {
        setCurrentTab(tab);
        navigateWithFilters({ tab, page: 1 });
    };

    const handleProjectChange = value => {
        setProject(value);
        navigateWithFilters({ project: value, page: 1 });
    };

    const handleGudangChange = value => {
        setGudangId(value);
        navigateWithFilters({ gudang_id: value, page: 1 });
    };

    const handleDateApply = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        navigateWithFilters({ start_date: start, end_date: end, page: 1 });
    };

    const handleDateReset = () => {
        setStartDate('');
        setEndDate('');
        navigateWithFilters({ start_date: '', end_date: '', page: 1 });
    };

    const handlePerPageChange = value => {
        const nextPerPage = Number(value);
        setPerPage(nextPerPage);
        navigateWithFilters({ per_page: nextPerPage, page: 1 });
    };

    const handlePageChange = page => {
        navigateWithFilters({ page });
    };

    const handleToggleSort = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 10, 120));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 10, 50));
    };

    const handleResetZoom = () => {
        setZoomLevel(100);
    };

    const handleFitZoom = () => {
        setZoomLevel(85);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setProject('');
        setGudangId('ALL');
        setStartDate('');
        setEndDate('');
        navigateWithFilters({
            search: '',
            project: '',
            gudang_id: 'ALL',
            start_date: '',
            end_date: '',
            page: 1,
        });
    };

    const handleExport = () => {
        const rows = activeData?.data || [];
        if (!rows.length) return;

        let headers = [];
        let dataRows = [];

        if (currentTab === 'TERPASANG') {
            headers = ['Kode PPL', 'Barang', 'Project', 'Jumlah', 'Harga Satuan', 'Nilai Aset', 'Status'];
            dataRows = rows.map(item => [
                item.kode_barang || '-',
                item.nama_barang || '-',
                item.project || '-',
                item.jumlah || 0,
                item.harga || 0,
                item.nilai_aset || 0,
                item.status || 'Terpasang',
            ]);
        } else if (currentTab === 'GUDANG') {
            headers = ['Keluar Terakhir', 'Kode PPL', 'Barang', 'Gudang', 'Jumlah', 'Harga Satuan', 'Nilai Aset'];
            dataRows = rows.map(item => [
                item.keluar_data || '-',
                item.kode_barang || '-',
                item.nama_barang || '-',
                item.nama_gudang || '-',
                item.jumlah || 0,
                item.harga || 0,
                item.nilai_aset || 0,
            ]);
        } else {
            headers = ['Gudang', 'Kode PPL', 'Barang', 'Total Stok', 'Harga Satuan', 'Nilai Aset'];
            dataRows = rows.map(item => [
                item.nama_gudang || '-',
                item.kode_barang || '-',
                item.nama_barang || '-',
                item.total_stok || 0,
                item.harga || 0,
                item.nilai_aset || 0,
            ]);
        }

        const csv = [
            headers.join(';'),
            ...dataRows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';')),
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `Rincian_Aset_${currentTab}_${new Date().toISOString().slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <AuthenticatedLayout header="Rincian Aset">
            <Head title="Rincian Aset - Panca Pilar Laksana" />

            <div className="max-w-[1500px] mx-auto">
                <div className="px-1 sm:px-2">
                    <div className="flex items-start gap-3">
                        <Link
                            href="/transaksi"
                            title="Kembali ke Transaksi"
                            className="mt-1 w-10 h-10 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>

                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                                Rincian Aset
                            </h1>

                            <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400">
                                Monitoring aset project, aset di gudang, dan stok di setiap gudang.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 border-b border-slate-200 dark:border-slate-800">
                        {Object.entries(TAB_CONFIG).map(([key, config]) => {
                            const Icon = config.icon;
                            const isActive = currentTab === key;

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleTabChange(key)}
                                    disabled={isProcessing}
                                    className={`relative flex items-center justify-center gap-2.5 px-4 py-4 text-sm sm:text-base font-semibold transition-all cursor-pointer ${isActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{config.label}</span>

                                    {isActive && (
                                        <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-rose-600 rounded-t-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-5">
                    <StatistikRincianAset
                        summary={summary}
                        activeTab={currentTab}
                    />

                    <div className="mt-5">
                        <TabelRincianAset
                            activeTab={currentTab}
                            dataList={activeData?.data || []}
                            pagination={activeData}
                            isProcessing={isProcessing}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            project={project}
                            projectOptions={projectFilterOptions}
                            onProjectChange={handleProjectChange}
                            gudangId={gudangId}
                            gudangOptions={gudangOptions}
                            onGudangChange={handleGudangChange}
                            startDate={startDate}
                            endDate={endDate}
                            onDateApply={handleDateApply}
                            onDateReset={handleDateReset}
                            onReset={handleResetFilters}
                            onExport={handleExport}
                            sortOrder={sortOrder}
                            onToggleSort={handleToggleSort}
                            zoomLevel={zoomLevel}
                            onZoomIn={handleZoomIn}
                            onZoomOut={handleZoomOut}
                            onResetZoom={handleResetZoom}
                            onFitZoom={handleFitZoom}
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                            perPage={perPage}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}