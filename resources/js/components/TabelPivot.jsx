import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const defaultFormatNumber = value =>
    Number(value || 0).toLocaleString('id-ID');

const defaultFormatCurrency = value => {
    const amount = Number(value || 0);
    if (!amount) return 'Rp -';
    return `Rp ${amount.toLocaleString('id-ID')}`;
};

const getAccessorValue = (row, config) => {
    if (typeof config?.getValue === 'function') {
        return config.getValue(row);
    }

    if (config?.key) {
        return row?.[config.key];
    }

    return null;
};

const formatValue = (value, config) => {
    if (typeof config?.format === 'function') {
        return config.format(value);
    }

    if (config?.format === 'currency') {
        return defaultFormatCurrency(value);
    }

    if (config?.format === 'number') {
        return defaultFormatNumber(value);
    }

    return value ?? '-';
};

const aggregateValues = (rows, config) => {
    if (typeof config?.aggregate === 'function') {
        return config.aggregate(rows);
    }

    const values = rows.map(row => {
        const value = Number(getAccessorValue(row, config));
        return Number.isFinite(value) ? value : 0;
    });

    switch (config?.aggregate) {
        case 'count':
            return rows.length;

        case 'avg':
            return values.length
                ? values.reduce((sum, value) => sum + value, 0) / values.length
                : 0;

        case 'min':
            return values.length ? Math.min(...values) : 0;

        case 'max':
            return values.length ? Math.max(...values) : 0;

        case 'sum':
        default:
            return values.reduce((sum, value) => sum + value, 0);
    }
};

const normalizeGroupValue = (value, config) => {
    if (value === undefined || value === null || value === '') {
        return config?.emptyLabel || '-';
    }

    return String(value);
};

const buildTree = (rows, levels, levelIndex = 0, parentKey = '') => {
    if (levelIndex >= levels.length) {
        return [];
    }

    const level = levels[levelIndex];
    const groups = new Map();

    rows.forEach(row => {
        const rawValue = getAccessorValue(row, level);
        const value = normalizeGroupValue(rawValue, level);

        if (!groups.has(value)) {
            groups.set(value, []);
        }

        groups.get(value).push(row);
    });

    return [...groups.entries()].map(([value, groupRows], index) => {
        const key = `${parentKey}${level.key}::${value}::${index}`;
        const children = buildTree(
            groupRows,
            levels,
            levelIndex + 1,
            `${key}::`
        );

        return {
            type: level.type || 'group',
            level: levelIndex,
            key,
            value,
            label: typeof level.format === 'function'
                ? level.format(value, groupRows)
                : value,
            rows: groupRows,
            children,
        };
    });
};

const collectExpandableKeys = nodes => {
    const keys = new Set();

    const walk = items => {
        items.forEach(node => {
            if (node.children?.length) {
                keys.add(node.key);
                walk(node.children);
            }
        });
    };

    walk(nodes);

    return keys;
};

const getRowStyles = (node, levels) => {
    const levelConfig = levels[node.level] || {};

    if (typeof levelConfig.rowClassName === 'function') {
        return levelConfig.rowClassName(node);
    }

    if (levelConfig.rowClassName) {
        return levelConfig.rowClassName;
    }

    const defaults = [
        'bg-slate-50 dark:bg-slate-800/60 font-bold',
        'bg-white dark:bg-slate-900 font-semibold',
        'bg-white dark:bg-slate-900',
        'bg-white dark:bg-slate-900',
    ];

    return defaults[Math.min(node.level, defaults.length - 1)];
};

const getLabelStyles = (node, levels) => {
    const levelConfig = levels[node.level] || {};

    if (typeof levelConfig.labelClassName === 'function') {
        return levelConfig.labelClassName(node);
    }

    if (levelConfig.labelClassName) {
        return levelConfig.labelClassName;
    }

    const defaults = [
        'text-slate-900 dark:text-white',
        'text-slate-800 dark:text-slate-100',
        'font-mono font-semibold text-blue-600 dark:text-blue-400',
        'font-mono text-slate-600 dark:text-slate-400',
    ];

    return defaults[Math.min(node.level, defaults.length - 1)];
};

