import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, QrCode, Hash, Ban } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import Tabel from '@/components/Tabel';
import ModalBarang from './ModalBarang';

const TABLE_COLUMNS = [
    { key: 'kode_barang', altKeys: ['kode_barang', 'kode_ppl', 'kode', 'sku'], label: 'Kode PPL' },
    { key: 'brand', altKeys: ['brand', 'merk', 'brand_merk'], label: 'Brand / Merk' },
    { key: 'tipe', altKeys: ['tipe', 'jenis', 'tipe_jenis', 'model'], label: 'Tipe / Jenis' },
    { key: 'kategori', altKeys: ['kategori', 'category'], label: 'Kategori' },
    // Hapus 'nama_barang' dari altKeys agar tidak mengambil nama fallback
    { key: 'part_number', altKeys: ['part_number', 'pn', 'part_no'], label: 'Part Number' },
    { key: 'satuan', altKeys: ['satuan', 'uom', 'unit', 'deskripsi'], label: 'Satuan' },
    { key: 'keterangan_sn_pn', label: 'Keterangan SN / PN' },
];

export default function CrudTable({
    dataList = [],
    selectedIds = [],
    onSelectAll,
    onSelectRow,
    getRowNumber
}) {
    const { auth } = usePage().props;
    const userRole = auth?.user?.role || 'view';
    const canWrite = userRole === 'admin' || userRole === 'staff';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const getItemId = useCallback((item) => item?.id, []);

    const existingOptions = useMemo(() => {
        const brands = new Set();
        const tipes = new Set();
        const kategoris = new Set();
        const partNumbers = new Set();
        const satuans = new Set();

        dataList.forEach(item => {
            if (item.brand) brands.add(item.brand);
            if (item.tipe) tipes.add(item.tipe);
            if (item.kategori) kategoris.add(item.kategori);
            if (item.is_wajib_pn && item.part_number) partNumbers.add(item.part_number);
            if (item.satuan || item.deskripsi) satuans.add(item.satuan || item.deskripsi);
        });

        return {
            brandList: Array.from(brands),
            tipeList: Array.from(tipes),
            kategoriList: Array.from(kategoris),
            partNumberList: Array.from(partNumbers),
            satuanList: Array.from(satuans),
        };
    }, [dataList]);

    const getFieldValue = useCallback((item, colDef) => {
        if (!item || !colDef) return '';
        if (colDef.altKeys && Array.isArray(colDef.altKeys)) {
            for (const k of colDef.altKeys) {
                if (item[k] !== undefined && item[k] !== null && item[k] !== '') return item[k];
            }
        }
        return item[colDef.key] ?? '';
    }, []);

    const formattedColumns = useMemo(() => {
        return TABLE_COLUMNS.map(col => ({
            ...col,
            render: (item) => {
                const value = getFieldValue(item, col);
                switch (col.key) {
                    case 'kode_barang':
                        return <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{value || '-'}</span>;
                    case 'brand':
                    case 'tipe':
                    case 'kategori':
                        return <span className="text-slate-800 dark:text-slate-200">{value || '-'}</span>;
                    case 'part_number': {
                        const isWajibPn = Boolean(item.is_wajib_pn && item.is_wajib_pn !== '0' && item.is_wajib_pn !== 0);
                        // Jika tidak wajib PN, otomatis tampilkan strip (-)
                        if (!isWajibPn) {
                            return <span className="text-slate-400 font-mono text-xs">-</span>;
                        }
                        return (
                            <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                                {item.part_number || value || '-'}
                            </span>
                        );
                    }
                    case 'satuan':
                        return <span className="text-slate-700 dark:text-slate-300">{value || '-'}</span>;
                    case 'keterangan_sn_pn': {
                        const isWajibSn = Boolean(item.is_wajib_sn && item.is_wajib_sn !== '0' && item.is_wajib_sn !== 0);
                        const isWajibPn = Boolean(item.is_wajib_pn && item.is_wajib_pn !== '0' && item.is_wajib_pn !== 0);

                        return (
                            <div className="flex flex-wrap items-center gap-1.5">
                                {/* BADGE STATUS SERIAL NUMBER */}
                                {isWajibSn ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                        <QrCode className="w-3 h-3" /> Wajib SN
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        <Ban className="w-2.5 h-2.5 opacity-60" /> Tidak Wajib SN
                                    </span>
                                )}

                                {/* BADGE STATUS PART NUMBER */}
                                {isWajibPn ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                                        <Hash className="w-3 h-3" /> Wajib PN
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        <Ban className="w-2.5 h-2.5 opacity-60" /> Tidak Wajib PN
                                    </span>
                                )}
                            </div>
                        );
                    }
                    default:
                        return value !== undefined && value !== null && value !== '' ? String(value) : '-';
                }
            }
        }));
    }, [getFieldValue]);

    const handleOpenAddModal = () => {
        if (!canWrite) return;
        setIsEditMode(false);
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item) => {
        if (!canWrite || !item) return;
        setIsEditMode(true);
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col w-full">
            <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Daftar Master Barang (Kode PPL)
                </span>
                {canWrite && (
                    <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleOpenAddModal}
                        className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Data Baru</span>
                    </Button>
                )}
            </div>

            <div className="w-full [&>div]:border-0 [&>div]:rounded-none [&>div]:shadow-none">
                <Tabel 
                    data={dataList}
                    columns={formattedColumns}
                    selectedIds={selectedIds}
                    onSelectAll={onSelectAll}
                    onSelectRow={onSelectRow}
                    onEditRow={canWrite ? handleOpenEditModal : undefined}
                    getItemId={getItemId}
                    getRowNumber={getRowNumber}
                    emptyMessage="Belum ada data Master Barang PPL."
                />
            </div>

            <ModalBarang
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isEditMode={isEditMode}
                selectedItem={selectedItem}
                existingOptions={existingOptions}
            />
        </div>
    );
}