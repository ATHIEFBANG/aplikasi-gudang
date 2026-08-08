import React from 'react';
import { X } from 'lucide-react';

export default function DetailModal({
    isOpen,
    onClose,
    title = 'Detail Data',
    data = null,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
                {/* Header Modal */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
                    {data ? (
                        Object.entries(data).map(([key, val], idx) => (
                            <div key={idx} className="flex justify-between py-2 border-b border-slate-50 dark:border-white/5 text-sm">
                                <span className="text-slate-500 dark:text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{String(val ?? '-')}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-4">Tidak ada data untuk ditampilkan.</p>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="p-4 border-t border-slate-100 dark:border-white/10 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}