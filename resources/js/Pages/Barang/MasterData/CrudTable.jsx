import React, { useMemo } from 'react';
import Tabel from '@/components/Tabel';
import { Badge } from '@/components/ui/badge';

export default function CrudTable({
    dataList = [],
    selectedIds = [],
    onSelectAll,
    onSelectRow,
    onEditRow,
    getRowNumber,
    zoomLevel = 100
}) {
    const getItemId = (item) => item?.id;

    const columns = useMemo(() => [
        {
            key: 'kode_barang',
            label: 'Kode PPL',
            render: (item) => (
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                    {item.kode_barang}
                </span>
            )
        },
        { key: 'brand', label: 'Brand / Merk' },
        { key: 'tipe', label: 'Tipe / Jenis' },
        { key: 'kategori', label: 'Kategori' },
        {
            key: 'part_number',
            label: 'Part Number',
            render: (item) => (
                <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                    {item.part_number || '-'}
                </span>
            )
        },
        {
            key: 'satuan',
            label: 'Satuan',
            render: (item) => item.deskripsi || item.satuan || 'Unit'
        },
        {
            key: 'status_sn_pn',
            label: 'Keterangan SN / PN',
            render: (item) => {
                const isSn = Boolean(item.is_wajib_sn);
                const isPn = Boolean(item.is_wajib_pn);
                return (
                    <div className="flex items-center gap-1.5">
                        {isSn && (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold px-1.5 py-0.5">
                                # Wajib SN
                            </Badge>
                        )}
                        {isPn && (
                            <Badge className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 text-[10px] font-bold px-1.5 py-0.5">
                                # Wajib PN
                            </Badge>
                        )}
                        {!isSn && !isPn && (
                            <span className="text-slate-400 text-xs">Standar</span>
                        )}
                    </div>
                );
            }
        }
    ], []);

    return (
        <Tabel
            data={dataList}
            columns={columns}
            selectedIds={selectedIds}
            onSelectAll={onSelectAll}
            onSelectRow={onSelectRow}
            onEditRow={onEditRow}
            getItemId={getItemId}
            getRowNumber={getRowNumber}
            zoomLevel={zoomLevel}
            emptyMessage="Belum ada data master barang."
        />
    );
}