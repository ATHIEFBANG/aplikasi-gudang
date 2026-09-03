import React, { useMemo } from 'react';
import Tabel from '@/components/Tabel';
import { Badge } from '@/components/ui/badge';

const REKONSILIASI_COLUMNS = [
    { key: 'kode_barang', label: 'KODE PPL' },
    { key: 'nama_barang', label: 'NAMA & DESKRIPSI BARANG' },
    { key: 'stok_awal', label: 'STOK AWAL' },
    { key: 'masuk', label: 'MASUK (+)' },
    { key: 'keluar', label: 'KELUAR (-)' },
    { key: 'rincian_keluar', label: 'RINCIAN KELUAR' },
    { key: 'transfer_net', label: 'TRF NET' },
    { key: 'stok_akhir', label: 'STOK AKHIR' },
    { key: 'sisa_fisik', label: 'SISA FISIK DI GUDANG' },
    { key: 'grand_total', label: 'GRAND TOTAL' },
];

export default function TabelRekonsiliasi({
    dataList = [],
    zoomLevel = 100,
    getRowNumber
}) {
    const getItemId = (item) => item?.id || item?.kode_barang;

    const formattedColumns = useMemo(() => {
        return REKONSILIASI_COLUMNS.map((col) => ({
            ...col,
            render: (item) => {
                switch (col.key) {
                    case 'kode_barang':
                        return (
                            <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                {item.kode_barang || '-'}
                            </span>
                        );
                    case 'nama_barang':
                        return (
                            <div className="flex flex-col max-w-[200px]">
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate" title={item.nama_barang}>
                                    {item.nama_barang || '-'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    PN: {item.part_number !== '-' ? item.part_number : 'Standar'} • {item.satuan}
                                </span>
                            </div>
                        );
                    case 'stok_awal':
                        return (
                            <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                                {(item.stok_awal || 0).toLocaleString('id-ID')}
                            </span>
                        );
                    case 'masuk':
                        return (
                            <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                                +{(item.masuk || 0).toLocaleString('id-ID')}
                            </span>
                        );
                    case 'keluar':
                        return (
                            <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                                -{(item.keluar || 0).toLocaleString('id-ID')}
                            </span>
                        );
                    case 'rincian_keluar':
                        return (item.keluar || 0) > 0 ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono">
                                {item.keluar_baru > 0 && <span className="text-emerald-600 font-semibold">{item.keluar_baru} Baru</span>}
                                {item.keluar_bekas > 0 && <span className="text-amber-500 font-semibold">{item.keluar_bekas} Bekas</span>}
                                {item.keluar_rusak > 0 && <span className="text-rose-500 font-semibold">{item.keluar_rusak} Rusak</span>}
                            </div>
                        ) : (
                            <span className="text-slate-400 text-xs">-</span>
                        );
                    case 'transfer_net': {
                        const trf = item.transfer_net || 0;
                        return (
                            <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                {trf >= 0 ? `+${trf}` : trf}
                            </span>
                        );
                    }
                    case 'stok_akhir':
                        return (
                            <Badge variant="outline" className="font-mono font-black text-xs bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5">
                                {(item.stok_akhir || 0).toLocaleString('id-ID')}
                            </Badge>
                        );
                    case 'sisa_fisik':
                        return (
                            <div className="flex items-center gap-2 text-xs font-mono whitespace-nowrap">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {item.kondisi_baru || 0} <span className="font-sans font-medium text-[10px] text-slate-400">Baru</span>
                                </span>
                                <span className="text-slate-300 dark:text-slate-700 font-sans">•</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                    {item.kondisi_bekas || 0} <span className="font-sans font-medium text-[10px] text-slate-400">Bekas</span>
                                </span>
                                <span className="text-slate-300 dark:text-slate-700 font-sans">•</span>
                                <span className="font-bold text-rose-600 dark:text-rose-400">
                                    {item.kondisi_rusak || 0} <span className="font-sans font-medium text-[10px] text-slate-400">Rusak</span>
                                </span>
                            </div>
                        );
                    case 'grand_total': {
                        const total = item.grand_total !== undefined 
                            ? item.grand_total 
                            : ((item.kondisi_baru || 0) + (item.kondisi_bekas || 0) + (item.kondisi_rusak || 0));
                        return (
                            <Badge variant="outline" className="font-mono font-black text-xs bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-2.5 py-0.5">
                                {total.toLocaleString('id-ID')}
                            </Badge>
                        );
                    }
                    default:
                        return '-';
                }
            },
        }));
    }, []);

    return (
        <Tabel
            data={dataList}
            columns={formattedColumns}
            getItemId={getItemId}
            getRowNumber={getRowNumber}
            zoomLevel={zoomLevel}
            emptyMessage="Tidak ada data rekonsiliasi stok pada periode ini."
        />
    );
}