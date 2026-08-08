import React from 'react';

export default function StatusBadge({ status = 'default', label, dot = true, className = '' }) {
    const getStatusStyles = (status) => {
        const normalized = String(status).toLowerCase().trim();

        if (['success', 'active', 'matched', 'completed', 'approved', 'ok', 'normal'].includes(normalized)) {
            return {
                bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
                text: 'text-emerald-700 dark:text-emerald-400',
                border: 'border-emerald-500/20 dark:border-emerald-500/30',
                dot: 'bg-emerald-500',
            };
        }
        if (['pending', 'warning', 'in progress', 'processing', 'review'].includes(normalized)) {
            return {
                bg: 'bg-amber-500/10 dark:bg-amber-500/20',
                text: 'text-amber-700 dark:text-amber-400',
                border: 'border-amber-500/20 dark:border-amber-500/30',
                dot: 'bg-amber-500',
            };
        }
        if (['danger', 'error', 'unmatched', 'failed', 'rejected', 'critical', 'inactive'].includes(normalized)) {
            return {
                bg: 'bg-rose-500/10 dark:bg-rose-500/20',
                text: 'text-rose-700 dark:text-rose-400',
                border: 'border-rose-500/20 dark:border-rose-500/30',
                dot: 'bg-rose-500',
            };
        }
        if (['info', 'blue', 'draft', 'syncing'].includes(normalized)) {
            return {
                bg: 'bg-blue-500/10 dark:bg-blue-500/20',
                text: 'text-blue-700 dark:text-blue-400',
                border: 'border-blue-500/20 dark:border-blue-500/30',
                dot: 'bg-blue-500',
            };
        }
        return {
            bg: 'bg-slate-500/10 dark:bg-slate-500/20',
            text: 'text-slate-700 dark:text-slate-300',
            border: 'border-slate-500/20 dark:border-slate-500/30',
            dot: 'bg-slate-500',
        };
    };

    const styles = getStatusStyles(status);
    const displayLabel = label || status;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${styles.bg} ${styles.text} ${styles.border} ${className}`}
        >
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} animate-pulse`} />}
            <span className="capitalize">{displayLabel}</span>
        </span>
    );
}