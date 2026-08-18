import React, { useMemo, useState } from 'react';
import { 
    Radio, CheckCircle2, PieChart as PieChartIcon, 
    BarChart2 as BarChartIcon, ShieldAlert, Zap
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { parseCoordinates } from '@/components/MapControls';
import RiwayatCombat from './RiwayatCombat';
import MapCombat from './MapCombat'; 

// Helpers
const getItemProps = (item) => item?.properties || item || {};
const formatXAxisLabel = (value) => (value ? (value.length > 15 ? `${value.substring(0, 15)}...` : value) : '');

// Konfigurasi Status Standar COMBAT
const COMBAT_STATUS_CONFIG = {
    'ONSITE': { label: 'ONSITE', color: '#10b981', bg: 'rgba(16,185,129,0.35)' },
    'IN TRANSIT': { label: 'IN TRANSIT', color: '#f59e0b', bg: 'rgba(245,158,11,0.35)' },
    'READY TO USE': { label: 'READY TO USE', color: '#06b6d4', bg: 'rgba(6,182,212,0.35)' },
    'BROKEN': { label: 'BROKEN / INOP', color: '#f43f5e', bg: 'rgba(244,63,94,0.35)' },
    'UNASSIGNED': { label: 'UNASSIGNED', color: '#64748b', bg: 'rgba(100,116,139,0.35)' }
};

const normalizeStatus = (statusStr) => {
    if (!statusStr) return 'UNASSIGNED';
    const clean = String(statusStr).toUpperCase().trim();
    if (clean.includes('TRANSIT')) return 'IN TRANSIT';
    if (clean.includes('ONSITE') || clean.startsWith('2.')) return 'ONSITE';
    if (clean.includes('READY') || clean.startsWith('5.')) return 'READY TO USE';
    if (clean.includes('BROKEN') || clean.startsWith('6.')) return 'BROKEN';
    return 'UNASSIGNED';
};

const getCombatPopupData = (item, lat, lng) => {
    const props = getItemProps(item);
    if (item?.is_destination) {
        return {
            title: item.properties?.asset_name || item.destination_name || 'Lokasi Tujuan',
            details: [
                { label: 'Nama Lokasi', value: item.destination_name || item.properties?.asset_name || '-' },
                { label: 'Koordinat', value: `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`, isMonospace: true },
            ],
            statusText: 'TUJUAN',
        };
    }
    return {
        title: props.asset_name || props.nama_site || 'Unit COMBAT',
        details: [
            { label: 'Serial Number', value: props.sn || '-' },
            { label: 'PIC Data', value: props.pic?.name || props.pic_data || props.data || '-' },
            { label: 'Type / Tinggi', value: `${props.type_combat || '-'} (${props.ketinggian_combat || '-'})` },
            { label: 'Nama Site / Lokasi', value: props.nama_site || '-' },
            { label: 'Koordinat', value: `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`, isMonospace: true },
        ],
        statusText: props.status_raw || props.status_combat || normalizeStatus(props.status_combat),
    };
};

const renderCustomLegend = (props) => {
    const { payload, onClick } = props;
    return (
        <div className="flex items-center justify-end gap-4 text-xs font-semibold pb-2">
            {payload.map((entry, index) => (
                <div 
                    key={`legend-${index}`}
                    onClick={() => onClick(entry)}
                    className="flex items-center gap-1.5 cursor-pointer select-none transition-opacity hover:opacity-80"
                >
                    <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                        {entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default function StatistikCombat({ summary = {}, activeTrip = null }) {
    const activeSummary = summary?.summary || summary || {};
    const activeMapRaw = summary?.map_data || summary?.mapData || summary?.table_data || [];
    const activeTripsRaw = summary?.trips || [];

    const [hiddenBars, setHiddenBars] = useState({});
    const [viewMode, setViewMode] = useState('dashboard');
    
    const [routeHistory, setRouteHistory] = useState([]);
    const [selectedTripInfo, setSelectedTripInfo] = useState(null);

    const handleLegendClick = (e) => {
        const { dataKey } = e;
        if (dataKey) setHiddenBars((prev) => ({ ...prev, [dataKey]: !prev[dataKey] }));
    };

    const handleResetRoute = () => {
        setRouteHistory([]);
        setSelectedTripInfo(null);
    };

    // =========================================================================
    // 1. KALKULASI DATA KPI STATUS (4 KOLOM DENGAN SUB-LABEL)
    // =========================================================================
    const totalCombat = useMemo(() => Number(activeSummary.totalCombat ?? activeSummary.total_combat ?? (Array.isArray(activeMapRaw) ? activeMapRaw.length : 0)), [activeSummary, activeMapRaw]);
    const countOnsite = useMemo(() => activeMapRaw.filter(i => normalizeStatus(getItemProps(i).status_combat || getItemProps(i).status_raw) === 'ONSITE').length, [activeMapRaw]);
    const countReady = useMemo(() => activeMapRaw.filter(i => normalizeStatus(getItemProps(i).status_combat || getItemProps(i).status_raw) === 'READY TO USE').length, [activeMapRaw]);
    const countBroken = useMemo(() => activeMapRaw.filter(i => normalizeStatus(getItemProps(i).status_combat || getItemProps(i).status_raw) === 'BROKEN').length, [activeMapRaw]);
    const validLocationCount = useMemo(() => activeMapRaw.filter(item => parseCoordinates(item) !== null).length, [activeMapRaw]);

    // Donut Chart (Hanya 3 Status Fisik: On-Site, Ready, Broken)
    const donutData = useMemo(() => {
        const raw = [
            { name: 'On-Site', value: countOnsite, color: '#10b981' },
            { name: 'Ready To Use', value: countReady, color: '#06b6d4' },
            { name: 'Broken / Inop', value: countBroken, color: '#f43f5e' },
        ];
        const chartTotal = countOnsite + countReady + countBroken;
        return raw.map(item => ({ 
            ...item, 
            pct: chartTotal > 0 ? ((item.value / chartTotal) * 100).toFixed(1) : '0.0' 
        }));
    }, [countOnsite, countReady, countBroken]);

    // Bar Chart per Type (Tanpa In Transit)
    const barTypeData = useMemo(() => {
        if (!Array.isArray(activeMapRaw)) return [];
        const typeGroup = {};
        activeMapRaw.forEach((item) => {
            const props = getItemProps(item);
            const type = props.type_combat || 'Unassigned';
            const st = normalizeStatus(props.status_combat || props.status_raw);
            if (!typeGroup[type]) typeGroup[type] = { name: type, ONSITE: 0, READY: 0, BROKEN: 0, total: 0 };
            
            if (st === 'ONSITE') {
                typeGroup[type].ONSITE += 1;
                typeGroup[type].total += 1;
            } else if (st === 'READY TO USE') {
                typeGroup[type].READY += 1;
                typeGroup[type].total += 1;
            } else if (st === 'BROKEN') {
                typeGroup[type].BROKEN += 1;
                typeGroup[type].total += 1;
            }
        });
        return Object.values(typeGroup).sort((a, b) => b.total - a.total).slice(0, 8);
    }, [activeMapRaw]);

    // Tampilan Halaman Riwayat
    if (viewMode === 'history') {
        return (
            <RiwayatCombat 
                initialTrips={activeTripsRaw}
                onBack={() => setViewMode('dashboard')}
            />
        );
    }

    return (
        <div className="space-y-4">
            
            {/* ================================================================= */}
            {/* 1. KARTU STATUS KPI (4 KOLOM DENGAN SUB-LABEL RINGKAS)            */}
            {/* ================================================================= */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total COMBAT */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Total COMBAT</span>
                            <Radio className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-white mt-1.5">
                            {totalCombat.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        Total armada terdaftar
                    </p>
                </div>

                {/* On-Site */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-emerald-500/30 transition-colors">
                    <div>
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">On-Site</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mt-1.5">
                            {countOnsite.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        Unit aktif di lokasi site
                    </p>
                </div>

                {/* Ready To Use */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-cyan-500/30 transition-colors">
                    <div>
                        <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Ready To Use</span>
                            <Zap className="h-4 w-4 text-cyan-500" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-cyan-600 dark:text-cyan-400 mt-1.5">
                            {countReady.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        Unit siap dimobilisasi
                    </p>
                </div>

                {/* Broken / Inop */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-rose-500/30 transition-colors">
                    <div>
                        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Broken / Inop</span>
                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400 mt-1.5">
                            {countBroken.toLocaleString('id-ID')}
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        Unit perbaikan / inoperasional
                    </p>
                </div>
            </div>

            {/* ================================================================= */}
            {/* 2. KOMPONEN PETA COMBAT                                           */}
            {/* ================================================================= */}
            <MapCombat 
                activeMapRaw={activeMapRaw}
                activeTrip={activeTrip}
                activeTripsRaw={activeTripsRaw}
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedTripInfo={selectedTripInfo}
                routeHistory={routeHistory}
                handleResetRoute={handleResetRoute}
                validLocationCount={validLocationCount}
                totalCombat={totalCombat}
                COMBAT_STATUS_CONFIG={COMBAT_STATUS_CONFIG}
                normalizeStatus={normalizeStatus}
                getCombatPopupData={getCombatPopupData}
                combatList={activeMapRaw}
            />

            {/* ================================================================= */}
            {/* 3. CHARTS SECTION (DONUT 3 STATUS & BAR CHART ELEGAN)             */}
            {/* ================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* 1. DONUT CHART */}
                <div className="lg:col-span-4 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                        <PieChartIcon className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">Proporsi Status Fisik</h3>
                    </div>
                    <div className="relative w-full h-52 my-2 flex items-center justify-center">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                            <span className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                                {(countOnsite + countReady + countBroken).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Total Unit</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={donutData} cx="50%" cy="50%" innerRadius={58} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                                    {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip 
                                    wrapperStyle={{ outline: 'none' }} 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', fontSize: '12px', color: '#f8fafc', padding: '8px 12px' }} 
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    
                    {/* 3 Kolom Ringkasan Donut */}
                    <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        {donutData.map((item, idx) => (
                            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-2 text-center" key={idx}>
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 truncate">{item.name}</span>
                                </div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {item.value} <span className="text-[9px] font-normal text-slate-400">({item.pct}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. BAR CHART (DESAIN MODERN SESUAI REFERENSI, TEKS BAWAH MIRING) */}
                <div className="lg:col-span-8 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2">
                            <BarChartIcon className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                Breakdown Status per Type COMBAT
                            </h3>
                        </div>
                    </div>
                    
                    <div className="w-full h-72 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={barTypeData} 
                                margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                                barGap={4}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                                    tickFormatter={formatXAxisLabel} 
                                    interval={0} 
                                    angle={-25} 
                                    textAnchor="end" 
                                    height={50} 
                                />
                                
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                                
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} 
                                    wrapperStyle={{ outline: 'none' }} 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px', color: '#f8fafc', padding: '8px 12px' }} 
                                />
                                
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    content={renderCustomLegend}
                                    onClick={handleLegendClick} 
                                />
                                
                                <Bar 
                                    dataKey="ONSITE" 
                                    name="On-Site" 
                                    fill="#10b981" 
                                    hide={hiddenBars.ONSITE || false} 
                                    radius={[6, 6, 0, 0]} 
                                    maxBarSize={22}
                                />
                                <Bar 
                                    dataKey="READY" 
                                    name="Ready To Use" 
                                    fill="#06b6d4" 
                                    hide={hiddenBars.READY || false} 
                                    radius={[6, 6, 0, 0]} 
                                    maxBarSize={22}
                                />
                                <Bar 
                                    dataKey="BROKEN" 
                                    name="Broken / Inop" 
                                    fill="#f43f5e" 
                                    hide={hiddenBars.BROKEN || false} 
                                    radius={[6, 6, 0, 0]} 
                                    maxBarSize={22}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}