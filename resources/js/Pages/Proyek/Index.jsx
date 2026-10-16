import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import MasterDataProyek from './MasterDataProyek';

export default function ProyekIndex({ proyekData = [] }) {
    return (
        <AuthenticatedLayout header="Master Data Proyek">
            <Head title="Master Data Proyek - Logistik" />

            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            <Building2 className="h-6 w-6 text-rose-600" />
                            Master Data Proyek
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                            Kelola data proyek operasional yang digunakan pada transaksi dan rincian aset.
                        </p>
                    </div>

                    <Link href="/transaksi">
                        <Button type="button" variant="outline" className="h-9 gap-2 text-xs font-semibold">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Kembali ke Transaksi</span>
                        </Button>
                    </Link>
                </div>

                <MasterDataProyek proyekData={proyekData} />
            </div>
        </AuthenticatedLayout>
    );
}
