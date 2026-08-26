import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Layers, ArrowLeftRight, ArrowUpRight, Building2 } from 'lucide-react';

export default function StatistikGudang({ kpi = {} }) {
    const totalBarang = kpi.totalBarang ?? 0;
    const totalStokFisik = kpi.totalStokFisik ?? 0;
    const totalTransfer = kpi.totalTransfer ?? 0;
    const totalBarangKeluar = kpi.totalBarangKeluar ?? 0;
    const totalGudang = kpi.totalGudang ?? 0;

    const cards = [
        {
            title: 'TOTAL MASTER BARANG',
            value: totalBarang.toLocaleString('id-ID'),
            desc: 'Item SKU terdaftar',
            icon: Package,
            iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            valColor: 'text-slate-900 dark:text-white',
        },
        {
            title: 'TOTAL STOK FISIK',
            value: totalStokFisik.toLocaleString('id-ID'),
            desc: 'Unit fisik di semua gudang',
            icon: Layers,
            iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            valColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            title: 'TOTAL TRANSFER GUDANG',
            value: totalTransfer.toLocaleString('id-ID'),
            desc: 'Unit terdistribusi antar-hub',
            icon: ArrowLeftRight,
            iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
            valColor: 'text-sky-600 dark:text-sky-400',
        },
        {
            title: 'TOTAL BARANG KELUAR',
            value: totalBarangKeluar.toLocaleString('id-ID'),
            desc: 'Unit keluar operasional',
            icon: ArrowUpRight,
            iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
            valColor: 'text-rose-600 dark:text-rose-400',
        },
        {
            title: 'GUDANG OPERASIONAL',
            value: totalGudang.toLocaleString('id-ID'),
            desc: 'Titik hub logistik aktif',
            icon: Building2,
            iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            valColor: 'text-amber-600 dark:text-amber-400',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <Card 
                        key={idx} 
                        className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xs flex flex-col justify-between"
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3.5 px-4">
                            <CardTitle className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                                {card.title}
                            </CardTitle>
                            <div className={`p-1.5 rounded-lg ${card.iconBg}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3.5">
                            <div className={`text-2xl font-black font-mono tracking-tight ${card.valColor}`}>
                                {card.value}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                                {card.desc}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}