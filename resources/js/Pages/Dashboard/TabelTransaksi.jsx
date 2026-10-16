import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Tabel from '@/components/gabungan/Tabel';
import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

export default function TabelTransaksi({ recentTransactions = [] }) {
    // Badge transaksi dengan pemetaan Proyek & Non Proyek
    const getBadgeTransaksi = (trx) => {
        const jenis = trx.jenis_transaksi || '';
        const subJenis = trx.sub_jenis || '';

        if (jenis === 'KELUAR') {
            const isProyek = ['BARANG_KE_SITE', 'PROYEK'].includes(subJenis);
            const label = isProyek
                ? 'Proyek'
                : ['PEMAKAIAN_INTERNAL', 'NON PROYEK'].includes(subJenis)
                    ? 'Non Proyek'
                    : 'Keluar';

            return (
                <Badge className={isProyek
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300'}>
                    {label}
                </Badge>
            );
        }

        const labels = {
            MASUK: 'Masuk',
            TRANSFER: 'Transfer',
            PINJAM: 'Pinjam',
            KEMBALI: 'Kembali',
        };

        return <Badge variant="outline">{labels[jenis] || jenis || '-'}</Badge>;
    };

    return (
        <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <CardContent className="p-0">
                <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Riwayat Transaksi Terakhir
                    </span>
                    <Link href="/transaksi" className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-rose-700">
                        <span>Semua Transaksi</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <div className="w-full [&>div]:border-0 [&>div]:rounded-none [&>div]:shadow-none border-b border-slate-200 dark:border-slate-800">
                    <Tabel
                        data={recentTransactions}
                        emptyMessage="Belum ada riwayat transaksi."
                        columns={[
                            {
                                key: 'no_transaksi',
                                label: 'No. Transaksi',
                                render: trx => (
                                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                        {trx.no_transaksi || '-'}
                                        <span className="block font-sans font-normal text-[10px] text-slate-400">{trx.tanggal || ''}</span>
                                    </span>
                                ),
                                cellClassName: 'whitespace-nowrap',
                            },
                            {
                                key: 'tipe',
                                label: 'Tipe',
                                render: getBadgeTransaksi,
                            },
                            {
                                key: 'detail_rute',
                                label: 'Detail / Rute',
                                render: trx => {
                                    if (trx.jenis_transaksi === 'MASUK') {
                                        return <span>{trx.pihak_asal || trx.supplier?.nama_supplier || '-'} ➔ {trx.gudang_tujuan?.nama_gudang || '-'}</span>;
                                    }
                                    if (trx.jenis_transaksi === 'KELUAR') {
                                        return <span>{trx.gudang_asal?.nama_gudang || '-'} ➔ <strong className="text-slate-800 dark:text-slate-200">{trx.pihak_asal || '-'}</strong></span>;
                                    }
                                    if (trx.jenis_transaksi === 'TRANSFER') {
                                        return <span>{trx.gudang_asal?.nama_gudang ?? '-'} ➔ {trx.gudang_tujuan?.nama_gudang ?? '-'}</span>;
                                    }
                                    if (['PINJAM', 'KEMBALI'].includes(trx.jenis_transaksi)) {
                                        return <span>{trx.keterangan || trx.pihak_asal || '-'}</span>;
                                    }
                                    return <span>{trx.keterangan || trx.pihak_asal || '-'}</span>;
                                },
                            },
                            {
                                key: 'pic',
                                label: 'PIC',
                                render: trx => trx.pic_user?.name || '-',
                            },
                        ]}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
