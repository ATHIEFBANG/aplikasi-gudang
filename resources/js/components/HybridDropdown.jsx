import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export default function HybridDropdown({
    value = '',
    options = [],
    onChange,
    placeholder = 'Ketik atau pilih...',
    disabled = false,
    inputClassName = '',
    className = '',
    direction = 'down'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Normalisasi opsi (mendukung array string maupun array object)
    const normalizedOptions = useMemo(() => {
        return (options || []).map((opt) => {
            if (typeof opt === 'object' && opt !== null) {
                return {
                    value: String(opt.value ?? opt.id ?? opt.label ?? ''),
                    label: String(opt.label ?? opt.name ?? opt.value ?? ''),
                };
            }
            return {
                value: String(opt),
                label: String(opt),
            };
        });
    }, [options]);

    // Filter daftar saran berdasarkan teks yang diketik pengguna
    const filteredOptions = useMemo(() => {
        const query = String(value || '').toLowerCase().trim();
        if (!query) return normalizedOptions;
        return normalizedOptions.filter((opt) =>
            opt.label.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query)
        );
    }, [normalizedOptions, value]);

    // Menutup dropdown ketika pengguna klik di luar elemen
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        if (onChange) onChange(e.target.value);
        if (!isOpen) setIsOpen(true);
    };

    const handleSelectOption = (optVal) => {
        if (onChange) onChange(optVal);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (onChange) onChange('');
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            <div className="relative flex items-center">
                {/* Kotak Input Teks (Bisa Diketik Manual Bebas) */}
                <input
                    ref={inputRef}
                    type="text"
                    disabled={disabled}
                    value={value || ''}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && setIsOpen(true)}
                    placeholder={placeholder}
                    className={`w-full h-8 pl-3 pr-14 rounded-lg border bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isOpen 
                            ? 'border-blue-500 ring-1 ring-blue-500' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    } ${inputClassName}`}
                />

                {/* Tombol Clear & Chevron Dropdown */}
                <div className="absolute right-1.5 flex items-center gap-0.5">
                    {value && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={disabled}
                        tabIndex={-1}
                        onClick={() => {
                            if (!disabled) {
                                setIsOpen((prev) => !prev);
                                inputRef.current?.focus();
                            }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Menu Pop-up Saran Dropdown */}
            {isOpen && !disabled && (
                <div
                    className={`absolute left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 text-xs transition-all ${
                        direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
                    }`}
                >
                    {/* Scrollbar otomatis muncul jika opsi > 3 (max-h-36) */}
                    <div className="overflow-y-auto max-h-36 py-0.5 space-y-0.5">
                        {filteredOptions.length === 0 ? (
                            <div className="py-2.5 px-3 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                                Tekan simpan untuk menggunakan: <strong>"{value}"</strong>
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = String(value).toLowerCase() === opt.value.toLowerCase();
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelectOption(opt.value)}
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