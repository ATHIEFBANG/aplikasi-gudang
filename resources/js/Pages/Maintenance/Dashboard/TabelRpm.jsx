import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Calendar, LayoutList } from 'lucide-react';

export default function TabelRpm({ monthlyPivot = {}, rtpPivot = [] }) {
  const monthNumbers = Array.from({ length: 12 }, (_, i) => i + 1);

  // Destructure data Pivot Bulanan dari Controller dengan Nilai Default Aman
  const {
    counts = { OK: Array(12).fill(0), BELUM: Array(12).fill(0), REJECT: Array(12).fill(0), RETURN: Array(12).fill(0) },
    monthTotals = Array(12).fill(0),
    monthPct = Array(12).fill(0),
    rowTotals = { OK: 0, BELUM: 0, REJECT: 0, RETURN: 0 },
    overallTotal = 0,
    overallPct = 0
  } = monthlyPivot;

  // Hitung Grand Total RTP secara ringan hanya dari array rtpPivot
  const grandTotalRow = useMemo(() => {
    let ok = 0, belum = 0, reject = 0, returnVal = 0, total = 0;
    
    rtpPivot.forEach(row => {
      ok += row.ok || 0;
      belum += row.belum || 0;
      reject += row.reject || 0;
      returnVal += row.returnVal || 0;
      total += row.total || 0;
    });

    const pct = total > 0 ? Math.round((ok / total) * 100) : 0;
    return { ok, belum, reject, returnVal, total, pct };
  }, [rtpPivot]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      
      {/* 1. TABEL PIVOT BULANAN */}
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
          <div className="w-full no-scrollbar overflow-x-auto">
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
                      {counts.OK[idx] || ''}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-emerald-600 dark:text-emerald-400 text-[9px] px-0.5 py-1">{rowTotals.OK || ''}</TableCell>
                </TableRow>

                {/* BARIS BELUM */}
                <TableRow className="border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                  <TableCell className="font-semibold text-amber-600 dark:text-amber-400 text-[9px] text-center px-0.5 py-1 border-r border-slate-100 dark:border-slate-800/30">Belum</TableCell>
                  {monthNumbers.map((m, idx) => (
                    <TableCell key={m} className="text-center text-amber-600 dark:text-amber-400 text-[9px] px-0 py-1 border-r border-slate-100 dark:border-slate-800/30">
                      {counts.BELUM[idx] || ''}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-amber-600 dark:text-amber-400 text-[9px] px-0.5 py-1">{rowTotals.BELUM || ''}</TableCell>
                </TableRow>

                {/* BARIS REJECT */}
                <TableRow className="border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                  <TableCell className="font-semibold text-rose-600 dark:text-rose-400 text-[9px] text-center px-0.5 py-1 border-r border-slate-100 dark:border-slate-800/30">Reject</TableCell>
                  {monthNumbers.map((m, idx) => (
                    <TableCell key={m} className="text-center text-rose-600 dark:text-rose-400 text-[9px] px-0 py-1 border-r border-slate-100 dark:border-slate-800/30">
                      {counts.REJECT[idx] || ''}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-rose-600 dark:text-rose-400 text-[9px] px-0.5 py-1">{rowTotals.REJECT || ''}</TableCell>
                </TableRow>

                {/* BARIS RETURN */}
                <TableRow className="border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                  <TableCell className="font-semibold text-sky-600 dark:text-sky-400 text-[9px] text-center px-0.5 py-1 border-r border-slate-100 dark:border-slate-800/30">Return</TableCell>
                  {monthNumbers.map((m, idx) => (
                    <TableCell key={m} className="text-center text-sky-600 dark:text-sky-400 text-[9px] px-0 py-1 border-r border-slate-100 dark:border-slate-800/30">
                      {counts.RETURN[idx] || ''}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-sky-600 dark:text-sky-400 text-[9px] px-0.5 py-1">{rowTotals.RETURN || ''}</TableCell>
                </TableRow>
              </TableBody>

              <TableFooter className="bg-slate-100 dark:bg-slate-950 border-t-2 border-slate-300 dark:border-slate-700 font-bold">
                {/* GRAND TOTAL */}
                <TableRow>
                  <TableCell className="text-[9px] font-bold text-slate-800 dark:text-slate-100 text-center px-0.5 py-1 border-r border-slate-200 dark:border-slate-800">Grand Total</TableCell>
                  {monthNumbers.map((m, idx) => (
                    <TableCell key={m} className="text-center text-[9px] font-bold text-slate-800 dark:text-slate-100 px-0 py-1 border-r border-slate-200 dark:border-slate-800">
                      {monthTotals[idx] || ''}
                    </TableCell>
                  ))}
                  <TableCell className="text-center text-[9px] font-bold text-slate-800 dark:text-slate-100 px-0.5 py-1">{overallTotal}</TableCell>
                </TableRow>

                {/* PERSENTASE OK */}
                <TableRow className="border-t border-slate-200 dark:border-slate-800/80">
                  <TableCell className="text-[9px] font-bold text-slate-800 dark:text-slate-100 text-center px-0.5 py-1 border-r border-slate-200 dark:border-slate-800">Persentase OK</TableCell>
                  {monthNumbers.map((m, idx) => (
                    <TableCell key={m} className="text-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400 px-0 py-1 border-r border-slate-200 dark:border-slate-800">
                      {monthTotals[idx] > 0 ? `${monthPct[idx]}%` : '-'}
                    </TableCell>
                  ))}
                  <TableCell className="text-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400 px-0.5 py-1">
                    {overallTotal > 0 ? `${overallPct}%` : '-'}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 2. TABEL PIVOT STATUS PER RTP */}
      <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <LayoutList className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Tabel Pivot Status per RTP
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto no-scrollbar">
            <Table className="w-full text-center border-collapse">
              <TableHeader className="bg-slate-100 dark:bg-slate-950/90">
                <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold text-slate-700 dark:text-slate-200 px-3 py-2 text-left">RTP / Region</TableHead>
                  <TableHead className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-2">OK</TableHead>
                  <TableHead className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-2">Belum</TableHead>
                  <TableHead className="text-[10px] font-bold text-rose-600 dark:text-rose-400 px-2 py-2">Reject</TableHead>
                  <TableHead className="text-[10px] font-bold text-sky-600 dark:text-sky-400 px-2 py-2">Return</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-700 dark:text-slate-200 px-2 py-2">Total</TableHead>
                  <TableHead className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-2">% OK</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rtpPivot.length > 0 ? (
                  rtpPivot.map((row) => (
                    <TableRow key={row.rtp} className="border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20 text-[10px]">
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200 text-left px-3 py-1.5">{row.rtp}</TableCell>
                      <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1.5">{row.ok || '-'}</TableCell>
                      <TableCell className="text-amber-600 dark:text-amber-400 font-medium px-2 py-1.5">{row.belum || '-'}</TableCell>
                      <TableCell className="text-rose-600 dark:text-rose-400 font-medium px-2 py-1.5">{row.reject || '-'}</TableCell>
                      <TableCell className="text-sky-600 dark:text-sky-400 font-medium px-2 py-1.5">{row.returnVal || '-'}</TableCell>
                      <TableCell className="font-bold text-slate-800 dark:text-slate-100 px-2 py-1.5">{row.total}</TableCell>
                      <TableCell className="font-bold text-emerald-600 dark:text-emerald-400 px-2 py-1.5">{row.pct}%</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-xs text-slate-400">
                      Tidak ada data RTP tersedia
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter className="bg-slate-100 dark:bg-slate-950 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-[10px]">
                <TableRow>
                  <TableCell className="text-left font-bold text-slate-800 dark:text-slate-100 px-3 py-2">Grand Total</TableCell>
                  <TableCell className="text-emerald-600 dark:text-emerald-400 px-2 py-2">{grandTotalRow.ok}</TableCell>
                  <TableCell className="text-amber-600 dark:text-amber-400 px-2 py-2">{grandTotalRow.belum}</TableCell>
                  <TableCell className="text-rose-600 dark:text-rose-400 px-2 py-2">{grandTotalRow.reject}</TableCell>
                  <TableCell className="text-sky-600 dark:text-sky-400 px-2 py-2">{grandTotalRow.returnVal}</TableCell>
                  <TableCell className="text-slate-800 dark:text-slate-100 px-2 py-2">{grandTotalRow.total}</TableCell>
                  <TableCell className="text-emerald-600 dark:text-emerald-400 px-2 py-2">{grandTotalRow.pct}%</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}