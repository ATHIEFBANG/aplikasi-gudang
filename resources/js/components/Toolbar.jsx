import React from 'react';
import { Button } from '@/components/ui/button';
import {
    ArrowUpDown,
    Download,
    Trash2,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Maximize2
} from 'lucide-react';

export default function Toolbar({
    sortOrder = 'desc',
    onToggleSort,
    selectedCount = 0,
    onDeleteSelected,
    onReset,
    onExport,
    isProcessing = false,
    leftContent = null,
    zoomLevel = 100,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onFitZoom,
}) {
    return (
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* SISI KIRI: TAB / BADGE STATUS */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {leftContent}
            </div>

            {/* SISI KANAN: KONTROL ZOOM + AKSI TABEL */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                {/* 1. KONTROL ZOOM TABEL */}
                {onZoomIn && onZoomOut && (
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={zoomLevel <= 50 || isProcessing}
                            onClick={onZoomOut}
                            title="Zoom Out (Kecilkan Tampilan)"
                            className="h-7 w-7 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md cursor-pointer"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </Button>

                        <button
                            type="button"
                            onClick={onResetZoom}
                            title="Reset Zoom ke 100%"
                            className="px-2 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                        >
                            {zoomLevel}%
                        </button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={zoomLevel >= 120 || isProcessing}
                            onClick={onZoomIn}
                            title="Zoom In (Perbesar Tampilan)"
                            className="h-7 w-7 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md cursor-pointer"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </Button>

                        {onFitZoom && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={onFitZoom}
                                title="Fit to Screen (Muat Semua Kolom)"
                                className="h-7 w-7 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md border-l border-slate-200 dark:border-slate-700 ml-0.5 pl-1 cursor-pointer"
                            >
                                <Maximize2 className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                )}

                {/* 2. HAPUS DATA TERPILIH (BULK DELETE) */}
                {selectedCount > 0 && onDeleteSelected && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={onDeleteSelected}
                        disabled={isProcessing}
                        className="h-8 text-xs gap-1.5 shadow-xs cursor-pointer animate-in fade-in zoom-in-95"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus ({selectedCount})</span>
                    </Button>
                )}

                {/* 3. SORTING ASC / DESC */}
                {onToggleSort && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onToggleSort}
                        disabled={isProcessing}
                        className="h-8 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span className="uppercase font-mono">{sortOrder}</span>
                    </Button>
                )}

                {/* 4. RESET DATA */}
                {onReset && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onReset}
                        disabled={isProcessing}
                        className="h-8 text-xs gap-1.5 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                    </Button>
                )}

                {/* 5. EXPORT CSV */}
                {onExport && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onExport}
                        disabled={isProcessing}
                        className="h-8 text-xs gap-1.5 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export</span>
                    </Button>
                )}
            </div>
        </div>
    );
}