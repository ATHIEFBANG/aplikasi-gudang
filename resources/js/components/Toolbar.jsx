import React from 'react';
import { Search, ArrowUpDown, Trash2, RotateCcw, Download, X, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Toolbar({
    searchTerm = '',
    onSearchChange,
    onSearchClear,
    searchPlaceholder = "Cari data...",
    
    sortOrder = 'asc',
    onToggleSort,
    
    selectedCount = 0,
    onDeleteSelected,
    
    onReset,
    onExport,
    
    isProcessing = false,
    leftContent, // Untuk menampung Tab Switcher atau Judul di sebelah kiri
    extraActions, // Untuk tombol tambahan di sebelah kanan (misal: Tombol Tambah Data)
}) {
    return (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* AREA KIRI: Tab Switcher / Judul */}
            <div className="flex items-center gap-2">
                {leftContent}
            </div>

            {/* AREA KANAN: Tombol Aksi & Pencarian */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                {/* SEARCH INPUT */}
                {onSearchChange && (
                    <form onSubmit={(e) => e.preventDefault()} className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder} 
                            className="pl-9 pr-8 w-full sm:w-48 h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                        />
                        {searchTerm && onSearchClear && (
                            <button
                                type="button"
                                onClick={onSearchClear}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </form>
                )}

                {/* URUTKAN */}
                {onToggleSort && (
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={onToggleSort} 
                        disabled={isProcessing}
                        className="h-9 gap-1 text-xs dark:border-slate-800"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
                        <span className="uppercase">{sortOrder}</span>
                    </Button>
                )}

                {/* HAPUS TERPILIH */}
                {selectedCount > 0 && onDeleteSelected && (
                    <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={onDeleteSelected} 
                        disabled={isProcessing} 
                        className="h-9 gap-1.5 text-xs animate-in fade-in duration-200"
                    >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        <span>Hapus ({selectedCount})</span>
                    </Button>
                )}

                {/* RESET */}
                {onReset && (
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={onReset} 
                        disabled={isProcessing} 
                        className="h-9 gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                    </Button>
                )}

                {/* EXPORT */}
                {onExport && (
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={onExport} 
                        disabled={isProcessing}
                        className="h-9 gap-1.5 text-xs dark:border-slate-800"
                    >
                        <Download className="w-3.5 h-3.5 text-emerald-600" /> Export
                    </Button>
                )}

                {/* TOMBOL EKSTRA / CUSTOM */}
                {extraActions}
            </div>
        </div>
    );
}