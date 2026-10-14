import GlassCard from '@/components/GlassCard';

export default function StatCard({ title, value, subtext, icon: Icon, variant = 'danger' }) {
    const accentColors = {
        danger: 'bg-red-500/10 dark:bg-red-600/20 text-red-600 dark:text-red-400 border-red-500/30',
        success: 'bg-emerald-500/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        warning: 'bg-amber-500/10 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
        info: 'bg-cyan-500/10 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    };

    return (
        <GlassCard>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</h3>
                </div>
                {Icon && (
                    <div className={`p-3 rounded-xl border ${accentColors[variant] || accentColors.danger}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>
            {subtext && (
                <div className="mt-4 flex items-center text-xs text-slate-600 dark:text-slate-400 gap-1 font-medium">
                    {subtext}
                </div>
            )}
        </GlassCard>
    );
}