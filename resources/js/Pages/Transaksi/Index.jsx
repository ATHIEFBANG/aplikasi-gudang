import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TabTransaksi from './TabTransaksi';
import { ArrowLeftRight } from 'lucide-react';

export default function TransaksiIndex({
    transaksis,
    gudangs = [],
    suppliers = [],
    barangs = [],
    filters = {}
}) {
    return (
        <AuthenticatedLayout header="Transaksi & Mutasi Stok">
            <Head title="Transaksi Stok - Logistik" />
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* HEADER CAPTION & TITLE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                            Transaksi & Mutasi Logistik
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Pusat pencatatan mutasi stok barang masuk, pengeluaran logistik, dan transfer distribusi antar-gudang secara terintegrasi.
                        </p>
                    </div>
                </div>

                {/* TAB TRANSAKSI UTAMA */}
                <TabTransaksi
                    transaksis={transaksis}
                    gudangs={gudangs}
                    suppliers={suppliers}
                    barangs={barangs}
                    filters={filters}
                />
            </div>
        </AuthenticatedLayout>
    );
}