import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DashboardRpm from './DashboardRpm';
import DashboardSmartkey from './DashboardSmartkey';

import {
    Activity,
    KeyRound,
    MapPin,
    BarChart3
} from 'lucide-react';

export default function DashboardIndex({ 
    auth, 
    rpmSummary = {}, 
    smartkeySummary = {}, 
    filterOptions = {}, 
    filters = {} 
}) {
    // Switcher tampilan internal halaman (RPM vs SmartKey)
    const [viewMode, setViewMode] = useState('rpm');

    return (
        <AuthenticatedLayout header="Dashboard Maintenance">
            <Head title="Dashboard Maintenance" />

            {/* HEADER HALAMAN & SWITCHER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Dashboard Maintenance
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Pusat kendali dan pemonitoran performa RPM serta status SmartKey.
                    </p>
                </div>

                {/* Sub-Menu Switcher */}
                <div className="inline-flex p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm self-start md:self-auto">
                    <button
                        onClick={() => setViewMode('rpm')}
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            viewMode === 'rpm'
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                        <span>Monitoring RPM</span>
                    </button>

                    <button
                        onClick={() => setViewMode('smartkey')}
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            viewMode === 'smartkey'
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                        <KeyRound className="w-4 h-4" />
                        <span>Status SmartKey</span>
                    </button>
                </div>
            </div>

            {/* VIEW 1: MONITORING RPM */}
            {viewMode === 'rpm' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-red-600" /> Performa Log RPM
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Ringkasan aktivitas RPM terdeteksi
                                </p>
                            </div>
                        </div>

                        <div className="w-full">
                            {/* Mengirimkan data ringkasan, opsi dropdown, dan state filter ke DashboardRpm */}
                            <DashboardRpm 
                                summary={rpmSummary} 
                                options={filterOptions.rpm || {}} 
                                filters={filters.rpm || {}} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 2: STATUS SMARTKEY */}
            {viewMode === 'smartkey' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-red-600" /> Monitoring & Sebaran SmartKey
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Ringkasan status unit dan pemetaan lokasi SmartKey
                                </p>
                            </div>
                        </div>

                        <div className="w-full relative z-0">
                            <DashboardSmartkey 
                                summary={smartkeySummary} 
                                options={filterOptions.smartkey || {}} 
                                filters={filters.smartkey || {}} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}