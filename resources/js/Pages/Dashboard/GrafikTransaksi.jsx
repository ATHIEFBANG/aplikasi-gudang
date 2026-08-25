import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';

export default function GrafikTransaksi({ chartData = [] }) {
    // Hitung total akumulasi per jenis transaksi
    const { totalMasuk, totalKeluar, totalTransfer, totalAll } = useMemo(() => {
        let masuk = 0, keluar = 0, transfer = 0;
        chartData.forEach(item => {
            masuk += Number(item.MASUK || 0);
            keluar += Number(item.KELUAR || 0);
            transfer += Number(item.TRANSFER || 0);
        });
        return {
            totalMasuk: masuk,
            totalKeluar: keluar,
            totalTransfer: transfer,
            totalAll: masuk + keluar + transfer
        };
    }, [chartData]);

    // Data untuk Donut Chart
    const donutData = useMemo(() => {
        const list = [
            { name: 'Masuk', value: totalMasuk, color: '#10b981', badgeClass: 'bg-emerald-500' },
            { name: 'Keluar', value: totalKeluar, color: '#f43f5e', badgeClass: 'bg-rose-500' },
            { name: 'Transfer', value: totalTransfer, color: '#0284c7', badgeClass: 'bg-sky-500' },
        ];
        return list.map(item => ({
            ...item,
            pct: totalAll > 0 ? ((item.value / totalAll) * 100).toFixed(1) : '0.0'
        }));
    }, [totalMasuk, totalKeluar, totalTransfer, totalAll]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. Bar Chart Volume Bulanan */}
            <Card className="lg:col-span-2 bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                Tren Aktivitas Logistik Bulanan
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                            Total: <strong className="text-slate-800 dark:text-slate-200 font-bold">{totalAll.toLocaleString('id-ID')}</strong> Mutasi
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="w-full h-[270px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderColor: '#1e293b',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        color: '#f8fafc'
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                <Bar dataKey="MASUK" fill="#10b981" radius={[4, 4, 0, 0]} name="Barang Masuk" />
                                <Bar dataKey="KELUAR" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Barang Keluar" />
                                <Bar dataKey="TRANSFER" fill="#0284c7" radius={[4, 4, 0, 0]} name="Transfer Gudang" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Donut Chart Proporsi Transaksi */}
            <Card className="lg:col-span-1 bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4 text-amber-500" />
                        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Distribusi Jenis Transaksi
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col justify-center items-center">
                    <div className="relative w-full h-[180px] flex items-center justify-center">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center z-0">
                            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
                                {totalAll.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
                                Total Trx
                            </span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                            <PieChart>
                                <Pie data={donutData} cx="50%" cy="50%" innerRadius={58} outerRadius={78} paddingAngle={4} dataKey="value" stroke="none">
                                    {donutData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                                    formatter={(value, name) => [`${value} Transaksi`, name]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="w-full grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                        {donutData.map((item) => (
                            <div key={item.name} className="flex flex-col items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40">
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${item.badgeClass}`} />
                                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                                    {item.value} <span className="text-[9px] font-normal text-slate-400">({item.pct}%)</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}