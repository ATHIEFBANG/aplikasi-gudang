import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TabelRincianAset from './TabelRincianAset';

const TAB_CONFIG = {
    PROYEK: 'Proyek',
    NON_PROYEK: 'Non Proyek',
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

    const handleSearch = value => {
        setSearchTerm(value);

        navigateWithFilters({
            search: value,
            page: 1,
        });
    };

    const handleTabChange = tab => {
        setCurrentTab(tab);

        const nextProject = tab === 'PROYEK' ? project : '';
        const nextDepartment = tab === 'NON_PROYEK' ? department : '';

        setProject(nextProject);
        setDepartment(nextDepartment);

        navigateWithFilters({
            tab,
            project: nextProject,
            department: nextDepartment,
            page: 1,
        });
    };

    const handleFilterApply = values => {
        const nextProject = currentTab === 'PROYEK'
            ? values?.project || ''
            : '';

        const nextDepartment = currentTab === 'NON_PROYEK'
            ? values?.department || ''
            : '';

        const nextGudangId = values?.gudang_id || 'ALL';
        const nextStartDate = values?.start_date || '';
        const nextEndDate = values?.end_date || '';

        setProject(nextProject);
        setDepartment(nextDepartment);
        setGudangId(nextGudangId);
        setStartDate(nextStartDate);
        setEndDate(nextEndDate);

        navigateWithFilters({
            project: nextProject,
            department: nextDepartment,
            gudang_id: nextGudangId,
            start_date: nextStartDate,
            end_date: nextEndDate,
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

    return (
        <AuthenticatedLayout header="Analisis Barang Keluar">
            <Head title="Analisis Barang Keluar - Panca Pilar Laksana" />

            <div className="max-w-[1500px] mx-auto">
                <div className="px-1 sm:px-2">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                            Analisis Barang Keluar
                        </h1>

                        <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400">
                            Analisis pengeluaran barang berdasarkan proyek dan kebutuhan non proyek.
                        </p>
                    </div>
                </div>

                <div className="pt-5">
                    <TabelRincianAset
                        activeTab={currentTab}
                        onTabChange={handleTabChange}
                        dataList={activeData}
                        project={project}
                        projectOptions={projectFilterOptions}
                        department={department}
                        departmentOptions={departmentFilterOptions}
                        gudangId={gudangId}
                        gudangOptions={gudangOptions}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onSearch={handleSearch}
                        startDate={startDate}
                        endDate={endDate}
                        onFilterApply={handleFilterApply}
                        onReset={handleResetFilters}
                        isProcessing={isProcessing}
                        zoomLevel={zoomLevel}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}