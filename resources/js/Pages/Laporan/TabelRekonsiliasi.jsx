import React, { useMemo } from 'react';
import Tabel from '@/components/Tabel';

const REKONSILIASI_COLUMNS = [
    { key: 'kode_barang', label: 'KODE PPL' },
    { key: 'nama_barang', label: 'NAMA & DESKRIPSI BARANG' },
    { key: 'part_number', label: 'PART NUMBER' },
    { key: 'satuan', label: 'SATUAN' },
    { key: 'stok_awal', label: 'STOK AWAL' },
    { key: 'masuk', label: 'MASUK (+)' },
    { key: 'keluar', label: 'KELUAR (-)' },
    { key: 'transfer_net', label: 'TRANSFER NET' },
    { key: 'stok_akhir', label: 'STOK AKHIR' },
    { key: 'kondisi_rincian', label: 'RINCIAN KONDISI FISIK UNIT' },
];

export default function TabelRekonsiliasi({
    dataList = [],
    zoomLevel = 100
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
                                {item.kode_barang}
                            </span>
                        );

                    case 'nama_barang':
                        return (
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                {item.nama_barang}
                            </span>
                        );

                    case 'part_number':
                        return (
                            <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                                {item.part_number || '-'}
                            </span>
                        );

                    case 'satuan':
                        return (
                            <span className="text-xs text-slate-500 font-medium">
                                {item.satuan || 'Unit'}
                            </span>
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

                    case 'transfer_net': {
                        const trf = item.transfer_net || 0;
                        return (
                            <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                {trf > 0 ? `+${trf}` : trf}
                            </span>
                        );
                    }

                    case 'stok_akhir':
                        return (
                            <span className="font-mono font-black text-xs text-blue-700 dark:text-blue-300">
                                {(item.stok_akhir || 0).toLocaleString('id-ID')}
                            </span>
                        );

                    case 'kondisi_rincian':
                        return (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono whitespace-nowrap">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.kondisi_baru || 0} Baru</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-amber-600 dark:text-amber-400 font-bold">{item.kondisi_bekas || 0} Bekas</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-rose-600 dark:text-rose-400 font-bold">{item.kondisi_rusak || 0} Rusak</span>
                            </div>
                        );

                    default:
                        return '-';
                }
            },
        }));
    }, []);

    // Perhitungan Total Akumulasi Bawah
    const totalSummary = useMemo(() => {
        return dataList.reduce((acc, row) => ({
            stok_awal: acc.stok_awal + (row.stok_awal || 0),
            masuk: acc.masuk + (row.masuk || 0),
            keluar: acc.keluar + (row.keluar || 0),
            transfer_net: acc.transfer_net + (row.transfer_net || 0),
            stok_akhir: acc.stok_akhir + (row.stok_akhir || 0),
            kondisi_baru: acc.kondisi_baru + (row.kondisi_baru || 0),
            kondisi_bekas: acc.kondisi_bekas + (row.kondisi_bekas || 0),
            kondisi_rusak: acc.kondisi_rusak + (row.kondisi_rusak || 0),
        }), {
            stok_awal: 0, masuk: 0, keluar: 0, transfer_net: 0, stok_akhir: 0,
            kondisi_baru: 0, kondisi_bekas: 0, kondisi_rusak: 0
        });
    }, [dataList]);

    return (
        <div className="w-full flex flex-col">
            <Tabel
                data={dataList}
                columns={formattedColumns}
                getItemId={getItemId}
                getRowNumber={(idx) => idx + 1}
                zoomLevel={zoomLevel}
                emptyMessage="Tidak ada data rekonsiliasi stok pada periode ini."
            />

            {/* Footer Ringkasan Total Saldo */}
            {dataList.length > 0 && (
                <div className="p-3.5 bg-slate-100/90 dark:bg-slate-950 border-t-2 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
                    <div className="text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Total Rekonsiliasi ({dataList.length} SKU)
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono">
                        <span className="text-slate-600 dark:text-slate-400">
                            Awal: <strong className="text-slate-900 dark:text-slate-100">{totalSummary.stok_awal.toLocaleString('id-ID')}</strong>
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                            Masuk: <strong>+{totalSummary.masuk.toLocaleString('id-ID')}</strong>
                        </span>
                        <span className="text-rose-600 dark:text-rose-400">
                            Keluar: <strong>-{totalSummary.keluar.toLocaleString('id-ID')}</strong>
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                            Transfer Net: <strong>{totalSummary.transfer_net >= 0 ? `+${totalSummary.transfer_net}` : totalSummary.transfer_net}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black">
                            Akhir: {totalSummary.stok_akhir.toLocaleString('id-ID')} Unit
                        </span>
                        <span className="text-slate-500 font-normal">
                            ({totalSummary.kondisi_baru} Baru • {totalSummary.kondisi_bekas} Bekas • {totalSummary.kondisi_rusak} Rusak)
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}