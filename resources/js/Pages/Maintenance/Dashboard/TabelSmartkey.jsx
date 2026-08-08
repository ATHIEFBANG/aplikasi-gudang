import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Users } from 'lucide-react';

export default function TabelSmartkey({ data = [] }) {
    // ----------------------------------------------------
    // KALKULASI PIVOT KSM
    // ----------------------------------------------------
    const { pivotRows, grandTotal } = useMemo(() => {
        const ksmMap = {};

        data.forEach((item) => {
            const ksmName = item.ksm || 'Unassigned';
            if (!ksmMap[ksmName]) {
                ksmMap[ksmName] = { ksm: ksmName, locked: 0, unlocked: 0, na: 0, total: 0 };
            }

            const sa = String(item.status_aktifitas || '').trim().toLowerCase();

            if (sa === 'locked') {
                ksmMap[ksmName].locked += 1;
            } else if (sa === 'unlocked') {
                ksmMap[ksmName].unlocked += 1;
            } else {
                ksmMap[ksmName].na += 1;
            }

            ksmMap[ksmName].total += 1;
        });

        const rows = Object.values(ksmMap).sort((a, b) => a.ksm.localeCompare(b.ksm));

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
    }, [data]);

    return (
        <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            {/* CARD HEADER */}
            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Tabel Pivot Status Aktivitas per Personil KSM
                    </CardTitle>
                </div>
            </CardHeader>

            {/* CARD CONTENT */}
            <CardContent className="p-0">
                <div className="w-full no-scrollbar overflow-x-auto">
                    <Table className="w-full text-xs border-collapse">
                        {/* HEADER TABEL - IDENTIK DENGAN TABEL RPM */}
                        <TableHeader className="bg-slate-100 dark:bg-slate-950/90">
                            <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold text-slate-700 dark:text-slate-200 py-2 px-3 text-left">
                                    Personil KSM
                                </TableHead>
                                <TableHead className="text-[10px] font-bold text-sky-600 dark:text-sky-400 py-2 px-2 text-center">
                                    Locked
                                </TableHead>
                                <TableHead className="text-[10px] font-bold text-amber-600 dark:text-amber-400 py-2 px-2 text-center">
                                    Unlocked
                                </TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-500 dark:text-slate-400 py-2 px-2 text-center">
                                    #N/A
                                </TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-700 dark:text-slate-200 py-2 px-2 text-center">
                                    Total
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        {/* BODY TABEL */}
                        <TableBody>
                            {pivotRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-slate-400 py-6 text-xs">
                                        Tidak ada data tersedia
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pivotRows.map((row, idx) => (
                                    <TableRow 
                                        key={idx} 
                                        className="border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                    >
                                        <TableCell className="font-medium text-slate-800 dark:text-slate-200 text-xs py-2 px-3 text-left truncate max-w-[180px]">
                                            {row.ksm}
                                        </TableCell>
                                        <TableCell className="text-center text-sky-600 dark:text-sky-400 text-xs py-2 px-2 font-medium">
                                            {row.locked || 0}
                                        </TableCell>
                                        <TableCell className="text-center text-amber-600 dark:text-amber-400 text-xs py-2 px-2 font-medium">
                                            {row.unlocked || 0}
                                        </TableCell>
                                        <TableCell className="text-center text-slate-500 dark:text-slate-400 text-xs py-2 px-2 font-medium">
                                            {row.na || 0}
                                        </TableCell>
                                        <TableCell className="text-center text-slate-800 dark:text-slate-100 font-bold text-xs py-2 px-2">
                                            {row.total}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>

                        {/* FOOTER TABEL - GRAND TOTAL */}
                        <TableFooter className="bg-slate-100 dark:bg-slate-950 border-t-2 border-slate-300 dark:border-slate-700 font-bold">
                            <TableRow>
                                <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-100 py-2 px-3 text-left">
                                    Grand Total
                                </TableCell>
                                <TableCell className="text-center text-xs font-bold text-sky-600 dark:text-sky-400 py-2 px-2">
                                    {grandTotal.locked}
                                </TableCell>
                                <TableCell className="text-center text-xs font-bold text-amber-600 dark:text-amber-400 py-2 px-2">
                                    {grandTotal.unlocked}
                                </TableCell>
                                <TableCell className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-2 px-2">
                                    {grandTotal.na}
                                </TableCell>
                                <TableCell className="text-center text-xs font-bold text-slate-800 dark:text-slate-100 py-2 px-2">
                                    {grandTotal.total}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}