import React, { useMemo } from 'react';
import Tabel from '@/components/Tabel';
import { Badge } from '@/components/ui/badge';

const JURNAL_COLUMNS = [
    { key: 'tanggal', label: 'TANGGAL' },
    { key: 'no_transaksi', label: 'NO TRANSAKSI' },
    { key: 'jenis', label: 'JENIS MUTASI' },
    { key: 'nomor_dokumen', label: 'DOKUMEN (OMC / IMC)' },
    { key: 'asal', label: 'DARI (ASAL)' },
    { key: 'tujuan', label: 'KE (TUJUAN / SITE)' },
    { key: 'nama_barang', label: 'KODE PPL & NAMA BARANG' },
    { key: 'qty', label: 'QTY' },
    { key: 'serials', label: 'SERIAL NUMBER (SN)' },
];

export default function TabelJurnal({
    dataList = [],
    zoomLevel = 100
}) {
    const getItemId = (item) => item?.id || item?.no_transaksi;

    const formattedColumns = useMemo(() => {
        return JURNAL_COLUMNS.map((col) => ({
            ...col,
            render: (item) => {
                switch (col.key) {
                    case 'tanggal':
                        return (
                            <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
                                {item.tanggal}
                            </span>
                        );

                    case 'no_transaksi':
                        return (
                            <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                {item.no_transaksi}
                            </span>
                        );

                    case 'jenis': {
                        const isMasuk = item.jenis === 'MASUK';
                        const isKeluar = item.jenis === 'KELUAR';
                        return (
                            <Badge 
                                variant="outline"
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap ${
                                    isMasuk
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        : isKeluar
                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                }`}
                            >
                                {item.sub_jenis?.replace(/_/g, ' ') || item.jenis}
                            </Badge>
                        );
                    }

                    case 'nomor_dokumen':
                        return (
                            <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {item.nomor_dokumen || '-'}
                            </span>
                        );

                    case 'asal':
                        return (
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[140px] block" title={item.asal}>
                                {item.asal || '-'}
                            </span>
                        );

                    case 'tujuan':
                        return (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[140px] block" title={item.tujuan}>
                                {item.tujuan || '-'}
                            </span>
                        );

                    case 'nama_barang':
                        return (
                            <div className="flex flex-col justify-center max-w-[200px] leading-tight">
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                    {item.nama_barang}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 mt-0.5">
                                    {item.kode_barang}
                                </span>
                            </div>
                        );

                    case 'qty':
                        return (
                            <Badge variant="outline" className="font-mono font-bold text-xs bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                                {item.qty || 0}
                            </Badge>
                        );

                    case 'serials': {
                        const listSn = item.serials || [];
                        return (
                            <div className="flex flex-wrap gap-1 max-w-[260px] max-h-20 overflow-y-auto py-1">
                                {listSn.length > 0 ? (
                                    listSn.map((s, idx) => (
                                        <Badge
                                            key={idx}
                                            variant="outline"
                                            className="text-[9px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 px-1.5 py-0.5 gap-1 shrink-0"
                                        >
                                            <span>{s.serial_number || s}</span>
                                            {s.kondisi && (
                                                <span className="text-[8px] font-sans font-bold text-slate-400">({s.kondisi})</span>
                                            )}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-slate-400 font-mono text-xs">-</span>
                                )}
                            </div>
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
            getRowNumber={(idx) => idx + 1}
            zoomLevel={zoomLevel}
            emptyMessage="Belum ada catatan mutasi transaksi pada periode ini."
        />
    );
}