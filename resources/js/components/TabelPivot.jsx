import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const DEFAULT_INDENTATION = 24;

const geometricHeader = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 100" preserveAspectRatio="none">
    <defs>
        <linearGradient id="pivotBase" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0d3978"/>
            <stop offset="50%" stop-color="#092b5c"/>
            <stop offset="100%" stop-color="#061c3c"/>
        </linearGradient>
        <linearGradient id="pivotBlueAccent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#147cff"/>
            <stop offset="100%" stop-color="#0752c9"/>
        </linearGradient>
    </defs>

    <rect width="1600" height="100" fill="url(#pivotBase)"/>

    <polygon points="0,0 155,0 80,100 0,100" fill="url(#pivotBlueAccent)" opacity=".95"/>
    <polygon points="55,0 185,0 110,100 25,100" fill="#0a5fd8" opacity=".55"/>
    <polygon points="145,0 175,0 100,100 72,100" fill="#38a0ff" opacity=".25"/>
    <polygon points="650,0 660,0 585,100 575,100" fill="#2386f5" opacity=".10"/>
    <polygon points="1510,0 1600,0 1600,100 1435,100" fill="#0d58c7" opacity=".55"/>
    <polygon points="1560,0 1600,0 1600,100 1490,100" fill="url(#pivotBlueAccent)" opacity=".95"/>
    <polygon points="1525,0 1555,0 1480,100 1450,100" fill="#49a5ff" opacity=".35"/>

    <line x1="0" y1="99" x2="1600" y2="99" stroke="#4da5ff" stroke-opacity=".45" stroke-width="1"/>
    <line x1="160" y1="0" x2="85" y2="100" stroke="#56aeff" stroke-opacity=".25" stroke-width="1"/>
    <line x1="1515" y1="0" x2="1440" y2="100" stroke="#56aeff" stroke-opacity=".25" stroke-width="1"/>