function PivotRow({
    node,
    levels,
    valueColumns,
    expandedKeys,
    onToggle,
    indentation,
}) {
    const hasChildren = node.children?.length > 0;
    const isExpanded = expandedKeys.has(node.key);

    const rowClassName = getRowStyles(node, levels);
    const labelClassName = getLabelStyles(node, levels);

    return (
        <>
            <tr className={`${rowClassName} border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors`}>
                <td className="min-w-[420px] px-4 py-2.5">
                    <div
                        className="flex items-center"
                        style={{
                            paddingLeft: `${node.level * indentation}px`,
                        }}
                    >
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={() => onToggle(node.key)}
                                className="w-6 h-6 mr-1.5 shrink-0 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>
                        ) : (
                            <span className="w-6 mr-1.5 shrink-0" />
                        )}

                        <div className="min-w-0">
                            <div
                                className={`${labelClassName} text-xs sm:text-sm truncate`}
                                title={String(node.label)}
                            >
                                {node.label}
                            </div>

                            {levels[node.level]?.subLabel && (
                                <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                    {typeof levels[node.level].subLabel === 'function'
                                        ? levels[node.level].subLabel(node)
                                        : levels[node.level].subLabel}
                                </div>
                            )}
                        </div>
                    </div>
                </td>

                {valueColumns.map(column => {
                    const value = aggregateValues(node.rows, column);

                    return (
                        <td
                            key={column.key}
                            className={`px-4 py-2.5 text-xs font-mono font-semibold ${
                                column.align === 'left'
                                    ? 'text-left'
                                    : column.align === 'center'
                                        ? 'text-center'
                                        : 'text-right'
                            } ${column.cellClassName || 'text-slate-800 dark:text-slate-200'}`}
                        >
                            {formatValue(value, column)}
                        </td>
                    );
                })}
            </tr>

            {hasChildren && isExpanded && node.children.map(child => (
                <PivotRow
                    key={child.key}
                    node={child}
                    levels={levels}
                    valueColumns={valueColumns}
                    expandedKeys={expandedKeys}
                    onToggle={onToggle}
                    indentation={indentation}
                />
            ))}
        </>
    );
}

export default function TabelPivot({
    data = [],
    levels = [],
    valueColumns = [],
    rowLabelHeader = 'Row Labels',
    grandTotalLabel = 'Grand Total',
    emptyMessage = 'Tidak ada data.',
    emptySubMessage = 'Coba ubah filter atau periode yang digunakan.',
    indentation = 28,
    zoomLevel = 100,
    defaultExpanded = false,
    showControls = true,
    showGrandTotal = true,
    showFooter = true,
    footerLeftText = 'Klik ikon › untuk melihat rincian.',
    rowKeyPrefix = 'pivot',
}) {
    const safeData = Array.isArray(data) ? data : [];

    const tree = useMemo(
        () => buildTree(safeData, levels),
        [safeData, levels]
    );

    const allExpandableKeys = useMemo(
        () => collectExpandableKeys(tree),
        [tree]
    );

    const [expandedKeys, setExpandedKeys] = useState(() => {
        if (!defaultExpanded) {
            return new Set();
        }

        return allExpandableKeys;
    });

    const grandTotals = useMemo(() => {
        return valueColumns.map(column => ({
            key: column.key,
            value: aggregateValues(safeData, column),
        }));
    }, [safeData, valueColumns]);

    const handleToggle = key => {
        setExpandedKeys(prev => {
            const next = new Set(prev);

            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }

            return next;
        });
    };

    const handleExpandAll = () => {
        setExpandedKeys(new Set(allExpandableKeys));
    };

    const handleCollapseAll = () => {
        setExpandedKeys(new Set());
    };

    const zoomScale = Math.max(
        10,
        Math.min(18, zoomLevel * 0.12)
    );

    return (
        <div className="w-full overflow-x-auto border-t border-slate-200 dark:border-slate-800">
            {showControls && (
                <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={handleExpandAll}
                        disabled={!tree.length}
                        className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Expand Semua
                    </button>

                    <button
                        type="button"
                        onClick={handleCollapseAll}
                        disabled={!tree.length}
                        className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Collapse
                    </button>
                </div>
            )}

            <table
                key={rowKeyPrefix}
                className="w-full border-collapse"
                style={{ fontSize: `${zoomScale}px` }}
            >
                <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-3.5 text-left text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            {rowLabelHeader}
                        </th>

                        {valueColumns.map(column => (
                            <th
                                key={column.key}
                                className={`w-[${column.width || 180}px] px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ${
                                    column.align === 'left'
                                        ? 'text-left'
                                        : column.align === 'center'
                                            ? 'text-center'
                                            : 'text-right'
                                }`}
                                style={{
                                    width: column.width
                                        ? `${column.width}px`
                                        : undefined,
                                }}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {tree.length ? (
                        tree.map(node => (
                            <PivotRow
                                key={node.key}
                                node={node}
                                levels={levels}
                                valueColumns={valueColumns}
                                expandedKeys={expandedKeys}
                                onToggle={handleToggle}
                                indentation={indentation}
                            />
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={valueColumns.length + 1}
                                className="px-6 py-16 text-center"
                            >
                                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                    {emptyMessage}
                                </div>

                                <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                    {emptySubMessage}
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>

                {showGrandTotal && (
                    <tfoot>
                        <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80">
                            <td className="px-4 py-3.5 text-sm font-black text-slate-900 dark:text-white">
                                {grandTotalLabel}
                            </td>

                            {grandTotals.map(column => (
                                <td
                                    key={column.key}
                                    className={`px-4 py-3.5 text-sm font-black font-mono text-slate-900 dark:text-white ${
                                        column.align === 'left'
                                            ? 'text-left'
                                            : column.align === 'center'
                                                ? 'text-center'
                                                : 'text-right'
                                    }`}
                                >
                                    {formatValue(column.value, column)}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                )}
            </table>

            {showFooter && (
                <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {footerLeftText}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {tree.length.toLocaleString('id-ID')} kelompok utama
                    </div>
                </div>
            )}
        </div>
    );
}