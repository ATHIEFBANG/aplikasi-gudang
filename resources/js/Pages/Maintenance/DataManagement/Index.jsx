import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Database, Cpu, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// --- IMPORT KOMPONEN Halaman ---
import TabMasterData from './MasterData/TabMasterData';
import TabDataTarikan from './Partials/TabDataTarikan';

export default function DataManagementIndex({ rpmMasters, smartkeyMasters, filters }) {
    const { flash, errors } = usePage().props;
    const [activeTab, setActiveTab] = useState('master');
    const [showAlert, setShowAlert] = useState(false);

    // 1. Sync Tab Utama dengan Query Parameter URL (Mencegah reset saat refresh)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mainTabParam = params.get('main_tab');
        if (mainTabParam && ['master', 'engine'].includes(mainTabParam)) {
            setActiveTab(mainTabParam);
        }
    }, []);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        // Update URL tanpa trigger full page reload
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('main_tab', tabId);
        window.history.replaceState({}, '', newUrl);
    };

    // 2. Handle Auto-Dismiss Flash Notification (5 Detik)
    useEffect(() => {
        const hasErrors = errors && Object.keys(errors).length > 0;
        if (flash?.success || flash?.error || flash?.info || hasErrors) {
            setShowAlert(true);
            const timer = setTimeout(() => {
                setShowAlert(false);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [flash, errors]);

    const tabs = [
        { id: 'master', label: 'Master Data', icon: Database },
        { id: 'engine', label: 'Data Tarikan & Engine', icon: Cpu },
    ];

    // 3. Helper Component untuk Notification Alert
    const renderFlashMessage = () => {
        if (!showAlert) return null;

        // --- Sukses ---
        if (flash?.success) {
            return (
                <div className="flex items-center justify-between p-4 text-sm text-emerald-800 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-medium">{flash.success}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAlert(false)}
                        className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        // --- Error / Validasi ---
        const hasErrors = errors && Object.keys(errors).length > 0;
        if (flash?.error || hasErrors) {
            const errorMessage = flash?.error || "Terjadi kesalahan pada inputan Anda. Silakan periksa kembali.";
            return (
                <div className="flex items-center justify-between p-4 text-sm text-rose-800 rounded-xl bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="font-medium">{errorMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAlert(false)}
                        className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        // --- Info ---
        if (flash?.info) {
            return (
                <div className="flex items-center justify-between p-4 text-sm text-blue-800 rounded-xl bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="font-medium">{flash.info}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAlert(false)}
                        className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        return null;
    };

    return (
        <AuthenticatedLayout header="Data Management">
            <Head title="Data Management Engine" />

            <div className="space-y-6">
                {/* Banner / Flash Alert Message */}
                {renderFlashMessage()}

                {/* Switcher Tab Utama */}
                <div className="flex p-1 bg-white dark:bg-slate-900 rounded-xl w-fit border border-slate-200 dark:border-slate-800 shadow-sm">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                    isActive 
                                        ? 'bg-blue-600 text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Render Tab */}
                <div className="transition-all duration-300">
                    {activeTab === 'master' && (
                        <TabMasterData 
                            rpmMasters={rpmMasters} 
                            smartkeyMasters={smartkeyMasters} 
                            filters={filters} 
                        />
                    )}
                    {activeTab === 'engine' && <TabDataTarikan />}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}