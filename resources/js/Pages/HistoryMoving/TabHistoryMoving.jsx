import React from 'react';
import Toolbar from '@/components/Toolbar';
import Tabel from '@/components/Tabel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    History, 
    Search, 
    X, 
    ChevronLeft, 
    ChevronRight, 
    ArrowDownCircle, 
    ArrowUpCircle, 
    ArrowRightLeft 
} from 'lucide-react';
import { router } from '@inertiajs/react';

export default function TabHistoryMoving({
    movings = {},
    control
}) {
    const {
        search,
        setSearch,
        jenis,
        handleFilterChange,
        sortOrder,
        toggleSort,
        handleExportCSV,
        isProcessing,
        zoomLevel,
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        handleFitZoom,
        dataList,
        columns,
        getItemId,
        getRowNumber,
        activeGudangLabel,
        startDate,
        endDate,
        perPageInput,
        setPerPageInput,
        handlePerPageSubmit
    } = control;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
            {/* 1. Toolbar Atas (Tab Switcher Tipe Mutasi & Tombol Aksi) */}
            <Toolbar
                sortOrder={sortOrder}
                onToggleSort={toggleSort}
                onExport={handleExportCSV}
                isProcessing={isProcessing}
                zoomLevel={zoomLevel}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                onFitZoom={handleFitZoom}
                leftContent={
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => handleFilterChange('jenis', 'ALL')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                jenis === 'ALL'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <History className="w-3.5 h-3.5" />
                            <span>Semua Pergerakan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('jenis', 'MASUK')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                jenis === 'MASUK'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                            <span>Barang Masuk</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('jenis', 'KELUAR')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                jenis === 'KELUAR'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            <span>Barang Keluar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('jenis', 'TRANSFER')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                jenis === 'TRANSFER'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Transfer Gudang</span>
                        </button>
                    </div>
                }
            />

            {/* 2. Sub-Header: Informasi Konteks di Kiri & Kolom Pencarian di Kanan */}
            <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                        Daftar Riwayat Pergerakan Logistik
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">
                        Rentang: <strong className="text-slate-700 dark:text-slate-300">{startDate || '-'}</strong> s/d <strong className="text-slate-700 dark:text-slate-300">{endDate || '-'}</strong> &bull; Lokasi: <strong className="text-slate-700 dark:text-slate-300">{activeGudangLabel}</strong>
                    </span>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <Input
                        placeholder="Cari PPL, Nama, SN, IMC, OMC..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        disabled={isProcessing}
                        className="h-8 pl-8 pr-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* 3. Tabel Data Dinamis */}
            <div className="w-full overflow-x-auto relative border-b border-slate-200 dark:border-slate-800">
                <Tabel
                    data={dataList}
                    columns={columns}
                    getItemId={getItemId}
                    getRowNumber={getRowNumber}
                    zoomLevel={zoomLevel}
                    emptyMessage="Tidak ada riwayat pergerakan stok pada kriteria pencarian ini."
                />
            </div>

            {/* 4. Pagination Footer */}
            {movings && (
                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <span>Tampilkan</span>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={perPageInput}
                            disabled={isProcessing}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val !== '' && Number(val) > 100) setPerPageInput(100);
                                else setPerPageInput(val);
                            }}
                            onBlur={handlePerPageSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handlePerPageSubmit();
                                }
                            }}
                            className="h-8 w-16 text-center text-xs font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span>data per halaman</span>
                    </div>

                    <div className="text-slate-500">
                        Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{movings.from || 0}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{movings.to || 0}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{movings.total || 0}</span> data
                    </div>

                    <div className="flex items-center gap-1">
                        {movings.links?.map((link, idx) => {
                            let label = link.label;
                            if (label.includes('Previous') || label.includes('&laquo;')) label = <ChevronLeft className="w-3.5 h-3.5" />;
                            else if (label.includes('Next') || label.includes('&raquo;')) label = <ChevronRight className="w-3.5 h-3.5" />;
                            return (
                                <Button
                                    key={`page-${idx}`}
                                    type="button"
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    disabled={!link.url || isProcessing}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                    className={`h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 ${
                                        link.active ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}