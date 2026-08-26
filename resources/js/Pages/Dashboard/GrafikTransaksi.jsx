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
    PieChart,
    Pie,
    Cell
} from 'recharts';

// Custom Floating Tooltip
const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-white min-w-[190px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {data.fullName || data.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                        Total: {data.total.toLocaleString('id-ID')} Trx
                    </span>
                </div>
                <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-slate-300 font-medium">Barang Masuk</span>
                        </div>
                        <span className="font-bold text-emerald-400">{data.MASUK || 0}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            <span className="text-slate-300 font-medium">Barang Keluar</span>
                        </div>
                        <span className="font-bold text-rose-400">{data.KELUAR || 0}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                            <span className="text-slate-300 font-medium">Transfer Gudang</span>
                        </div>
                        <span className="font-bold text-sky-400">{data.TRANSFER || 0}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function GrafikTransaksi({ chartData = [] }) {
    const monthFullNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Data bulanan lengkap dengan total akumulasi
    const formattedChartData = useMemo(() => {
        return chartData.map((item, idx) => {
            const masuk = Number(item.MASUK || 0);
            const keluar = Number(item.KELUAR || 0);
            const transfer = Number(item.TRANSFER || 0);
            const total = masuk + keluar + transfer;

            return {
                ...item,
                fullName: monthFullNames[idx] || item.name,
                total,
                MASUK: masuk,
                KELUAR: keluar,
                TRANSFER: transfer,
            };
        });
    }, [chartData]);

    // Akumulasi total transaksi keseluruhan
    const { totalMasuk, totalKeluar, totalTransfer, totalAll } = useMemo(() => {
        let masuk = 0, keluar = 0, transfer = 0;
        chartData.forEach((item) => {
            masuk += Number(item.MASUK || 0);
            keluar += Number(item.KELUAR || 0);
            transfer += Number(item.TRANSFER || 0);
        });
        return {
            totalMasuk: masuk,
            totalKeluar: keluar,
            totalTransfer: transfer,
            totalAll: masuk + keluar + transfer,
        };
    }, [chartData]);

    // Data Donut Chart
    const donutData = useMemo(() => {
        const list = [
            { name: 'Barang Masuk', value: totalMasuk, color: '#10b981', badgeClass: 'bg-emerald-500' },
            { name: 'Barang Keluar', value: totalKeluar, color: '#f43f5e', badgeClass: 'bg-rose-500' },
            { name: 'Transfer Gudang', value: totalTransfer, color: '#0284c7', badgeClass: 'bg-sky-500' },
        ];
        return list.map((item) => ({
            ...item,
            pct: totalAll > 0 ? ((item.value / totalAll) * 100).toFixed(1) : '0.0',
        }));
    }, [totalMasuk, totalKeluar, totalTransfer, totalAll]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. MULTI-BAR CHART AKTIVITAS LOGISTIK BULANAN */}
            <Card className="lg:col-span-2 bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xs">
                <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                Tren Aktivitas Logistik Bulanan
                            </CardTitle>
                        </div>

                        {/* LEGENDA FLAT DI HEADER */}
                        <div className="flex items-center gap-3 text-[11px]">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Masuk</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Keluar</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-xs bg-sky-500" />
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Transfer</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="w-full h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={formattedChartData}
                                barGap={2}
                                margin={{ top: 15, right: 15, left: -20, bottom: 45 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#94a3b8"
                                    opacity={0.25}
                                />

                                {/* SUMBU X: NAMA BULAN + ANGKA MASUK, KELUAR, TRANSFER DI BAWAHNYA */}
                                <XAxis
                                    dataKey="name"
                                    interval={0}
                                    tickLine={false}
                                    axisLine={false}
                                    padding={{ left: 10, right: 10 }}
                                    tick={({ x, y, payload }) => {
                                        const item =
                                            formattedChartData[payload.index] ||
                                            formattedChartData.find((d) => d.name === payload.value);
                                        const masuk = item?.MASUK ?? 0;
                                        const keluar = item?.KELUAR ?? 0;
                                        const transfer = item?.TRANSFER ?? 0;

                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                {/* Baris 1: Nama Bulan */}
                                                <text
                                                    x={0}
                                                    y={0}
                                                    dy={12}
                                                    textAnchor="middle"
                                                    fill="#64748b"
                                                    fontSize={11}
                                                    fontWeight={700}
                                                >
                                                    {payload.value}
                                                </text>

                                                {/* Baris 2: Angka Masuk (Hijau) */}
                                                <text
                                                    x={0}
                                                    y={0}
                                                    dy={25}
                                                    textAnchor="middle"
                                                    fill="#10b981"
                                                    fontSize={9}
                                                    fontWeight={800}
                                                >
                                                    {masuk > 0 ? masuk : '-'}
                                                </text>

                                                {/* Baris 3: Angka Keluar (Merah) */}
                                                <text
                                                    x={0}
                                                    y={0}
                                                    dy={36}
                                                    textAnchor="middle"
                                                    fill="#f43f5e"
                                                    fontSize={9}
                                                    fontWeight={800}
                                                >
                                                    {keluar > 0 ? keluar : '-'}
                                                </text>

                                                {/* Baris 4: Angka Transfer (Biru) */}
                                                <text
                                                    x={0}
                                                    y={0}
                                                    dy={47}
                                                    textAnchor="middle"
                                                    fill="#0284c7"
                                                    fontSize={9}
                                                    fontWeight={800}
                                                >
                                                    {transfer > 0 ? transfer : '-'}
                                                </text>
                                            </g>
                                        );
                                    }}
                                />

                                <YAxis
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    tickCount={5}
                                />

                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                                    wrapperStyle={{ zIndex: 50, outline: 'none' }}
                                    content={<CustomBarTooltip />}
                                />

                                {/* BATANG 1: BARANG MASUK */}
                                <Bar
                                    dataKey="MASUK"
                                    name="Barang Masuk"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                />

                                {/* BATANG 2: BARANG KELUAR */}
                                <Bar
                                    dataKey="KELUAR"
                                    name="Barang Keluar"
                                    fill="#f43f5e"
                                    radius={[4, 4, 0, 0]}
                                />

                                {/* BATANG 3: TRANSFER GUDANG */}
                                <Bar
                                    dataKey="TRANSFER"
                                    name="Transfer Gudang"
                                    fill="#0284c7"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 2. DONUT CHART DISTRIBUSI JENIS TRANSAKSI */}
            <Card className="lg:col-span-1 bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xs flex flex-col justify-between">
                <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Distribusi Jenis Transaksi
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-4 flex-1 flex flex-col justify-center items-center">
                    <div className="relative w-full h-[180px] flex items-center justify-center">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center z-0">
                            <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 leading-none">
                                {totalAll.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mt-1">
                                TOTAL TRX
                            </span>
                        </div>
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
                                        <Cell key={`donut-cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    wrapperStyle={{ zIndex: 50, outline: 'none' }}
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderColor: '#1e293b',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#f8fafc',
                                        padding: '8px 12px',
                                    }}
                                    formatter={(value, name) => [
                                        `${value.toLocaleString('id-ID')} Trx (${
                                            totalAll > 0 ? ((value / totalAll) * 100).toFixed(1) : 0
                                        }%)`,
                                        name,
                                    ]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="w-full grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                        {donutData.map((item) => (
                            <div
                                key={item.name}
                                className="flex flex-col items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40"
                            >
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.badgeClass}`} />
                                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate">
                                        {item.name.replace('Barang ', '').replace(' Gudang', '')}
                                    </span>
                                </div>
                                <div className="text-center mt-1">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block leading-none">
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
    );
}