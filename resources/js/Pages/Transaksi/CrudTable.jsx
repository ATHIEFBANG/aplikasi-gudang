import React, { useMemo } from 'react';
import Tabel from '@/components/Tabel';
import { Badge } from '@/components/ui/badge';

const ALL_COLUMNS = [
    { key: 'no_transaksi', label: 'NO TRANSAKSI' },
    { key: 'sub_jenis', label: 'JENIS TRANSAKSI' },
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
    { key: 'gudang_tujuan', label: 'TUJUAN / SITE' },
    { key: 'serials', label: 'SERIAL NUMBER (SN)' },
];

export default function CrudTable({ 
    dataList = [], 
    selectedIds = [], 
    onSelectAll, 
    onSelectRow, 
    onEditRow, 
    getRowNumber,
    zoomLevel = 100,
    mainTab = 'MASUK'
}) {
    const getItemId = (item) => item?.id;

    const formattedColumns = useMemo(() => {
        let visibleKeys = [];
        if (mainTab === 'MASUK') {
            visibleKeys = [
                'no_transaksi', 'sub_jenis', 'kode_ppl', 'nama_barang', 'part_number', 
                'satuan', 'tanggal', 'qty', 'harga', 'total_harga', 'kondisi', 
                'nomor_imc', 'asal', 'gudang_tujuan', 'serials'
            ];
        } else if (mainTab === 'KELUAR') {
            visibleKeys = [
                'no_transaksi', 'sub_jenis', 'kode_ppl', 'nama_barang', 'part_number', 
                'satuan', 'tanggal', 'qty', 'nomor_omc', 'asal', 'gudang_tujuan', 'serials'
            ];
        } else if (mainTab === 'TRANSFER') {
            visibleKeys = [
                'no_transaksi', 'kode_ppl', 'nama_barang', 'part_number', 'satuan', 
                'tanggal', 'qty', 'nomor_omc', 'nomor_imc', 'asal', 'gudang_tujuan', 'serials'
            ];
        }

        const activeCols = ALL_COLUMNS.filter((col) => visibleKeys.includes(col.key));
        return activeCols.map((col) => ({
            ...col,
            label: (col.key === 'asal' && mainTab === 'TRANSFER') 
                ? 'GUDANG ASAL' 
                : (col.key === 'gudang_tujuan' && mainTab === 'TRANSFER')
                ? 'GUDANG TUJUAN'
                : (col.key === 'gudang_tujuan' && mainTab === 'KELUAR')
                ? 'TUJUAN / KEPERLUAN'
                : col.label,
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
                        let rawSub = item.sub_jenis;
                        if (!rawSub) {
                            const noTrx = item.no_transaksi || '';
                            if (noTrx.includes('BUY')) rawSub = 'PEMBELIAN';
                            else if (noTrx.includes('SITE')) rawSub = 'BARANG_KE_SITE';
                            else if (noTrx.includes('INT')) rawSub = 'PEMAKAIAN_INTERNAL';
                            else if (noTrx.includes('TRF')) rawSub = 'TRANSFER_GUDANG';
                            else rawSub = item.jenis_transaksi || 'PEMBELIAN';
                        }

                        // Penyesuaian nama tampilan ke Proyek dan Non Proyek
                        let displayLabel = rawSub?.replace(/_/g, ' ');
                        if (rawSub === 'BARANG_KE_SITE') displayLabel = 'PROYEK';
                        else if (rawSub === 'PEMAKAIAN_INTERNAL') displayLabel = 'NON PROYEK';

                        const badgeColor = {
                            PEMBELIAN: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                            PEMINJAMAN: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                            PENGEMBALIAN: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                            BARANG_KE_SITE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                            PEMAKAIAN_INTERNAL: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                        };

                        return (
                            <Badge 
                                variant="outline"
                                className={`${badgeColor[rawSub] || 'bg-slate-500/10 text-slate-600 border-slate-500/20'} text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide`}
                            >
                                {displayLabel}
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
                        const raw = String(item.kondisi || detail.kondisi || 'Baru').toUpperCase().trim();
                        let displayKondisi = 'Baru';
                        let badgeStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                        if (raw === 'RUSAK') {
                            displayKondisi = 'Rusak';
                            badgeStyle = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                        } else if (raw.includes('BEKAS') || raw.includes('SECOND')) {
                            displayKondisi = 'Bekas';
                            badgeStyle = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
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
                            <span className="font-mono text-xs text-rose-600 dark:text-rose-400 font-bold">
                                {item.nomor_omc || '-'}
                            </span>
                        );
                    case 'asal': {
                        const asalText = (mainTab === 'KELUAR' || mainTab === 'TRANSFER')
                            ? (item.gudang_asal?.nama_gudang || '-')
                            : (item.pihak_asal || item.supplier?.nama_supplier);
                        return (
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate block max-w-[150px]" title={asalText}>
                                {asalText || '-'}
                            </span>
                        );
                    }
                    case 'gudang_tujuan': {
                        const tujuanText = (mainTab === 'TRANSFER')
                            ? item.gudang_tujuan?.nama_gudang
                            : (mainTab === 'KELUAR' ? item.pihak_asal : item.gudang_tujuan?.nama_gudang);
                        return (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate block max-w-[150px]" title={tujuanText}>
                                {tujuanText || '-'}
                            </span>
                        );
                    }
                    case 'serials': {
                        const listSn = detail.serials || item.serials || [];
                        return (
                            <div className="flex flex-wrap gap-1 max-w-[280px] max-h-24 overflow-y-auto py-1">
                                {listSn.length > 0 ? (
                                    listSn.map((s, idx) => {
                                        const snVal = s.serial_number || s;
                                        const rawKondisi = String(s.kondisi || '').toUpperCase().trim();
                                        let kondisiText = '';
                                        let badgeColor = '';
                                        if (rawKondisi === 'RUSAK') {
                                            kondisiText = 'Rusak';
                                            badgeColor = 'bg-rose-500/20 text-rose-600';
                                        } else if (rawKondisi.includes('BEKAS') || rawKondisi.includes('SECOND')) {
                                            kondisiText = 'Bekas';
                                            badgeColor = 'bg-amber-500/20 text-amber-600';
                                        } else if (rawKondisi === 'BARU' || rawKondisi === 'BAIK') {
                                            kondisiText = 'Baru';
                                            badgeColor = 'bg-emerald-500/20 text-emerald-600';
                                        }
                                        return (
                                            <Badge 
                                                key={idx}
                                                variant="outline"
                                                className="text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 px-1.5 py-0.5 shrink-0 flex items-center gap-1"
                                            >
                                                <span>{snVal}</span>
                                                {kondisiText && (
                                                    <span className={`text-[8px] px-1 py-0.2 rounded font-sans font-bold uppercase ${badgeColor}`}>
                                                        {kondisiText}
                                                    </span>
                                                )}
                                            </Badge>
                                        );
                                    })
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
    }, [mainTab]);

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
            emptyMessage={`Belum ada riwayat data ${mainTab.toLowerCase()}.`}
        />
    );
}