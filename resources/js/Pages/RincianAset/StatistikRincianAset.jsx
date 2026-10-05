import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Box,
    Boxes,
    BriefcaseBusiness,
    Package,
} from 'lucide-react';

const formatDecimal = value => Number(value).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
});

const formatCompactNumber = value => {
    const number = Number(value || 0);

    if (!number) return '0';
    if (number >= 1_000_000_000_000) return `${formatDecimal(number / 1_000_000_000_000)} T`;
    if (number >= 1_000_000_000) return `${formatDecimal(number / 1_000_000_000)} M`;
    if (number >= 1_000_000) return `${formatDecimal(number / 1_000_000)} JT`;
    if (number >= 1_000) return `${formatDecimal(number / 1_000)} K`;

    return number.toLocaleString('id-ID');
};

const formatCurrencyCompact = value => {
    const number = Number(value || 0);

    if (!number) return '-';
    if (number >= 1_000_000_000_000) return `Rp ${formatDecimal(number / 1_000_000_000_000)} T`;
    if (number >= 1_000_000_000) return `Rp ${formatDecimal(number / 1_000_000_000)} M`;
    if (number >= 1_000_000) return `Rp ${formatDecimal(number / 1_000_000)} JT`;
    if (number >= 1_000) return `Rp ${formatDecimal(number / 1_000)} K`;

    return `Rp ${number.toLocaleString('id-ID')}`;
};

const CARD_THEME = {
    rose: {
        accent: 'bg-rose-500',
        icon: 'text-rose-500 dark:text-rose-400',
        iconBg: 'bg-rose-50 dark:bg-rose-950/30',
    },
    violet: {
        accent: 'bg-violet-500',
        icon: 'text-violet-500 dark:text-violet-400',
        iconBg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    blue: {
        accent: 'bg-blue-500',
        icon: 'text-blue-500 dark:text-blue-400',
        iconBg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    orange: {
        accent: 'bg-orange-500',
        icon: 'text-orange-500 dark:text-orange-400',
        iconBg: 'bg-orange-50 dark:bg-orange-950/30',
    },
};

export default function StatistikRincianAset({
    summary = {},
    activeTab = 'TERPASANG',
}) {
    const totalUnit = Number(summary?.total_unit || 0);
    const nilaiAset = Number(summary?.nilai_aset || 0);
    const totalProject = Number(summary?.total_project || 0);
    const jenisBarang = Number(summary?.jenis_barang || 0);

    const isInstalled = activeTab === 'TERPASANG';

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr] gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StatCard
                    title={isInstalled ? 'Total Unit Terpasang' : 'Total Unit Aset'}
                    value={formatCompactNumber(totalUnit)}
                    suffix="Unit"
                    icon={Boxes}
                    theme="rose"
                />

                <StatCard
                    title="Nilai Aset"
                    value={formatCurrencyCompact(nilaiAset)}
                    icon={Package}
                    theme="violet"
                />

                <StatCard
                    title="Total Project"
                    value={formatCompactNumber(totalProject)}
                    suffix="Project"
                    icon={BriefcaseBusiness}
                    theme="blue"
                />

                <StatCard
                    title="Jenis Barang"
                    value={formatCompactNumber(jenisBarang)}
                    suffix="Jenis Barang"
                    icon={Box}
                    theme="orange"
                />
            </div>

            <WarehouseBanner />
        </div>
    );
}

function StatCard({
    title,
    value,
    suffix,
    icon: Icon,
    theme = 'blue',
}) {
    const colors = CARD_THEME[theme] || CARD_THEME.blue;

    return (
        <Card className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${colors.accent}`} />

            <div className={`absolute right-3 top-3 z-20 w-9 h-9 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} strokeWidth={1.8} />
            </div>

            <CardContent className="min-h-[108px] p-4">
                <p className="pr-12 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">
                    {title}
                </p>

                <div className="mt-3 text-[27px] leading-none font-black tracking-tight text-slate-900 dark:text-white truncate">
                    {value}
                </div>

                {suffix && (
                    <p className="mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {suffix}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function WarehouseBanner() {
    return (
        <div className="relative min-h-[225px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm">
            <div className="absolute inset-0">
                <svg
                    viewBox="0 0 900 360"
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="warehouseSky" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8bc8f2" />
                            <stop offset="55%" stopColor="#b9dcf4" />
                            <stop offset="100%" stopColor="#d9ebf8" />
                        </linearGradient>

                        <linearGradient id="warehouseBuilding" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f8fafc" />
                            <stop offset="100%" stopColor="#cbd5e1" />
                        </linearGradient>

                        <linearGradient id="warehouseGround" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#dbeafe" />
                            <stop offset="100%" stopColor="#bfdbfe" />
                        </linearGradient>
                    </defs>

                    <rect width="900" height="360" fill="url(#warehouseSky)" />

                    <circle cx="785" cy="55" r="31" fill="#fff" opacity=".82" />
                    <circle cx="820" cy="70" r="24" fill="#fff" opacity=".72" />
                    <circle cx="748" cy="72" r="22" fill="#fff" opacity=".72" />

                    <g opacity=".5">
                        <circle cx="70" cy="172" r="35" fill="#3f8b91" />
                        <circle cx="105" cy="181" r="25" fill="#3f8b91" />
                        <circle cx="850" cy="172" r="33" fill="#3f8b91" />
                        <circle cx="878" cy="184" r="22" fill="#3f8b91" />
                    </g>

                    <polygon points="245,118 525,42 780,110 780,265 245,265" fill="url(#warehouseBuilding)" />
                    <polygon points="245,118 525,42 780,110 748,132 525,78 277,144" fill="#145ea8" />
                    <polygon points="278,144 748,132 748,265 278,265" fill="#f8fafc" />

                    <rect x="330" y="175" width="130" height="90" fill="#e2e8f0" />
                    <rect x="485" y="158" width="128" height="107" fill="#eef2f7" />
                    <rect x="350" y="198" width="90" height="67" fill="#94a3b8" opacity=".24" />
                    <rect x="503" y="178" width="91" height="87" fill="#94a3b8" opacity=".18" />
                    <rect x="390" y="190" width="68" height="75" fill="#fca5a5" opacity=".32" />
                    <rect x="518" y="194" width="43" height="71" fill="#fecaca" opacity=".28" />

                    <rect y="265" width="900" height="95" fill="url(#warehouseGround)" />

                    <g opacity=".82">
                        <rect x="110" y="244" width="47" height="37" fill="#d97706" />
                        <rect x="157" y="253" width="49" height="28" fill="#f59e0b" />
                        <rect x="688" y="242" width="55" height="39" fill="#d97706" />
                        <rect x="743" y="251" width="39" height="30" fill="#f59e0b" />
                        <rect x="58" y="265" width="52" height="22" fill="#b45309" />
                    </g>

                    <g fill="#155e75" opacity=".65">
                        <rect x="120" y="299" width="78" height="17" rx="3" />
                        <rect x="143" y="283" width="8" height="16" />
                        <rect x="170" y="283" width="8" height="16" />
                        <rect x="195" y="290" width="5" height="9" />
                    </g>
                </svg>
            </div>

            <div className="absolute left-0 bottom-0 w-[48%] h-[58%] bg-gradient-to-tr from-slate-900/25 via-slate-900/5 to-transparent blur-lg" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent dark:from-slate-950/10 dark:via-transparent" />
        </div>
    );
}