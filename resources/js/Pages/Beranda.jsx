import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Wrench,
    Truck,
    Users,
    KeyRound,
    BarChart3,
    Compass,
    ArrowUpRight
} from 'lucide-react';

// Import Komponen Bawaan Proyek (Vision UI) & Shadcn/UI
import GlassCard from '@/components/GlassCard';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Beranda({ 
    combatSummary = {}, 
    maintenanceSummary = {}, 
    teamMembers = [], 
    teamCount = 0 
}) {
    const { auth } = usePage().props;
    const user = auth?.user || { name: 'User Operator', email: 'operator@mitratel.co.id', role: 'Operator' };

    // State Switcher Mode COMBAT ('unit' = Kondisi Fisik, 'rute' = Operasional Trip)
    const [combatMode, setCombatMode] = useState('unit');

    // Ekstraksi Data COMBAT
    const combatUnit = {
        total: combatSummary.unit?.total ?? 0,
        ready: combatSummary.unit?.ready ?? 0,
        rusak: combatSummary.unit?.rusak ?? 0,
        onsite: combatSummary.unit?.onsite ?? 0
    };

    const combatRute = {
        totalTrips: combatSummary.rute?.total_trips ?? 0,
        inTransit: combatSummary.rute?.in_transit ?? 0,
        assigned: combatSummary.rute?.assigned ?? 0,
        completed: combatSummary.rute?.completed ?? 0
    };

    // Ekstraksi Data Maintenance
    const rpm = {
        total: maintenanceSummary.rpm?.total ?? 0,
        approved: maintenanceSummary.rpm?.approved ?? 0,
        pending: maintenanceSummary.rpm?.pending ?? 0,
        reject: maintenanceSummary.rpm?.reject ?? 0,
        returnVal: maintenanceSummary.rpm?.return ?? 0,
    };

    const smartkey = {
        total: maintenanceSummary.smartkey?.total ?? 0,
        locked: maintenanceSummary.smartkey?.locked ?? 0,
        unlocked: maintenanceSummary.smartkey?.unlocked ?? 0,
        na: maintenanceSummary.smartkey?.na ?? 0
    };

    const totalPersonil = teamCount || (Array.isArray(teamMembers) ? teamMembers.length : 0);

    return (
        <AuthenticatedLayout header="Beranda">
            <Head title="Beranda - Portal Monitoring" />

            <div className="space-y-6 max-w-7xl mx-auto">
                
                {/* =========================================================================
                 * 1. HEADER HALAMAN (MINIMALIS & BERSIH)
                 * ========================================================================= */}
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Selamat Datang, {user.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Ringkasan operasional pemeliharaan preventif serta manajemen aset armada COMBAT.
                    </p>
                </div>

                {/* =========================================================================
                 * 2. DUA MODUL UTAMA: MAINTENANCE & ASSETS (GLASSCARD)
                 * ========================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* -------------------------------------------------------------
                     * MODUL 1: MAINTENANCE (RPM & SMARTKEY)
                     * ------------------------------------------------------------- */}
                    <GlassCard className="flex flex-col justify-between p-6">
                        <div className="space-y-5">
                            {/* Header Modul Maintenance */}
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        Modul Maintenance
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Rekonsiliasi Preventif & IoT SmartKey
                                    </p>
                                </div>
                            </div>

                            {/* Sub-Seksi Dokumen RPM */}
                            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                                        <span>Progres Dokumen RPM</span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                        Total: <strong className="text-slate-900 dark:text-slate-100">{rpm.total.toLocaleString('id-ID')}</strong> Site
                                    </span>
                                </div>

                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-emerald-500/40 transition-colors">
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">Approved</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{rpm.approved.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-amber-500/40 transition-colors">
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">Pending</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{rpm.pending.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-rose-500/40 transition-colors">
                                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block">Reject</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{rpm.reject.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-sky-500/40 transition-colors">
                                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold block">Return</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{rpm.returnVal.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sub-Seksi Status SmartKey */}
                            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                                        <KeyRound className="w-4 h-4 text-sky-500" />
                                        <span>Status IoT SmartKey</span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                        Total: <strong className="text-slate-900 dark:text-slate-100">{smartkey.total.toLocaleString('id-ID')}</strong> Gembok
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-sky-500/40 transition-colors">
                                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold block">Locked</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{smartkey.locked}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-amber-500/40 transition-colors">
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">Unlocked</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{smartkey.unlocked}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-slate-400 transition-colors">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">#N/A (Offline)</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{smartkey.na}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 👉 TOMBOL NAVIGASI ADAPTIF TEMA (LIGHT & DARK MODE) */}
                        <div className="pt-4 mt-2">
                            <Link
                                href="/maintenance/dashboard"
                                className="group flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-100/90 hover:bg-rose-600 dark:bg-slate-950/70 dark:hover:bg-rose-600 text-slate-700 hover:text-white dark:text-slate-200 dark:hover:text-white text-xs font-semibold shadow-2xs hover:shadow-md hover:shadow-rose-500/20 transition-all duration-200 border border-slate-200/80 hover:border-rose-600 dark:border-slate-800 dark:hover:border-rose-600 cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-rose-500/10 group-hover:bg-white/20 dark:bg-rose-500/15 transition-colors">
                                        <BarChart3 className="w-3.5 h-3.5 text-rose-600 group-hover:text-white dark:text-rose-400 transition-colors" />
                                    </div>
                                    <span>Buka Dashboard Maintenance</span>
                                </div>
                                <div className="w-6 h-6 rounded-lg bg-slate-200/60 group-hover:bg-white/20 dark:bg-slate-800/80 flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5">
                                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white dark:text-slate-400" />
                                </div>
                            </Link>
                        </div>
                    </GlassCard>

                    {/* -------------------------------------------------------------
                     * MODUL 2: ASSETS (COMBAT)
                     * ------------------------------------------------------------- */}
                    <GlassCard className="flex flex-col justify-between p-6">
                        <div className="space-y-5">
                            {/* Header Modul Assets & Switcher Mode */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                            Modul Assets COMBAT
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Kondisi Unit & Pelacakan Rute Trip
                                        </p>
                                    </div>
                                </div>

                                {/* Switcher Mode (Unit vs Rute) */}
                                <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setCombatMode('unit')}
                                        className={`px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${
                                            combatMode === 'unit'
                                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        Mode Unit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCombatMode('rute')}
                                        className={`px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${
                                            combatMode === 'rute'
                                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        Mode Rute
                                    </button>
                                </div>
                            </div>

                            {/* Konten Berdasarkan Mode yang Dipilih */}
                            {combatMode === 'unit' ? (
                                /* 👉 1. MODE DASHBOARD (KONDISI FISIK UNIT MASTER) */
                                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            Kondisi Fisik Armada
                                        </span>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                            Total: <strong className="text-slate-900 dark:text-slate-100">{combatUnit.total}</strong> Unit
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-emerald-500/40 transition-colors">
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">Ready to Use</span>
                                            <span className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{combatUnit.ready}</span>
                                            <span className="text-[9px] text-slate-500 dark:text-slate-400">Siap Operasi</span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-rose-500/40 transition-colors">
                                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block">Rusak / Maint</span>
                                            <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5 block">{combatUnit.rusak}</span>
                                            <span className="text-[9px] text-slate-500 dark:text-slate-400">Perlu Perbaikan</span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-sky-500/40 transition-colors">
                                            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold block">Onsite / Aktif</span>
                                            <span className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{combatUnit.onsite}</span>
                                            <span className="text-[9px] text-slate-500 dark:text-slate-400">Terpasang Site</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                                        Status kondisi fisik armada dikelola melalui menu Master Data Aset COMBAT.
                                    </p>
                                </div>
                            ) : (
                                /* 👉 2. MODE RUTE (STATUS TRIP / MOBILISASI) */
                                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            Aktivitas Rute Mobilisasi
                                        </span>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                            Total: <strong className="text-slate-900 dark:text-slate-100">{combatRute.totalTrips}</strong> Riwayat Trip
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-amber-500/40 transition-colors">
                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">In Transit</span>
                                            <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">{combatRute.inTransit}</span>
                                            <span className="text-[9px] text-slate-500 dark:text-slate-400">Sedang Bergerak</span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-sky-500/40 transition-colors">
                                            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold block">Assigned</span>
                                            <span className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{combatRute.assigned}</span>
                                            <span className="text-[9px] text-slate-500 dark:text-slate-400">Menunggu Supir</span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs hover:border-emerald-500/40 transition-colors">
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">Selesai</span>
                                            <span className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{combatRute.completed}</span>
                                            <span className="text-[9px] text-slate-500 dark:text-slate-400">Tiba Tujuan</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                                        Posisi armada diperbarui secara otomatis dari aplikasi driver secara real-time.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 👉 TOMBOL NAVIGASI ADAPTIF TEMA (LIGHT & DARK MODE) */}
                        <div className="pt-4 mt-2">
                            <Link
                                href="/assets/dashboard"
                                className="group flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-100/90 hover:bg-sky-600 dark:bg-slate-950/70 dark:hover:bg-sky-600 text-slate-700 hover:text-white dark:text-slate-200 dark:hover:text-white text-xs font-semibold shadow-2xs hover:shadow-md hover:shadow-sky-500/20 transition-all duration-200 border border-slate-200/80 hover:border-sky-600 dark:border-slate-800 dark:hover:border-sky-600 cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-sky-500/10 group-hover:bg-white/20 dark:bg-sky-500/15 transition-colors">
                                        <Compass className="w-3.5 h-3.5 text-sky-600 group-hover:text-white dark:text-sky-400 transition-colors" />
                                    </div>
                                    <span>Buka Tracking COMBAT</span>
                                </div>
                                <div className="w-6 h-6 rounded-lg bg-slate-200/60 group-hover:bg-white/20 dark:bg-slate-800/80 flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5">
                                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white dark:text-slate-400" />
                                </div>
                            </Link>
                        </div>
                    </GlassCard>
                </div>

                {/* =========================================================================
                 * 3. TABEL TIM OPERASIONAL (GLASSCARD RINGKAS & RAPI)
                 * ========================================================================= */}
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    Tim Operasional
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Daftar personil yang memiliki hak akses sistem
                                </p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs px-2.5 py-1 font-semibold">
                            {totalPersonil} Tim
                        </Badge>
                    </div>

                    <div className="mt-2 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-200/80 dark:border-slate-800 hover:bg-transparent">
                                    <TableHead className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Nama Pengguna</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Peran / Role</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teamMembers && teamMembers.length > 0 ? (
                                    teamMembers.map((member) => {
                                        const role = String(member.role || 'Operator').toUpperCase();
                                        const isAdmin = role.includes('ADMIN');
                                        const isDriver = role.includes('DRIVER') || role.includes('SUPIR');

                                        return (
                                            <TableRow key={member.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                <TableCell className="py-3 px-4 font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 text-xs border border-slate-200 dark:border-slate-700">
                                                            <AvatarFallback className={`font-bold ${
                                                                isAdmin 
                                                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' 
                                                                    : isDriver 
                                                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                                                                    : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                                                            }`}>
                                                                {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                                                            {member.name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-3 px-4">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md ${
                                                            isAdmin 
                                                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' 
                                                                : isDriver 
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                                                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                                                        }`}
                                                    >
                                                        {member.role || 'Operator'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-8 text-slate-400 text-xs">
                                            Belum ada data personil terdaftar.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </GlassCard>

            </div>
        </AuthenticatedLayout>
    );
}