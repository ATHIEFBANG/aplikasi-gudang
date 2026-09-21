import React from 'react';
import Modal from '@/components/Modal';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, PlusCircle, ClipboardPaste } from 'lucide-react';
import ModalBarangMasukRow from './ModalBarangMasukRow';
import { useModalBarangMasukControl, MAX_ROWS_LIMIT } from './ModalBarangMasukControl';

export default function ModalBarangMasuk({
    isOpen,
    onClose,
    isEditMode = false,
    selectedItem = null,
    gudangs = [],
    suppliers = [],
    barangs = []
}) {
    const {
        isProcessing,
        rows,
        gudangOptions,
        supplierOptions,
        getBarangPplOptionsForRow,
        getBarangNamaOptionsForRow,
        handleAddMoreRows,
        handleRemoveRow,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleManualSerialChange,
        handleBulkPasteExcel,
        handleSubmitForm,
    } = useModalBarangMasukControl({
        isOpen,
        isEditMode,
        selectedItem,
        gudangs,
        suppliers,
        barangs,
        onClose
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Data Penerimaan Barang' : 'Tambah Data Barang Masuk (Inbound)'}
            onSubmit={handleSubmitForm}
            submitLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Semua Data'}
            isProcessing={isProcessing}
            headerExtra={
                !isEditMode && (
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                try {
                                    const text = await navigator.clipboard.readText();
                                    if (!text || !text.trim()) {
                                        alert('Clipboard kosong. Silakan salin (Ctrl+C) data tabel dari Excel terlebih dahulu.');
                                        return;
                                    }
                                    handleBulkPasteExcel(text);
                                } catch (err) {
                                    alert('Gagal mengakses clipboard. Pastikan izin clipboard diizinkan pada browser Anda.');
                                }
                            }}
                            className="h-7 text-xs gap-1.5 cursor-pointer bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 font-semibold"
                        >
                            <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Paste dari Excel</span>
                        </Button>
                        <Badge 
                            variant="secondary" 
                            className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold px-2.5 py-1"
                        >
                            {rows.length} / {MAX_ROWS_LIMIT} Baris
                        </Badge>
                    </div>
                )
            }
        >
            {!isEditMode && (
                <Alert className="shrink-0 mb-3 bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-[11px] leading-relaxed">
                        <strong>Pencatatan Inbound:</strong> Catat stok masuk dari <strong>Pembelian</strong>, <strong>Peminjaman</strong>, atau <strong>Pengembalian</strong> barang. Anda dapat mengetik manual atau menggunakan tombol <strong>Paste dari Excel</strong> di pojok kanan atas.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                {rows.map((row, rowIdx) => {
                    const pplOptions = getBarangPplOptionsForRow();
                    const namaOptions = getBarangNamaOptionsForRow();

                    return (
                        <ModalBarangMasukRow
                            key={`row-inbound-${rowIdx}`}
                            row={row}
                            rowIdx={rowIdx}
                            rowsCount={rows.length}
                            isEditMode={isEditMode}
                            isProcessing={isProcessing}
                            barangs={barangs}
                            gudangs={gudangs}
                            gudangOptions={gudangOptions}
                            supplierOptions={supplierOptions}
                            pplOptions={pplOptions}
                            namaOptions={namaOptions}
                            onRemoveRow={handleRemoveRow}
                            onFieldChange={handleRowFieldChange}
                            onBarangChange={handleBarangChange}
                            onQtyChange={handleQtyChange}
                            onManualSerialChange={handleManualSerialChange}
                        />
                    );
                })}

                {!isEditMode && (
                    <div className="flex items-center gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddMoreRows(1)}
                            disabled={isProcessing || rows.length >= MAX_ROWS_LIMIT}
                            className="h-8 text-xs gap-1.5 cursor-pointer"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Tambah 1 Baris</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddMoreRows(5)}
                            disabled={isProcessing || rows.length >= MAX_ROWS_LIMIT}
                            className="h-8 text-xs gap-1.5 cursor-pointer"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Tambah 5 Baris</span>
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}