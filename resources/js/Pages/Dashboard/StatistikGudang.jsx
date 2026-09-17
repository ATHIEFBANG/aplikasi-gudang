import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ArrowDownCircle, ArrowLeftRight, ArrowUpRight, Coins } from 'lucide-react';

export default function StatistikGudang({ kpi = {} }) {
    const totalBarang = kpi.totalBarang ?? 0;
    const totalBarangMasuk = kpi.totalBarangMasuk ?? 0;
    const totalTransfer = kpi.totalTransfer ?? 0;
    const totalBarangKeluar = kpi.totalBarangKeluar ?? 0;
    const totalNilaiAset = kpi.totalNilaiPembelian ?? kpi.totalNilaiAset ?? 0;

    const cards = [
        {
            title: 'TOTAL MASTER BARANG',
            value: totalBarang.toLocaleString('id-ID'),
            desc: 'Item SKU terdaftar',
            icon: Package,
            // Warna latar belakang pekat untuk tema terang, dan sedikit lebih gelap untuk tema gelap.
            cardBg: 'bg-blue-600 border-blue-600 dark:bg-blue-700 dark:border-blue-700/50',
            // Teks nilai putih untuk kontras terbaik.
            valColor: 'text-white',
        },
        {
            title: 'TOTAL BARANG MASUK',
            value: totalBarangMasuk.toLocaleString('id-ID'),
            desc: 'Unit masuk operasional',
            icon: ArrowDownCircle,
            cardBg: 'bg-emerald-600 border-emerald-600 dark:bg-emerald-700 dark:border-emerald-700/50',
            valColor: 'text-white',
        },
        {
            title: 'TOTAL TRANSFER GUDANG',
            value: totalTransfer.toLocaleString('id-ID'),
            desc: 'Unit terdistribusi antar-hub',
            icon: ArrowLeftRight,
            cardBg: 'bg-sky-600 border-sky-600 dark:bg-sky-700 dark:border-sky-700/50',
            valColor: 'text-white',
        },
        {
            title: 'TOTAL BARANG KELUAR',
            value: totalBarangKeluar.toLocaleString('id-ID'),
            desc: 'Unit keluar operasional',
            icon: ArrowUpRight,
            cardBg: 'bg-rose-600 border-rose-600 dark:bg-rose-700 dark:border-rose-700/50',
            valColor: 'text-white',
        },
        {
            title: 'TOTAL NILAI ASET GUDANG',
            value: `Rp ${Number(totalNilaiAset).toLocaleString('id-ID')}`,
            desc: 'Akumulasi nilai beli aset fisik',
            icon: Coins,
            cardBg: 'bg-amber-600 border-amber-600 dark:bg-amber-700 dark:border-amber-700/50',
            valColor: 'text-white',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <Card 
                        key={idx} 
                        className={`${card.cardBg} rounded-xl shadow-xs flex flex-col justify-between transition-all ${
                            idx === cards.length - 1 ? 'col-span-2 md:col-span-1' : ''
                        }`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3.5 px-4">
                            {/* Judul abu-abu terang untuk kontras di atas latar belakang pekat */}
                            <CardTitle className="text-[10px] font-bold text-slate-100 uppercase tracking-wider truncate">
                                {card.title}
                            </CardTitle>
                            {/* Ikon Lucide berwarna putih untuk kontras, tanpa latar belakang ikon tipis */}
                            <div className="p-0"> 
                                <Icon className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3.5">
                            <div 
                                className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${card.valColor} truncate`}
                                title={card.value}
                            >
                                {card.value}
                            </div>
                            {/* Deskripsi abu-abu terang untuk kontras di atas latar belakang pekat */}
                            <p className="text-[10px] text-slate-100 mt-1 truncate opacity-90">
                                {card.desc}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}