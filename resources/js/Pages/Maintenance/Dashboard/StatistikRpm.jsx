import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, CheckCircle2, Clock, XCircle, RotateCcw, 
  TrendingUp, PieChart as PieChartIcon, Layers 
} from 'lucide-react';
import { 
  ComposedChart, Bar, Line, PieChart, Pie, Cell, 
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// Custom Tooltip untuk Composed Chart (Bar Volume + Line % OK)
const CustomComposedTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-white min-w-[170px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {data.fullMonth || data.name}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Bln {data.monthNum || ''}
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-slate-300 font-medium">Total Site</span>
            </div>
            <span className="font-bold text-slate-100">
              {(data.total || 0).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-300 font-medium">% OK (Approved)</span>
            </div>
            <span className="font-bold text-emerald-400">
              {data.pctOk ?? 0}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip untuk Stacked Area Chart (Menyesuaikan Status yang Aktif)
const CustomAreaTooltip = ({ active, payload, label, activeStatus }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-white min-w-[180px]">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 mb-2">
          Bulan: {data.fullMonth || label}
        </div>
        <div className="space-y-1.5 text-xs">
          {activeStatus.OK && (
            <div className="flex justify-between items-center">
              <span className="text-emerald-400 font-medium">● OK (Approved):</span>
              <span className="font-bold">{(data.OK || 0).toLocaleString('id-ID')}</span>
            </div>
          )}
          {activeStatus.Belum && (
            <div className="flex justify-between items-center">
              <span className="text-amber-400 font-medium">● Belum (Pending):</span>
              <span className="font-bold">{(data.Belum || 0).toLocaleString('id-ID')}</span>
            </div>
          )}
          {activeStatus.Reject && (
            <div className="flex justify-between items-center">
              <span className="text-rose-400 font-medium">● Reject:</span>
              <span className="font-bold">{(data.Reject || 0).toLocaleString('id-ID')}</span>
            </div>
          )}
          {activeStatus.Return && (
            <div className="flex justify-between items-center">
              <span className="text-sky-400 font-medium">● Return:</span>
              <span className="font-bold">{(data.Return || 0).toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="pt-1.5 mt-1 border-t border-slate-800 flex justify-between items-center font-bold text-slate-100">
            <span>Total Site:</span>
            <span>{(data.total || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function StatistikRpm({ summary = {} }) {
  // State Filter Interaktif Legend 4 Status
  const [activeStatus, setActiveStatus] = useState({
    OK: true,
    Belum: true,
    Reject: true,
    Return: true,
  });

  // Toggle On/Off Status
  const toggleStatus = (key) => {
    setActiveStatus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Extract Summary KPI
  const totalSite = summary.totalSite || summary.total_site || 0;
  const totalApproved = summary.totalApproved || summary.total_approved || 0;
  const rawPending = summary.totalPending || summary.total_pending || summary.totalBelum || summary.total_belum || 0;
  const rawTidakOm = summary.totalTidakOm || summary.total_tidak_om || 0;
  const totalPending = rawPending + rawTidakOm;
  const totalReject = summary.totalReject || summary.total_reject || 0;
  const totalReturn = summary.totalReturn || summary.total_return || 0;

  // 1. Data Composed Chart
  const chartData = useMemo(() => {
    const rawChartData = summary.chartData || [];
    const monthlyPivot = summary.monthlyPivot || {};
    const monthPct = monthlyPivot.monthPct || [];
    const okCounts = monthlyPivot.counts?.OK || monthlyPivot.counts?.ok || [];

    return rawChartData.map((item, index) => {
      const ok = item.ok ?? okCounts[index] ?? 0;
      const pctOk = item.pctOk ?? monthPct[index] ?? (item.total > 0 ? Math.round((ok / item.total) * 100) : 0);
      
      return {
        ...item,
        ok,
        pctOk
      };
    });
  }, [summary.chartData, summary.monthlyPivot]);

  // 2. Data Donut Chart
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

  // 3. Data Stacked Area Chart (4 Status Bulanan)
  const stackedAreaData = useMemo(() => {
    const monthlyPivot = summary.monthlyPivot || {};
    const counts = monthlyPivot.counts || {};
    const chartData = summary.chartData || [];

    return chartData.map((item, idx) => {
      const ok = counts.OK?.[idx] ?? counts.ok?.[idx] ?? item.ok ?? 0;
      const belum = (counts.Belum?.[idx] ?? counts.belum?.[idx] ?? item.belum ?? 0) + 
                    (counts['Tidak OM']?.[idx] ?? counts.tidak_om?.[idx] ?? 0);
      const reject = counts.Reject?.[idx] ?? counts.reject?.[idx] ?? item.reject ?? 0;
      const returnVal = counts.Return?.[idx] ?? counts.return?.[idx] ?? item.return ?? 0;

      return {
        name: item.name || `Bln ${idx + 1}`,
        fullMonth: item.fullMonth || item.name,
        OK: ok,
        Belum: belum,
        Reject: reject,
        Return: returnVal,
        total: ok + belum + reject + returnVal
      };
    });
  }, [summary.chartData, summary.monthlyPivot]);

  // Konfigurasi Item Legend Interaktif
  const legendConfig = [
    { key: 'OK', label: 'OK', color: 'bg-emerald-500', border: 'border-emerald-500/50' },
    { key: 'Belum', label: 'Belum', color: 'bg-amber-500', border: 'border-amber-500/50' },
    { key: 'Reject', label: 'Reject', color: 'bg-rose-500', border: 'border-rose-500/50' },
    { key: 'Return', label: 'Return', color: 'bg-sky-500', border: 'border-sky-500/50' },
  ];

  return (
    <div className="space-y-5">
      {/* SECTION 1: 5 KARTU KPI SUMMARY */}
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
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Belum/Tidak OM/Reviewed</p>
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

      {/* SECTION 2: COMPOSED CHART & DONUT CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* COMPOSED CHART BULANAN */}
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
          <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Grafik Volume & Persentase OK Bulanan
                </CardTitle>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Total Site</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
                  <span className="text-slate-500 dark:text-slate-400 font-medium">% OK</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} padding={{ left: 10, right: 10 }} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" stroke="#10b981" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(244, 63, 94, 0.06)' }} wrapperStyle={{ zIndex: 50, outline: 'none' }} content={<CustomComposedTooltip />} />
                  <Bar yAxisId="left" dataKey="total" name="Total Site" barSize={32} radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.total > 0 ? '#fb7185' : '#94a3b8'} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="pctOk" name="% Approved (OK)" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3.5, strokeWidth: 1.5, stroke: '#ffffff' }} activeDot={{ r: 5, strokeWidth: 2 }} />
                </ComposedChart>
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center z-0">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                  {totalSite.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                  Total Site
                </span>
              </div>

              <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={58} outerRadius={78} paddingAngle={3} minAngle={6} dataKey="value" stroke="none">
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={{ zIndex: 50, outline: 'none' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px', color: '#f8fafc', padding: '8px 12px' }} formatter={(value, name) => [`${value.toLocaleString('id-ID')} unit (${totalSite > 0 ? ((value/totalSite)*100).toFixed(1) : 0}%)`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              {donutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.badgeClass}`} />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">{item.name.split(' ')[0]}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 block leading-none">{item.value.toLocaleString('id-ID')}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: STACKED AREA CHART DENGAN LEGEND INTERAKTIF */}
      <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Grafik Area 4 Status (Stacked Area Chart)
              </CardTitle>
            </div>

            {/* LEGEND DENGAN TOMBOL BISA DIKLIK (INTERAKTIF) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 mr-1 font-medium hidden sm:inline">Filter Status:</span>
              {legendConfig.map((item) => {
                const isActive = activeStatus[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleStatus(item.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200 border cursor-pointer select-none ${
                      isActive
                        ? 'bg-slate-800 dark:bg-slate-800 text-slate-100 border-slate-700 shadow-sm opacity-100 scale-100'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-900 line-through opacity-50 scale-95'
                    }`}
                    title={`Klik untuk ${isActive ? 'menyembunyikan' : 'menampilkan'} status ${item.label}`}
                  >
                    <span className={`w-2 h-2 rounded-full transition-all ${isActive ? item.color : 'bg-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stackedAreaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="colorBelum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="colorReject" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                
                <Tooltip wrapperStyle={{ zIndex: 50, outline: 'none' }} content={<CustomAreaTooltip activeStatus={activeStatus} />} />

                {/* DITAMPILKAN SECARA KONDISIONAL SESUAI STATUS LEGEND YANG AKTIF */}
                {activeStatus.OK && (
                  <Area type="monotone" dataKey="OK" stackId="1" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorOk)" />
                )}
                {activeStatus.Belum && (
                  <Area type="monotone" dataKey="Belum" stackId="1" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBelum)" />
                )}
                {activeStatus.Reject && (
                  <Area type="monotone" dataKey="Reject" stackId="1" stroke="#f43f5e" strokeWidth={1.5} fillOpacity={1} fill="url(#colorReject)" />
                )}
                {activeStatus.Return && (
                  <Area type="monotone" dataKey="Return" stroke="#38bdf8" stackId="1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorReturn)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}