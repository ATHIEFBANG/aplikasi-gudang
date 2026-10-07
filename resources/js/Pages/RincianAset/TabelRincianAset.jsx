import React, { useMemo } from 'react';
import TabelPivot from '@/components/TabelPivot';
import HybridDropdown from '@/components/HybridDropdown';
import DateRangeFilter from '@/components/DateRangeFilter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RotateCcw, Search, Layers3 } from 'lucide-react';

const getBarangName = item => {
    return [
        item?.brand,
        item?.tipe,
        item?.kategori,
    ].filter(Boolean).join(' ') || item?.nama_barang || '-';
};

const normalizeSerials = value => {
    if (Array.isArray(value)) {
        return value
            .flatMap(item => {
                if (typeof item === 'object' && item !== null) {
                    return item.serial_number || item.serial || item.sn || item.value || '';
                }

                return String(item || '');
            })
            .map(item => String(item).trim())
            .filter(Boolean);
    }

    if (!value) return [];

    const raw = String(value).trim();

    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
            return normalizeSerials(parsed);
        }
    } catch {
        // Bukan JSON, lanjut parsing biasa.
    }

    return raw
        .split(/\r?\n|,|;/)
        .map(item => item.trim())
        .filter(Boolean);
};

const buildPivotRows = dataList => {
    const rows = Array.isArray(dataList) ? dataList : [];

    return rows.flatMap((item, index) => {
        const serials = normalizeSerials(
            item?.serials ??
            item?.serial_numbers ??
            item?.serial_number ??
            item?.sn
        );

        const qty = Number(
            item?.qty ??
            item?.jumlah ??
            item?.quantity ??
            0
        );

        const harga = Number(
            item?.harga ??
            item?.harga_satuan ??
            item?.unit_price ??
            0
        );

        const baseData = {
            ...item,
            _source_index: index,
            nama_barang_display: getBarangName(item),
            kode_ppl: item?.kode_barang || '-',
            harga_satuan: harga,
        };

        if (!serials.length) {
            return [{
                ...baseData,
                serial_number: '-',
                pivot_qty: qty,
                pivot_nilai: qty * harga,
            }];
        }

        const serialRows = serials.map(serial => ({
            ...baseData,
            serial_number: serial,
            pivot_qty: 1,
            pivot_nilai: harga,
        }));

        if (qty > serials.length) {
            serialRows.push({
                ...baseData,
                serial_number: '-',
                pivot_qty: qty - serials.length,
                pivot_nilai: (qty - serials.length) * harga,
            });
        }

        return serialRows;
    });
};

