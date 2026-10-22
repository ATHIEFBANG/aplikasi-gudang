import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TabelRincianAset from './TabelRincianAset';

const TAB_CONFIG = { PROYEK: 'Proyek', NON_PROYEK: 'Non Proyek' };
const getPivotData = data => Array.isArray(data) ? data : data?.data || [];
const normalizeProjectCodeFilter = value => {
    const normalized = String(value || 'ALL').trim().toUpperCase();
    return ['MRC', 'OTC'].includes(normalized) ? normalized : 'ALL';
};

export default function AnalisisBarangKeluarIndex({ activeTab = 'PROYEK', projectPivot = [], nonProjectPivot = [], stockPivot = [], filters = {} }) {
    const initialTab = TAB_CONFIG[activeTab] ? activeTab : 'PROYEK';
    const [currentTab, setCurrentTab] = useState(initialTab);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [projectCodeFilter, setProjectCodeFilter] = useState(normalizeProjectCodeFilter(filters?.project_code_filter));
    const [zoomLevel, setZoomLevel] = useState(Number(filters?.zoom || 100));
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => setCurrentTab(TAB_CONFIG[activeTab] ? activeTab : 'PROYEK'), [activeTab]);
    useEffect(() => {
        setSearchTerm(filters?.search || '');
        setProjectCodeFilter(normalizeProjectCodeFilter(filters?.project_code_filter));
        setZoomLevel(Number(filters?.zoom || 100));
    }, [filters]);

    const activeData = currentTab === 'PROYEK' ? getPivotData(projectPivot) : getPivotData(nonProjectPivot);
    const stockData = getPivotData(stockPivot);

    const navigateWithFilters = (params = {}) => {
        setIsProcessing(true);
        const query = {
            tab: params.tab ?? currentTab,
            project_code_filter: params.project_code_filter ?? projectCodeFilter,
            search: params.search ?? searchTerm,
            zoom: params.zoom ?? zoomLevel,
            page: params.page ?? 1,
        };
        Object.keys(query).forEach(key => {
            if (query[key] === '' || query[key] === 'ALL' || query[key] === undefined || query[key] === null) delete query[key];
        });
        router.get('/rincian-aset', query, { preserveState: true, preserveScroll: true, replace: true, onFinish: () => setIsProcessing(false) });
    };

    const handleSearch = value => {
        setSearchTerm(value);
        navigateWithFilters({ search: value, page: 1 });
    };

    const handleTabChange = tab => {
        setCurrentTab(tab);
        navigateWithFilters({ tab, page: 1 });
    };

    const handleProjectCodeFilterChange = value => {
        const nextFilter = normalizeProjectCodeFilter(value);
        setProjectCodeFilter(nextFilter);
        navigateWithFilters({ project_code_filter: nextFilter, page: 1 });
    };

    return (
        <AuthenticatedLayout header="Analisis Rincian Aset">
            <Head title="Analisis Rincian Aset - Panca Pilar Laksana" />
            <div className="max-w-[1500px] mx-auto">
                <div className="px-1 sm:px-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Analisis Rincian Aset</h1>
                    <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400">Analisis saldo aset proyek setelah pengembalian dan pemakaian nonproyek.</p>
                </div>
                <div className="pt-5">
                    <TabelRincianAset activeTab={currentTab} onTabChange={handleTabChange} dataList={activeData} stockDataList={stockData} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={handleSearch} projectCodeFilter={projectCodeFilter} onProjectCodeFilterChange={handleProjectCodeFilterChange} isProcessing={isProcessing} zoomLevel={zoomLevel} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
