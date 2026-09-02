import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TabMasterData from './MasterData/TabMasterData'; // atau sesuaikan dengan struktur import kamu

export default function BarangIndex({ barangs, existingOptions = {}, filters = {} }) {
    return (
        <AuthenticatedLayout header="Master Barang">
            <Head title="Master Data Barang - PPL" />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* HEADER BERSIH TANPA ICON */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Master Data Barang PPL
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Kelola data master barang, kode PPL, klasifikasi merk/kategori, dan konfigurasi wajib SN/PN.
                        </p>
                    </div>
                </div>

                {/* KOMPONEN TABEL / MASTER DATA */}
                <TabMasterData 
                    barangs={barangs} 
                    existingOptions={existingOptions} 
                    filters={filters} 
                />
            </div>
        </AuthenticatedLayout>
    );
}