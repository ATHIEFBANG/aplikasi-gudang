import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle2, Clock, XCircle, RotateCcw, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Helper Map Nama Bulan Lengkap
const NAMA_BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const getBulanNumber = (bulanVal) => {
    if (!bulanVal) return null;
    let blnNum = parseInt(bulanVal, 10);
    if (isNaN(blnNum)) {
        const str = String(bulanVal).toLowerCase();
        if (str.includes('jan')) blnNum = 1;
        else if (str.includes('feb')) blnNum = 2;
        else if (str.includes('mar')) blnNum = 3;
        else if (str.includes('apr')) blnNum = 4;
        else if (str.includes('mei') || str.includes('may')) blnNum = 5;
        else if (str.includes('jun')) blnNum = 6;
        else if (str.includes('jul')) blnNum = 7;
        else if (str.includes('agu') || str.includes('aug')) blnNum = 8;
        else if (str.includes('sep')) blnNum = 9;
        else if (str.includes('okt') || str.includes('oct')) blnNum = 10;
        else if (str.includes('nov')) blnNum = 11;
        else if (str.includes('des') || str.includes('dec')) blnNum = 12;
    }
    return (blnNum >= 1 && blnNum <= 12) ? blnNum : null;
};

// --- CUSTOM TOOLTIP BAR CHART (DESAIN SHADCN UI MODERN) ---
const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; // Mengambil item data bulan
        return (
            <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-white min-w-[140px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {data.fullMonth}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                        Bln {data.monthNum}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                        <span className="text-xs text-slate-300 font-medium">Total Site</span>
                    </div>
                    <span className="text-sm font-bold text-slate-100">
                        {data.total.toLocaleString('id-ID')}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export default function StatistikRpm({ data = [] }) {
    const totalSite = data.length;

    const totalApproved = useMemo(() => data.filter((d) => {
        const st = String(d.approve || d.status || '').toUpperCase();
        return st === 'OK' || st === 'APPROVED';
    }).length, [data]);

    const totalPending = useMemo(() => data.filter((d) => {
        const st = String(d.approve || d.status || '').toUpperCase();
        return st === 'BELUM' || st === 'PENDING';
    }).length, [data]);

    const totalReject = useMemo(() => data.filter((d) => {
        const st = String(d.approve || d.status || '').toUpperCase();
        return st === 'REJECT' || st === 'REJECTED';
    }).length, [data]);

    const totalReturn = useMemo(() => data.filter((d) => {
        const st = String(d.approve || d.status || '').toUpperCase();
        return st === 'RETURN' || st === 'RETURNED';
    }).length, [data]);

    const chartData = useMemo(() => {
        const monthMap = Array.from({ length: 12 }, (_, i) => ({
            name: `Bln ${i + 1}`,
            monthNum: i + 1,
            fullMonth: NAMA_BULAN[i],
            total: 0
        }));

        data.forEach(item => {
            const blnNum = getBulanNumber(item.bulan);
            if (blnNum) {
                monthMap[blnNum - 1].total += 1;
            }
        });

        return monthMap;
    }, [data]);

    const donutData = useMemo(() => {
        const raw = [
            { name: 'Approved (OK)', value: totalApproved, color: '#10b981', badgeClass: 'bg-emerald-500' },
            { name: 'Pending (Belum)', value: totalPending, color: '#f59e0b', badgeClass: 'bg-amber-500' },
            { name: 'Reject', value: totalReject, color: '#f43f5e', badgeClass: 'bg-rose-500' },
            { name: 'Return', value: totalReturn, color: '#38bdf8', badgeClass: 'bg-sky-500' },
        ];
        return raw.map(item => ({
            ...item,
            pct: totalSite > 0 ? ((item.value / totalSite) * 100).toFixed(1) : '0.0'
        }));
    }, [totalApproved, totalPending, totalReject, totalReturn, totalSite]);

    return (
        <div className="space-y-4">
            {/* 5 KARTU SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                        <CardTitle className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Site RPM</CardTitle>
                        <Activity className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{totalSite.toLocaleString('id-ID')}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Unit terdaftar</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                        <CardTitle className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Approved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 tracking-tight">{totalApproved.toLocaleString('id-ID')}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Dokumen disetujui</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                        <CardTitle className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Pending</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-500 tracking-tight">{totalPending.toLocaleString('id-ID')}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Menunggu approval</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                        <CardTitle className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Reject</CardTitle>
                        <XCircle className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold text-rose-600 dark:text-rose-500 tracking-tight">{totalReject.toLocaleString('id-ID')}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Dokumen ditolak</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                        <CardTitle className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Return</CardTitle>
                        <RotateCcw className="h-4 w-4 text-sky-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 tracking-tight">{totalReturn.toLocaleString('id-ID')}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Perlu perbaikan</p>
                    </CardContent>
                </Card>
            </div>

            {/* SEKSI GRAFIK */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* BAR CHART BULANAN */}
                <Card className="lg:col-span-2 bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
                    <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                Grafik Bulanan RPM
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="w-full h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                    
                                    {/* MENGGUNAKAN CUSTOM TOOLTIP KOMPONEN */}
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(244, 63, 94, 0.08)' }} 
                                        wrapperStyle={{ zIndex: 50, outline: 'none' }}
                                        content={<CustomBarTooltip />}
                                    />

                                    <Bar dataKey="total" name="Total Aktif" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.total > 0 ? '#fb7185' : '#94a3b8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* DONUT CHART */}
                <Card className="lg:col-span-1 bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                Distribusi Persentase Status
                            </CardTitle>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 flex-1 flex flex-col justify-center items-center">
                        <div className="relative w-full h-[180px] flex items-center justify-center">
                            
                            {/* Center Label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center z-0">
                                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                                    {totalSite.toLocaleString('id-ID')}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                                    Total Site
                                </span>
                            </div>

                            {/* Donut PieChart */}
                            <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={58}
                                        outerRadius={78}
                                        paddingAngle={3}
                                        minAngle={6}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    
                                    <Tooltip
                                        wrapperStyle={{ zIndex: 50, outline: 'none' }}
                                        contentStyle={{ 
                                            backgroundColor: 'var(--tooltip-bg, #0f172a)', 
                                            borderColor: 'var(--tooltip-border, #1e293b)', 
                                            borderRadius: '8px', 
                                            fontSize: '12px',
                                            color: '#f8fafc',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
                                            padding: '8px 12px'
                                        }}
                                        formatter={(value, name) => [`${value.toLocaleString('id-ID')} unit (${totalSite > 0 ? ((value/totalSite)*100).toFixed(1) : 0}%)`, name]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Breakdown Legend Kustom */}
                        <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                            {donutData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.badgeClass}`} />
                                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                                            {item.name.split(' ')[0]}
                                        </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 block leading-none">
                                            {item.value.toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                            {item.pct}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}