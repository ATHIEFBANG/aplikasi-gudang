import React, { useMemo, useState } from 'react';
import { 
    Radio, 
    MapPin, 
    ShieldAlert, 
    CheckCircle2, 
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
import Map from '@/components/Map';

// Konfigurasi Status COMBAT (Diselaraskan Presisi)
const COMBAT_STATUS_CONFIG = {
    'ONSITE': {
        label: 'ONSITE',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.35)',
        badgeBg: 'rgba(16,185,129,0.15)',
        badgeBorder: 'rgba(16,185,129,0.3)',
    },
    'READY TO USE': {
        label: 'READY TO USE',
        color: '#06b6d4',
        bg: 'rgba(6,182,212,0.35)',
        badgeBg: 'rgba(6,182,212,0.15)',
        badgeBorder: 'rgba(6,182,212,0.3)',
    },
    'BROKEN': {
        label: 'BROKEN / INOP',
        color: '#f43f5e',
        bg: 'rgba(244,63,94,0.35)',
        badgeBg: 'rgba(244,63,94,0.15)',
        badgeBorder: 'rgba(244,63,94,0.3)',
    },
    'UNASSIGNED': {
        label: 'UNASSIGNED',
        color: '#64748b',
        bg: 'rgba(100,116,139,0.35)',
        badgeBg: 'rgba(100,116,139,0.15)',
        badgeBorder: 'rgba(100,116,139,0.3)',
    },
};

const normalizeStatus = (statusStr) => {
    if (!statusStr) return 'UNASSIGNED';
    const clean = String(statusStr).toUpperCase();
    if (clean.includes('ONSITE')) return 'ONSITE';
    if (clean.includes('READY')) return 'READY TO USE';
    if (clean.includes('BROKEN') || clean.includes('INOP')) return 'BROKEN';
    return 'UNASSIGNED';
};

const getCombatPopupData = (item, lat, lng) => {
    const props = item?.properties || item || {};
    return {
        title: props.asset_name || props.nama_site || 'Unit COMBAT',
        details: [
            { label: 'Serial Number', value: props.sn || '-' },
            { label: 'PIC Data', value: props.pic_data || props.data || '-' },
            { label: 'Type / Tinggi', value: `${props.type_combat || '-'} (${props.ketinggian_combat || '-'})` },
            { label: 'Nama Site', value: props.nama_site || '-' },
            { label: 'Lokasi Saat Ini', value: props.lokasi_saat_ini || '-' },
            { label: 'Tgl Ambil / Kembali', value: `${props.tanggal_ambil || '-'} / ${props.tanggal_kembali || '-'}` },
            { 
                label: 'Koordinat', 
                value: `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`, 
                isMonospace: true 
            },
        ],
        statusText: props.status_raw || props.status_combat || normalizeStatus(props.status_combat),
    };
};

