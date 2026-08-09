import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    onSubmit,
    submitLabel = 'Simpan',
    cancelLabel = 'Batal',
    isProcessing = false,
    maxWidth = 'sm:max-w-xl',
    showFooter = true,
    headerExtra,
    onPaste,
}) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose?.()}>
            <DialogContent 
                /* DIUBAH: Menggunakan max-h-[85vh] h-auto agar tidak melar kebawah */
                className={`${maxWidth} max-h-[85vh] h-auto flex flex-col p-6 gap-0 overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl z-50`}
                onPaste={onPaste}
            >
                {/* FIXED HEADER */}
                {(title || description || headerExtra) && (
                    <DialogHeader className="shrink-0 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between pr-6">
                            <span>{title}</span>
                            {headerExtra && <div>{headerExtra}</div>}
                        </DialogTitle>
                        {description ? (
                            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {description}
                            </DialogDescription>
                        ) : (
                            <DialogDescription className="sr-only">
                                Dialog Modal
                            </DialogDescription>
                        )}
                    </DialogHeader>
                )}

                {/* SCROLLABLE BODY / ISI FORM */}
                <div className="flex-1 overflow-y-auto py-3 pr-1">
                    {children}
                </div>

                {/* FIXED FOOTER */}
                {showFooter && (
                    <DialogFooter className="shrink-0 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-white dark:bg-slate-900">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="h-9 text-xs"
                        >
                            {cancelLabel}
                        </Button>

                        {onSubmit && (
                            <Button
                                type="button"
                                onClick={onSubmit}
                                disabled={isProcessing}
                                className="h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
                            >
                                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <span>{submitLabel}</span>
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}