</svg>
`;

const geometricHeaderUrl = `url("data:image/svg+xml,${encodeURIComponent(geometricHeader)}")`;

const defaultFormatNumber = value => Number(value || 0).toLocaleString('id-ID');

const defaultFormatCurrency = value => {
    const amount = Number(value || 0);
    if (!amount) return 'Rp -';
    return `Rp ${amount.toLocaleString('id-ID')}`;
};

const getAccessorValue = (row, config) => {
    if (typeof config?.getValue === 'function') return config.getValue(row);
    if (config?.key) return row?.[config.key];
    return null;
};

const formatValue = (value, config) => {
    if (typeof config?.format === 'function') return config.format(value);
    if (config?.format === 'currency') return defaultFormatCurrency(value);
    if (config?.format === 'number') return defaultFormatNumber(value);
    return value ?? '-';
};

const aggregateValues = (rows, config) => {
    if (typeof config?.aggregate === 'function') return config.aggregate(rows);

    const values = rows.map(row => {
        const value = Number(getAccessorValue(row, config));
        return Number.isFinite(value) ? value : 0;
    });

    switch (config?.aggregate) {
        case 'count':
            return rows.length;
        case 'avg':
            return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
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
    if (value === undefined || value === null || value === '') return config?.emptyLabel || '-';
    return String(value);
};

const buildTree = (rows, levels, levelIndex = 0, parentKey = '') => {
    if (levelIndex >= levels.length) return [];

    const level = levels[levelIndex];
    const groups = new Map();

    rows.forEach(row => {
        const rawValue = getAccessorValue(row, level);
        const value = normalizeGroupValue(rawValue, level);

        if (!groups.has(value)) groups.set(value, []);
        groups.get(value).push(row);
    });

    return [...groups.entries()].map(([value, groupRows], index) => {
        const key = `${parentKey}${level.key}::${value}::${index}`;
        const children = buildTree(groupRows, levels, levelIndex + 1, `${key}::`);

        return {
            type: level.type || 'group',
            level: levelIndex,
            key,
            value,
            label: typeof level.format === 'function' ? level.format(value, groupRows) : value,
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

const resolveAlign = align => {
    if (align === 'left') return 'left';
    if (align === 'center') return 'center';
    return 'right';
};

const getRowStyles = (node, levels) => {
    const levelConfig = levels[node.level] || {};

    if (typeof levelConfig.rowClassName === 'function') return levelConfig.rowClassName(node);
    if (levelConfig.rowClassName) return levelConfig.rowClassName;

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

    if (typeof levelConfig.labelClassName === 'function') return levelConfig.labelClassName(node);
    if (levelConfig.labelClassName) return levelConfig.labelClassName;

    const defaults = [
        'text-slate-900 dark:text-white',
        'text-slate-800 dark:text-slate-100',
        'font-mono font-semibold text-blue-600 dark:text-blue-400',
        'font-mono text-slate-600 dark:text-slate-400',
    ];

    return defaults[Math.min(node.level, defaults.length - 1)];
};

function PivotRow({ node, levels, valueColumns, expandedKeys, onToggle, indentation }) {
    const hasChildren = node.children?.length > 0;
    const isExpanded = expandedKeys.has(node.key);
    const rowClassName = getRowStyles(node, levels);
    const labelClassName = getLabelStyles(node, levels);
    const showValues = levels[node.level]?.showValues !== false;

    return (
        <>
            <tr className={`${rowClassName} border-b border-slate-100 dark:border-slate-800/70 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors`}>
                <td className="py-2.5 px-3 overflow-hidden">
                    <div className="flex items-center min-w-0" style={{ paddingLeft: `${node.level * indentation}px` }}>
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={() => onToggle(node.key)}
                                className="w-5 h-5 mr-1.5 shrink-0 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                )}
                            </button>
                        ) : (
                            <span className="w-5 mr-1.5 shrink-0" />
                        )}

                        <div className="min-w-0">
                            <div
                                className={`${labelClassName} text-[11px] sm:text-xs truncate`}
                                title={String(node.label)}
                            >
                                {node.label}
                            </div>

                            {levels[node.level]?.subLabel && (
                                <div className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500 truncate">
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
                            className={`py-2.5 px-3 text-[11px] font-mono font-semibold ${column.cellClassName || 'text-slate-700 dark:text-slate-300'}`}
                            style={{ textAlign: resolveAlign(column.align) }}
                        >
                            {showValues ? formatValue(value, column) : ''}
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

const TabelPivot = forwardRef(function TabelPivot({
    data = [],
    levels = [],
    valueColumns = [],
    rowLabelHeader = 'Row Labels',
    grandTotalLabel = 'Grand Total',
    emptyMessage = 'Tidak ada data.',
    emptySubMessage = 'Coba ubah filter atau periode yang digunakan.',
    indentation = DEFAULT_INDENTATION,
    zoomLevel = 95,
    defaultExpanded = false,
    showGrandTotal = true,
    showFooter = true,
    footerLeftText = 'Klik ikon › untuk melihat rincian.',
    headerClassName = '',
    headerStyle = {},
    labelColumnWidth = 360,
    grandTotalClassName = 'border-t border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/25',
    grandTotalLabelClassName = 'text-amber-800 dark:text-amber-200',
    grandTotalCellClassName = 'text-amber-900 dark:text-amber-100',
}, ref) {
    const safeData = Array.isArray(data) ? data : [];

    const tree = useMemo(() => buildTree(safeData, levels), [safeData, levels]);
    const allExpandableKeys = useMemo(() => collectExpandableKeys(tree), [tree]);

    const [expandedKeys, setExpandedKeys] = useState(() =>
        defaultExpanded ? allExpandableKeys : new Set()
    );

    useImperativeHandle(ref, () => ({
        expandAll: () => setExpandedKeys(new Set(allExpandableKeys)),
        collapseAll: () => setExpandedKeys(new Set()),
    }), [allExpandableKeys]);

    const grandTotals = useMemo(() => {
        return valueColumns.map(column => ({
            ...column,
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

    const zoomScale = Math.max(10, Math.min(16, zoomLevel * 0.11));

    return (
        <div className="w-full overflow-x-auto transition-all duration-200 ease-out">
            <table className="w-full table-fixed border-collapse text-left text-xs" style={{ fontSize: `${zoomScale}px` }}>
                <colgroup>
                    <col style={{ width: `${labelColumnWidth}px` }} />

                    {valueColumns.map(column => (
                        <col
                            key={column.key}
                            style={{ width: column.width ? `${column.width}px` : undefined }}
                        />
                    ))}
                </colgroup>

                <thead>
                    <tr
                        className={`border-b border-blue-400/40 text-white font-bold uppercase tracking-wider text-[10px] select-none ${headerClassName}`}
                        style={{
                            backgroundColor: '#092b5c',
                            backgroundImage: geometricHeaderUrl,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            ...headerStyle,
                        }}
                    >
                        <th className="py-2.5 px-3 text-left">
                            {rowLabelHeader}
                        </th>

                        {valueColumns.map(column => (
                            <th
                                key={column.key}
                                className="py-2.5 px-3 whitespace-nowrap"
                                style={{ textAlign: resolveAlign(column.align) }}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
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
                            <td colSpan={valueColumns.length + 1} className="py-10 text-center text-xs text-slate-400">
                                <div className="font-semibold">{emptyMessage}</div>
                                <div className="mt-1 text-[10px]">{emptySubMessage}</div>
                            </td>
                        </tr>
                    )}

                    {showGrandTotal && (
                        <tr className={`${grandTotalClassName} font-black`}>
                            <td className={`py-2.5 px-3 text-[11px] ${grandTotalLabelClassName}`}>
                                {grandTotalLabel}
                            </td>

                            {grandTotals.map(column => (
                                <td
                                    key={column.key}
                                    className={`py-2.5 px-3 text-[11px] font-black font-mono ${grandTotalCellClassName}`}
                                    style={{ textAlign: resolveAlign(column.grandTotalAlign ?? column.align) }}
                                >
                                    {formatValue(column.value, column)}
                                </td>
                            ))}
                        </tr>
                    )}
                </tbody>
            </table>

            {showFooter && (
                <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {footerLeftText}
                    </div>
                </div>
            )}
        </div>
    );
});

export default TabelPivot;