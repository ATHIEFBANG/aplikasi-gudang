import React, { useMemo } from 'react';
import Tabel from '@/components/Tabel';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, UserCheck } from 'lucide-react';

const TABLE_COLUMNS = [
    { key: 'no_transaksi', label: 'No. Transaksi' },
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'jenis_transaksi', label: 'Jenis Mutasi' },
    { key: 'rute', label: 'Rute / Alur Barang' },
    { key: 'items', label: 'Detail Barang' },
    { key: 'pic', label: 'PIC Operator' },
];

export default function CrudTable({
    dataList = [],
    getRowNumber
}) {
    const getItemId = (item) => item?.id;

    const formattedColumns = useMemo(() => {
        return TABLE_COLUMNS.map(col => ({
            ...col,
            render: (item) => {
                switch (col.key) {
                    case 'no_transaksi':
                        return (
                            <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                                    {item.no_transaksi}
                                </span>
                                {item.keterangan && (
                                    <span className="text-[10px] text-slate-400 block truncate max-w-xs mt-0.5">
                                        {item.keterangan}
                                    </span>
                                )}
                            </div>
                        );
                    case 'tanggal':
                        return <span className="text-xs text-slate-500">{item.tanggal}</span>;
                    case 'jenis_transaksi':
                        const jenis = item.jenis_transaksi;
                        if (jenis === 'MASUK') return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold">MASUK</Badge>;
                        if (jenis === 'KELUAR') return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold">KELUAR</Badge>;
                        if (jenis === 'TRANSFER') return <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 font-bold">TRANSFER</Badge>;
                        if (jenis === 'PINJAM') return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold">PINJAM</Badge>;
                        return <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold">KEMBALI</Badge>;
                    case 'rute':
                        return (
                            <div className="text-xs">
                                {item.jenis_transaksi === 'MASUK' && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                        Dari: {item.supplier?.nama_supplier || 'Supplier'} ➔ {item.gudang_tujuan?.nama_gudang || '-'}
                                    </span>
                                )}
                                {item.jenis_transaksi === 'KELUAR' && (
                                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                                        Keluar Dari: {item.gudang_asal?.nama_gudang || '-'}
                                    </span>
                                )}
                                {item.jenis_transaksi === 'TRANSFER' && (
                                    <span className="text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
                                        {item.gudang_asal?.nama_gudang || '-'} <ArrowRight className="w-3 h-3" /> {item.gudang_tujuan?.nama_gudang || '-'}
                                    </span>
                                )}
                                {['PINJAM', 'KEMBALI'].includes(item.jenis_transaksi) && (
                                    <span className="text-slate-600 dark:text-slate-300">
                                        {item.gudang_asal?.nama_gudang || item.gudang_tujuan?.nama_gudang || '-'}
                                    </span>
                                )}
                            </div>
                        );
                    case 'items':
                        const details = item.details || [];
                        return (
                            <div className="space-y-0.5 max-w-xs">
                                {details.map((d, i) => (
                                    <div key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
                                        <span className="truncate">{d.barang?.nama_barang || 'Barang'}</span>
                                        <Badge variant="outline" className="font-mono text-[10px] shrink-0 font-bold">
                                            {d.qty} Unit
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        );
                    case 'pic':
                        return (
                            <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                {item.pic_user?.name || '-'}
                            </span>
                        );
                    default:
                        return '-';
                }
            }
        }));
    }, []);

    return (
        <Tabel
            data={dataList}
            columns={formattedColumns}
            getItemId={getItemId}
            getRowNumber={getRowNumber}
            emptyMessage="Belum ada riwayat transaksi logistik."
        />
    );
}