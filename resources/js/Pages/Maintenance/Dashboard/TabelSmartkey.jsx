import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Users, Search } from 'lucide-react';

export default function TabelSmartkey({ tableData = [] }) {
    const [search, setSearch] = useState('');

    const rawData = useMemo(() => {
        if (Array.isArray(tableData)) return tableData;
        if (tableData && Array.isArray(tableData.data)) return tableData.data;
        if (tableData && Array.isArray(tableData.tableData)) return tableData.tableData;
        if (tableData && Array.isArray(tableData.table_data)) return tableData.table_data;
        return [];
    }, [tableData]);

    const { pivotRows, grandTotal } = useMemo(() => {
        if (!rawData || rawData.length === 0) {
            return { pivotRows: [], grandTotal: { locked: 0, unlocked: 0, na: 0, total: 0 } };
        }

        const rows = rawData
            .map((item) => {
                const locked = Number(item.locked ?? item.count_locked ?? 0);
                const unlocked = Number(item.unlocked ?? item.count_unlocked ?? 0);
                const na = Number(item.na ?? item.count_na ?? 0);
                const total = Number(item.total ?? (locked + unlocked + na));

                return {
                    ksm: item.ksm || item.ksm_name || item.personil_ksm || item.nama_ksm || 'Unassigned',
                    locked,
                    unlocked,
                    na,
                    total,
                };
            })
            .sort((a, b) => b.total - a.total || a.ksm.localeCompare(b.ksm));

        const grand = rows.reduce(
            (acc, curr) => ({
                locked: acc.locked + curr.locked,
                unlocked: acc.unlocked + curr.unlocked,
                na: acc.na + curr.na,
                total: acc.total + curr.total,
            }),
            { locked: 0, unlocked: 0, na: 0, total: 0 }
        );

        return { pivotRows: rows, grandTotal: grand };
    }, [rawData]);

    const filteredRows = useMemo(() => {
        if (!search.trim()) return pivotRows;
        return pivotRows.filter((r) => r.ksm.toLowerCase().includes(search.toLowerCase().trim()));
    }, [pivotRows, search]);

    return (
        <Card className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Tabel Pivot Status Aktivitas per Personil KSM
                    </CardTitle>
                </div>

                {pivotRows.length > 0 && (
                    <div className="relative max-w-xs">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari Personil KSM..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-1 text-xs bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-colors w-36 sm:w-48"
                        />
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-0">
                <div className="w-full no-scrollbar overflow-x-auto max-h-[420px]">
                    <Table className="w-full text-xs border-collapse">
                        <TableHeader className="bg-slate-100 dark:bg-slate-950/90 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 py-2.5 px-3 text-left">
                                    Personil KSM
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 py-2.5 px-2 text-center">
                                    Locked
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 py-2.5 px-2 text-center">
                                    Unlocked
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-2.5 px-2 text-center">
                                    #N/A
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 py-2.5 px-2 text-center">
                                    Total
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-slate-400 py-8 text-xs">
                                        {search ? 'Tidak ada personil KSM yang cocok dengan pencarian' : 'Tidak ada data tersedia'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRows.map((row, idx) => (
                                    <TableRow 
                                        key={idx} 
                                        className="border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        <TableCell className="font-medium text-slate-800 dark:text-slate-200 text-xs py-2 px-3 text-left truncate max-w-[200px]">
                                            {row.ksm}
                                        </TableCell>
                                        <TableCell className="text-center text-sky-600 dark:text-sky-400 text-xs py-2 px-2 font-semibold">
                                            {row.locked.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell className="text-center text-amber-600 dark:text-amber-400 text-xs py-2 px-2 font-semibold">
                                            {row.unlocked.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell className="text-center text-slate-500 dark:text-slate-400 text-xs py-2 px-2 font-medium">
                                            {row.na.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell className="text-center text-slate-800 dark:text-slate-100 font-bold text-xs py-2 px-2">
                                            {row.total.toLocaleString('id-ID')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>

                        <TableFooter className="bg-slate-100 dark:bg-slate-950 border-t-2 border-slate-300 dark:border-slate-700 font-bold sticky bottom-0 z-10">
                            <TableRow>
                                <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-100 py-2.5 px-3 text-left uppercase tracking-wider">
                                    Grand Total
                                </TableCell>
                                <TableCell className="text-center text-xs font-bold text-sky-600 dark:text-sky-400 py-2.5 px-2">
                                    {grandTotal.locked.toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="text-center text-xs font-bold text-amber-600 dark:text-amber-400 py-2.5 px-2">
                                    {grandTotal.unlocked.toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-2.5 px-2">
                                    {grandTotal.na.toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="text-center text-xs font-bold text-slate-800 dark:text-slate-100 py-2.5 px-2">
                                    {grandTotal.total.toLocaleString('id-ID')}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}