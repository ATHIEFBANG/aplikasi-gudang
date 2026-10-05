import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TabTransaksi from './TabTransaksi';
import { Button } from '@/components/ui/button';
import { Boxes } from 'lucide-react';

export default function TransaksiIndex({
    transaksis,
    gudangs = [],
    suppliers = [],
    barangs = [],
    customerOptions = [],
    filters = {}
}) {
    return (
        <AuthenticatedLayout header="Transaksi & Mutasi Stok">
            <Head title="Transaksi Stok - Logistik" />

            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                            Transaksi & Mutasi Logistik
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Pusat pencatatan stok barang masuk, pengeluaran, dan transfer antar-gudang secara terintegrasi.
                        </p>
                    </div>

                    <Link href="/rincian-aset">
                        <Button
                            type="button"
                            className="h-9 text-xs gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm shadow-rose-600/20 cursor-pointer"
                        >
                            <Boxes className="w-4 h-4" />
                            <span>Rincian Aset</span>
                        </Button>
                    </Link>
                </div>

                <TabTransaksi
                    transaksis={transaksis}
                    gudangs={gudangs}
                    suppliers={suppliers}
                    barangs={barangs}
                    customerOptions={customerOptions}
                    filters={filters}
                />
            </div>
        </AuthenticatedLayout>
    );
}