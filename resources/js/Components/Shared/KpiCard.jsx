import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KpiCard({
    title,
    value,
    icon: Icon,
    trend = null, // Contoh: "+12.5%" atau "-5%"
    trendType = 'up', // 'up' | 'down' | 'neutral'
    subtitle = 'dibanding bulan lalu',
    color = 'red', // 'red' | 'blue' | 'emerald' | 'amber' | 'purple'
}) {
    const getColorStyles = (colorName) => {
        switch (colorName) {
            case 'emerald':
            case 'green':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'blue':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'amber':
            case 'yellow':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'purple':
                return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
            case 'red':
            default:
                return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
        }
    };

    const colorStyle = getColorStyles(color);

    return (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                    {title}
                </span>
                {Icon && (
                    <div className={`p-2.5 rounded-xl border ${colorStyle} shrink-0`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>

            <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {value}
                </h3>

                {trend && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold">
                        {trendType === 'up' && (
                            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                                {trend}
                            </span>
                        )}
                        {trendType === 'down' && (
                            <span className="inline-flex items-center text-rose-600 dark:text-rose-400">
                                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                                {trend}
                            </span>
                        )}
                        {trendType === 'neutral' && (
                            <span className="inline-flex items-center text-slate-500 dark:text-slate-400">
                                <Minus className="w-3.5 h-3.5 mr-0.5" />
                                {trend}
                            </span>
                        )}
                        <span className="text-slate-400 dark:text-slate-500 font-normal">
                            {subtitle}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}