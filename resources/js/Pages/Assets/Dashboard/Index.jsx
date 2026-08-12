import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DashboardCombat from './DashboardCombat';
import { Boxes, Radio, Database, BarChart3 } from 'lucide-react';

export default function DashboardAssets({ 
    auth, 
    combatSummary = {}, 
    templateSummary = {}, 
    filterOptions = {}, 
    filters = {} 
}) {
    // Switcher internal halaman (COMBAT vs Master Data 2)
    const [viewMode, setViewMode] = useState('combat');

    return (
        <AuthenticatedLayout header="Dashboard Assets">
            <Head title="Dashboard Assets" />

            {/* HEADER HALAMAN & SWITCHER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Boxes className="w-7 h-7 text-red-600" />
                        Assets Management Dashboard
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Pusat pemantauan aset COMBAT dan inventaris aset Mitratel secara real-time.
                    </p>
                </div>

                {/* Sub-Menu Switcher */}
                <div className="inline-flex p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm self-start md:self-auto">
                    <button
                        onClick={() => setViewMode('combat')}
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            viewMode === 'combat'
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                        <Radio className="w-4 h-4" />
                        <span>Monitoring COMBAT</span>
                    </button>

                    <button
                        onClick={() => setViewMode('template')}
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            viewMode === 'template'
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                        <Database className="w-4 h-4" />
                        <span>Master Data 2</span>
                    </button>
                </div>
            </div>

            {/* VIEW 1: MONITORING COMBAT */}
            {viewMode === 'combat' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-red-600" /> Operational & Status COMBAT
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Ringkasan unit COMBAT Onsite, Standby, dan pemetaan lokasi
                                </p>
                            </div>
                        </div>

                        <div className="w-full relative z-0">
                            <DashboardCombat 
                                summary={combatSummary} 
                                options={filterOptions.combat || filterOptions || {}} 
                                filters={filters.combat || filters || {}} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 2: MASTER DATA 2 */}
            {viewMode === 'template' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center py-16">
                        <Database className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">Master Data 2 / Template Aset</h3>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                            Modul manajemen inventaris master data lainnya. Anda dapat menampilkan tabel khusus atau filter aset tambahan di sini.
                        </p>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}