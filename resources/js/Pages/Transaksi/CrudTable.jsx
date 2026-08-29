import React, { useMemo } from 'react';
import Tabel from '@/components/Tabel';
import { Badge } from '@/components/ui/badge';

const TABLE_COLUMNS = [
    { key: 'no_transaksi', label: 'NO TRANSAKSI' },
    { key: 'sub_jenis', label: 'JENIS PENERIMAAN' },
    { key: 'kode_ppl', label: 'KODE PPL' },
    { key: 'nama_barang', label: 'NAMA BARANG' },
    { key: 'part_number', label: 'PART NUMBER' },
    { key: 'satuan', label: 'SATUAN' },
    { key: 'tanggal', label: 'TANGGAL' },
    { key: 'qty', label: 'QTY' },
    { key: 'harga', label: 'HARGA SATUAN' },
    { key: 'total_harga', label: 'TOTAL NILAI' },
    { key: 'kondisi', label: 'KONDISI' },
    { key: 'nomor_imc', label: 'NOMOR IMC' },
    { key: 'nomor_omc', label: 'NOMOR OMC' },
    { key: 'asal', label: 'ASAL / PENGIRIM' },
    { key: 'gudang_tujuan', label: 'GUDANG TUJUAN' },
    { key: 'serials', label: 'SERIAL NUMBER (SN)' },
];

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

    const formattedColumns = useMemo(() => {
        return TABLE_COLUMNS.map((col) => ({
            ...col,
            render: (item) => {
                const detail = item.details?.[0] || {};
                const barang = detail.barang || {};
                const hargaSatuan = parseFloat(detail.harga) || 0;
                const totalNilai = (detail.qty || 0) * hargaSatuan;
                
                switch (col.key) {
                    case 'no_transaksi':
                        return (
                            <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                {item.no_transaksi}
                            </span>
                        );

                    case 'sub_jenis': {
                        let statusSub = item.sub_jenis;
                        if (!statusSub || statusSub === 'MASUK') {
                            const noTrx = item.no_transaksi || '';
                            if (noTrx.includes('BUY')) statusSub = 'PEMBELIAN';
                            else if (noTrx.includes('BORROW')) statusSub = 'PEMINJAMAN';
                            else if (noTrx.includes('RET')) statusSub = 'PENGEMBALIAN';
                            else if (noTrx.includes('TRF')) statusSub = 'TRANSFER_GUDANG';
                            else statusSub = 'PEMBELIAN';
                        }

                        const badgeColor = {
                            PEMBELIAN: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                            PEMINJAMAN: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                            PENGEMBALIAN: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                            TRANSFER_GUDANG: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                            TRANSFER: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                        };

                        return (
                            <Badge 
                                variant="outline" 
                                className={`${badgeColor[statusSub] || 'bg-blue-500/10 text-blue-600 border-blue-500/20'} text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide`}
                            >
                                {statusSub?.replace('_', ' ')}
                            </Badge>
                        );
                    }

                    case 'kode_ppl':
                        return (
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                {barang.kode_barang || '-'}
                            </span>
                        );

                    case 'nama_barang': {
                        const brandNama = barang.brand || barang.nama_barang || '-';
                        const subDeskripsi = [barang.tipe, barang.kategori].filter(Boolean).join(' • ');

                        return (
                            <div 
                                className="flex flex-col justify-center max-w-[210px] leading-tight"
                                title={`${brandNama}${subDeskripsi ? ` (${subDeskripsi})` : ''}`}
                            >
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                    {brandNama}
                                </span>
                                {subDeskripsi && (
                                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {subDeskripsi}
                                    </span>
                                )}
                            </div>
                        );
                    }

                    case 'part_number': {
                        const isPn = Boolean(barang.is_wajib_pn === true || barang.is_wajib_pn === 1 || barang.is_wajib_pn === '1');
                        const pnValue = isPn ? (barang.part_number || '-') : '-';
                        return (
                            <span className={`font-mono text-xs ${pnValue !== '-' ? 'text-slate-700 dark:text-slate-300 font-semibold' : 'text-slate-400'}`}>
                                {pnValue}
                            </span>
                        );
                    }

                    case 'satuan':
                        return (
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                {barang.deskripsi || barang.satuan || 'Unit'}
                            </span>
                        );

                    case 'tanggal': {
                        const cleanTanggal = item.tanggal ? String(item.tanggal).split('T')[0] : '-';
                        return (
                            <span className="text-xs text-slate-500 font-mono">
                                {cleanTanggal}
                            </span>
                        );
                    }

                    case 'qty':
                        return (
                            <Badge variant="outline" className="font-mono font-bold text-xs bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                                {detail.qty || 0}
                            </Badge>
                        );

                    case 'harga':
                        return hargaSatuan > 0 ? (
                            <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                                Rp {hargaSatuan.toLocaleString('id-ID')}
                            </span>
                        ) : (
                            <span className="text-slate-400 text-xs">-</span>
                        );

                    case 'total_harga':
                        return totalNilai > 0 ? (
                            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                Rp {totalNilai.toLocaleString('id-ID')}
                            </span>
                        ) : (
                            <span className="text-slate-400 text-xs">-</span>
                        );

                    case 'kondisi': {
                        if (item.sub_jenis === 'TRANSFER_GUDANG' || item.jenis_transaksi === 'TRANSFER') {
                            return <span className="text-slate-400 text-xs font-bold font-mono">-</span>;
                        }

                        const raw = String(item.kondisi || detail.kondisi || 'Baru').toUpperCase().trim();
                        let displayKondisi = 'Baru';
                        let badgeStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

                        if (raw === 'RUSAK') {
                            displayKondisi = 'Rusak';
                            badgeStyle = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                        } else if (raw.includes('BEKAS') || raw.includes('SECOND')) {
                            displayKondisi = 'Bekas';
                            badgeStyle = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                        } else if (raw === '-') {
                            return <span className="text-slate-400 text-xs font-bold font-mono">-</span>;
                        }

                        return (
                            <Badge variant="outline" className={`${badgeStyle} text-[10px] font-bold px-2 py-0.5 rounded-md`}>
                                {displayKondisi}
                            </Badge>
                        );
                    }

                    case 'nomor_imc':
                        return (
                            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {item.nomor_imc || '-'}
                            </span>
                        );

                    case 'nomor_omc':
                        return (
                            <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                                {item.nomor_omc || '-'}
                            </span>
                        );

                    case 'asal': {
                        const asalText = (item.sub_jenis === 'TRANSFER_GUDANG' || item.jenis_transaksi === 'TRANSFER')
                            ? item.gudang_asal?.nama_gudang
                            : (item.pihak_asal || item.supplier?.nama_supplier);
                        return (
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate block max-w-[150px]" title={asalText}>
                                {asalText || '-'}
                            </span>
                        );
                    }

                    case 'gudang_tujuan':
                        return (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate block max-w-[150px]" title={item.gudang_tujuan?.nama_gudang}>
                                {item.gudang_tujuan?.nama_gudang || '-'}
                            </span>
                        );

                    case 'serials': {
                        const listSn = detail.serials || item.serials || [];
                        return (
                            <div className="flex flex-wrap gap-1 max-w-[260px] max-h-24 overflow-y-auto py-1">
                                {listSn.length > 0 ? (
                                    listSn.map((s, idx) => (
                                        <Badge 
                                            key={idx} 
                                            variant="outline" 
                                            className="text-[9px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 px-1.5 py-0.5 shrink-0"
                                        >
                                            {s.serial_number || s}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-slate-400 text-xs">-</span>
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
            selectedIds={selectedIds}
            onSelectAll={onSelectAll}
            onSelectRow={onSelectRow}
            onEditRow={onEditRow}
            getItemId={getItemId}
            getRowNumber={getRowNumber}
            zoomLevel={zoomLevel}
            emptyMessage="Belum ada riwayat transaksi barang masuk."
        />
    );
}