export default function StatistikCombat({ summary = {} }) {
    const activeSummary = summary?.summary || summary || {};
    const activeChart = summary?.chart || summary?.chart_data || summary?.type_chart || [];
    const activeMapRaw = summary?.map_data || summary?.mapData || summary?.table_data || [];

    const [hiddenBars, setHiddenBars] = useState({});

    const handleLegendClick = (e) => {
        const { dataKey } = e;
        if (dataKey) {
            setHiddenBars((prev) => ({ ...prev, [dataKey]: !prev[dataKey] }));
        }
    };

    // KPI Aggregation
    const totalCombat = useMemo(() => {
        return Number(activeSummary.totalCombat ?? activeSummary.total_combat ?? activeMapRaw.length ?? 0);
    }, [activeSummary, activeMapRaw]);

    const countOnsite = useMemo(() => {
        if (activeSummary.count_onsite !== undefined) return Number(activeSummary.count_onsite);
        return activeMapRaw.filter(i => normalizeStatus(i.status_combat) === 'ONSITE').length;
    }, [activeSummary, activeMapRaw]);

    const countReady = useMemo(() => {
        if (activeSummary.count_ready !== undefined) return Number(activeSummary.count_ready);
        return activeMapRaw.filter(i => normalizeStatus(i.status_combat) === 'READY TO USE').length;
    }, [activeSummary, activeMapRaw]);

    const countBroken = useMemo(() => {
        if (activeSummary.count_broken !== undefined) return Number(activeSummary.count_broken);
        return activeMapRaw.filter(i => normalizeStatus(i.status_combat) === 'BROKEN').length;
    }, [activeSummary, activeMapRaw]);

    // Donut Chart Status
    const donutData = useMemo(() => {
        const raw = [
            { name: 'On-Site', value: countOnsite, color: '#10b981', badgeClass: 'bg-emerald-500' },
            { name: 'Ready To Use', value: countReady, color: '#06b6d4', badgeClass: 'bg-cyan-500' },
            { name: 'Broken / Inop', value: countBroken, color: '#f43f5e', badgeClass: 'bg-rose-500' },
        ];
        return raw.map((item) => ({
            ...item,
            pct: totalCombat > 0 ? ((item.value / totalCombat) * 100).toFixed(1) : '0.0'
        }));
    }, [countOnsite, countReady, countBroken, totalCombat]);

    // Bar Chart per Type COMBAT
    const barTypeData = useMemo(() => {
        if (Array.isArray(activeChart) && activeChart.length > 0) return activeChart;

        const typeGroup = {};
        activeMapRaw.forEach((item) => {
            const type = item.type_combat || 'Unassigned';
            const st = normalizeStatus(item.status_combat);

            if (!typeGroup[type]) {
                typeGroup[type] = { name: type, ONSITE: 0, READY: 0, BROKEN: 0, total: 0 };
            }
            if (st === 'ONSITE') typeGroup[type].ONSITE += 1;
            else if (st === 'READY TO USE') typeGroup[type].READY += 1;
            else if (st === 'BROKEN') typeGroup[type].BROKEN += 1;

            typeGroup[type].total += 1;
        });

        return Object.values(typeGroup).sort((a, b) => b.total - a.total).slice(0, 8);
    }, [activeChart, activeMapRaw]);

    return (
        <div className="space-y-4">
            {/* KPI CARDS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="text-[11px] font-medium uppercase tracking-wider">Total COMBAT</span>
                            <Radio className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white mt-1.5">
                            {totalCombat.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-normal leading-tight">Master data terdaftar</p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                            <span className="text-[11px] font-medium uppercase tracking-wider">On-Site</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1.5">
                            {countOnsite.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 mt-2 font-normal leading-tight">Terpasang di lokasi site</p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                        <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400">
                            <span className="text-[11px] font-medium uppercase tracking-wider">Ready To Use</span>
                            <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-cyan-600 dark:text-cyan-400 mt-1.5">
                            {countReady.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[10px] text-cyan-600/70 dark:text-cyan-400/60 mt-2 font-normal leading-tight">Siap di gudang / WH</p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                            <span className="text-[11px] font-medium uppercase tracking-wider">Broken / Inop</span>
                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 mt-1.5">
                            {countBroken.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[10px] text-rose-600/70 dark:text-rose-400/60 mt-2 font-normal leading-tight">Unit rusak / tidak operasional</p>
                </div>
            </div>

            {/* MAP SECTION */}
            <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            Peta Sebaran Lokasi Asset COMBAT
                        </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                        {(Array.isArray(activeMapRaw) ? activeMapRaw.length : 0)} Pin Terdeteksi
                    </span>
                </div>
                <div className="p-0">
                    <Map 
                        data={activeMapRaw} 
                        statusKey="status_combat"
                        statusConfig={COMBAT_STATUS_CONFIG}
                        getPopupData={getCombatPopupData}
                    />
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* DONUT CHART */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                        <PieChartIcon className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            Proporsi Status COMBAT
                        </h3>
                    </div>

                    <div className="relative w-full h-[220px] my-2 flex items-center justify-center">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                            <span className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                                {totalCombat.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
                                Total COMBAT
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
                                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate">
                                        {item.name}
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                                    {item.value.toLocaleString('id-ID')} <span className="text-[9px] font-normal text-slate-400">({item.pct}%)</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BAR CHART TYPE COMBAT */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                        <BarChart3 className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            Breakdown Status per Type COMBAT
                        </h3>
                    </div>

                    <div className="w-full h-[260px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderColor: '#1e293b',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        color: '#f8fafc',
                                        padding: '8px 12px',
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
                                <Bar dataKey="ONSITE" name="Onsite" fill="#10b981" radius={[4, 4, 0, 0]} hide={hiddenBars['ONSITE']} />
                                <Bar dataKey="READY" name="Ready" fill="#06b6d4" radius={[4, 4, 0, 0]} hide={hiddenBars['READY']} />
                                <Bar dataKey="BROKEN" name="Broken" fill="#f43f5e" radius={[4, 4, 0, 0]} hide={hiddenBars['BROKEN']} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}