import React, { useState } from 'react';
import {
    Filter,
    RotateCcw,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

const COLUMN_CLASS = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
};

export default function FilterPanel({
    children,
    mode = 'panel',
    columns = 2,
    activeCount = 0,
    title = 'Filter',
    applyLabel = 'Terapkan',
    resetLabel = 'Reset',
    onApply,
    onReset,
    defaultOpen = false,
    isProcessing = false,
    className = '',
    buttonClassName = '',
    showHeader = true,
    showActions = true,
    triggerPosition = 'left',
    panelWidth = '680px',
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const safeColumns = Math.min(
        Math.max(Number(columns) || 2, 1),
        6
    );

    const columnClass = COLUMN_CLASS[safeColumns] || COLUMN_CLASS[2];

    const handleToggle = () => {
        setIsOpen(prev => !prev);
    };

    const handleApply = () => {
        onApply?.();

        if (mode === 'panel') {
            setIsOpen(false);
        }
    };

    const handleReset = () => {
        onReset?.();
    };

    const renderChildren = () => {
        const items = React.Children.toArray(children);

        return items.map((child, index) => (
            <div
                key={child?.key || index}
                className="relative min-w-0 z-[1] focus-within:z-[300]"
            >
                {child}
            </div>
        ));
    };

    if (mode === 'inline') {
        return (
            <div className={`w-full ${className}`}>
                <div className="flex flex-wrap items-center gap-2.5">
                    {renderChildren()}

                    {showActions && (
                        <>
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isProcessing}
                                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    {resetLabel}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={handleApply}
                                disabled={isProcessing}
                                className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold shadow-sm shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                {applyLabel}
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const alignmentClass = triggerPosition === 'right'
        ? 'justify-end'
        : 'justify-start';

    return (
        <div className={`relative w-full ${className}`}>
            <div className={`flex items-center ${alignmentClass}`}>
                <button
                    type="button"
                    onClick={handleToggle}
                    disabled={isProcessing}
                    className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${buttonClassName}`}
                >
                    <Filter className="w-4 h-4 text-rose-600 dark:text-rose-400" />

                    <span>{title}</span>

                    {Number(activeCount) > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                            {activeCount}
                        </span>
                    )}

                    {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                </button>
            </div>

            {isOpen && (
                <div
                    className="absolute right-3 sm:right-4 top-[calc(100%+18px)] z-[100] overflow-visible rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:shadow-black/30"
                    style={{
                        width: `min(${panelWidth}, calc(100vw - 2rem))`,
                    }}
                >
                    {showHeader && (
            <div className="relative overflow-hidden rounded-t-2xl border-b border-blue-400/30 bg-blue-700 dark:bg-blue-800">
                <svg
                    className="absolute right-0 top-0 w-[70%] h-full pointer-events-none"
                    viewBox="0 0 760 90"
                    preserveAspectRatio="none"
                    fill="none"
                >
                    <path
                        d="M120 88C205 68 220 22 318 27C407 32 430 70 510 56C590 42 610 8 760 14"
                        stroke="rgba(191,219,254,0.32)"
                        strokeWidth="1.3"
                    />

                    <path
                        d="M150 90C235 72 255 36 340 40C420 44 455 73 528 63C600 53 630 24 760 25"
                        stroke="rgba(147,197,253,0.28)"
                        strokeWidth="1.1"
                    />

                    <path
                        d="M185 92C267 77 290 49 362 51C432 53 462 80 535 71C612 61 645 37 760 38"
                        stroke="rgba(125,211,252,0.22)"
                        strokeWidth="1"
                    />

                    <path
                        d="M215 90C292 82 319 61 382 61C447 61 480 82 548 77C620 72 655 51 760 52"
                        stroke="rgba(191,219,254,0.18)"
                        strokeWidth="0.9"
                    />

                    <path
                        d="M255 90C325 84 350 71 406 70C467 69 500 88 562 83C632 78 680 66 760 66"
                        stroke="rgba(96,165,250,0.16)"
                        strokeWidth="0.8"
                    />
                </svg>

                <div className="absolute inset-y-0 right-0 w-[65%] bg-gradient-to-l from-blue-300/5 via-transparent to-transparent pointer-events-none" />

                <div className="relative flex items-center justify-between px-5 py-3.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        {title}
                    </h3>

                    {Number(activeCount) > 0 && (
                        <span className="ml-auto rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                            {activeCount} filter aktif
                        </span>
                    )}
                </div>
            </div>
        )}

                    <div className={`grid ${columnClass} gap-3 p-4 overflow-visible bg-white dark:bg-slate-900`}>
                        {renderChildren()}
                    </div>

                    {showActions && (
                        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 rounded-b-2xl flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isProcessing}
                                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    {resetLabel}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={handleApply}
                                disabled={isProcessing}
                                className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold shadow-sm shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                {applyLabel}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}