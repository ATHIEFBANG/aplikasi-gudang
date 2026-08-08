import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Inbox } from 'lucide-react';

export default function DataTable({
    columns = [],
    data = [],
    title = '',
    subtitle = '',
    searchable = true,
    searchPlaceholder = 'Cari data...',
    pagination = true,
    perPageDefault = 10,
    actions = null,
    onRowClick = null,
}) {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(perPageDefault);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Filter Search
    const filteredData = useMemo(() => {
        if (!search.trim()) return data;
        const query = search.toLowerCase();
        return data.filter((item) =>
            columns.some((col) => {
                const val = col.accessor ? item[col.accessor] : '';
                return String(val ?? '').toLowerCase().includes(query);
            })
        );
    }, [data, search, columns]);

    // Sorting Data
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key] ?? '';
            const bVal = b[sortConfig.key] ?? '';
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / perPage) || 1;
    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData;
        const start = (currentPage - 1) * perPage;
        return sortedData.slice(start, start + perPage);
    }, [sortedData, currentPage, perPage, pagination]);

    const handleSort = (accessor) => {
        if (!accessor) return;
        setSortConfig((prev) => ({
            key: accessor,
            direction: prev.key === accessor && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
            {/* Toolbar Header */}
            {(title || searchable || actions) && (
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        {title && <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>}
                        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {searchable && (
                            <div className="relative flex-1 sm:w-64">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder={searchPlaceholder}
                                    className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                                />
                            </div>
                        )}
                        {actions && <div className="flex items-center gap-2">{actions}</div>}
                    </div>
                </div>
            )}

            {/* Table Area */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    onClick={() => col.sortable !== false && handleSort(col.accessor)}
                                    className={`px-4 py-3.5 ${col.sortable !== false ? 'cursor-pointer select-none hover:text-slate-900 dark:hover:text-white' : ''} ${col.className || ''}`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>{col.header}</span>
                                        {col.sortable !== false && col.accessor && (
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, rowIdx) => (
                                <tr
                                    key={row.id || rowIdx}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className={`px-4 py-3.5 whitespace-nowrap text-sm ${col.cellClassName || ''}`}>
                                            {col.render ? col.render(row) : row[col.accessor] ?? '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="py-12 text-center text-slate-400 dark:text-slate-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Inbox className="w-10 h-10 stroke-[1.5]" />
                                        <p className="text-sm font-medium">Tidak ada data ditemukan</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination && sortedData.length > 0 && (
                <div className="p-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                        Menampilkan <span className="font-semibold text-slate-800 dark:text-slate-200">{(currentPage - 1) * perPage + 1}</span> - <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(currentPage * perPage, sortedData.length)}</span> dari <span className="font-semibold text-slate-800 dark:text-slate-200">{sortedData.length}</span> data
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                            <option value={10}>10 / hal</option>
                            <option value={25}>25 / hal</option>
                            <option value={50}>50 / hal</option>
                        </select>

                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}