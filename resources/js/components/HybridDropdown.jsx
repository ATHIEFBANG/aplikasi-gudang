import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export default function HybridDropdown({
    value = '',
    options = [],
    onChange,
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    disabled = false,
    inputClassName = '',
    className = '',
    direction = 'down'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Normalisasi opsi (mendukung array string maupun array object)
    const normalizedOptions = useMemo(() => {
        return options.map((opt) => {
            if (typeof opt === 'object' && opt !== null) {
                return {
                    value: String(opt.value ?? opt.id ?? opt.label ?? ''),
                    label: String(opt.label ?? opt.name ?? opt.value ?? ''),
                    raw: opt
                };
            }
            return {
                value: String(opt),
                label: String(opt),
                raw: opt
            };
        });
    }, [options]);

    // Tampilkan fitur pencarian jika data lebih dari 3
    const showSearch = normalizedOptions.length > 3;

    // Filter opsi berdasarkan teks pencarian
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim() || !showSearch) return normalizedOptions;
        const q = searchQuery.toLowerCase().trim();
        return normalizedOptions.filter((opt) =>
            opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
        );
    }, [normalizedOptions, searchQuery, showSearch]);

    // Label yang saat ini dipilih
    const selectedLabel = useMemo(() => {
        if (!value) return '';
        const found = normalizedOptions.find(
            (opt) => opt.value.toLowerCase() === String(value).toLowerCase() || opt.label.toLowerCase() === String(value).toLowerCase()
        );
        return found ? found.label : String(value);
    }, [value, normalizedOptions]);

    // Tutup dropdown saat klik di luar
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-focus input pencarian saat dropdown terbuka
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            if (showSearch) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }
        }
    }, [isOpen, showSearch]);

    const handleSelect = (optValue) => {
        if (onChange) onChange(optValue);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 text-xs transition-all text-left focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isOpen
                        ? 'border-blue-500 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                } ${inputClassName}`}
            >
                <span className={`truncate ${selectedLabel ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {/* Dropdown Menu Popup */}
            {isOpen && (
                <div
                    className={`absolute left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 text-xs transition-all ${
                        direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
                    }`}
                >
                    {/* Kotak Pencarian (Otomatis Muncul jika > 3 Opsi) */}
                    {showSearch && (
                        <div className="p-1 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full pl-7 pr-6 py-1 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 text-[11px] focus:outline-none focus:border-blue-500"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Daftar Opsi dengan Scrollbar jika > 3 Opsi */}
                    <div className={`overflow-y-auto py-0.5 space-y-0.5 ${showSearch ? 'max-h-40' : 'max-h-48'}`}>
                        {filteredOptions.length === 0 ? (
                            <div className="py-3 px-2 text-center text-[11px] text-slate-400">
                                Tidak ada data yang cocok.
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected =
                                    String(value).toLowerCase() === opt.value.toLowerCase() ||
                                    String(value).toLowerCase() === opt.label.toLowerCase();

                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                                            isSelected
                                                ? 'bg-blue-600 text-white font-semibold'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1.5 stroke-[2.5]" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}