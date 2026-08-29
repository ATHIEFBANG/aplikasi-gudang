import React from 'react';
import Modal from '@/components/Modal';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, PlusCircle } from 'lucide-react';
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
        snSearches,
        setSnSearches,
        gudangOptions,
        supplierOptions,
        getBarangPplOptionsForRow,
        getBarangNamaOptionsForRow,
        getBarangStockInWarehouse,
        handleAddMoreRows,
        handleRemoveRow,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleManualSerialChange,
        handleToggleTransferSn,
        handleAutoSelectTransferSns,
        handleClearTransferSns,
        getAvailableSerialsForTransfer,
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

    const handleSnSearchChange = (rowIdx, val) => {
        setSnSearches(prev => ({ ...prev, [rowIdx]: val }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Data Transaksi' : 'Tambah Data Transaksi'}
            onSubmit={handleSubmitForm}
            submitLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Semua Data'}
            isProcessing={isProcessing}
            headerExtra={
                !isEditMode && (
                    <Badge 
                        variant="secondary" 
                        className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold px-2.5 py-0.5"
                    >
                        {rows.length} / {MAX_ROWS_LIMIT} Baris
                    </Badge>
                )
            }
        >
            {!isEditMode && (
                <Alert className="shrink-0 mb-3 bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-[11px] leading-relaxed">
                        <strong>Pencatatan Logistik:</strong> Untuk <strong>Pembelian & Peminjaman</strong> kondisi tersedia Baru dan Bekas. Untuk <strong>Pengembalian & Transfer Gudang</strong> tersedia Baru, Bekas, dan Rusak.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                {rows.map((row, rowIdx) => {
                    const targetBarang = barangs.find(b => String(b.id) === String(row.barang_id));
                    const pplOptions = getBarangPplOptionsForRow(row);
                    const namaOptions = getBarangNamaOptionsForRow(row);
                    const stockInOrigin = (row.sub_jenis === 'TRANSFER_GUDANG' && targetBarang && row.gudang_asal_id)
                        ? getBarangStockInWarehouse(targetBarang, row.gudang_asal_id)
                        : null;
                    const availableSnsForTransfer = row.sub_jenis === 'TRANSFER_GUDANG' 
                        ? getAvailableSerialsForTransfer(row.barang_id, row.gudang_asal_id)
                        : [];

                    return (
                        <ModalBarangMasukRow
                            key={`row-${rowIdx}`}
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
                            stockInOrigin={stockInOrigin}
                            availableSnsForTransfer={availableSnsForTransfer}
                            snSearch={snSearches[rowIdx] || ''}
                            onRemoveRow={handleRemoveRow}
                            onFieldChange={handleRowFieldChange}
                            onBarangChange={handleBarangChange}
                            onQtyChange={handleQtyChange}
                            onSnSearchChange={handleSnSearchChange}
                            onToggleTransferSn={handleToggleTransferSn}
                            onAutoSelectTransferSns={handleAutoSelectTransferSns}
                            onClearTransferSns={handleClearTransferSns}
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