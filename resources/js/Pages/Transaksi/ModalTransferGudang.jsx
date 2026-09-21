import React from 'react';
import Modal from '@/components/Modal';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, PlusCircle } from 'lucide-react';
import ModalTransferGudangRow from './ModalTransferGudangRow';
import { useModalTransferGudangControl } from './ModalTransferGudangControl';

export default function ModalTransferGudang({
    isOpen,
    onClose,
    isEditMode = false,
    selectedItem = null,
    gudangs = [],
    barangs = []
}) {
    const {
        isProcessing,
        rows,
        setRows,
        snSearches,
        setSnSearches,
        nonSnSearches,
        setNonSnSearches,
        gudangOptions,
        getBarangStockInWarehouse,
        getBarangPplOptions,
        getBarangNamaOptions,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleNonSnBatchQtyChange,
        handleToggleSn,
        handleClearSns,
        handleSubmit,
        createEmptyRow
    } = useModalTransferGudangControl({
        isOpen,
        isEditMode,
        selectedItem,
        gudangs,
        barangs,
        onClose
    });

    const maxLimit = 50;

    const handleAddMoreRows = (count = 1) => {
        setRows(prev => {
            if (prev.length + count > maxLimit) {
                alert(`Maksimal penambahan transaksi adalah ${maxLimit} baris.`);
                const allowed = maxLimit - prev.length;
                if (allowed <= 0) return prev;
                return [...prev, ...Array.from({ length: allowed }, () => createEmptyRow())];
            }
            return [...prev, ...Array.from({ length: count }, () => createEmptyRow())];
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Data Transfer Antar-Gudang' : 'Tambah Transfer Antar-Gudang'}
            onSubmit={handleSubmit}
            submitLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Transfer Gudang'}
            isProcessing={isProcessing}
            headerExtra={
                !isEditMode && (
                    <Badge 
                        variant="secondary" 
                        className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold px-2.5 py-1"
                    >
                        {rows.length} / {maxLimit} Baris
                    </Badge>
                )
            }
        >
            {!isEditMode && (
                <Alert className="shrink-0 mb-3 bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-[11px] leading-relaxed">
                        <strong>Mutasi Internal:</strong> Transfer akan memotong stok di <strong>Gudang Asal</strong> dan menambahkannya ke <strong>Gudang Tujuan</strong> secara langsung. Silakan pilih gudang asal, gudang tujuan, serta unit barang secara akurat.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                {rows.map((row, rowIdx) => {
                    const targetBarang = barangs.find(b => String(b.id) === String(row.barang_id));
                    const stockInOrigin = targetBarang && row.gudang_asal_id 
                        ? getBarangStockInWarehouse(targetBarang, row.gudang_asal_id) 
                        : null;
                    const availableSns = (targetBarang?.serials || []).filter(
                        s => String(s.gudang_id) === String(row.gudang_asal_id) && s.status === 'IN_WAREHOUSE'
                    );
                    const pplOptions = getBarangPplOptions(row);
                    const namaOptions = getBarangNamaOptions(row);

                    return (
                        <ModalTransferGudangRow
                            key={`trf-row-${rowIdx}`}
                            row={row}
                            rowIdx={rowIdx}
                            rowsCount={rows.length}
                            isEditMode={isEditMode}
                            isProcessing={isProcessing}
                            barangs={barangs}
                            gudangs={gudangs}
                            gudangOptions={gudangOptions}
                            pplOptions={pplOptions}
                            namaOptions={namaOptions}
                            stockInOrigin={stockInOrigin}
                            availableSns={availableSns}
                            nonSnSearch={nonSnSearches[rowIdx] || ''}
                            snSearch={snSearches[rowIdx] || ''}
                            onRemoveRow={(idx) => setRows(prev => prev.filter((_, i) => i !== idx))}
                            onFieldChange={handleRowFieldChange}
                            onBarangChange={handleBarangChange}
                            onQtyChange={handleQtyChange}
                            onNonSnBatchQtyChange={handleNonSnBatchQtyChange}
                            onNonSnSearchChange={(rIdx, val) => setNonSnSearches(prev => ({ ...prev, [rIdx]: val }))}
                            onSnSearchChange={(rIdx, val) => setSnSearches(prev => ({ ...prev, [rIdx]: val }))}
                            onToggleSn={handleToggleSn}
                            onClearSns={handleClearSns}
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
                            disabled={isProcessing || rows.length >= maxLimit}
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
                            disabled={isProcessing || rows.length >= maxLimit}
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