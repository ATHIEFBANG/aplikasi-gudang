import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TabTransaksi from './TabTransaksi';

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