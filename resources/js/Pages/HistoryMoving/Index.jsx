import React, { useState, useRef, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import HybridDropdown from '@/components/HybridDropdown';
import TabHistoryMoving from './TabHistoryMoving';
import { useHistoryMovingControl, KONDISI_OPTIONS } from './HistoryMovingControl';
import { 
    History, 
    Filter, 
    RotateCcw, 
    Calendar, 
    ChevronDown, 
    X 
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

    // State Popover Filter Rentang Tanggal
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [tempStart, setTempStart] = useState(startDate);
    const [tempEnd, setTempEnd] = useState(endDate);
    const dateDropdownRef = useRef(null);

    useEffect(() => {
        setTempStart(startDate);
        setTempEnd(endDate);
    }, [startDate, endDate]);

    // Tutup popup jika klik di luar area
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
                setIsDateOpen(false);
            }
        };
        if (isDateOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDateOpen]);

    const handleApplyDate = () => {
        setIsDateOpen(false);
        handleDateRangeApply(tempStart, tempEnd);
    };

    const handlePresetDate = (type) => {
        const now = new Date();
        let s = '';
        let e = '';

        if (type === 'this_month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            s = firstDay.toISOString().slice(0, 10);
            e = lastDay.toISOString().slice(0, 10);
        } else if (type === 'last_month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            s = firstDay.toISOString().slice(0, 10);
            e = lastDay.toISOString().slice(0, 10);
        } else if (type === 'last_30_days') {
            const past = new Date();
            past.setDate(now.getDate() - 30);
            s = past.toISOString().slice(0, 10);
            e = now.toISOString().slice(0, 10);
        }

        setTempStart(s);
        setTempEnd(e);
        setIsDateOpen(false);
        handleDateRangeApply(s, e);
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
        return dateStr;
    };

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

                    {/* Filter Kondisi Fisik (Diperlebar ke w-40 agar teks 'Semua Kondisi' tidak terpotong) */}
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

                    {/* Filter Rentang Tanggal Ramping */}
                    <div className="relative" ref={dateDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsDateOpen(!isDateOpen)}
                            className="h-8 px-2.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 border transition-all cursor-pointer bg-slate-50 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 shadow-2xs"
                        >
                            <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                            <span>
                                {startDate && endDate 
                                    ? `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}` 
                                    : 'Pilih Tanggal'}
                            </span>
                            <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-300 transition-transform ${isDateOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Card Popover Rentang Tanggal */}
                        {isDateOpen && (
                            <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 z-50 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-72 sm:w-80 space-y-2.5 animate-in fade-in zoom-in-95">
                                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Rentang Tanggal</span>
                                    <button 
                                        type="button"
                                        onClick={() => setIsDateOpen(false)} 
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Preset Cepat */}
                                <div className="flex flex-wrap gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handlePresetDate('this_month')}
                                        className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        Bulan Ini
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePresetDate('last_month')}
                                        className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        Bulan Lalu
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePresetDate('last_30_days')}
                                        className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        30 Hari Terakhir
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Dari Tanggal</label>
                                        <Input
                                            type="date"
                                            value={tempStart}
                                            onChange={(e) => setTempStart(e.target.value)}
                                            className="h-7 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 font-medium dark:[color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Sampai Tanggal</label>
                                        <Input
                                            type="date"
                                            value={tempEnd}
                                            onChange={(e) => setTempEnd(e.target.value)}
                                            className="h-7 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 font-medium dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsDateOpen(false)}
                                        className="h-6 text-[11px] px-2 cursor-pointer"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleApplyDate}
                                        className="h-6 text-[11px] px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer"
                                    >
                                        Terapkan
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tombol Reset Filter */}
                    {isFiltered && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
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