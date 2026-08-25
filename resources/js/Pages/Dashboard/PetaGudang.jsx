import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Map from '@/components/Map';
import { MapPin } from 'lucide-react';

const GUDANG_MAP_CONFIG = {
    ACTIVE: {
        label: 'Gudang Aktif',
        color: '#0284c7',
        bg: 'rgba(2, 132, 199, 0.35)',
    }
};

export default function PetaGudang({ mapData = [] }) {
    return (
        <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <CardHeader className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-sky-500" />
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Peta Sebaran Gudang
                    </CardTitle>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {mapData.length} Lokasi Teridentifikasi
                </span>
            </CardHeader>
            <CardContent className="p-0">
                {/* Tinggi peta diperlebar ke bawah (h-[480px]) */}
                <div className="w-full h-[480px] relative">
                    <Map 
                        data={mapData}
                        statusKey="status"
                        statusConfig={GUDANG_MAP_CONFIG}
                        height="h-[480px]"
                        getPopupData={(item, lat, lng) => ({
                            title: item.nama_gudang || item.kode_gudang,
                            details: [
                                { label: 'Kode Hub', value: item.kode_gudang || '-' },
                                { label: 'Lokasi Area', value: item.lokasi || '-' },
                                { label: 'Total Qty Barang', value: `${(item.total_qty || 0).toLocaleString('id-ID')} Unit` },
                                { label: 'Koordinat', value: `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`, isMonospace: true }
                            ],
                            statusText: 'GUDANG AKTIF'
                        })}
                    />
                </div>
            </CardContent>
        </Card>
    );
}