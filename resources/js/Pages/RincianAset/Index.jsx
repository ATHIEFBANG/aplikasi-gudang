import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TabelRincianAset from './TabelRincianAset';
import { ArrowLeft, BriefcaseBusiness, Building2 } from 'lucide-react';

const TAB_CONFIG = {
    PROYEK: {
        label: 'Proyek',
        icon: BriefcaseBusiness,
        activeClass: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700',
    },
    NON_PROYEK: {
        label: 'Non Proyek',
        icon: Building2,
        activeClass: 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700',
    },
};

const getPivotData = data => Array.isArray(data) ? data : data?.data || [];

export default function AnalisisBarangKeluarIndex({
    activeTab = 'PROYEK',
    projectPivot = [],
    nonProjectPivot = [],
    projectOptions = [],
    departmentOptions = [],
    gudangs = [],
    filters = {},
}) {
    const initialTab = TAB_CONFIG[activeTab] ? activeTab : 'PROYEK';

    const [currentTab, setCurrentTab] = useState(initialTab);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [project, setProject] = useState(filters?.project || '');
    const [department, setDepartment] = useState(filters?.department || '');
    const [gudangId, setGudangId] = useState(filters?.gudang_id || 'ALL');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [zoomLevel, setZoomLevel] = useState(Number(filters?.zoom || 100));
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setCurrentTab(TAB_CONFIG[activeTab] ? activeTab : 'PROYEK');
    }, [activeTab]);

    useEffect(() => {
        setSearchTerm(filters?.search || '');
        setProject(filters?.project || '');
        setDepartment(filters?.department || '');
        setGudangId(filters?.gudang_id || 'ALL');
        setStartDate(filters?.start_date || '');
        setEndDate(filters?.end_date || '');
        setZoomLevel(Number(filters?.zoom || 100));
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm === (filters?.search || '')) return;

            navigateWithFilters({
                search: searchTerm,
                page: 1,
            });
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

    const departmentFilterOptions = useMemo(
        () => departmentOptions.map(item => ({ value: item, label: item })),
        [departmentOptions]
    );

    const activeData = currentTab === 'PROYEK'
        ? getPivotData(projectPivot)
        : getPivotData(nonProjectPivot);

    const navigateWithFilters = (params = {}) => {
        setIsProcessing(true);

        const query = {
            tab: params.tab ?? currentTab,
            search: params.search ?? searchTerm,
            project: params.project ?? project,
            department: params.department ?? department,
            gudang_id: params.gudang_id ?? gudangId,
            start_date: params.start_date ?? startDate,
            end_date: params.end_date ?? endDate,
            zoom: params.zoom ?? zoomLevel,
            page: params.page ?? 1,
        };

        if (query.tab === 'PROYEK') {
            delete query.department;
        }

        if (query.tab === 'NON_PROYEK') {
            delete query.project;
        }

        Object.keys(query).forEach(key => {
            if (
                query[key] === '' ||
                query[key] === 'ALL' ||
                query[key] === undefined ||
                query[key] === null
            ) {
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

        if (tab === 'PROYEK') {
            setDepartment('');
        } else {
            setProject('');
        }

        navigateWithFilters({
            tab,
            project: tab === 'PROYEK' ? project : '',
            department: tab === 'NON_PROYEK' ? department : '',
            page: 1,
        });
    };

    const handleProjectChange = value => {
        setProject(value);

        navigateWithFilters({
            project: value,
            page: 1,
        });
    };

    const handleDepartmentChange = value => {
        setDepartment(value);

        navigateWithFilters({
            department: value,
            page: 1,
        });
    };

    const handleGudangChange = value => {
        setGudangId(value);

        navigateWithFilters({
            gudang_id: value,
            page: 1,
        });
    };

    const handleDateApply = (start, end) => {
        setStartDate(start);
        setEndDate(end);

        navigateWithFilters({
            start_date: start,
            end_date: end,
            page: 1,
        });
    };

    const handleDateReset = () => {
        setStartDate('');
        setEndDate('');

        navigateWithFilters({
            start_date: '',
            end_date: '',
            page: 1,
        });
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setProject('');
        setDepartment('');
        setGudangId('ALL');
        setStartDate('');
        setEndDate('');
        setZoomLevel(100);

        navigateWithFilters({
            search: '',
            project: '',
            department: '',
            gudang_id: 'ALL',
            start_date: '',
            end_date: '',
            zoom: 100,
            page: 1,
        });
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 10, 125));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 10, 60));
    };

    const handleResetZoom = () => {
        setZoomLevel(100);
    };

    const handleFitZoom = () => {
        setZoomLevel(90);
    };

    return (
        <AuthenticatedLayout header="Analisis Barang Keluar">
            <Head title="Analisis Barang Keluar - Panca Pilar Laksana" />

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
                                Analisis Barang Keluar
                            </h1>

                            <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400">
                                Analisis pengeluaran barang berdasarkan proyek dan kebutuhan non proyek.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5">
                        <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900/80 shadow-sm">
                            {Object.entries(TAB_CONFIG).map(([key, config]) => {
                                const Icon = config.icon;
                                const isActive = currentTab === key;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleTabChange(key)}
                                        disabled={isProcessing}
                                        className={`inline-flex items-center justify-center gap-2 min-w-[150px] h-9 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                            isActive
                                                ? config.activeClass
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/70'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" strokeWidth={2} />
                                        <span>{config.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="pt-5">
                    <TabelRincianAset
                        activeTab={currentTab}
                        dataList={activeData}
                        project={project}
                        projectOptions={projectFilterOptions}
                        onProjectChange={handleProjectChange}
                        department={department}
                        departmentOptions={departmentFilterOptions}
                        onDepartmentChange={handleDepartmentChange}
                        gudangId={gudangId}
                        gudangOptions={gudangOptions}
                        onGudangChange={handleGudangChange}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        startDate={startDate}
                        endDate={endDate}
                        onDateApply={handleDateApply}
                        onDateReset={handleDateReset}
                        onReset={handleResetFilters}
                        isProcessing={isProcessing}
                        zoomLevel={zoomLevel}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onResetZoom={handleResetZoom}
                        onFitZoom={handleFitZoom}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}