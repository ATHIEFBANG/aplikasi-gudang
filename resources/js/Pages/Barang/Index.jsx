import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TabMasterData from './MasterData/TabMasterData';

export default function BarangIndex({ barangs, filters = {} }) {
    return (
        <AuthenticatedLayout header="Master Data Barang">
            <Head title="Master Barang - Gudang PPL" />
            <div className="space-y-6 max-w-7xl mx-auto">
                <TabMasterData 
                    barangs={barangs}
                    filters={filters}
                />
            </div>
        </AuthenticatedLayout>
    );
}