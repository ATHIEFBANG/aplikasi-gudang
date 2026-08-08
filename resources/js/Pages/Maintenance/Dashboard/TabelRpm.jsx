import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Calendar, LayoutList } from 'lucide-react';

const getBulanNumber = (bulanVal) => {
    if (!bulanVal) return null;
    let blnNum = parseInt(bulanVal, 10);
    if (isNaN(blnNum)) {
        const str = String(bulanVal).toLowerCase();
        if (str.includes('jan')) blnNum = 1;
        else if (str.includes('feb')) blnNum = 2;
        else if (str.includes('mar')) blnNum = 3;
        else if (str.includes('apr')) blnNum = 4;
        else if (str.includes('mei') || str.includes('may')) blnNum = 5;
        else if (str.includes('jun')) blnNum = 6;
        else if (str.includes('jul')) blnNum = 7;
        else if (str.includes('agu') || str.includes('aug')) blnNum = 8;
        else if (str.includes('sep')) blnNum = 9;
        else if (str.includes('okt') || str.includes('oct')) blnNum = 10;
        else if (str.includes('nov')) blnNum = 11;
        else if (str.includes('des') || str.includes('dec')) blnNum = 12;
    }
    return (blnNum >= 1 && blnNum <= 12) ? blnNum : null;
};

