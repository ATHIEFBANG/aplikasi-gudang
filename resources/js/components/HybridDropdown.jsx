import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, Search, Plus } from 'lucide-react';

export default function HybridDropdown({
    value = '',
    options = [],
    onChange,
    placeholder = "Pilih atau ketik...",
    searchPlaceholder = "Cari opsi...",
    disabled = false,
    allowCustom = true,
    direction = 'auto', // 'auto', 'up', atau 'down'
    className = "",
    inputClassName = "",
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);

    // Normalisasi opsi ke format standar: [{ value, label }]
    const normalizedOptions = useMemo(() => {
        const unique = Array.from(new Set(options.filter(Boolean)));
        return unique.map(opt => (typeof opt === 'object' ? opt : { value: opt, label: opt }));
    }, [options]);

    const showSearch = normalizedOptions.length > 5;

    // Filter opsi berdasarkan input pencarian
    const filteredOptions = useMemo(() => {
        const query = (searchTerm || '').trim().toLowerCase();
        if (!query) return normalizedOptions;
        return normalizedOptions.filter(opt => String(opt.label).toLowerCase().includes(query));
    }, [normalizedOptions, searchTerm]);

    // Deteksi cerdas posisi relatif terhadap container Modal & Layar Window
    useLayoutEffect(() => {
        if (!isOpen || !containerRef.current) return;

        if (direction === 'up') {
            setOpenUpward(true);
            return;
        }
        if (direction === 'down') {
            setOpenUpward(false);
            return;
        }

        const triggerRect = containerRef.current.getBoundingClientRect();
        const dropdownHeight = 230; // Perkiraan tinggi menu dropdown

        // 1. Cari elemen scroll parent terdekat (Modal Body / Scroll Container)
        let scrollParent = containerRef.current.parentElement;
        while (scrollParent && scrollParent !== document.body) {
            const style = window.getComputedStyle(scrollParent);
            if (/(auto|scroll)/.test(style.overflow + style.overflowY)) {
                break;
            }
            scrollParent = scrollParent.parentElement;
        }

        let spaceBelow = window.innerHeight - triggerRect.bottom;
        let spaceAbove = triggerRect.top;

        // Jika berada di dalam modal/scroll container, hitung jarak terhadap batas modal tersebut
        if (scrollParent && scrollParent !== document.body) {
            const parentRect = scrollParent.getBoundingClientRect();
            spaceBelow = parentRect.bottom - triggerRect.bottom;
            spaceAbove = triggerRect.top - parentRect.top;
        }

        // Buka ke atas (Drop-Up) jika ruang di bawah sempit (< 220px)
        if (spaceBelow < dropdownHeight && spaceAbove > 140) {
            setOpenUpward(true);
        } else {
            setOpenUpward(false);
        }
    }, [isOpen, direction]);

    // Tutup dropdown saat klik di luar
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current && 
                !containerRef.current.contains(event.target) &&
                (!dropdownRef.current || !dropdownRef.current.contains(event.target))
            ) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectOption = (optValue) => {
        onChange(optValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* INPUT TEKS UTAMA + TOMBOL CHEVRON */}
            <div className="relative flex items-center">
                <Input
                    type="text"
                    value={value}
                    disabled={disabled}
                    placeholder={placeholder}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (!isOpen) setIsOpen(true);
                    }}
                    className={`h-8 text-xs pr-7 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus-visible:ring-1 focus-visible:ring-blue-500 font-medium ${inputClassName}`}
                />

                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    onClick={() => {
                        setIsOpen(prev => !prev);
                        setSearchTerm('');
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? (openUpward ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'rotate-180 text-blue-600 dark:text-blue-400') : ''}`} />
                </button>
            </div>

            {/* MENU DROPDOWN AUTO-PLACEMENT (DROP-UP JIKA DI AREA BAWAH) */}
            {isOpen && !disabled && (
                <div 
                    ref={dropdownRef}
                    className={`absolute left-0 right-0 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-2xl z-[200] animate-in fade-in-50 zoom-in-95 ${
                        openUpward 
                            ? 'bottom-full mb-1.5' // Buka ke Atas (Drop-Up)
                            : 'top-full mt-1.5'     // Buka ke Bawah (Drop-Down)
                    }`}
                >
                    {/* INPUT PENCARIAN KHUSUS JIKA OPSI > 5 */}
                    {showSearch && (
                        <div className="p-1 pb-1.5 border-b border-slate-100 dark:border-slate-800 mb-1 sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    autoFocus
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="h-7 text-xs pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                />
                            </div>
                        </div>
                    )}

                    {/* DAFTAR PILIHAN ITEM */}
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, idx) => {
                            const isSelected = String(value).trim().toLowerCase() === String(opt.value).trim().toLowerCase();
                            return (
                                <button
                                    key={`${opt.value}-${idx}`}
                                    type="button"
                                    onClick={() => handleSelectOption(opt.value)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                        isSelected
                                            ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-slate-800/60"
                                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                    }`}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />}
                                </button>
                            );
                        })
                    ) : (
                        <div className="py-2.5 px-2 text-center text-slate-400 text-xs">
                            {allowCustom && searchTerm.trim() ? (
                                <button
                                    type="button"
                                    onClick={() => handleSelectOption(searchTerm.trim())}
                                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> Gunakan "{searchTerm.trim()}"
                                </button>
                            ) : (
                                "Tidak ada opsi cocok"
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}