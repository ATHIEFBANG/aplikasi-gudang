import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

export default function GrafikLineKondisi({ data = [] }) {
    const [activeKondisi, setActiveKondisi] = useState({ Baru: true, Bekas: true, Rusak: true });

    const toggleKondisi = (key) => {
        setActiveKondisi((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const legends = [
        { key: 'Baru', label: '% Baru (Segel)', color: 'bg-emerald-500' },
        { key: 'Bekas', label: '% Bekas (Second)', color: 'bg-amber-500' },
        { key: 'Rusak', label: '% Rusak', color: 'bg-rose-500' },
    ];

    return (
        <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xs">
            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <LineChartIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Grafik Tren Persentase Kondisi Barang Bulanan (% Line Chart)
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                        {legends.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => toggleKondisi(item.key)}
                                className={`flex items-center gap-1.5 text-xs transition-all cursor-pointer select-none ${
                                    activeKondisi[item.key] ? 'text-slate-700 dark:text-slate-200 font-semibold' : 'text-slate-400 line-through opacity-40'
                                }`}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${activeKondisi[item.key] ? item.color : 'bg-slate-400'}`} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-5">
                <div className="w-full h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 22, right: 15, left: -20, bottom: 65 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.25} />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                tickLine={false}
                                axisLine={false}
                                padding={{ left: 10, right: 10 }}
                                tick={({ x, y, payload }) => {
                                    const item = data[payload.index] || data.find((d) => d.name === payload.value);
                                    if (!item) return null;
                                    const lines = [];
                                    if (activeKondisi.Baru) lines.push({ val: item.Baru, pct: item.pctBaru, color: '#10b981' });
                                    if (activeKondisi.Bekas) lines.push({ val: item.Bekas, pct: item.pctBekas, color: '#f59e0b' });
                                    if (activeKondisi.Rusak) lines.push({ val: item.Rusak, pct: item.pctRusak, color: '#f43f5e' });

                                    return (
                                        <g transform={`translate(${x},${y})`}>
                                            <text x={0} y={0} dy={12} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={700}>
                                                {payload.value}
                                            </text>
                                            {lines.map((l, i) => (
                                                <text key={i} x={-22} y={0} dy={25 + i * 12} textAnchor="start" fill={l.color} fontSize={8.5} fontWeight={800}>
                                                    {`${(l.val || 0).toLocaleString('id-ID')} (${l.pct}%)`}
                                                </text>
                                            ))}
                                        </g>
                                    );
                                }}
                            />
                            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs shadow-xl">
                                            <div className="font-bold border-b border-slate-800 pb-1 mb-2">Bulan: {d.fullMonth || d.name}</div>
                                            {activeKondisi.Baru && <div className="text-emerald-400">Baru: {d.Baru} ({d.pctBaru}%)</div>}
                                            {activeKondisi.Bekas && <div className="text-amber-400">Bekas: {d.Bekas} ({d.pctBekas}%)</div>}
                                            {activeKondisi.Rusak && <div className="text-rose-400">Rusak: {d.Rusak} ({d.pctRusak}%)</div>}
                                        </div>
                                    );
                                }}
                            />
                            {activeKondisi.Baru && (
                                <Line type="monotone" dataKey="pctBaru" name="% Baru" stroke="#10b981" strokeWidth={2.8} dot={{ fill: '#10b981', r: 4 }}>
                                    <LabelList dataKey="pctBaru" position="top" offset={8} fill="#059669" fontSize={10} fontWeight={800} formatter={(v) => v > 0 ? `${v}%` : ''} />
                                </Line>
                            )}
                            {activeKondisi.Bekas && (
                                <Line type="monotone" dataKey="pctBekas" name="% Bekas" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3.5 }}>
                                    <LabelList dataKey="pctBekas" position="top" offset={8} fill="#d97706" fontSize={10} fontWeight={800} formatter={(v) => v > 0 ? `${v}%` : ''} />
                                </Line>
                            )}
                            {activeKondisi.Rusak && (
                                <Line type="monotone" dataKey="pctRusak" name="% Rusak" stroke="#f43f5e" strokeWidth={2.5} dot={{ fill: '#f43f5e', r: 3.5 }}>
                                    <LabelList dataKey="pctRusak" position="top" offset={8} fill="#e11d48" fontSize={10} fontWeight={800} formatter={(v) => v > 0 ? `${v}%` : ''} />
                                </Line>
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}