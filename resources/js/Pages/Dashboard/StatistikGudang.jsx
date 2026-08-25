import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Layers, AlertTriangle, Warehouse, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function StatistikGudang({ kpi = {} }) {
    const totalBarang = Number(kpi.totalBarang ?? 0);
    const totalStokFisik = Number(kpi.totalStokFisik ?? 0);
    const lowStockCount = Number(kpi.lowStockCount ?? 0);
    const totalGudang = Number(kpi.totalGudang ?? 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Master SKU */}
            <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                    <CardTitle className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Master Barang
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Package className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                        {totalBarang.toLocaleString('id-ID')}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Item SKU terdaftar</p>
                </CardContent>
            </Card>

            {/* 2. Total Stok Fisik */}
            <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                    <CardTitle className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Stok Fisik
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Layers className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                        {totalStokFisik.toLocaleString('id-ID')}
                    </div>
                    <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/60 mt-1">Unit fisik di semua gudang</p>
                </CardContent>
            </Card>

            {/* 3. Stok Kritis */}
            <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                    <CardTitle className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Stok Kritis (&le; Min)
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className={`text-2xl font-bold font-mono tracking-tight ${lowStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {lowStockCount.toLocaleString('id-ID')}
                    </div>
                    <p className="text-[11px] text-rose-600/70 dark:text-rose-400/60 mt-1">Perlu pengadaan kembali</p>
                </CardContent>
            </Card>

            {/* 4. Gudang Aktif */}
            <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                    <CardTitle className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Gudang Operasional
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Warehouse className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                        {totalGudang.toLocaleString('id-ID')}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Titik hub logistik aktif</p>
                </CardContent>
            </Card>
        </div>
    );
}