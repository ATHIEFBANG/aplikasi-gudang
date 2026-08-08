import React, { useMemo, useState } from 'react';
import { 
    KeyRound, 
    MapPin, 
    ShieldAlert, 
    Lock, 
    Unlock, 
    HelpCircle, 
    PieChart as PieChartIcon, 
    BarChart3 
} from 'lucide-react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    Tooltip, 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Legend 
} from 'recharts';
import Map from '@/Components/Map';

export default function StatistikSmartkey({ data = [] }) {
    // State untuk toggle visibilitas series BarChart via Legend
    const [hiddenBars, setHiddenBars] = useState({
        Locked: false,
        Unlocked: false,
        '#N/A': false,
    });

    const handleLegendClick = (e) => {
        const { dataKey } = e;
        if (dataKey) {
            setHiddenBars((prev) => ({ ...prev, [dataKey]: !prev[dataKey] }));
        }
    };

    // 1. KPI & METRICS SUMMARY
    const totalUnit = data.length;

    const totalAktif = useMemo(() => {
        return data.filter((d) => String(d.status || '').toLowerCase() === 'aktif').length;
    }, [data]);

    const totalProblem = useMemo(() => {
        return data.filter((d) => {
            const st = String(d.status || '').toLowerCase();
            return st === 'rusak' || st === 'hilang';
        }).length;
    }, [data]);

    const countLocked = useMemo(() => {
        return data.filter((d) => String(d.status_aktifitas || '').toLowerCase() === 'locked').length;
    }, [data]);

    const countUnlocked = useMemo(() => {
        return data.filter((d) => String(d.status_aktifitas || '').toLowerCase() === 'unlocked').length;
    }, [data]);

    const countNA = useMemo(() => {
        return data.filter((d) => {
            const sa = String(d.status_aktifitas || '').trim().toUpperCase();
            return sa === '#N/A' || sa === 'N/A' || !sa || sa === 'NULL' || sa === 'UNDEFINED';
        }).length;
    }, [data]);

    // 2. DONUT CHART DATA
    const donutData = useMemo(() => {
        const raw = [
            { name: 'Locked', value: countLocked, color: '#0ea5e9', badgeClass: 'bg-sky-500' },
            { name: 'Unlocked', value: countUnlocked, color: '#f59e0b', badgeClass: 'bg-amber-500' },
            { name: '#N/A', value: countNA, color: '#64748b', badgeClass: 'bg-slate-500' },
        ];
        return raw.map((item) => ({
            ...item,
            pct: totalUnit > 0 ? ((item.value / totalUnit) * 100).toFixed(1) : '0.0'
        }));
    }, [countLocked, countUnlocked, countNA, totalUnit]);

    // 3. BAR CHART DATA (TOP 6 REGION INFRAKO)
    const barInfrakoData = useMemo(() => {
        const infraMap = {};

        data.forEach((item) => {
            const infraName = item.infrako || 'Unassigned';
            if (!infraMap[infraName]) {
                infraMap[infraName] = { name: infraName, Locked: 0, Unlocked: 0, '#N/A': 0, total: 0 };
            }

            const sa = String(item.status_aktifitas || '').trim().toLowerCase();
            if (sa === 'locked') {
                infraMap[infraName].Locked += 1;
            } else if (sa === 'unlocked') {
                infraMap[infraName].Unlocked += 1;
            } else {
                infraMap[infraName]['#N/A'] += 1;
            }

            infraMap[infraName].total += 1;
        });

        return Object.values(infraMap)
            .sort((a, b) => b.total - a.total)
            .slice(0, 6);
    }, [data]);

    return (
        <div className="space-y-4">
            
            {/* KPI METRICS CARDS WITH SUB-TEXT */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                
                {/* Total Unit */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="text-[11px] font-medium uppercase tracking-wider">Total Unit</span>
                            <KeyRound className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white mt-1.5">
                            {totalUnit.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-normal leading-tight">
                        Total terdaftar di sistem
                    </p>
                </div>

                {/* Unit Aktif */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                            <span className="text-[11px] font-medium uppercase tracking-wider">Unit Aktif</span>
                            <MapPin className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1.5">
                            {totalAktif.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 mt-2 font-normal leading-tight">
                        Operasional normal
                    </p>
                </div>

                {/* Rusak / Hilang */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                            <span className="text-[11px] font-medium uppercase tracking-wider">Rusak / Hilang</span>
                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 mt-1.5">
                            {totalProblem.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[10px] text-rose-600/70 dark:text-rose-400/60 mt-2 font-normal leading-tight">
                        Perlu tindak lanjut
                    </p>
                </div>

                {/* Locked */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                        <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
                            <span className="text-[11px] font-medium uppercase tracking-wider">Locked</span>
                            <Lock className="h-4 w-4 text-sky-500" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400 mt-1.5">
                            {countLocked.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[10px] text-sky-600/70 dark:text-sky-400/60 mt-2 font-normal leading-tight">
                        Status posisi terkunci
                    </p>
                </div>

                {/* Unlocked */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                            <span className="text-[11px] font-medium uppercase tracking-wider">Unlocked</span>
                            <Unlock className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-1.5">
                            {countUnlocked.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 mt-2 font-normal leading-tight">
                        Sedang terbuka / diakses
                    </p>
                </div>

                {/* #N/A */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="text-[11px] font-medium uppercase tracking-wider">#N/A</span>
                            <HelpCircle className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-slate-600 dark:text-slate-400 mt-1.5">
                            {countNA.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-normal leading-tight">
                        Belum teridentifikasi
                    </p>
                </div>

            </div>

            {/* MAP SECTION */}
            <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-sky-500" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Peta Sebaran SmartKey
                    </h3>
                </div>
                <div className="p-0">
                    <Map data={data} />
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* DONUT CHART */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                        <PieChartIcon className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            Proporsi Status Aktivitas Global
                        </h3>
                    </div>

                    <div className="relative w-full h-[220px] my-2 flex items-center justify-center">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                            <span className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                                {totalUnit.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
                                Total Keys
                            </span>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={donutData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={68}
                                    outerRadius={88}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {donutData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    wrapperStyle={{ outline: 'none' }}
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderColor: '#1e293b',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        color: '#f8fafc',
                                        padding: '8px 12px',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                                    }}
                                    formatter={(val, name) => [`${val.toLocaleString('id-ID')} unit`, name]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        {donutData.map((item) => (
                            <div key={item.name} className="flex flex-col items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60">
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${item.badgeClass}`} />
                                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                                        {item.name}
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                                    {item.value} <span className="text-[10px] font-normal text-slate-400">({item.pct}%)</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BAR CHART */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                        <BarChart3 className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            Status Aktivitas per Region Infrako (Top 6)
                        </h3>
                    </div>

                    <div className="w-full h-[260px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barInfrakoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderColor: '#1e293b',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        color: '#f8fafc',
                                        padding: '8px 12px',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                                    }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle"
                                    onClick={handleLegendClick}
                                    wrapperStyle={{ fontSize: '11px', paddingBottom: '12px', cursor: 'pointer' }}
                                    formatter={(value) => {
                                        const isHidden = hiddenBars[value];
                                        return (
                                            <span className={`select-none transition-opacity ${isHidden ? 'opacity-30 line-through' : 'opacity-100 text-slate-600 dark:text-slate-300'}`}>
                                                {value}
                                            </span>
                                        );
                                    }}
                                />
                                <Bar dataKey="#N/A" fill="#64748b" radius={[4, 4, 0, 0]} hide={hiddenBars['#N/A']} />
                                <Bar dataKey="Locked" fill="#0ea5e9" radius={[4, 4, 0, 0]} hide={hiddenBars['Locked']} />
                                <Bar dataKey="Unlocked" fill="#f59e0b" radius={[4, 4, 0, 0]} hide={hiddenBars['Unlocked']} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}