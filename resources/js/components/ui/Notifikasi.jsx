import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

/**
 * 1. TOAST NOTIFICATION (Pojok Kanan Bawah - z-[99999])
 */
export function Toast({ 
    isOpen, 
    type = 'success', // 'success' | 'error' | 'info'
    title, 
    message, 
    onClose, 
    duration = 4000 
}) {
    useEffect(() => {
        if (isOpen && duration > 0) {
            const timer = setTimeout(() => {
                onClose?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    const styles = {
        success: {
            border: 'border-emerald-500/40 dark:border-emerald-500/30',
            bg: 'bg-white/95 dark:bg-slate-900/95',
            iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
            icon: CheckCircle2,
            titleColor: 'text-emerald-600 dark:text-emerald-400',
        },
        error: {
            border: 'border-rose-500/40 dark:border-rose-500/30',
            bg: 'bg-white/95 dark:bg-slate-900/95',
            iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20',
            icon: AlertTriangle,
            titleColor: 'text-rose-600 dark:text-rose-400',
        },
        info: {
            border: 'border-blue-500/40 dark:border-blue-500/30',
            bg: 'bg-white/95 dark:bg-slate-900/95',
            iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20',
            icon: Info,
            titleColor: 'text-blue-600 dark:text-blue-400',
        }
    }[type] || styles.info;

    const Icon = styles.icon;

    return (
        <div className="fixed bottom-6 right-6 z-[99999] max-w-md w-full pointer-events-none animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl shadow-black/40 backdrop-blur-md flex items-start gap-3 ${styles.bg} ${styles.border}`}>
                <div className={`p-2 rounded-xl shrink-0 ${styles.iconBg}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 pr-2 min-w-0">
                    {title && <h4 className={`text-sm font-bold tracking-wide uppercase ${styles.titleColor}`}>{title}</h4>}
                    <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed break-words">{message}</p>
                </div>
                <button 
                    type="button"
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

/**
 * 2. CONFIRM MODAL (Pojok Kanan Bawah - z-[99999])
 */
export function ConfirmModal({ 
    isOpen, 
    title, 
    message, 
    variant = 'danger', 
    confirmText = 'Lanjutkan', 
    cancelText = 'Batal', 
    onConfirm, 
    onCancel 
}) {
    if (!isOpen) return null;

    const isDanger = variant === 'danger';

    return (
        <div className="fixed inset-0 z-[99999] flex items-end justify-end p-6 pointer-events-none">
            {/* Backdrop transparan tipis */}
            <div 
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity pointer-events-auto"
                onClick={onCancel}
            />

            {/* Container Modal di Kanan Bawah */}
            <div className="relative pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-2xl p-6 z-10 animate-in slide-in-from-bottom-5 fade-in duration-300">
                
                {/* Header & Close Button */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${
                            isDanger 
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' 
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                            {isDanger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tindakan ini memerlukan konfirmasi</p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={onCancel}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content Box */}
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 mb-5">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{message}</p>
                </div>

                {/* Actions Button */}
                <div className="flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-4 font-medium cursor-pointer"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={onConfirm}
                        className={`text-xs h-9 px-5 font-bold transition-all shadow-md cursor-pointer ${
                            isDanger 
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/30'
                        }`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}