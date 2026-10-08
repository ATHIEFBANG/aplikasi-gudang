import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Filter, RotateCcw, X } from 'lucide-react';
import Search from '@/components/Search';
import DateRangeFilter from '@/components/DateRangeFilter';
import Button from '@/components/Button';

const FILTER_BUTTON_ID = 'filter-panel-trigger';

const normalizeOptions = options => {
    return (options || [])
        .map(item => {
            if (typeof item === 'string') return { value: item, label: item };

            return {
                value: item?.value ?? item?.id ?? item?.kode ?? item?.code ?? '',
                label: item?.label ?? item?.name ?? item?.nama ?? item?.kode ?? item?.code ?? '',
            };
        })
        .filter(item => item.value !== '' && item.label !== '');
};

const normalizeSelected = value => {
    if (Array.isArray(value)) return value.map(String);
    if (value === '' || value === null || value === undefined || value === 'ALL') return [];
    return [String(value)];
};

const groupByAlphabet = options => {
    return options.reduce((groups, item) => {
        const letter = String(item.label).trim().charAt(0).toUpperCase() || '#';

        if (!groups[letter]) groups[letter] = [];

        groups[letter].push(item);

        return groups;
    }, {});
};

const Checkbox = ({ checked, indeterminate = false }) => (
    <span className={`flex items-center justify-center w-4 h-4 shrink-0 rounded-[4px] border transition-colors ${checked || indeterminate ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 dark:border-slate-600 bg-transparent'}`}>
        {checked && <Check className="w-3 h-3" strokeWidth={3} />}
        {indeterminate && !checked && <span className="w-2 h-0.5 rounded-full bg-white" />}
    </span>
);

