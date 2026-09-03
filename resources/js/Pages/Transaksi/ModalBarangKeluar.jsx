import React from 'react';
import Modal from '@/components/Modal';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, PlusCircle } from 'lucide-react';
import ModalBarangKeluarRow from './ModalBarangKeluarRow';
import { useModalBarangKeluarControl, MAX_ROWS_LIMIT } from './ModalBarangKeluarControl';

export default function ModalBarangKeluar({
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
        snSearches,
        setSnSearches,
        gudangOptions,
        getBarangPplOptionsForRow,
        getBarangNamaOptionsForRow,
        getBarangStockInWarehouse,
        handleAddMoreRows,
        handleRemoveRow,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleNonSnBatchQtyChange,
        handleAutoSelectNonSnBatches,
        handleToggleTransferSn,
        handleAutoSelectTransferSns,
        handleClearTransferSns,
        getAvailableSerialsForOutbound,
        handleSubmitForm,
    } = useModalBarangKeluarControl({
        isOpen,
        isEditMode,
        selectedItem,
        gudangs,
        barangs,
        onClose
    });

    const handleSnSearchChange = (rowIdx, val) => {
        setSnSearches(prev => ({ ...prev, [rowIdx]: val }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Data Pengeluaran Barang' : 'Tambah Data Barang Keluar (Outbound)'}
            onSubmit={handleSubmitForm}
            submitLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Transaksi Keluar'}
            isProcessing={isProcessing}
            headerExtra={
                !isEditMode && (
                    <Badge 
                        variant="secondary" 
                        className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900 text-[11px] font-mono font-bold px-2.5 py-0.5"
                    >
                        {rows.length} / {MAX_ROWS_LIMIT} Baris
                    </Badge>
                )
            }
        >
            {!isEditMode && (
                <Alert className="shrink-0 mb-3 bg-rose-50/60 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-[11px] leading-relaxed">
                        <strong>Pencatatan Outbound:</strong> Pengeluaran barang akan otomatis memotong stok fisik di <strong>Gudang Asal</strong> dan mengubah status Serial Number menjadi <strong>IN_USE</strong>.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                {rows.map((row, rowIdx) => {
                    const targetBarang = barangs.find(b => String(b.id) === String(row.barang_id));
                    const pplOptions = getBarangPplOptionsForRow(row);
                    const namaOptions = getBarangNamaOptionsForRow(row);
                    const stockInOrigin = (targetBarang && row.gudang_asal_id)
                        ? getBarangStockInWarehouse(targetBarang, row.gudang_asal_id)
                        : null;
                    const availableSnsForOutbound = getAvailableSerialsForOutbound(row.barang_id, row.gudang_asal_id);

                    return (
                        <ModalBarangKeluarRow
                            key={`row-keluar-${rowIdx}`}
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
                            availableSnsForOutbound={availableSnsForOutbound}
                            snSearch={snSearches[rowIdx] || ''}
                            onRemoveRow={handleRemoveRow}
                            onFieldChange={handleRowFieldChange}
                            onBarangChange={handleBarangChange}
                            onQtyChange={handleQtyChange}
                            onNonSnBatchQtyChange={handleNonSnBatchQtyChange}
                            onAutoSelectNonSnBatches={handleAutoSelectNonSnBatches}
                            onSnSearchChange={handleSnSearchChange}
                            onToggleTransferSn={handleToggleTransferSn}
                            onAutoSelectTransferSns={handleAutoSelectTransferSns}
                            onClearTransferSns={handleClearTransferSns}
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