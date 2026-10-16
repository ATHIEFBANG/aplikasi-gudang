import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GrafikBatangLogistik({ data = [] }) {
    const [activeStatus, setActiveStatus] = useState({ MASUK: true, KELUAR: true, TRANSFER: true });

    const toggleStatus = (key) => {
        setActiveStatus((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const legends = [
        { key: 'MASUK', label: 'Masuk', color: 'bg-emerald-500', fill: '#10b981' },
        { key: 'KELUAR', label: 'Keluar', color: 'bg-rose-500', fill: '#f43f5e' },
        { key: 'TRANSFER', label: 'Transfer', color: 'bg-sky-500', fill: '#0284c7' },
    ];

    return (
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xs">
            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Tren Aktivitas Logistik Bulanan
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                        {legends.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => toggleStatus(item.key)}
                                className={`flex items-center gap-1.5 text-xs transition-all cursor-pointer select-none ${
                                    activeStatus[item.key] ? 'text-slate-700 dark:text-slate-200 font-semibold' : 'text-slate-400 line-through opacity-40'
                                }`}
                            >
                                <span className={`w-2.5 h-2.5 rounded-xs ${activeStatus[item.key] ? item.color : 'bg-slate-400'}`} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-5">
                <div className="w-full h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barGap={2} margin={{ top: 15, right: 15, left: -20, bottom: 45 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.25} />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                tickLine={false}
                                axisLine={false}
                                padding={{ left: 10, right: 10 }}
                                tick={({ x, y, payload }) => {
                                    const item = data[payload.index] || data.find((d) => d.name === payload.value);
                                    const activeLines = [];
                                    if (activeStatus.MASUK) activeLines.push({ val: item?.MASUK ?? 0, color: '#10b981' });
                                    if (activeStatus.KELUAR) activeLines.push({ val: item?.KELUAR ?? 0, color: '#f43f5e' });
                                    if (activeStatus.TRANSFER) activeLines.push({ val: item?.TRANSFER ?? 0, color: '#0284c7' });

                                    return (
                                        <g transform={`translate(${x},${y})`}>
                                            <text x={0} y={0} dy={12} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={700}>
                                                {payload.value}
                                            </text>
                                            {activeLines.map((l, i) => (
                                                <text key={i} x={0} y={0} dy={25 + i * 11} textAnchor="middle" fill={l.color} fontSize={9} fontWeight={800}>
                                                    {l.val > 0 ? l.val : '-'}
                                                </text>
                                            ))}
                                        </g>
                                    );
                                }}
                            />
                            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} tickCount={5} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs shadow-xl">
                                            <div className="font-bold border-b border-slate-800 pb-1 mb-2">{d.fullName || d.name} (Total: {d.total} Unit)</div>
                                            {activeStatus.MASUK && <div className="text-emerald-400">Masuk: {d.MASUK || 0}</div>}
                                            {activeStatus.KELUAR && <div className="text-rose-400">Keluar: {d.KELUAR || 0}</div>}
                                            {activeStatus.TRANSFER && <div className="text-sky-400">Transfer: {d.TRANSFER || 0}</div>}
                                        </div>
                                    );
                                }}
                            />
                            {activeStatus.MASUK && <Bar dataKey="MASUK" name="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} />}
                            {activeStatus.KELUAR && <Bar dataKey="KELUAR" name="Keluar" fill="#f43f5e" radius={[4, 4, 0, 0]} />}
                            {activeStatus.TRANSFER && <Bar dataKey="TRANSFER" name="Transfer" fill="#0284c7" radius={[4, 4, 0, 0]} />}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}