import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TabTransaksi from './TabTransaksi';
import { Button } from '@/components/ui/button';
import { Boxes, Building2 } from 'lucide-react';

export default function TransaksiIndex({
    transaksis,
    gudangs = [],
    suppliers = [],
    barangs = [],
    customerOptions = [],
    projectOptions = [],
    returnProjectOptions = [],
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

                    <div className="flex flex-wrap gap-2">
                        <Link href="/proyek">
                            <Button type="button" variant="outline" className="h-9 gap-2 text-xs font-semibold">
                                <Building2 className="h-4 w-4" />
                                <span>Master Data Proyek</span>
                            </Button>
                        </Link>
                        <Link href="/rincian-aset">
                            <Button type="button" className="h-9 cursor-pointer gap-2 bg-rose-600 text-xs font-semibold text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700">
                                <Boxes className="h-4 w-4" />
                                <span>Rincian Aset</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                <TabTransaksi
                    transaksis={transaksis}
                    gudangs={gudangs}
                    suppliers={suppliers}
                    barangs={barangs}
                    customerOptions={customerOptions}
                    projectOptions={projectOptions}
                    returnProjectOptions={returnProjectOptions}
                    filters={filters}
                />
            </div>
        </AuthenticatedLayout>
    );
}