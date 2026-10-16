import React, { useEffect, useState } from 'react';
import {
    Package,
    ArrowLeftRight,
    Coins,
    ChevronRight,
    Download,
    Truck,
} from 'lucide-react';

import iconMasterBarang from '../../../images/kardus.png';
import iconBarangMasuk from '../../../images/barang masuk.png';
import iconTransfer from '../../../images/transfer gudang.png';
import iconBarangKeluar from '../../../images/barang keluar.png';
import iconNilaiAset from '../../../images/nilai aset.png';

const CardIcon = ({
    customIcon,
    DefaultIcon,
    defaultColorClass = 'text-white',
    className = '',
}) => {
    if (customIcon) {
        return (
            <img
                src={customIcon}
                alt="Card Icon"
                className={`w-14 h-14 object-contain ${className}`}
            />
        );
    }

    return (
        <DefaultIcon
            className={`w-5 h-5 ${defaultColorClass} ${className}`}
        />
    );
};

const AnimatedNumber = ({ value, prefix = '', duration = 900 }) => {
    const target = Number(value) || 0;
    const [displayValue, setDisplayValue] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;

            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(target * easedProgress);

            setDisplayValue(currentValue);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setDisplayValue(target);
            }
        };

        setDisplayValue(0);
        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration]);

    const formattedValue = displayValue.toLocaleString('id-ID');
    const fullValue = `${prefix}${target.toLocaleString('id-ID')}`;

    return (
        <div
            className="relative inline-block max-w-full z-30"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="text-2xl font-bold tracking-tight truncate cursor-help"
                title={fullValue}
            >
                {prefix}{formattedValue}
            </div>

            {isHovered && (
                <div className="absolute left-0 bottom-full mb-2 z-[100] whitespace-nowrap rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-2xl">
                    {fullValue}
                </div>
            )}
        </div>
    );
};

