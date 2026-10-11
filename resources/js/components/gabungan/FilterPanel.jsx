
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';

import Search from '@/components/gabungan/Search';
import DateRangeFilter from '@/components/gabungan/DateRangeFilter';
import Button from '@/components/gabungan/Button';
import FilterPanelLayout from '@/components/gabungan/FilterPanelLayout';
import { FilterPanelAlphabetOptions } from '@/components/gabungan/FilterPanelMenu';

const FILTER_BUTTON_ID = 'filter-panel-trigger';

const normalizeOptions = options =>
    (options || [])
        .map(item => {
            if (typeof item === 'string') return { value: item, label: item };

            return {
                value: item?.value ?? item?.id ?? item?.kode ?? item?.code ?? '',
                label: item?.label ?? item?.name ?? item?.nama ?? item?.kode ?? item?.code ?? '',
            };
        })
        .filter(item => item.value !== '' && item.label !== '');

const normalizeSelected = value => {
    if (Array.isArray(value)) return value.map(String);
    if (value === '' || value === null || value === undefined || value === 'ALL') return [];
    return [String(value)];
};

export default function FilterPanel({
    activeCount = 0,
    title = 'Filter',
    applyLabel = 'Terapkan',
    resetLabel = 'Reset',
    onApply,
    onReset,
    isProcessing = false,
    activeTab = 'PROYEK',
    projectOptions = [],
    departmentOptions = [],
    project = '',
    department = '',
    startDate = '',
    endDate = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(activeTab === 'PROYEK' ? 'project' : 'department');
    const [searchTerm, setSearchTerm] = useState('');
    const [draftProject, setDraftProject] = useState(normalizeSelected(project));
    const [draftDepartment, setDraftDepartment] = useState(normalizeSelected(department));
    const [draftStartDate, setDraftStartDate] = useState(startDate || '');
    const [draftEndDate, setDraftEndDate] = useState(endDate || '');
    const [triggerRect, setTriggerRect] = useState(null);

    const isProject = activeTab === 'PROYEK';

    const activeOptions = useMemo(
        () => normalizeOptions(isProject ? projectOptions : departmentOptions),
        [isProject, projectOptions, departmentOptions]
    );

    useEffect(() => {
        if (!isOpen) return;

        setDraftProject(normalizeSelected(project));
        setDraftDepartment(normalizeSelected(department));
        setDraftStartDate(startDate || '');
        setDraftEndDate(endDate || '');
        setActiveCategory(activeTab === 'PROYEK' ? 'project' : 'department');
        setSearchTerm('');
    }, [isOpen, project, department, startDate, endDate, activeTab]);

    useEffect(() => {
        const nextCategory = activeTab === 'PROYEK' ? 'project' : 'department';

        if (activeCategory !== nextCategory && activeCategory !== 'periode') {
            setActiveCategory(nextCategory);
            setSearchTerm('');
        }
    }, [activeTab, activeCategory]);

    useEffect(() => {
        const updateTriggerPosition = () => {
            const trigger = document.getElementById(FILTER_BUTTON_ID);

            if (!trigger) {
                setTriggerRect(null);
                return;
            }

            const rect = trigger.getBoundingClientRect();
            setTriggerRect({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            });
        };

        updateTriggerPosition();
        window.addEventListener('resize', updateTriggerPosition);
        window.addEventListener('scroll', updateTriggerPosition, true);

        const observer = new ResizeObserver(updateTriggerPosition);
        const trigger = document.getElementById(FILTER_BUTTON_ID);

        if (trigger) observer.observe(trigger);

        return () => {
            window.removeEventListener('resize', updateTriggerPosition);
            window.removeEventListener('scroll', updateTriggerPosition, true);
            observer.disconnect();
        };
    }, []);

    const activeSelected = activeCategory === 'project' ? draftProject : draftDepartment;

    const setActiveSelected = values => {
        if (activeCategory === 'project') setDraftProject(values);
        if (activeCategory === 'department') setDraftDepartment(values);
    };

    const handleOpen = () => setIsOpen(true);

    const handleClose = () => {
        if (!isProcessing) setIsOpen(false);
    };

    const handleReset = () => {
        setDraftProject([]);
        setDraftDepartment([]);
        setDraftStartDate('');
        setDraftEndDate('');
        setSearchTerm('');
        onReset?.();
    };

    const handleApply = () => {
        onApply?.({
            project: isProject ? (draftProject.length === 1 ? draftProject[0] : draftProject) : '',
            department: !isProject ? (draftDepartment.length === 1 ? draftDepartment[0] : draftDepartment) : '',
            start_date: draftStartDate,
            end_date: draftEndDate,
        });

        setIsOpen(false);
    };

    const categoryTitle = activeCategory === 'project'
        ? 'Project'
        : activeCategory === 'department'
            ? 'Departemen'
            : 'Periode';

    const triggerHitbox = triggerRect && !isProcessing && !isOpen ? (
        <button
            type="button"
            aria-label={title}
            onClick={handleOpen}
            style={{
                position: 'fixed',
                top: triggerRect.top,
                left: triggerRect.left,
                width: triggerRect.width,
                height: triggerRect.height,
                zIndex: 9998,
            }}
            className="cursor-pointer opacity-0"
        />
    ) : null;

    return (
        <>
            <Button
                id={FILTER_BUTTON_ID}
                shape="kiri-atas-kanan-bawah"
                flipHorizontal={false}
                flipVertical={false}
                variant="ghost"
                effect="neon"
                effectColor="#22D3EE"
                decoration="none"
                decorationColor="#FFF000"
                color="blue"
                size="none"
                width="fit"
                edge="top-right"
                edgeOffset={18}
                layer="behind"
                onClick={handleOpen}
                disabled={isProcessing}
                className={`!w-[170px] h-12 translate-x-267 translate-y-1 gap-2 px-6 ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
            >
                <Filter className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap text-sm font-bold">{title}</span>

                {activeCount > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white">
                        {activeCount}
                    </span>
                )}
            </Button>

            {typeof document !== 'undefined' && triggerHitbox && createPortal(triggerHitbox, document.body)}

            <FilterPanelLayout
                open={isOpen}
                onOpenChange={setIsOpen}
                isProcessing={isProcessing}
                title="Filter Data"
                menuItems={[
                    {
                        value: isProject ? 'project' : 'department',
                        label: isProject ? 'Project' : 'Departemen',
                        count: isProject ? draftProject.length : draftDepartment.length,
                    },
                    { value: 'periode', label: 'Periode' },
                ]}
                activeItem={activeCategory}
                onMenuChange={value => {
                    setActiveCategory(value);
                    setSearchTerm('');
                }}
                resetLabel={resetLabel}
                applyLabel={applyLabel}
                onReset={handleReset}
                onCancel={handleClose}
                onApply={handleApply}
            >
                {activeCategory === 'periode' ? (
                    <div className="flex h-full min-h-0 flex-col">
                        <div className="mb-3 shrink-0">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                Periode
                            </h3>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                Tentukan rentang tanggal transaksi.
                            </p>
                        </div>

                        <div className="min-h-0 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                            <DateRangeFilter
                                startDate={draftStartDate}
                                endDate={draftEndDate}
                                onApply={(start, end) => {
                                    setDraftStartDate(start);
                                    setDraftEndDate(end);
                                }}
                                onReset={() => {
                                    setDraftStartDate('');
                                    setDraftEndDate('');
                                }}
                                isProcessing={isProcessing}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full min-h-0 flex-col">
                        <div className="mb-3 shrink-0">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        {categoryTitle}
                                    </h3>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        Pilih satu atau beberapa {categoryTitle.toLowerCase()}.
                                    </p>
                                </div>

                                <Search
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                    onSearch={setSearchTerm}
                                    placeholder={`Cari ${categoryTitle.toLowerCase()}...`}
                                    disabled={isProcessing}
                                    className="w-full shrink-0 sm:w-[260px]"
                                />
                            </div>
                        </div>

                        <div className="min-h-0 flex-1">
                            <FilterPanelAlphabetOptions
                                options={activeOptions}
                                selected={activeSelected}
                                onChange={setActiveSelected}
                                searchTerm={searchTerm}
                            />
                        </div>
                    </div>
                )}
            </FilterPanelLayout>
        </>
    );
}
