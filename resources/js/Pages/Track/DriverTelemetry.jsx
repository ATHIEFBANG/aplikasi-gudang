import React from 'react';
import { 
    Gauge, 
    Compass, 
    Activity, 
    TrendingUp 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';

export default function DriverTelemetry({
    currentCoords,
    remainingDistanceKm = '-',
    speedHistory = []
}) {
    return (
        <div className="space-y-3.5">
            {/* 1. GRID 3 KARTU: KECEPATAN, SISA JARAK, AKURASI */}
            <div className="grid grid-cols-3 gap-2">
                {/* Kecepatan */}
                <Card className="bg-slate-900 border-slate-800 rounded-xl p-3 shadow-sm">
                    <CardContent className="p-0 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] uppercase font-semibold">Kecepatan</span>
                            <Gauge className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="mt-1">
                            <span className="text-xl font-black font-mono text-slate-100">
                                {currentCoords?.speed || '0.0'}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">km/h</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Sisa Jarak */}
                <Card className="bg-slate-900 border-slate-800 rounded-xl p-3 shadow-sm">
                    <CardContent className="p-0 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] uppercase font-semibold">Sisa Jarak</span>
                            <Compass className="w-3.5 h-3.5 text-sky-400" />
                        </div>
                        <div className="mt-1">
                            <span className="text-xl font-black font-mono text-sky-400">
                                {remainingDistanceKm}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">km</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Akurasi GPS */}
                <Card className="bg-slate-900 border-slate-800 rounded-xl p-3 shadow-sm">
                    <CardContent className="p-0 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] uppercase font-semibold">Akurasi</span>
                            <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="mt-1">
                            <span className="text-xl font-black font-mono text-emerald-400">
                                ±{currentCoords?.accuracy || 0}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">m</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 2. GRAFIK AREA KECEPATAN (RECHARTS) */}
            <Card className="bg-slate-900 border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="p-3.5 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        <CardTitle className="text-xs font-bold text-slate-200">
                            Grafik Kecepatan Berkendara (km/h)
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-3.5 pt-2">
                    <div className="w-full h-28">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={speedHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="speedColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} domain={[0, 'auto']} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
                                    formatter={(value) => [`${value} km/h`, 'Kecepatan']}
                                />
                                <Area type="monotone" dataKey="speed" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#speedColor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}