export default function StatistikGudang({ kpi = {} }) {
    const totalBarang = kpi.totalBarang ?? 0;
    const totalBarangMasuk = kpi.totalBarangMasuk ?? 0;
    const totalTransfer = kpi.totalTransfer ?? 0;
    const totalBarangKeluar = kpi.totalBarangKeluar ?? 0;
    const totalNilaiAset = kpi.totalNilaiPembelian ?? kpi.totalNilaiAset ?? 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* CARD 01 - TOTAL MASTER BARANG */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[160px]">
                <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-blue-400/20 rounded-full blur-xs pointer-events-none" />

                <div className="absolute top-4 right-3 z-20">
                    <CardIcon
                        customIcon={iconMasterBarang}
                        DefaultIcon={Package}
                    />
                </div>

                <div className="relative z-10 space-y-1.5 pr-14">
                    <h4 className="text-xs font-bold tracking-wider text-blue-50 dark:text-blue-100 uppercase">
                        TOTAL MASTER BARANG
                    </h4>

                    <AnimatedNumber value={totalBarang} />
                </div>

                <div className="relative z-10 flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-blue-50 dark:text-blue-100 font-medium">
                        <Package className="w-4 h-4 text-blue-100" />
                        <span>Item SKU terdaftar</span>
                    </div>

                    <button
                        type="button"
                        className="p-1.5 bg-blue-900/80 hover:bg-blue-900 rounded-full text-white transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* CARD 02 - TOTAL BARANG MASUK */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-md flex flex-col justify-between min-h-[160px]">
                <div className="absolute -bottom-6 -right-6 w-32 h-20 bg-emerald-500 rounded-tl-full opacity-90 pointer-events-none" />
                <div className="absolute -bottom-10 -right-2 w-36 h-20 bg-emerald-600 rounded-tl-full opacity-70 pointer-events-none" />

                <div className="absolute top-3 right-2 z-20">
                    <CardIcon
                        customIcon={iconBarangMasuk}
                        DefaultIcon={Download}
                        defaultColorClass="text-emerald-600 dark:text-emerald-400"
                    />
                </div>

                <div className="relative z-10 space-y-1.5 pr-14">
                    <h4 className="text-xs font-bold tracking-wider text-slate-800 dark:text-slate-100 uppercase">
                        TOTAL BARANG MASUK
                    </h4>

                    <AnimatedNumber value={totalBarangMasuk} />
                </div>

                <div className="relative z-10 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium pt-2">
                    <Package className="w-4 h-4" />
                    <span className="text-slate-700 dark:text-slate-300">
                        Unit masuk operasional
                    </span>
                </div>
            </div>

            {/* CARD 03 - TOTAL TRANSFER GUDANG */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[160px]">
                <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-blue-400/20 rounded-full blur-xs pointer-events-none" />

                <div className="absolute top-3 right-2 z-20">
                    <CardIcon
                        customIcon={iconTransfer}
                        DefaultIcon={ArrowLeftRight}
                    />
                </div>

                <div className="relative z-10 space-y-1.5 pr-14">
                    <h4 className="text-xs font-bold tracking-wider text-blue-50 dark:text-blue-100 uppercase">
                        TOTAL TRANSFER GUDANG
                    </h4>

                    <AnimatedNumber value={totalTransfer} />
                </div>

                <div className="relative z-10 flex items-center gap-2 text-xs text-blue-50 dark:text-blue-100 font-medium pt-2">
                    <ArrowLeftRight className="w-4 h-4 text-blue-100" />
                    <span>Unit terdistribusi antar-hub</span>
                </div>
            </div>

            {/* CARD 04 - TOTAL BARANG KELUAR */}
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[160px]">
                <div className="absolute -bottom-8 -right-6 w-32 h-24 bg-rose-900/50 rounded-tl-full pointer-events-none" />

                <div className="absolute top-3 right-2 z-20">
                    <CardIcon
                        customIcon={iconBarangKeluar}
                        DefaultIcon={Truck}
                    />
                </div>

                <div className="relative z-10 space-y-1.5 pr-14">
                    <h4 className="text-xs font-bold tracking-wider text-rose-50 dark:text-rose-100 uppercase">
                        TOTAL BARANG KELUAR
                    </h4>

                    <AnimatedNumber value={totalBarangKeluar} />
                </div>

                <div className="relative z-10 flex items-center gap-2 text-xs text-rose-50 dark:text-rose-100 font-medium pt-2">
                    <Truck className="w-4 h-4 text-rose-100" />
                    <span>Unit keluar operasional</span>
                </div>
            </div>

            {/* CARD 05 - TOTAL NILAI ASET */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-md flex flex-col justify-between min-h-[160px]">
                <div className="absolute -bottom-10 -right-6 w-36 h-28 bg-gradient-to-br from-amber-700 to-amber-500 rounded-tl-full pointer-events-none flex items-center justify-center p-4">
                    <svg
                        className="w-7 h-7 text-white translate-x-1 translate-y-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                    </svg>
                </div>

                <div className="absolute top-3 right-2 z-20">
                    <CardIcon
                        customIcon={iconNilaiAset}
                        DefaultIcon={Coins}
                        defaultColorClass="text-amber-600 dark:text-amber-400"
                    />
                </div>

                <div className="relative z-10 space-y-1.5 pr-14">
                    <h4 className="text-xs font-bold tracking-wider text-slate-800 dark:text-slate-100 uppercase">
                        TOTAL NILAI ASET GUDANG
                    </h4>

                    <AnimatedNumber
                        value={totalNilaiAset}
                        prefix="Rp "
                        duration={1200}
                    />
                </div>

                <div className="relative z-10 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-medium pt-2">
                    <Coins className="w-4 h-4" />
                    <span className="text-slate-700 dark:text-slate-200">
                        Nilai beli aset fisik
                    </span>
                </div>
            </div>

        </div>
    );
}