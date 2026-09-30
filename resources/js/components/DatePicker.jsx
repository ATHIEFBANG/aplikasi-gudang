import React, { useRef } from 'react';
import { Calendar, X } from 'lucide-react';

export default function DatePicker({
    value = '',
    onChange,
    placeholder = 'Pilih tanggal...',
    disabled = false,
    className = '',
    inputClassName = '',
    min,
    max,
    allowClear = true,
    ...props
}) {
    const inputRef = useRef(null);

    // Memicu popup kalender bawaan browser saat kotak/ikon diklik
    const handleContainerClick = () => {
        if (!disabled && inputRef.current) {
            if ('showPicker' in HTMLInputElement.prototype) {
                try {
                    inputRef.current.showPicker();
                } catch (e) {
                    inputRef.current.focus();
                }
            } else {
                inputRef.current.focus();
            }
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (onChange) onChange('');
    };

    return (
        <div 
            className={`relative flex items-center w-full cursor-pointer select-none ${className}`}
            onClick={handleContainerClick}
        >
            {/* Input Tanggal Native dengan Trik Styling Modern */}
            <input
                ref={inputRef}
                type="date"
                disabled={disabled}
                value={value || ''}
                min={min}
                max={max}
                onChange={(e) => onChange && onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full h-8 pl-3 pr-8 rounded-lg border bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${inputClassName}`}
                {...props}
            />

            {/* Ikon Kalender Custom & Tombol Clear */}
            <div className="absolute right-2 flex items-center gap-1 z-10">
                {value && allowClear && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        title="Hapus tanggal"
                        className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
        </div>
    );
}