export default function TabelRpm({ data = [] }) {
    const monthNumbers = Array.from({ length: 12 }, (_, i) => i + 1);

    const monthlyPivot = useMemo(() => {
        const counts = {
            OK: Array(12).fill(0),
            BELUM: Array(12).fill(0),
            REJECT: Array(12).fill(0),
            RETURN: Array(12).fill(0)
        };

        data.forEach(item => {
            const blnNum = getBulanNumber(item.bulan);
            if (blnNum) {
                const idx = blnNum - 1;
                const status = String(item.approve || item.status || '').toUpperCase();
                
                if (status === 'OK' || status === 'APPROVED') {
                    counts.OK[idx] += 1;
                } else if (status === 'REJECT' || status === 'REJECTED') {
                    counts.REJECT[idx] += 1;
                } else if (status === 'RETURN' || status === 'RETURNED') {
                    counts.RETURN[idx] += 1;
                } else {
                    counts.BELUM[idx] += 1;
                }
            }
        });

        const monthTotals = Array(12).fill(0);
        const monthPct = Array(12).fill(0);

        for (let m = 0; m < 12; m++) {
            const sum = counts.OK[m] + counts.BELUM[m] + counts.REJECT[m] + counts.RETURN[m];
            monthTotals[m] = sum;
            monthPct[m] = sum > 0 ? Math.round((counts.OK[m] / sum) * 100) : 0;
        }

        const rowTotals = {
            OK: counts.OK.reduce((a, b) => a + b, 0),
            BELUM: counts.BELUM.reduce((a, b) => a + b, 0),
            REJECT: counts.REJECT.reduce((a, b) => a + b, 0),
            RETURN: counts.RETURN.reduce((a, b) => a + b, 0)
        };

        const overallTotal = rowTotals.OK + rowTotals.BELUM + rowTotals.REJECT + rowTotals.RETURN;
        const overallPct = overallTotal > 0 ? Math.round((rowTotals.OK / overallTotal) * 100) : 0;

        return { counts, monthTotals, monthPct, rowTotals, overallTotal, overallPct };
    }, [data]);

    const { pivotRows, grandTotalRow } = useMemo(() => {
        const rtpMap = {};
        let totalOk = 0, totalBelum = 0, sumReject = 0, sumReturn = 0;

        data.forEach(item => {
            const rtpName = item.rtp || 'Unknown';
            if (!rtpMap[rtpName]) {
                rtpMap[rtpName] = { rtp: rtpName, ok: 0, belum: 0, reject: 0, returnVal: 0 };
            }

            const status = String(item.approve || item.status || '').toUpperCase();

            if (status === 'OK' || status === 'APPROVED') {
                rtpMap[rtpName].ok += 1;
                totalOk += 1;
            } else if (status === 'BELUM' || status === 'PENDING') {
                rtpMap[rtpName].belum += 1;
                totalBelum += 1;
            } else if (status === 'REJECT' || status === 'REJECTED') {
                rtpMap[rtpName].reject += 1;
                sumReject += 1;
            } else if (status === 'RETURN' || status === 'RETURNED') {
                rtpMap[rtpName].returnVal += 1;
                sumReturn += 1;
            } else {
                rtpMap[rtpName].belum += 1;
                totalBelum += 1;
            }
        });

        const rows = Object.values(rtpMap).map(row => {
            const rowTotal = row.ok + row.belum + row.reject + row.returnVal;
            const pct = rowTotal > 0 ? Math.round((row.ok / rowTotal) * 100) : 0;
            return { ...row, total: rowTotal, pct };
        }).sort((a, b) => a.rtp.localeCompare(b.rtp));

        const sumGrandTotal = totalOk + totalBelum + sumReject + sumReturn;
        const grandPct = sumGrandTotal > 0 ? Math.round((totalOk / sumGrandTotal) * 100) : 0;

        return {
            pivotRows: rows,
            grandTotalRow: { ok: totalOk, belum: totalBelum, reject: sumReject, returnVal: sumReturn, total: sumGrandTotal, pct: grandPct }
        };
    }, [data]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            
            {/* TABEL PIVOT BULANAN */}
            <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
                <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Tabel Pivot Status per Bulan
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="w-full no-scrollbar overflow-hidden">
                        <Table className="w-full text-center border-collapse">
                            <TableHeader className="bg-slate-100 dark:bg-slate-950/90">
                                <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                                    <TableHead rowSpan={2} className="text-[9px] font-bold text-slate-700 dark:text-slate-200 px-1 py-1 border-r border-slate-200 dark:border-slate-800/80 align-middle text-center w-[15%]">
                                        Row Labels
                                    </TableHead>
                                    <TableHead colSpan={12} className="text-[9px] font-bold text-center text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/80 py-0.5 border-b border-slate-200 dark:border-slate-800">
                                        Bulan
                                    </TableHead>
                                    <TableHead rowSpan={2} className="text-[9px] font-bold text-center text-slate-700 dark:text-slate-200 align-middle px-1 py-1 w-[12%]">
                                        Grand Total
                                    </TableHead>
                                </TableRow>
                                <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                                    {monthNumbers.map(m => (
                                        <TableHead key={m} className="text-[9px] font-semibold text-center text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800/40 px-0 py-0.5">
                                            {m}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* BARIS OK */}
                                <TableRow className="border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400 text-[9px] text-center px-0.5 py-1 border-r border-slate-100 dark:border-slate-800/30">OK</TableCell>
                                    {monthNumbers.map((m, idx) => (
                                        <TableCell key={m} className="text-center text-emerald-600 dark:text-emerald-400 text-[9px] px-0 py-1 border-r border-slate-100 dark:border-slate-800/30">
                                            {monthlyPivot.counts.OK[idx] || ''}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center font-bold text-emerald-600 dark:text-emerald-400 text-[9px] px-0.5 py-1">{monthlyPivot.rowTotals.OK || ''}</TableCell>
                                </TableRow>

                                {/* BARIS BELUM */}
                                <TableRow className="border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400 text-[9px] text-center px-0.5 py-1 border-r border-slate-100 dark:border-slate-800/30">Belum</TableCell>
                                    {monthNumbers.map((m, idx) => (
                                        <TableCell key={m} className="text-center text-amber-600 dark:text-amber-400 text-[9px] px-0 py-1 border-r border-slate-100 dark:border-slate-800/30">
                                            {monthlyPivot.counts.BELUM[idx] || ''}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center font-bold text-amber-600 dark:text-amber-400 text-[9px] px-0.5 py-1">{monthlyPivot.rowTotals.BELUM || ''}</TableCell>
                                </TableRow>

                                {/* BARIS REJECT */}
                                <TableRow className="border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                    <TableCell className="font-semibold text-rose-600 dark:text-rose-400 text-[9px] text-center px-0.5 py-1 border-r border-slate-100 dark:border-slate-800/30">Reject</TableCell>
                                    {monthNumbers.map((m, idx) => (
                                        <TableCell key={m} className="text-center text-rose-600 dark:text-rose-400 text-[9px] px-0 py-1 border-r border-slate-100 dark:border-slate-800/30">
                                            {monthlyPivot.counts.REJECT[idx] || ''}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center font-bold text-rose-600 dark:text-rose-400 text-[9px] px-0.5 py-1">{monthlyPivot.rowTotals.REJECT || ''}</TableCell>
                                </TableRow>

                                {/* BARIS RETURN */}
                                <TableRow className="border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                    <TableCell className="font-semibold text-sky-600 dark:text-sky-400 text-[9px] text-center px-0.5 py-1 border-r border-slate-100 dark:border-slate-800/30">Return</TableCell>
                                    {monthNumbers.map((m, idx) => (
                                        <TableCell key={m} className="text-center text-sky-600 dark:text-sky-400 text-[9px] px-0 py-1 border-r border-slate-100 dark:border-slate-800/30">
                                            {monthlyPivot.counts.RETURN[idx] || ''}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center font-bold text-sky-600 dark:text-sky-400 text-[9px] px-0.5 py-1">{monthlyPivot.rowTotals.RETURN || ''}</TableCell>
                                </TableRow>
                            </TableBody>
                            <TableFooter className="bg-slate-100 dark:bg-slate-950 border-t-2 border-slate-300 dark:border-slate-700 font-bold">
                                <TableRow>
                                    <TableCell className="text-[9px] font-bold text-slate-800 dark:text-slate-100 text-center px-0.5 py-1 border-r border-slate-200 dark:border-slate-800">Grand Total</TableCell>
                                    {monthNumbers.map((m, idx) => (
                                        <TableCell key={m} className="text-center text-[9px] font-bold text-slate-800 dark:text-slate-100 px-0 py-1 border-r border-slate-200 dark:border-slate-800">
                                            {monthlyPivot.monthTotals[idx] || ''}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center text-[9px] font-bold text-slate-800 dark:text-slate-100 px-0.5 py-1">{monthlyPivot.overallTotal}</TableCell>
                                </TableRow>
                                <TableRow className="border-t border-slate-200 dark:border-slate-800/80">
                                    <TableCell className="text-[9px] font-bold text-slate-800 dark:text-slate-100 text-center px-0.5 py-1 border-r border-slate-200 dark:border-slate-800">Persentase OK</TableCell>
                                    {monthNumbers.map((m, idx) => (
                                        <TableCell key={m} className="text-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400 px-0 py-1 border-r border-slate-200 dark:border-slate-800">
                                            {monthlyPivot.monthTotals[idx] > 0 ? `${monthlyPivot.monthPct[idx]}%` : '-'}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400 px-0.5 py-1">{monthlyPivot.overallPct}%</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* TABEL PIVOT RTP / AREA */}
            <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
                <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2">
                        <LayoutList className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Tabel Pivot Status per RTP / Area
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="w-full no-scrollbar overflow-x-auto">
                        <Table className="w-full text-xs border-collapse">
                            <TableHeader className="bg-slate-100 dark:bg-slate-950/90">
                                <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-bold text-slate-700 dark:text-slate-200 py-2 px-3 text-left">RTP / Area</TableHead>
                                    <TableHead className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 py-2 px-2 text-center">OK</TableHead>
                                    <TableHead className="text-[10px] font-bold text-amber-600 dark:text-amber-400 py-2 px-2 text-center">Belum</TableHead>
                                    <TableHead className="text-[10px] font-bold text-rose-600 dark:text-rose-400 py-2 px-2 text-center">Reject</TableHead>
                                    <TableHead className="text-[10px] font-bold text-sky-600 dark:text-sky-400 py-2 px-2 text-center">Return</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-700 dark:text-slate-200 py-2 px-2 text-center">Total</TableHead>
                                    <TableHead className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 py-2 px-2 text-center">% OK</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pivotRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-slate-400 py-6 text-xs">Tidak ada data tersedia</TableCell>
                                    </TableRow>
                                ) : (
                                    pivotRows.map((row, idx) => (
                                        <TableRow key={idx} className="border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                            <TableCell className="font-medium text-slate-800 dark:text-slate-200 text-xs py-2 px-3 text-left truncate max-w-[150px]">{row.rtp}</TableCell>
                                            <TableCell className="text-center text-emerald-600 dark:text-emerald-400 text-xs py-2 px-2 font-medium">{row.ok || 0}</TableCell>
                                            <TableCell className="text-center text-amber-600 dark:text-amber-400 text-xs py-2 px-2 font-medium">{row.belum || 0}</TableCell>
                                            <TableCell className="text-center text-rose-600 dark:text-rose-400 text-xs py-2 px-2 font-medium">{row.reject || 0}</TableCell>
                                            <TableCell className="text-center text-sky-600 dark:text-sky-400 text-xs py-2 px-2 font-medium">{row.returnVal || 0}</TableCell>
                                            <TableCell className="text-center text-slate-800 dark:text-slate-100 font-bold text-xs py-2 px-2">{row.total}</TableCell>
                                            <TableCell className="text-center text-emerald-600 dark:text-emerald-400 font-semibold text-xs py-2 px-2">{row.pct}%</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            <TableFooter className="bg-slate-100 dark:bg-slate-950 border-t-2 border-slate-300 dark:border-slate-700 font-bold">
                                <TableRow>
                                    <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-100 py-2 px-3 text-left">Grand Total</TableCell>
                                    <TableCell className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 py-2 px-2">{grandTotalRow.ok}</TableCell>
                                    <TableCell className="text-center text-xs font-bold text-amber-600 dark:text-amber-400 py-2 px-2">{grandTotalRow.belum}</TableCell>
                                    <TableCell className="text-center text-xs font-bold text-rose-600 dark:text-rose-400 py-2 px-2">{grandTotalRow.reject}</TableCell>
                                    <TableCell className="text-center text-xs font-bold text-sky-600 dark:text-sky-400 py-2 px-2">{grandTotalRow.returnVal}</TableCell>
                                    <TableCell className="text-center text-xs font-bold text-slate-800 dark:text-slate-100 py-2 px-2">{grandTotalRow.total}</TableCell>
                                    <TableCell className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 py-2 px-2">{grandTotalRow.pct}%</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}