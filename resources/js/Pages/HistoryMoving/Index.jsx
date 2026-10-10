import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import HybridDropdown from '@/components/gabungan/HybridDropdown';
import DateRangeFilter from '@/components/gabungan/DateRangeFilter';
import TabHistoryMoving from './TabHistoryMoving';
import { useHistoryMovingControl, KONDISI_OPTIONS } from './HistoryMovingControl';
import { 
    History, 
    Filter, 
    RotateCcw 
} from 'lucide-react';

export default function HistoryMovingIndex({
    movings = {},
    gudangs = [],
    barangs = [],
    filters = {}
}) {
    const control = useHistoryMovingControl({
        movings,
        gudangs,
        barangs,
        filters
    });

    const {
        gudangId,
        gudangOptions,
        barangId,
        barangOptions,
        kondisi,
        startDate,
        endDate,
        handleFilterChange,
        handleDateRangeApply,
        isFiltered,
        handleResetFilters,
        isProcessing
    } = control;

    return (
        <AuthenticatedLayout header="History Moving">
            <Head title="History Moving - Pelacakan Mutasi Stok" />

            <div className="space-y-4 max-w-7xl mx-auto">
                {/* 1. Header Title & Caption */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20">
                                <History className="w-5 h-5" />
                            </div>
                            <span>History Moving & Pelacakan Barang</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Pusat penelusuran riwayat perjalanan fisik barang, audit alur mutasi, dan jejak pergerakan antar-gudang.
                        </p>
                    </div>
                </div>

                {/* 2. Standalone Filter Bar Ramping & Lega */}
                <div className="bg-white dark:bg-slate-900/70 p-2.5 sm:p-3 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pr-1">
                        <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Filter History</span>
                    </div>

                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                    {/* Filter Gudang */}
                    <div className="w-40 sm:w-44">
                        <HybridDropdown
                            value={gudangId}
                            options={gudangOptions}
                            allowCustom={false}
                            onChange={(val) => handleFilterChange('gudang_id', val)}
                            placeholder="Semua Gudang..."
                            disabled={isProcessing}
                            inputClassName="h-8 font-medium text-[11px] bg-slate-50 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 px-2.5"
                        />
                    </div>

                    {/* Filter Nama Barang */}
                    <div className="w-48 sm:w-52">
                        <HybridDropdown
                            value={barangId}
                            options={barangOptions}
                            allowCustom={false}
                            onChange={(val) => handleFilterChange('barang_id', val)}
                            placeholder="Semua Barang..."
                            disabled={isProcessing}
                            inputClassName="h-8 font-medium text-[11px] bg-slate-50 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 px-2.5"
                        />
                    </div>

                    {/* Filter Kondisi Fisik */}
                    <div className="w-40">
                        <HybridDropdown
                            value={kondisi}
                            options={KONDISI_OPTIONS}
                            allowCustom={false}
                            onChange={(val) => handleFilterChange('kondisi', val)}
                            placeholder="Semua Kondisi..."
                            disabled={isProcessing}
                            inputClassName="h-8 font-medium text-[11px] bg-slate-50 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 px-2.5"
                        />
                    </div>

                    {/* Filter Rentang Tanggal REUSABLE */}
                    <DateRangeFilter
                        startDate={startDate}
                        endDate={endDate}
                        onApply={(s, e) => handleDateRangeApply(s, e)}
                        onReset={() => handleDateRangeApply('', '')}
                        isProcessing={isProcessing}
                    />

                    {/* Reset Filter */}
                    {(isFiltered || startDate || endDate) && (
                        <button
                            type="button"
                            onClick={() => {
                                handleResetFilters();
                                handleDateRangeApply('', '');
                            }}
                            className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-medium px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer ml-auto"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset</span>
                        </button>
                    )}
                </div>

                {/* 3. Konten Tabel Utama */}
                <TabHistoryMoving
                    movings={movings}
                    control={control}
                />
            </div>
        </AuthenticatedLayout>
    );
}