import React from 'react';
import { Pencil } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function Tabel({
    data = [],
    columns = [],
    selectedIds = [],
    onSelectAll,
    onSelectRow,
    onEditRow,
    getItemId = (item) => item.id,
    getRowNumber,
    emptyMessage = 'Tidak ada data ditemukan.',
    zoomLevel = 100,
}) {
    const isAllSelected = data.length > 0 && data.every((item) => selectedIds.includes(getItemId(item)));
    const isSomeSelected = data.some((item) => selectedIds.includes(getItemId(item))) && !isAllSelected;

    return (
        <div 
            className="w-full overflow-x-auto transition-all duration-200 ease-out"
            style={{ zoom: `${zoomLevel}%` }}
        >
            <table className="w-full border-collapse text-left text-xs">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] select-none">
                        {/* KOLOM AKSI / CHECKBOX */}
                        {(onSelectAll || onSelectRow || onEditRow) && (
                            <th className="py-3 px-3 w-14 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    {onSelectAll && (
                                        <Checkbox
                                            checked={isAllSelected}
                                            data-state={isSomeSelected ? "indeterminate" : (isAllSelected ? "checked" : "unchecked")}
                                            onCheckedChange={onSelectAll}
                                            className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600"
                                        />
                                    )}
                                    <span>Aksi</span>
                                </div>
                            </th>
                        )}

                        {/* NO URUT */}
                        {getRowNumber && (
                            <th className="py-3 px-3 w-12 text-center">No</th>
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
                                colSpan={columns.length + (onSelectAll || onSelectRow || onEditRow ? 1 : 0) + (getRowNumber ? 1 : 0)} 
                                className="py-10 text-center text-xs text-slate-400"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((item, index) => {
                            const id = getItemId(item);
                            const isSelected = selectedIds.includes(id);

                            return (
                                <tr
                                    key={id || index}
                                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                                        isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                                    }`}
                                >
                                    {(onSelectAll || onSelectRow || onEditRow) && (
                                        <td className="py-2.5 px-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {onSelectRow && (
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => onSelectRow(id)}
                                                        className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600"
                                                    />
                                                )}
                                                {onEditRow && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditRow(item)}
                                                        className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 rounded cursor-pointer transition-colors"
                                                        title="Edit Data"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
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
                                            className={`py-2.5 px-3 whitespace-nowrap ${col.cellClassName || ''}`}
                                        >
                                            {col.render ? col.render(item, index) : (item[col.key] ?? '-')}
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