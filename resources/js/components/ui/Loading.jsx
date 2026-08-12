import React from 'react';

export default function Loading({ message = "Memuat ..." }) {
    return (
        <div className="fixed bottom-5 left-5 z-[100] bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-white/10 shadow-2xl rounded-2xl p-4 min-w-[260px] max-w-sm backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-300">
            {/* Header / Info Text */}
            <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                    {/* Signal dot indicator */}
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-wide">
                        {message}
                    </span>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 uppercase">
                    Processing
                </span>
            </div>

            {/* Indeterminate Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden relative">
                <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-600 via-red-500 to-red-400 h-full rounded-full w-full origin-left animate-pulse"></div>
            </div>
        </div>
    );
}