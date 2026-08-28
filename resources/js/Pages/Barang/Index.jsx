import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TabMasterData from './MasterData/TabMasterData';
import { Package } from 'lucide-react';

export default function BarangIndex({
    barangs,
    existingOptions = {},
    filters = {}
}) {
    return (
        <AuthenticatedLayout header="Master Data Barang">
            <Head title="Master Barang PPL" />
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20">
                                <Package className="w-5 h-5" />
                            </div>
                            <span>Master Data Barang PPL</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Kelola data master barang, kode PPL, klasifikasi merk/tipe, dan konfigurasi wajib SN/PN.
                        </p>
                    </div>
                </div>

                <TabMasterData
                    barangs={barangs}
                    existingOptions={existingOptions}
                    filters={filters}
                />
            </div>
        </AuthenticatedLayout>
    );
}