export default function TabelRincianAset({
    activeTab = 'PROYEK',
    dataList = [],
    isProcessing = false,
    searchTerm = '',
    setSearchTerm,
    project = '',
    projectOptions = [],
    onProjectChange,
    department = '',
    departmentOptions = [],
    onDepartmentChange,
    gudangId = 'ALL',
    gudangOptions = [],
    onGudangChange,
    startDate = '',
    endDate = '',
    onDateApply,
    onDateReset,
    onReset,
    zoomLevel = 100,
}) {
    const pivotRows = useMemo(
        () => buildPivotRows(dataList),
        [dataList]
    );

    const isProject = activeTab === 'PROYEK';

    const pivotLevels = useMemo(() => {
        if (isProject) {
            return [
                {
                    key: 'project',
                    getValue: row => row?.project || '-',
                    emptyLabel: 'Tanpa Project',
                },
                {
                    key: 'barang',
                    getValue: row => row?.nama_barang_display || '-',
                },
                {
                    key: 'kode_ppl',
                    getValue: row => row?.kode_ppl || '-',
                },
                {
                    key: 'serial_number',
                    getValue: row => row?.serial_number || '-',
                },
            ];
        }

        return [
            {
                key: 'department',
                getValue: row => row?.department || row?.pihak_asal || '-',
                emptyLabel: 'Tanpa Departemen',
            },
            {
                key: 'barang',
                getValue: row => row?.nama_barang_display || '-',
            },
            {
                key: 'kode_ppl',
                getValue: row => row?.kode_ppl || '-',
            },
            {
                key: 'serial_number',
                getValue: row => row?.serial_number || '-',
            },
        ];
    }, [isProject]);

    const valueColumns = useMemo(() => [
        {
            key: 'jumlah',
            label: 'SUM OF JUMLAH',
            getValue: row => row?.pivot_qty || 0,
            aggregate: 'sum',
            format: 'number',
            align: 'center',
            width: 150,
        },
        {
            key: 'harga',
            label: 'SUM OF HARGA (RP)',
            getValue: row => row?.pivot_nilai || 0,
            aggregate: 'sum',
            format: 'currency',
            align: 'right',
            width: 200,
        },
    ], []);

    const contextLabel = isProject ? 'KODE PROJECT' : 'DEPARTEMEN';

    const contextValue = isProject
        ? project || 'Semua Project'
        : department || 'Semua Departemen';

    const handleReset = () => {
        onReset?.();
    };

    return (
        <Card className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardContent className="p-0">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                                <Layers3 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                    Pivot Analisis Barang Keluar
                                </h2>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {isProject
                                        ? 'Project → Barang → Kode PPL → Serial Number'
                                        : 'Departemen → Barang → Kode PPL → Serial Number'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={isProcessing}
                            title="Reset Filter"
                            className="w-9 h-9 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col xl:flex-row xl:items-center gap-2.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase shrink-0">
                            <span>{contextLabel}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-slate-800 dark:text-slate-200 normal-case tracking-normal">
                                {contextValue}
                            </span>
                        </div>

                        <div className="flex-1" />

                        <DateRangeFilter
                            startDate={startDate}
                            endDate={endDate}
                            onApply={onDateApply}
                            onReset={onDateReset}
                            isProcessing={isProcessing}
                        />

                        {isProject ? (
                            <div className="w-full xl:w-48">
                                <HybridDropdown
                                    value={project}
                                    options={projectOptions}
                                    allowCustom={false}
                                    onChange={onProjectChange}
                                    placeholder="Semua Project..."
                                    searchPlaceholder="Cari Project..."
                                    disabled={isProcessing}
                                    inputClassName="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-semibold"
                                />
                            </div>
                        ) : (
                            <div className="w-full xl:w-48">
                                <HybridDropdown
                                    value={department}
                                    options={departmentOptions}
                                    allowCustom={false}
                                    onChange={onDepartmentChange}
                                    placeholder="Semua Departemen..."
                                    searchPlaceholder="Cari Departemen..."
                                    disabled={isProcessing}
                                    inputClassName="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-semibold"
                                />
                            </div>
                        )}

                        <div className="w-full xl:w-48">
                            <HybridDropdown
                                value={gudangId}
                                options={gudangOptions}
                                allowCustom={false}
                                onChange={onGudangChange}
                                placeholder="Semua Gudang..."
                                searchPlaceholder="Cari Gudang..."
                                disabled={isProcessing}
                                inputClassName="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-semibold"
                            />
                        </div>

                        <div className="relative w-full xl:w-56">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                            <Input
                                value={searchTerm}
                                onChange={e => setSearchTerm?.(e.target.value)}
                                placeholder="Cari barang / kode PPL / SN..."
                                disabled={isProcessing}
                                className="h-8 pl-8 pr-3 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            />
                        </div>
                    </div>
                </div>

                <TabelPivot
                    data={pivotRows}
                    levels={pivotLevels}
                    valueColumns={valueColumns}
                    rowLabelHeader="ROW LABELS"
                    grandTotalLabel="Grand Total"
                    emptyMessage="Tidak ada data barang keluar."
                    emptySubMessage="Coba ubah filter atau periode yang digunakan."
                    indentation={28}
                    zoomLevel={zoomLevel}
                    defaultExpanded={false}
                    showControls
                    showGrandTotal
                    showFooter
                    footerLeftText="Klik ikon › untuk melihat rincian."
                    rowKeyPrefix={activeTab}
                />
            </CardContent>
        </Card>
    );
}