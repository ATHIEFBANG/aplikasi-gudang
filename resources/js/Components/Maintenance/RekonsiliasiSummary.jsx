import React from 'react';
import { CheckCircle2, AlertTriangle, FileText, ArrowRight, Layers } from 'lucide-react';

export default function RekonsiliasiSummary({
    totalData = 0,
    matchedData = 0,
    unmatchedData = 0,
    title = 'Hasil Rekonsiliasi VLOOKUP',
    lastUpdated = 'Baru Saja',
    onProcessClick = null,
}) {
    const matchedPercentage = totalData > 0 ? Math.round((matchedData / totalData) * 100) : 0;
    const unmatchedPercentage = totalData > 0 ? Math.round((unmatchedData / totalData) * 100) : 0;

    return (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm transition-colors">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100 dark:border-white/10">
                <div>
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Pembaruan Terakhir: {lastUpdated}
                    </p>
                </div>

                {onProcessClick && (
                    <button
                        onClick={onProcessClick}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/30 transition-all self-start sm:self-auto"
                    >
                        <span>Jalankan Matching</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Progress Bar Visual */}
            <div className="mb-6">
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Matching Rate ({matchedPercentage}%)</span>
                    <span className="text-slate-500 dark:text-slate-400">{matchedData} dari {totalData} Data Cocok</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                        style={{ width: `${matchedPercentage}%` }}
                        className="bg-emerald-500 transition-all duration-500"
                        title={`Matched: ${matchedPercentage}%`}
                    />
                    <div
                        style={{ width: `${unmatchedPercentage}%` }}
                        className="bg-rose-500 transition-all duration-500"
                        title={`Unmatched: ${unmatchedPercentage}%`}
                    />
                </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Data */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Baris Data</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                                {totalData.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Matched Data */}
                <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Sesuai (Matched)</p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {matchedData.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Unmatched Data */}
                <div className="p-4 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-rose-700 dark:text-rose-400">Beda (Unmatched)</p>
                            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                                {unmatchedData.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}