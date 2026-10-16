export default function StatusBadge({ status = 'Normal' }) {
    const statusStyles = {
        Normal: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        Active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        Maintenance: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        Critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        Offline: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    };

    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${statusStyles[status] || statusStyles.Normal}`}>
            {status}
        </span>
    );
}