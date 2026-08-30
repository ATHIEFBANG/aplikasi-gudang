import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HybridDropdown from '@/components/HybridDropdown';
import TabelRekonsiliasi from './TabelRekonsiliasi';
import TabelJurnal from './TabelJurnal';
import { 
    FileSpreadsheet, 
    Printer, 
    Download, 
    Search, 
    X, 
    Boxes,
    BookOpen
} from 'lucide-react';

const MONTH_NAMES = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
];

export default function LaporanIndex({
    laporanStok = [],
    jurnalMutasi = [],
    gudangs = [],
    filters = {}
}) {
    const [subTab, setSubTab] = useState('rekonsiliasi'); // 'rekonsiliasi' | 'jurnal'
    const [bulan, setBulan] = useState(String(filters.bulan || new Date().getMonth() + 1));
    const [tahun, setTahun] = useState(String(filters.tahun || 2026));
    const [gudangId, setGudangId] = useState(String(filters.gudang_id || 'ALL'));
    const [search, setSearch] = useState(filters.search || '');
    const [isProcessing, setIsProcessing] = useState(false);

    const yearOptions = useMemo(() => [
        { value: '2024', label: '2024' },
        { value: '2025', label: '2025' },
        { value: '2026', label: '2026' },
        { value: '2027', label: '2027' },
        { value: '2028', label: '2028' },
    ], []);

    const gudangOptions = useMemo(() => [
        { value: 'ALL', label: 'Semua Gudang' },
        ...gudangs.map(g => ({ value: String(g.id), label: g.nama_gudang }))
    ], [gudangs]);

    const activeBulanLabel = useMemo(() => {
        const found = MONTH_NAMES.find(m => m.value === String(bulan));
        return found ? found.label : `Bulan ${bulan}`;
    }, [bulan]);

    const activeGudangLabel = useMemo(() => {
        if (gudangId === 'ALL') return 'Semua Titik Gudang';
        const found = gudangs.find(g => String(g.id) === String(gudangId));
        return found ? found.nama_gudang : 'Gudang Terpilih';
    }, [gudangId, gudangs]);

    const handleFilterChange = (key, val) => {
        const newParams = {
            bulan,
            tahun,
            gudang_id: gudangId,
            search,
            [key]: val,
        };
        if (key === 'bulan') setBulan(val);
        if (key === 'tahun') setTahun(val);
        if (key === 'gudang_id') setGudangId(val);

        router.get('/laporan', newParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsProcessing(true),
            onFinish: () => setIsProcessing(false)
        });
    };

    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }
        const timer = setTimeout(() => {
            router.get('/laporan', { bulan, tahun, gudang_id: gudangId, search }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsProcessing(true),
                onFinish: () => setIsProcessing(false)
            });
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleExportCSV = () => {
        window.open(`/laporan/export?bulan=${bulan}&tahun=${tahun}&gudang_id=${gudangId}`, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout header="Laporan Bulanan">
            <Head title={`Laporan Logistik - ${activeBulanLabel} ${tahun}`} />

            <div className="space-y-5">
                {/* 1. Toolbar Filter Periode & Aksi Cetak */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
                        <div className="w-full sm:w-36">
                            <HybridDropdown
                                value={bulan}
                                options={MONTH_NAMES}
                                onChange={(val) => handleFilterChange('bulan', val)}
                                placeholder="Pilih Bulan..."
                                disabled={isProcessing}
                                inputClassName="h-8 font-semibold text-xs"
                            />
                        </div>

                        <div className="w-full sm:w-28">
                            <HybridDropdown
                                value={tahun}
                                options={yearOptions}
                                onChange={(val) => handleFilterChange('tahun', val)}
                                placeholder="Pilih Tahun..."
                                disabled={isProcessing}
                                inputClassName="h-8 font-semibold text-xs"
                            />
                        </div>

                        <div className="w-full sm:w-52 col-span-2 sm:col-span-1">
                            <HybridDropdown
                                value={gudangId}
                                options={gudangOptions}
                                onChange={(val) => handleFilterChange('gudang_id', val)}
                                placeholder="Semua Gudang..."
                                disabled={isProcessing}
                                inputClassName="h-8 font-semibold text-xs"
                            />
                        </div>

                        <div className="relative w-full sm:w-56 col-span-2 sm:col-span-1">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Cari Kode PPL / Barang..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                disabled={isProcessing}
                                className="h-8 pl-8 pr-7 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleExportCSV}
                            disabled={isProcessing}
                            className="h-8 text-xs gap-1.5 border-slate-200 dark:border-slate-700 font-semibold cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export CSV</span>
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={handlePrint}
                            className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs cursor-pointer"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Dokumen</span>
                        </Button>
                    </div>
                </div>

                {/* 2. Container Lembar Tabel Laporan */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col print:border-none print:shadow-none print:rounded-none">
                    
                    {/* Header Dokumen */}
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                        <div>
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-amber-400" />
                                <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900 dark:text-white">
                                    Laporan Rekonsiliasi & Mutasi Logistik Bulanan
                                </h1>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Periode: <strong className="text-slate-800 dark:text-slate-200">{activeBulanLabel} {tahun}</strong> • Lokasi: <strong className="text-slate-800 dark:text-slate-200">{activeGudangLabel}</strong>
                            </p>
                        </div>

                        {/* Switcher Tab */}
                        <div className="flex p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl print:hidden">
                            <button
                                type="button"
                                onClick={() => setSubTab('rekonsiliasi')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    subTab === 'rekonsiliasi'
                                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <Boxes className="w-3.5 h-3.5" />
                                <span>Rekonsiliasi Saldo Stok ({laporanStok.length})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSubTab('jurnal')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    subTab === 'jurnal'
                                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Buku Jurnal Mutasi ({jurnalMutasi.length})</span>
                            </button>
                        </div>
                    </div>

                    {/* Render Komponen Tabel Terpisah */}
                    <div className="w-full">
                        {subTab === 'rekonsiliasi' ? (
                            <TabelRekonsiliasi dataList={laporanStok} />
                        ) : (
                            <TabelJurnal dataList={jurnalMutasi} />
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}