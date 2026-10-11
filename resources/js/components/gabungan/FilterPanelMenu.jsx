
import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';

import Button from '@/components/gabungan/Button';
import Card from '@/components/gabungan/CustomCard';

const DEFAULT_BUTTON_PROPS = {
    shape: 'kiri-atas-kanan-kapsul',
    flipHorizontal: false,
    flipVertical: true,
    size: 'none',
    width: 'full',
    edge: 'none',
    edgeOffset: 0,
    layer: 'normal',
    decoration: 'none',
    decorationColor: '#FFFFFF',
};

// Styling Card untuk header setiap abjad.
// Cukup ubah konfigurasi ini untuk mengganti tampilannya.
const ALPHABET_HEADER_CARD = {
    variant: 'glass',
    color: 'amber',
    shape: 'kiri-atas-kanan-bawah',
    size: 'none',
    width: 'full',
    className: '!h-6 !w-full',
    contentClassName: '!block !h-full !w-full !p-0',
};

const groupByAlphabet = options =>
    options.reduce((groups, item) => {
        const letter = String(item.label).trim().charAt(0).toUpperCase() || '#';
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(item);
        return groups;
    }, {});

// =========================================================
// MENU NAVIGASI PROJECT / PERIODE
// =========================================================

export default function FilterPanelMenu({
    items = [],
    activeItem,
    onChange,
    className = '',
    buttonProps = {},
    positionX = 0,
    positionY = 0,
    positionClassName = '',
    orientation = 'vertical',
}) {
    const isHorizontal = orientation === 'horizontal';

    return (
        <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-2 ${isHorizontal ? 'w-max min-w-full' : ''} ${className}`}>
            {items.map(item => {
                const isActive = activeItem === item.value;
                const props = { ...DEFAULT_BUTTON_PROPS, ...buttonProps, ...item.buttonProps };
                const itemPositionX = item.positionX ?? positionX;
                const itemPositionY = item.positionY ?? positionY;
                const itemPositionClass = item.positionClassName ?? positionClassName;

                return (
                    <div
                        key={item.value}
                        className={`relative ${isHorizontal ? 'w-auto shrink-0' : 'w-full'} ${itemPositionClass}`}
                        style={{ left: itemPositionX, top: itemPositionY }}
                    >
                        <Button
                            {...props}
                            id={item.id}
                            type="button"
                            variant={isActive ? '3d' : 'ghost'}
                            color={isActive ? 'blue' : 'default'}
                            effect="none"
                            effectColor={isActive ? '#FFF000' : undefined}
                            selected={isActive}
                            disabled={item.disabled ?? props.disabled ?? false}
                            onClick={() => onChange?.(item.value)}
                            className={`!flex !h-10 ${isHorizontal ? '!w-[calc((100vw-3rem)/2)] sm:!w-[160px]' : '!w-[160px]'} !items-center !justify-center !gap-2 !px-3 text-center text-sm font-bold transition-all ${isActive ? '!text-white' : '!text-slate-600 dark:!text-slate-300'} ${item.className || ''} ${props.className || ''}`}
                        >
                            <span className="flex w-full items-center justify-center gap-2 text-center leading-none">
                                <span className="truncate">{item.label}</span>

                                {item.count > 0 && (
                                    <span className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                                        {item.count}
                                    </span>
                                )}
                            </span>
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}

// =========================================================
// CHECKBOX PILIHAN
// =========================================================

function FilterCheckbox({ checked, indeterminate = false }) {
    return (
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${checked || indeterminate ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-transparent dark:border-slate-600'}`}>
            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
            {indeterminate && !checked && <span className="h-0.5 w-2 rounded-full bg-white" />}
        </span>
    );
}

// =========================================================
// SATU GRUP ABJAD DENGAN CARD HEADER
// =========================================================

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
        <section className="min-w-0">
            <Card {...ALPHABET_HEADER_CARD}>
                <button
                    type="button"
                    onClick={() => setIsExpanded(prev => !prev)}
                    aria-expanded={isExpanded}
                    className="relative flex h-full w-full items-center justify-center rounded-[inherit] bg-transparent transition-colors hover:bg-blue-500/10"
                >
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                        {letter}
                    </span>

                    <span className="absolute right-3 text-slate-500 dark:text-slate-400">
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </span>
                </button>
            </Card>

            {isExpanded && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-2 py-2">
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="flex h-9 min-w-0 items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors hover:bg-blue-500/10"
                    >
                        <FilterCheckbox checked={allSelected} indeterminate={partiallySelected} />
                        <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Semua
                        </span>
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
                                <FilterCheckbox checked={checked} />
                                <span className={`truncate text-xs ${checked ? 'font-semibold text-slate-950 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

// =========================================================
// PILIHAN FILTER BERKELOMPOK ABJAD
// =========================================================

export function FilterPanelAlphabetOptions({
    options = [],
    selected = [],
    onChange,
    searchTerm = '',
}) {
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
                    <FilterCheckbox checked={allVisibleSelected} indeterminate={partiallyVisibleSelected} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Semua
                    </span>
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
