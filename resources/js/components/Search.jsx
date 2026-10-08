import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

export default function Search({
    value = '',
    onChange,
    onSearch,
    placeholder = 'Search here',
    disabled = false,
    className = '',
}) {
    const handleSubmit = () => {
        onSearch?.(value);
    };

    const handleKeyDown = event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className={`relative flex items-center h-8 ${className}`}>
            <input
                type="text"
                value={value}
                onChange={event => onChange?.(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full h-8 pl-4 pr-12 rounded-full border-2 border-blue-500 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
                type="button"
                onClick={handleSubmit}
                disabled={disabled}
                aria-label="Search"
                className="absolute right-[-4px] top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full border-4 border-blue-500 dark:border-blue-500 bg-blue-600 text-white shadow-sm hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                <SearchIcon className="w-5.5 h-5.5" />
            </button>
        </div>
    );
}