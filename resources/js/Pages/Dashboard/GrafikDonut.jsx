import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function GrafikDonutDistribusi({ donutPenerimaan = {} }) {
    const { donutData, totalAll } = useMemo(() => {
        const raw = [
            { 
                name: 'Pembelian', 
                value: Number(donutPenerimaan['Pembelian'] || donutPenerimaan['PEMBELIAN'] || 0), 
                color: '#10b981', 
                badgeClass: 'bg-emerald-500' 
            },
            { 
                name: 'Peminjaman', 
                value: Number(donutPenerimaan['Peminjaman'] || donutPenerimaan['PEMINJAMAN'] || 0), 
                color: '#3b82f6', 
                badgeClass: 'bg-blue-500' 
            },
            { 
                name: 'Pengembalian', 
                value: Number(donutPenerimaan['Pengembalian'] || donutPenerimaan['PENGEMBALIAN'] || 0), 
                color: '#f59e0b', 
                badgeClass: 'bg-amber-500' 
            },
            { 
                name: 'Proyek', 
                value: Number(
                    donutPenerimaan['Proyek'] || 
                    donutPenerimaan['PROYEK'] || 
                    donutPenerimaan['Barang ke Site'] || 
                    donutPenerimaan['BARANG_KE_SITE'] || 
                    0
                ), 
                color: '#f43f5e', 
                badgeClass: 'bg-rose-500' 
            },
            { 
                name: 'Non Proyek', 
                value: Number(
                    donutPenerimaan['Non Proyek'] || 
                    donutPenerimaan['NON_PROYEK'] || 
                    donutPenerimaan['Pemakaian Internal'] || 
                    donutPenerimaan['PEMAKAIAN_INTERNAL'] || 
                    0
                ), 
                color: '#8b5cf6', 
                badgeClass: 'bg-purple-500' 
            },
        ];

        const total = raw.reduce((acc, curr) => acc + curr.value, 0);
        return {
            totalAll: total,
            donutData: raw.map(item => ({
                ...item,
                pct: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
            }))
        };
    }, [donutPenerimaan]);

    return (
        <Card className="lg:col-span-1 bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Distribusi Mutasi Transaksi
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col justify-center items-center">
                <div className="relative w-full h-[180px] flex items-center justify-center">
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 leading-none">
                            {totalAll.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                            TOTAL UNIT
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={totalAll === 0 ? [{ name: 'Belum Ada Transaksi', value: 1, color: '#334155' }] : donutData}
                                cx="50%"
                                cy="50%"
                                innerRadius={58}
                                outerRadius={78}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                            >
                                {(totalAll === 0 ? [{ color: '#334155' }] : donutData).map((entry, idx) => (
                                    <Cell key={`donut-${idx}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                                formatter={(val, name) => [`${val.toLocaleString('id-ID')} Unit (${totalAll > 0 ? ((val / totalAll) * 100).toFixed(1) : 0}%)`, name]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    {donutData.map((item, index) => (
                        <div 
                            key={item.name} 
                            className={`flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 ${
                                index === donutData.length - 1 && donutData.length % 2 !== 0 ? 'col-span-2' : ''
                            }`}
                        >
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${item.badgeClass}`} />
                                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block leading-none">{item.value.toLocaleString('id-ID')}</span>
                                <span className="text-[9px] text-slate-400 font-medium">{item.pct}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}