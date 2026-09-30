import React from 'react';
import { Pencil, RotateCcw, MoreHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const geometricHeader = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 100" preserveAspectRatio="none">
    <defs>
        <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0d3978"/>
            <stop offset="50%" stop-color="#092b5c"/>
            <stop offset="100%" stop-color="#061c3c"/>
        </linearGradient>

        <linearGradient id="blueAccent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#147cff"/>
            <stop offset="100%" stop-color="#0752c9"/>
        </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="1600" height="100" fill="url(#base)"/>

    <!-- Left geometric accent -->
    <polygon
        points="0,0 155,0 80,100 0,100"
        fill="url(#blueAccent)"
        opacity=".95"
    />

    <polygon
        points="55,0 185,0 110,100 25,100"
        fill="#0a5fd8"
        opacity=".55"
    />

    <!-- Left thin diagonal -->
    <polygon
        points="145,0 175,0 100,100 72,100"
        fill="#38a0ff"
        opacity=".25"
    />

    <!-- Subtle center geometric line -->
    <polygon
        points="650,0 660,0 585,100 575,100"
        fill="#2386f5"
        opacity=".10"
    />

    <!-- Right geometric accent -->
    <polygon
        points="1510,0 1600,0 1600,100 1435,100"
        fill="#0d58c7"
        opacity=".55"
    />

    <polygon
        points="1560,0 1600,0 1600,100 1490,100"
        fill="url(#blueAccent)"
        opacity=".95"
    />

    <polygon
        points="1525,0 1555,0 1480,100 1450,100"
        fill="#49a5ff"
        opacity=".35"
    />

    <!-- Thin geometric lines -->
    <line
        x1="0"
        y1="99"
        x2="1600"
        y2="99"
        stroke="#4da5ff"
        stroke-opacity=".45"
        stroke-width="1"
    />

    <line
        x1="160"
        y1="0"
        x2="85"
        y2="100"
        stroke="#56aeff"
        stroke-opacity=".25"
        stroke-width="1"
    />

    <line
        x1="1515"
        y1="0"
        x2="1440"
        y2="100"
        stroke="#56aeff"
        stroke-opacity=".25"
        stroke-width="1"
    />
</svg>
`;

const geometricHeaderUrl = `url("data:image/svg+xml,${encodeURIComponent(geometricHeader)}")`;

export default function Tabel({
    data = [],
    columns = [],
    selectedIds = [],
    onSelectAll,
    onSelectRow,
    onEditRow,
    onCancelRow,
    mainTab = 'MASUK',
    getItemId = (item) => item.id,
    getRowNumber,
    emptyMessage = 'Tidak ada data ditemukan.',
    zoomLevel = 100,
}) {
    const isAllSelected =
        data.length > 0 &&
        data.every((item) => selectedIds.includes(getItemId(item)));

    const isSomeSelected =
        data.some((item) => selectedIds.includes(getItemId(item))) &&
        !isAllSelected;

    return (
        <div
            className="w-full overflow-x-auto transition-all duration-200 ease-out"
            style={{ zoom: `${zoomLevel}%` }}
        >
            <table className="w-full border-collapse text-left text-xs">
                <thead>
                    <tr
                        className="border-b border-blue-400/40 text-white font-bold uppercase tracking-wider text-[11px] select-none"
                        style={{
                            backgroundColor: '#092b5c',
                            backgroundImage: geometricHeaderUrl,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                        {/* KOLOM AKSI / CHECKBOX */}
                        {(onSelectAll || onSelectRow || onEditRow || onCancelRow) && (
                            <th className="py-3 px-3 w-16 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    {onSelectAll && (
                                        <Checkbox
                                            checked={isAllSelected}
                                            data-state={
                                                isSomeSelected
                                                    ? 'indeterminate'
                                                    : isAllSelected
                                                    ? 'checked'
                                                    : 'unchecked'
                                            }
                                            onCheckedChange={onSelectAll}
                                            className="h-4 w-4 rounded-sm border-white/70 bg-white/10"
                                        />
                                    )}
                                    <span>Aksi</span>
                                </div>
                            </th>
                        )}

                        {/* NO URUT */}
                        {getRowNumber && (
                            <th className="py-3 px-3 w-12 text-center">
                                No
                            </th>
                        )}

                        {/* DAFTAR KOLOM */}
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`py-3 px-3 whitespace-nowrap ${col.className || ''}`}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={
                                    columns.length +
                                    (onSelectAll || onSelectRow || onEditRow || onCancelRow ? 1 : 0) +
                                    (getRowNumber ? 1 : 0)
                                }
                                className="py-10 text-center text-xs text-slate-400"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((item, index) => {
                            const id = getItemId(item);
                            const isSelected = selectedIds.includes(id);
                            const isCancelled = item.status === 'CANCELLED';
                            const showCancelOption = (mainTab === 'KELUAR' || mainTab === 'TRANSFER') && !isCancelled;

                            return (
                                <tr
                                    key={id || index}
                                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                                        isCancelled
                                            ? 'opacity-60 bg-rose-50/20 dark:bg-rose-950/10'
                                            : isSelected
                                            ? 'bg-blue-50/50 dark:bg-blue-950/20'
                                            : ''
                                    }`}
                                >
                                    {(onSelectAll || onSelectRow || onEditRow || onCancelRow) && (
                                        <td className="py-2.5 px-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {onSelectRow && (
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => onSelectRow(id)}
                                                        disabled={isCancelled}
                                                        className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600"
                                                    />
                                                )}

                                                {(onEditRow || onCancelRow) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                                                title="Menu Aksi"
                                                            >
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start" className="w-40 z-50">
                                                            {onEditRow && (
                                                                <DropdownMenuItem
                                                                    onClick={() => onEditRow(item)}
                                                                    disabled={isCancelled}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Pencil className="mr-2 h-3.5 w-3.5 text-blue-500" />
                                                                    <span>Edit Data</span>
                                                                </DropdownMenuItem>
                                                            )}

                                                            {onCancelRow && showCancelOption && (
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        if (confirm(`Apakah Anda yakin ingin membatalkan transaksi ${item.no_transaksi}? Stok barang akan dikembalikan otomatis.`)) {
                                                                            onCancelRow(item);
                                                                        }
                                                                    }}
                                                                    className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50 font-medium"
                                                                >
                                                                    <RotateCcw className="mr-2 h-3.5 w-3.5 text-rose-600" />
                                                                    <span>Batalkan</span>
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </td>
                                    )}

                                    {getRowNumber && (
                                        <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-400">
                                            {getRowNumber(index)}
                                        </td>
                                    )}

                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`py-2.5 px-3 whitespace-nowrap ${col.cellClassName || ''} ${isCancelled ? 'line-through text-slate-400' : ''}`}
                                        >
                                            {col.render
                                                ? col.render(item, index)
                                                : (item[col.key] ?? '-')}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}