function AlphabetSection({ letter, options, selected, onChange }) {
    const values = options.map(item => String(item.value));
    const selectedValues = values.filter(value => selected.includes(value));
    const allSelected = values.length > 0 && selectedValues.length === values.length;
    const partiallySelected = selectedValues.length > 0 && selectedValues.length < values.length;

    const toggleAll = () => {
        if (allSelected) {
            onChange(selected.filter(value => !values.includes(value)));
        } else {
            onChange([...new Set([...selected, ...values])]);
        }
    };

    const toggleOption = value => {
        const stringValue = String(value);

        if (selected.includes(stringValue)) {
            onChange(selected.filter(item => item !== stringValue));
        } else {
            onChange([...selected, stringValue]);
        }
    };

    return (
        <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900/40">
            <div className="h-9 flex items-center justify-between px-3 bg-slate-800/80 border-b border-slate-700">
                <span className="text-xs font-black text-blue-400">{letter}</span>

                <button
                    type="button"
                    onClick={toggleAll}
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-700 transition-colors cursor-pointer"
                >
                    <Checkbox checked={allSelected} indeterminate={partiallySelected} />
                    <span className="text-[11px] font-semibold text-slate-300">Semua</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 p-2.5">
                {options.map(item => {
                    const checked = selected.includes(String(item.value));

                    return (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => toggleOption(item.value)}
                            className="min-w-0 h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-left hover:bg-blue-500/10 transition-colors cursor-pointer"
                        >
                            <Checkbox checked={checked} />
                            <span className={`truncate text-xs ${checked ? 'font-semibold text-white' : 'text-slate-300'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function OptionPicker({ options, selected, onChange, searchTerm }) {
    const filteredOptions = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        if (!keyword) return options;

        return options.filter(item => item.label.toLowerCase().includes(keyword));
    }, [options, searchTerm]);

    const groupedOptions = useMemo(() => groupByAlphabet(filteredOptions), [filteredOptions]);
    const letters = Object.keys(groupedOptions).sort((a, b) => a.localeCompare(b));
    const allVisibleValues = filteredOptions.map(item => String(item.value));
    const allVisibleSelected = allVisibleValues.length > 0 && allVisibleValues.every(value => selected.includes(value));
    const partiallyVisibleSelected = allVisibleValues.some(value => selected.includes(value)) && !allVisibleSelected;

    const toggleAllVisible = () => {
        if (allVisibleSelected) {
            onChange(selected.filter(value => !allVisibleValues.includes(value)));
        } else {
            onChange([...new Set([...selected, ...allVisibleValues])]);
        }
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between h-10 px-3 rounded-xl border border-slate-700 bg-slate-950 mb-3">
                <button
                    type="button"
                    onClick={toggleAllVisible}
                    className="flex items-center gap-2.5 cursor-pointer"
                >
                    <Checkbox checked={allVisibleSelected} indeterminate={partiallyVisibleSelected} />
                    <span className="text-xs font-bold text-slate-200">Semua</span>
                </button>

                <span className="text-[10px] font-semibold text-slate-500">
                    {selected.length} dipilih
                </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
                {letters.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
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

    const activeOptions = useMemo(() => {
        const options = isProject ? projectOptions : departmentOptions;
        return normalizeOptions(options);
    }, [isProject, projectOptions, departmentOptions]);

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
            <div
                className="absolute inset-0 bg-slate-950/65 backdrop-blur-[3px]"
                onClick={handleClose}
            />

            <div className="relative z-[10000] w-full max-w-[920px] h-[590px] max-h-[calc(100vh-80px)] flex flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-white shadow-2xl">
                <div className="h-[64px] shrink-0 flex items-center justify-center px-5 border-b border-slate-700 bg-slate-900">
                    <h2 className="text-base font-black tracking-tight">Filter Data</h2>
                </div>

                <div className="flex flex-1 min-h-0">
                    <div className="w-[190px] shrink-0 border-r border-slate-700 bg-slate-950 p-3">
                        <div className="space-y-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveCategory(isProject ? 'project' : 'department');
                                    setSearchTerm('');
                                }}
                                className={`w-full h-10 flex items-center justify-between px-3.5 rounded-lg text-sm font-bold text-left transition-all ${activeCategory === (isProject ? 'project' : 'department') ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}
                            >
                                <span>{isProject ? 'Project' : 'Departemen'}</span>

                                {(isProject ? draftProject.length : draftDepartment.length) > 0 && (
                                    <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-white/15 text-[10px]">
                                        {isProject ? draftProject.length : draftDepartment.length}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setActiveCategory('periode');
                                    setSearchTerm('');
                                }}
                                className={`w-full h-10 px-3.5 rounded-lg text-sm font-bold text-left transition-all ${activeCategory === 'periode' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}
                            >
                                Periode
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 min-h-0 p-4 bg-slate-900">
                        {activeCategory === 'periode' ? (
                            <div className="h-full flex flex-col">
                                <div className="mb-3">
                                    <h3 className="text-sm font-black text-white">Periode</h3>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Tentukan rentang tanggal transaksi.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
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
                            <div className="h-full flex flex-col min-h-0">
                                <div className="shrink-0 mb-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-white">
                                                {categoryTitle}
                                            </h3>

                                            <p className="mt-1 text-[11px] text-slate-400">
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

                                <div className="flex-1 min-h-0">
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

                <div className="h-[64px] shrink-0 flex items-center justify-between px-5 border-t border-slate-700 bg-slate-950">
                    <Button
                        variant="3d"
                        color="slate"
                        size="none"
                        radius="full"
                        width="fit"
                        onClick={handleReset}
                        disabled={isProcessing}
                        className="h-9 px-5 gap-2"
                    >
                        <RotateCcw className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                        <span className="text-sm font-bold">{resetLabel}</span>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="3d"
                            color="red"
                            size="none"
                            radius="full"
                            width="fit"
                            onClick={handleClose}
                            disabled={isProcessing}
                            className="h-9 px-5 gap-2"
                        >
                            <X className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                            <span className="text-sm font-bold">Batal</span>
                        </Button>

                        <Button
                            variant="3d"
                            color="blue"
                            size="none"
                            radius="full"
                            width="fit"
                            onClick={handleApply}
                            disabled={isProcessing}
                            className="h-9 px-6 gap-2"
                        >
                            <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                            <span className="text-sm font-bold">
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
            className="opacity-0 cursor-pointer"
        />
    ) : null;

    return (
        <>
            <Button
                id={FILTER_BUTTON_ID}
                variant="neon"
                color="blue"
                size="none"
                radius="sm"
                width="fit"
                edge="top-right"
                edgeOffset={14}
                layer="behind"
                onClick={handleOpen}
                disabled={isProcessing}
                className={`h-9 px-3.5 gap-2 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <Filter className="w-4 h-4 shrink-0" />

                <span className="text-sm font-bold whitespace-nowrap">
                    {title}
                </span>

                {activeCount > 0 && (
                    <span className="min-w-6 h-6 px-1.5 flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">
                        {activeCount}
                    </span>
                )}
            </Button>

            {typeof document !== 'undefined' && triggerHitbox && createPortal(triggerHitbox, document.body)}

            {isOpen && typeof document !== 'undefined' && createPortal(filterModal, document.body)}
        </>
    );
}