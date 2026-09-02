import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, History, Search } from 'lucide-react';

export default function TabelTransaksi({ recentTransactions = [] }) {
    const [searchTrx, setSearchTrx] = useState('');

    const filteredTransactions = useMemo(() => {
        if (!searchTrx.trim()) return recentTransactions;
        const q = searchTrx.toLowerCase().trim();
        return recentTransactions.filter(t => 
            (t.no_transaksi && t.no_transaksi.toLowerCase().includes(q)) ||
            (t.keterangan && t.keterangan.toLowerCase().includes(q)) ||
            (t.jenis_transaksi && t.jenis_transaksi.toLowerCase().includes(q)) ||
            (t.sub_jenis && t.sub_jenis.toLowerCase().includes(q)) ||
            (t.pihak_asal && t.pihak_asal.toLowerCase().includes(q)) ||
            (t.pic_user?.name && t.pic_user.name.toLowerCase().includes(q)) ||
            (t.gudang_asal?.nama_gudang && t.gudang_asal.nama_gudang.toLowerCase().includes(q)) ||
            (t.gudang_tujuan?.nama_gudang && t.gudang_tujuan.nama_gudang.toLowerCase().includes(q))
        );
    }, [recentTransactions, searchTrx]);

    // Badge transaksi dengan pemetaan Proyek & Non Proyek
    const getBadgeTransaksi = (trx) => {
        const jenis = trx.jenis_transaksi || '';
        const subJenis = trx.sub_jenis || '';

        // Transaksi Keluar
        if (jenis === 'KELUAR' || subJenis === 'BARANG_KE_SITE' || subJenis === 'PEMAKAIAN_INTERNAL' || subJenis === 'PROYEK' || subJenis === 'NON PROYEK') {
            if (subJenis === 'BARANG_KE_SITE' || subJenis === 'PROYEK') {
                return (
                    <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold uppercase tracking-wider">
                        PROYEK
                    </Badge>
                );
            }
            if (subJenis === 'PEMAKAIAN_INTERNAL' || subJenis === 'NON PROYEK' || subJenis === 'NON_PROYEK') {
                return (
                    <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold uppercase tracking-wider">
                        NON PROYEK
                    </Badge>
                );
            }
            return (
                <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold uppercase tracking-wider">
                    KELUAR
                </Badge>
            );
        }

        // Transaksi Masuk & Lainnya
        switch (jenis) {
            case 'MASUK':
                if (subJenis === 'PEMINJAMAN') {
                    return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold">PINJAM</Badge>;
                }
                if (subJenis === 'PENGEMBALIAN') {
                    return <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold">KEMBALI</Badge>;
                }
                return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold">MASUK</Badge>;
            case 'TRANSFER':
                return <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 font-bold">TRANSFER</Badge>;
            case 'PINJAM':
                return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold">PINJAM</Badge>;
            case 'KEMBALI':
                return <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold">KEMBALI</Badge>;
            default:
                return <Badge variant="outline" className="font-semibold uppercase">{subJenis?.replace(/_/g, ' ') || jenis || '-'}</Badge>;
        }
    };

    return (
        <Card className="w-full bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Riwayat Transaksi Terakhir
                    </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari transaksi / PIC / rute..."
                            value={searchTrx}
                            onChange={(e) => setSearchTrx(e.target.value)}
                            className="pl-8 pr-3 py-1 text-xs bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors w-40 sm:w-60"
                        />
                    </div>
                    <Link href="/transaksi" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <span>Semua</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                    <Table className="w-full text-xs">
                        <TableHeader className="bg-slate-100 dark:bg-slate-950/90">
                            <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider px-4 py-2.5">No. Transaksi</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider px-2 py-2.5 text-center">Tipe</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider px-4 py-2.5">Detail / Rute</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider px-4 py-2.5">PIC</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((trx) => (
                                    <TableRow key={trx.id || trx.no_transaksi} className="border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <TableCell className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 py-3 px-4">
                                            {trx.no_transaksi}
                                            <span className="block font-normal text-[10px] text-slate-400">{trx.tanggal}</span>
                                        </TableCell>
                                        <TableCell className="text-center py-3 px-2">
                                            {getBadgeTransaksi(trx)}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-600 dark:text-slate-300 py-3 px-4">
                                            {trx.jenis_transaksi === 'MASUK' && (
                                                <span>
                                                    {trx.pihak_asal || trx.supplier?.nama_supplier || '-'} ➔ {trx.gudang_tujuan?.nama_gudang || '-'}
                                                </span>
                                            )}
                                            {trx.jenis_transaksi === 'KELUAR' && (
                                                <span>
                                                    {trx.gudang_asal?.nama_gudang || '-'} ➔ <strong className="text-slate-800 dark:text-slate-200">{trx.pihak_asal || '-'}</strong>
                                                </span>
                                            )}
                                            {trx.jenis_transaksi === 'TRANSFER' && (
                                                <span>
                                                    {trx.gudang_asal?.nama_gudang ?? '-'} ➔ {trx.gudang_tujuan?.nama_gudang ?? '-'}
                                                </span>
                                            )}
                                            {['PINJAM', 'KEMBALI'].includes(trx.jenis_transaksi) && (
                                                <span>{trx.keterangan || trx.pihak_asal || '-'}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500 py-3 px-4">
                                            {trx.pic_user?.name || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-400 text-xs">
                                        Tidak ada riwayat transaksi yang cocok.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}