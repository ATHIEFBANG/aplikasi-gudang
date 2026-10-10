
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Filter, RotateCcw, X, ChevronDown, ChevronRight } from 'lucide-react';
import Search from '@/components/gabungan/Search';
import DateRangeFilter from '@/components/gabungan/DateRangeFilter';
import Button from '@/components/gabungan/Button';
import FilterPanelMenu from '@/components/gabungan/FilterPanelMenu';

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

const groupByAlphabet = options =>
    options.reduce((groups, item) => {
        const letter = String(item.label).trim().charAt(0).toUpperCase() || '#';
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(item);
        return groups;
    }, {});

const Checkbox = ({ checked, indeterminate = false }) => (
    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${checked || indeterminate ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-transparent dark:border-slate-600'}`}>
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
        {indeterminate && !checked && <span className="h-0.5 w-2 rounded-full bg-white" />}
    </span>
);

function AlphabetSection({ letter, options, selected, onChange }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const values = options.map(item => String(item.value));
    const selectedValues = values.filter(value => selected.includes(value));
    const allSelected = values.length > 0 && selectedValues.length === values.length;
    const partiallySelected = selectedValues.length > 0 && !allSelected;

    const toggleAll = () => {
        onChange(allSelected
            ? selected.filter(value => !values.includes(value))
            : [...new Set([...selected, ...values])]
        );
    };

    const toggleOption = value => {
        const stringValue = String(value);
        onChange(selected.includes(stringValue)
            ? selected.filter(item => item !== stringValue)
            : [...selected, stringValue]
        );
    };

    return (
        <div className="min-w-0">
            <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                aria-expanded={isExpanded}
                className="relative flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">{letter}</span>
                <span className="absolute right-3 text-slate-500 dark:text-slate-400">
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>
            </button>

            {isExpanded && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-2 py-2">
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="flex h-9 min-w-0 items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors hover:bg-blue-500/10"
                    >
                        <Checkbox checked={allSelected} indeterminate={partiallySelected} />
                        <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">Semua</span>
                    </button>

                    {options.map(item => {
                        const checked = selected.includes(String(item.value));

                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => toggleOption(item.value)}
                                className="flex h-9 min-w-0 items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors hover:bg-blue-500/10"
                            >
                                <Checkbox checked={checked} />
                                <span className={`truncate text-xs ${checked ? 'font-semibold text-slate-950 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function OptionPicker({ options, selected, onChange, searchTerm }) {
    const filteredOptions = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        return options.filter(item => String(item.label).toLowerCase().includes(keyword));
    }, [options, searchTerm]);

    const groupedOptions = useMemo(() => groupByAlphabet(filteredOptions), [filteredOptions]);
    const letters = Object.keys(groupedOptions).sort((a, b) => a.localeCompare(b));
    const allVisibleValues = filteredOptions.map(item => String(item.value));
    const allVisibleSelected = allVisibleValues.length > 0 && allVisibleValues.every(value => selected.includes(value));
    const partiallyVisibleSelected = allVisibleValues.some(value => selected.includes(value)) && !allVisibleSelected;

    const toggleAllVisible = () => {
        onChange(allVisibleSelected
            ? selected.filter(value => !allVisibleValues.includes(value))
            : [...new Set([...selected, ...allVisibleValues])]
        );
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="mb-3 flex h-10 shrink-0 items-center justify-end gap-4">
                <button
                    type="button"
                    onClick={toggleAllVisible}
                    disabled={filteredOptions.length === 0}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800"
                >
                    <Checkbox checked={allVisibleSelected} indeterminate={partiallyVisibleSelected} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Semua</span>
                </button>

                <span className="whitespace-nowrap text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {selected.length} dipilih
                </span>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {letters.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                        Tidak ada data ditemukan.
                    </div>
                ) : (
                    letters.map(letter => (
                        <AlphabetSection
                            key={letter}
                            letter={letter}
                            options={groupedOptions[letter]}
                            selected={selected}
                            onChange={onChange}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

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
            setTriggerRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
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

    const filterModal = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px] dark:bg-slate-950/65" onClick={handleClose} />

            <div className="relative z-[10000] flex h-[590px] max-h-[calc(100vh-80px)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <div className="flex h-[64px] shrink-0 items-center justify-center border-b border-slate-200 bg-slate-100 px-5 dark:border-slate-700 dark:bg-slate-900">
                    <h2 className="text-base font-black tracking-tight">Filter Data</h2>
                </div>

                <div className="flex min-h-0 flex-1">
                    <aside className="w-[190px] shrink-0 border-r border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                        
                <FilterPanelMenu
                    items={[
                        {
                            value: isProject ? 'project' : 'department',
                            label: isProject ? 'Project' : 'Departemen',
                            count: isProject ? draftProject.length : draftDepartment.length,
                        },
                        { value: 'periode', label: 'Periode' },
                    ]}
                    activeItem={activeCategory}
                    onChange={value => {
                        setActiveCategory(value);
                        setSearchTerm('');
                    }}
                    positionX={0}
                    positionY={0}
                    positionClassName=""
                />

                    </aside>

                    <div className="min-h-0 min-w-0 flex-1 bg-white p-4 dark:bg-slate-900">
                        {activeCategory === 'periode' ? (
                            <div className="flex h-full flex-col">
                                <div className="mb-3">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Periode</h3>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Tentukan rentang tanggal transaksi.</p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
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
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white">{categoryTitle}</h3>
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
                                            className="w-[260px] shrink-0"
                                        />
                                    </div>
                                </div>

                                <div className="min-h-0 flex-1">
                                    <OptionPicker
                                        options={activeOptions}
                                        selected={activeSelected}
                                        onChange={setActiveSelected}
                                        searchTerm={searchTerm}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex h-[64px] shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-5 dark:border-slate-700 dark:bg-slate-950">
                    <Button
                        variant="3d"
                        color="slate"
                        size="none"
                        width="fit"
                        onClick={handleReset}
                        disabled={isProcessing}
                        className="h-9 gap-2 px-5"
                    >
                        <RotateCcw className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        <span className="text-sm font-bold text-white">{resetLabel}</span>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="3d"
                            color="red"
                            size="none"
                            width="fit"
                            onClick={handleClose}
                            disabled={isProcessing}
                            className="h-9 gap-2 px-5"
                        >
                            <X className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                            <span className="text-sm font-bold text-white">Batal</span>
                        </Button>

                        <Button
                            variant="3d"
                            color="default"
                            size="none"
                            width="fit"
                            onClick={handleApply}
                            disabled={isProcessing}
                            className="h-9 gap-2 px-6"
                        >
                            <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                            <span className="text-sm font-bold text-white">
                                {isProcessing ? 'Memproses...' : applyLabel}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    const triggerHitbox = triggerRect && !isProcessing ? (
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
                variant="3d"
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
            {isOpen && typeof document !== 'undefined' && createPortal(filterModal, document.body)}
        </>
    );
}
