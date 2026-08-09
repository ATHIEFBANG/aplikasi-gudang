import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    Radio,
    Signal,
    CheckCircle2,
    AlertTriangle,
    Activity,
    Server,
    ArrowUpRight,
    TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
    return (
        <AuthenticatedLayout header="Dashboard Monitoring">
            <Head title="Dashboard - Mitratel" />

            <div className="space-y-6">
                {/* ================= BARIS 1: KARTU KPI STATISTIK ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Stat 1: Total Menara */}
                    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-sm hover:border-red-500/40 transition-all duration-300">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Menara</p>
                                    <h3 className="text-2xl font-black text-foreground mt-1">38,420</h3>
                                </div>
                                <div className="p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                                    <Radio className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-emerald-600 dark:text-emerald-400 gap-1 font-medium">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>+120 menara baru bulan ini</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stat 2: Status Operasional */}
                    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-sm hover:border-emerald-500/40 transition-all duration-300">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Online</p>
                                    <h3 className="text-2xl font-black text-foreground mt-1">99.85%</h3>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-muted-foreground gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Optimal & Terhubung</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stat 3: Total Tenant */}
                    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-sm hover:border-cyan-500/40 transition-all duration-300">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Tenant</p>
                                    <h3 className="text-2xl font-black text-foreground mt-1">57,890</h3>
                                </div>
                                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                                    <Signal className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-cyan-600 dark:text-cyan-400 gap-1 font-medium">
                                <span>Ratio Tenancy: 1.51x</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stat 4: Alerts Maintenance */}
                    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-sm hover:border-amber-500/40 transition-all duration-300">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perlu Perbaikan</p>
                                    <h3 className="text-2xl font-black text-foreground mt-1">14 Site</h3>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-amber-600 dark:text-amber-400 gap-1 font-medium">
                                <span>2 Site Prioritas Tinggi</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ================= BARIS 2: GRAFIK MONITORING & STATUS SITE ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* AREA GRAFIK RINGKASAN AKTIVITAS */}
                    <Card className="lg:col-span-2 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                            <div>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-red-500" />
                                    Ringkasan Performa Jaringan
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">Telemetri lalu lintas data menara secara real-time</p>
                            </div>
                            <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                                Live Data
                            </Badge>
                        </CardHeader>

                        <CardContent className="pt-4">
                            <div className="h-60 rounded-xl bg-slate-100/80 dark:bg-gradient-to-b dark:from-slate-800/30 dark:to-slate-950/70 border border-slate-200 dark:border-white/5 p-4 flex flex-col justify-end relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent"></div>

                                <div className="flex items-end justify-between gap-2 h-40 z-10">
                                    {[65, 80, 45, 90, 75, 60, 85, 95, 70, 85, 100, 90, 75, 80, 95].map((val, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                                            <div
                                                className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-sm group-hover:from-red-500 group-hover:to-cyan-400 transition-all duration-300 shadow-md shadow-red-500/20"
                                                style={{ height: `${val}%` }}
                                            ></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground pt-3 border-t border-slate-200 dark:border-white/10 z-10 font-mono">
                                    <span>00:00</span>
                                    <span>04:00</span>
                                    <span>08:00</span>
                                    <span>12:00</span>
                                    <span>16:00</span>
                                    <span>20:00</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* STATUS MENARA TERBARU */}
                    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
                        <div>
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Server className="w-5 h-5 text-cyan-500" />
                                    Status Site Menara
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">Update Terkini</span>
                            </CardHeader>

                            <CardContent className="pt-4 space-y-3">
                                {[
                                    { id: 'MTR-JKT-082', loc: 'Jakarta Selatan', status: 'Normal', color: 'emerald' },
                                    { id: 'MTR-BDG-104', loc: 'Bandung Barat', status: 'Maintenance', color: 'amber' },
                                    { id: 'MTR-SUB-045', loc: 'Surabaya Timur', status: 'Normal', color: 'emerald' },
                                    { id: 'MTR-MDN-019', loc: 'Medan Kota', status: 'Normal', color: 'emerald' },
                                ].map((site, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-150">
                                        <div>
                                            <p className="text-xs font-bold font-mono">{site.id}</p>
                                            <p className="text-[11px] text-muted-foreground">{site.loc}</p>
                                        </div>
                                        <Badge variant="outline" className={
                                            site.color === 'emerald'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                        }>
                                            {site.status}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </div>

                        <CardContent className="pt-0 pb-6">
                            <Button variant="outline" className="w-full flex items-center justify-center gap-1.5">
                                <span>Kelola Semua Site</span>
                                <ArrowUpRight className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}