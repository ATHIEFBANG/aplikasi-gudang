import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { TableProperties, Layers } from 'lucide-react';

export default function TabelCombat({ tableData = [] }) {
    // Normalisasi data mentah
    const rawData = useMemo(() => {
        if (Array.isArray(tableData)) return tableData;
        if (tableData && Array.isArray(tableData.data)) return tableData.data;
        return [];
    }, [tableData]);

    // Helper pencari nilai atribut aman (mendukung spasi maupun underscore _)
    const getValueByPattern = (item, regexPatterns) => {
        if (!item || typeof item !== 'object') return null;
        const keys = Object.keys(item);
        for (const pattern of regexPatterns) {
            const foundKey = keys.find(k => pattern.test(k.trim()));
            if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) {
                const val = String(item[foundKey]).trim();
                if (val !== '') return val;
            }
        }
        return null;
    };

    const normalizeStatusLabel = (rawVal) => {
        if (!rawVal) return 'Unassigned';
        const str = String(rawVal).toUpperCase().trim();
        if (str.includes('ONSITE') || str.startsWith('2.')) return 'On-Site';
        if (str.includes('READY') || str.startsWith('5.')) return 'Ready To Use';
        if (str.includes('BROKEN') || str.includes('INOP') || str.startsWith('6.')) return 'Broken / Inop';
        return 'Unassigned';
    };

    const normalizeTypeLabel = (rawVal) => {
        if (!rawVal) return 'N/A';
        const str = String(rawVal).trim();
        if (str === '' || str.toUpperCase() === 'NULL' || str.toUpperCase() === 'UNASSIGNED') return 'N/A';
        return str;
    };

    const normalizeHeightLabel = (rawVal) => {
        if (!rawVal) return 'N/A';
        let str = String(rawVal).trim();
        if (str === '' || str.toUpperCase() === 'NULL') return 'N/A';
        if (!str.toUpperCase().endsWith('M') && !isNaN(parseFloat(str))) {
            str = `${parseFloat(str)} M`;
        }
        return str;
    };

    const getStatus = (item) => {
        const val = item.status_combat || item.status || getValueByPattern(item, [/status[\s_]*combat/i, /^status$/i]);
        return normalizeStatusLabel(val);
    };

    const getType = (item) => {
        const val = item.type_combat || item.tipe_combat || item.type || item.tipe || getValueByPattern(item, [/type[\s_]*combat/i, /tipe[\s_]*combat/i, /^type$/i, /^tipe$/i]);
        return normalizeTypeLabel(val);
    };

    const getHeight = (item) => {
        const val = item.ketinggian_combat || item.ketinggian || getValueByPattern(item, [/ketinggian[\s_]*combat/i, /ketinggian/i, /height/i]);
        return normalizeHeightLabel(val);
    };

    // ORDERING KUSTOM BARIS STATUS
    const STATUS_ORDER = ['On-Site', 'Ready To Use', 'Broken / Inop', 'Unassigned'];

    // 1. PIVOT 1: Status Combat Berdasarkan Ketinggian
    const pivotKetinggian = useMemo(() => {
        if (!rawData.length) return { cols: [], rows: [], grandTotals: {}, totalAll: 0 };

        const colSet = new Set();
        rawData.forEach((item) => {
            colSet.add(getHeight(item));
        });

        // Urutkan kolom ketinggian secara numerik (6 M, 20 M, 25 M, dst)
        const cols = Array.from(colSet).sort((a, b) => {
            if (a === 'N/A') return -1;
            if (b === 'N/A') return 1;
            const numA = parseFloat(a) || 0;
            const numB = parseFloat(b) || 0;
            return numA - numB;
        });

        const rowGroup = {};
        rawData.forEach((item) => {
            const status = getStatus(item);
            const height = getHeight(item);

            if (!rowGroup[status]) rowGroup[status] = { status, counts: {}, rowTotal: 0 };
            rowGroup[status].counts[height] = (rowGroup[status].counts[height] || 0) + 1;
            rowGroup[status].rowTotal += 1;
        });

        const grandTotals = {};
        cols.forEach((col) => {
            grandTotals[col] = Object.values(rowGroup).reduce((acc, curr) => acc + (curr.counts[col] || 0), 0);
        });

        const rows = Object.values(rowGroup).sort((a, b) => {
            const idxA = STATUS_ORDER.indexOf(a.status);
            const idxB = STATUS_ORDER.indexOf(b.status);
            return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
        });

        return { cols, rows, grandTotals, totalAll: rawData.length };
    }, [rawData]);

    // 2. PIVOT 2: Status Combat Berdasarkan Tipe Armada
    const pivotTipe = useMemo(() => {
        if (!rawData.length) return { cols: [], rows: [], grandTotals: {}, totalAll: 0 };

        const colSet = new Set();
        rawData.forEach((item) => {
            colSet.add(getType(item));
        });
        const cols = Array.from(colSet).sort();

        const rowGroup = {};
        rawData.forEach((item) => {
            const status = getStatus(item);
            const type = getType(item);

            if (!rowGroup[status]) rowGroup[status] = { status, counts: {}, rowTotal: 0 };
            rowGroup[status].counts[type] = (rowGroup[status].counts[type] || 0) + 1;
            rowGroup[status].rowTotal += 1;
        });

        const grandTotals = {};
        cols.forEach((col) => {
            grandTotals[col] = Object.values(rowGroup).reduce((acc, curr) => acc + (curr.counts[col] || 0), 0);
        });

        const rows = Object.values(rowGroup).sort((a, b) => {
            const idxA = STATUS_ORDER.indexOf(a.status);
            const idxB = STATUS_ORDER.indexOf(b.status);
            return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
        });

        return { cols, rows, grandTotals, totalAll: rawData.length };
    }, [rawData]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
            
            {/* TABEL 1: STATUS BERDASARKAN KETINGGIAN */}
            <Card className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-sm flex flex-col overflow-hidden">
                <CardHeader className="pb-3 pt-4 px-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <TableProperties className="w-4 h-4 text-red-600" />
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            Tabel Status COMBAT Berdasarkan Ketinggian
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <Table className="w-full text-xs border-collapse">
                        <TableHeader className="bg-slate-100/90 dark:bg-slate-950/90">
                            <TableRow className="border-slate-200 dark:border-slate-800">
                                <TableHead className="font-bold text-slate-700 dark:text-slate-200 py-2.5 px-3">
                                    Status COMBAT
                                </TableHead>
                                {pivotKetinggian.cols.map((col) => (
                                    <TableHead key={col} className="font-bold text-center text-slate-700 dark:text-slate-200 py-2.5 px-2 whitespace-nowrap">
                                        {col}
                                    </TableHead>
                                ))}
                                <TableHead className="font-bold text-center text-slate-900 dark:text-white py-2.5 px-3 bg-slate-200/40 dark:bg-slate-800/40">
                                    Total
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pivotKetinggian.rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={pivotKetinggian.cols.length + 2} className="text-center py-6 text-slate-400">
                                        Tidak ada data terdeteksi
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pivotKetinggian.rows.map((row, idx) => (
                                    <TableRow key={idx} className="border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200 py-2 px-3">
                                            {row.status}
                                        </TableCell>
                                        {pivotKetinggian.cols.map((col) => {
                                            const val = row.counts[col] || 0;
                                            return (
                                                <TableCell key={col} className={`text-center py-2 px-2 ${val > 0 ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    {val > 0 ? val : '-'}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell className="text-center font-bold text-red-600 dark:text-red-400 py-2 px-3 bg-slate-100/30 dark:bg-slate-800/20">
                                            {row.rowTotal}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        <TableFooter className="bg-slate-100 dark:bg-slate-950 border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                            <TableRow>
                                <TableCell className="py-2.5 px-3 uppercase text-slate-800 dark:text-slate-100">Grand Total</TableCell>
                                {pivotKetinggian.cols.map((col) => (
                                    <TableCell key={col} className="text-center py-2.5 px-2 text-slate-800 dark:text-slate-100">
                                        {pivotKetinggian.grandTotals[col] || 0}
                                    </TableCell>
                                ))}
                                <TableCell className="text-center py-2.5 px-3 text-red-600 dark:text-red-400 text-xs">
                                    {pivotKetinggian.totalAll}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>

            {/* TABEL 2: STATUS BERDASARKAN TIPE ARMADA */}
            <Card className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-sm flex flex-col overflow-hidden">
                <CardHeader className="pb-3 pt-4 px-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-red-600" />
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            Tabel Status COMBAT Berdasarkan Tipe Armada
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <Table className="w-full text-xs border-collapse">
                        <TableHeader className="bg-slate-100/90 dark:bg-slate-950/90">
                            <TableRow className="border-slate-200 dark:border-slate-800">
                                <TableHead className="font-bold text-slate-700 dark:text-slate-200 py-2.5 px-3">
                                    Status COMBAT
                                </TableHead>
                                {pivotTipe.cols.map((col) => (
                                    <TableHead key={col} className="font-bold text-center text-slate-700 dark:text-slate-200 py-2.5 px-2 whitespace-nowrap">
                                        {col}
                                    </TableHead>
                                ))}
                                <TableHead className="font-bold text-center text-slate-900 dark:text-white py-2.5 px-3 bg-slate-200/40 dark:bg-slate-800/40">
                                    Total
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pivotTipe.rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={pivotTipe.cols.length + 2} className="text-center py-6 text-slate-400">
                                        Tidak ada data terdeteksi
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pivotTipe.rows.map((row, idx) => (
                                    <TableRow key={idx} className="border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200 py-2 px-3">
                                            {row.status}
                                        </TableCell>
                                        {pivotTipe.cols.map((col) => {
                                            const val = row.counts[col] || 0;
                                            return (
                                                <TableCell key={col} className={`text-center py-2 px-2 ${val > 0 ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    {val > 0 ? val : '-'}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell className="text-center font-bold text-red-600 dark:text-red-400 py-2 px-3 bg-slate-100/30 dark:bg-slate-800/20">
                                            {row.rowTotal}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        <TableFooter className="bg-slate-100 dark:bg-slate-950 border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                            <TableRow>
                                <TableCell className="py-2.5 px-3 uppercase text-slate-800 dark:text-slate-100">Grand Total</TableCell>
                                {pivotTipe.cols.map((col) => (
                                    <TableCell key={col} className="text-center py-2.5 px-2 text-slate-800 dark:text-slate-100">
                                        {pivotTipe.grandTotals[col] || 0}
                                    </TableCell>
                                ))}
                                <TableCell className="text-center py-2.5 px-3 text-red-600 dark:text-red-400 text-xs">
                                    {pivotTipe.totalAll}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}