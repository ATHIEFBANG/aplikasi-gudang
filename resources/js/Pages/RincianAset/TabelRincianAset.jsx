import React, { useMemo, useRef } from 'react';
import TabelPivot from '@/components/TabelPivot';
import FilterPanel from '@/components/FilterPanel';
import Search from '@/components/Search';
import { Card, CardContent } from '@/components/ui/card';
import { BriefcaseBusiness, Building2 } from 'lucide-react';

const getBarangName = item => [
    item?.brand,
    item?.tipe,
    item?.kategori,
].filter(Boolean).join(' ') || item?.nama_barang || '-';

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
        //
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

const getFilterLength = value => {
    if (Array.isArray(value)) return value.length;
    return value ? 1 : 0;
};

export default function TabelRincianAset({
    activeTab = 'PROYEK',
    onTabChange,
    dataList = [],
    isProcessing = false,
    searchTerm = '',
    setSearchTerm,
    onSearch,
    project = '',
    projectOptions = [],
    department = '',
    departmentOptions = [],
    startDate = '',
    endDate = '',
    onReset,
    onFilterApply,
    zoomLevel = 100,
}) {
    const pivotRef = useRef(null);

    const pivotRows = useMemo(() => buildPivotRows(dataList), [dataList]);

    const isProject = activeTab === 'PROYEK';

    const pivotLevels = useMemo(() => {
        if (isProject) {
            return [
                {
                    key: 'project',
                    getValue: row => row?.project || '-',
                    emptyLabel: 'Tanpa Project',
                    showValues: true,
                },
                {
                    key: 'barang',
                    getValue: row => row?.nama_barang_display || '-',
                    showValues: true,
                },
                {
                    key: 'kode_ppl',
                    getValue: row => row?.kode_ppl || '-',
                    showValues: false,
                },
                {
                    key: 'serial_number',
                    getValue: row => row?.serial_number || '-',
                    showValues: true,
                },
            ];
        }

        return [
            {
                key: 'department',
                getValue: row => row?.department || row?.pihak_asal || '-',
                emptyLabel: 'Tanpa Departemen',
                showValues: true,
            },
            {
                key: 'barang',
                getValue: row => row?.nama_barang_display || '-',
                showValues: true,
            },
            {
                key: 'kode_ppl',
                getValue: row => row?.kode_ppl || '-',
                showValues: false,
            },
            {
                key: 'serial_number',
                getValue: row => row?.serial_number || '-',
                showValues: true,
            },
        ];
    }, [isProject]);

    const valueColumns = useMemo(() => [
        {
            key: 'jumlah',
            label: 'JUMLAH',
            getValue: row => row?.pivot_qty || 0,
            aggregate: 'sum',
            format: 'number',
            align: 'center',
            grandTotalAlign: 'center',
            width: 135,
        },
        {
            key: 'harga',
            label: 'HARGA (RP)',
            getValue: row => row?.pivot_nilai || 0,
            aggregate: 'sum',
            format: 'currency',
            align: 'right',
            grandTotalAlign: 'right',
            width: 185,
        },
    ], []);

    const activeFilterCount = [
        getFilterLength(isProject ? project : department),
        startDate || endDate ? 1 : 0,
    ].reduce((total, value) => total + value, 0);

    const contextLabel = isProject ? 'KODE PROJECT' : 'DEPARTEMEN';

    const contextValue = isProject
        ? Array.isArray(project)
            ? project.length > 1
                ? `${project.length} Project dipilih`
                : project[0] || 'Semua Project'
            : project || 'Semua Project'
        : Array.isArray(department)
            ? department.length > 1
                ? `${department.length} Departemen dipilih`
                : department[0] || 'Semua Departemen'
            : department || 'Semua Departemen';

    const handleApplyFilters = values => {
        onFilterApply?.({
            project: isProject ? values?.project || '' : '',
            department: isProject ? '' : values?.department || '',
            start_date: values?.start_date || '',
            end_date: values?.end_date || '',
        });
    };

    const handleResetFilters = () => {
        onReset?.();
    };

    const handleExpandAll = () => {
        pivotRef.current?.expandAll();
    };

    const handleCollapseAll = () => {
        pivotRef.current?.collapseAll();
    };

    return (
        <div className="w-full">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="pt-2 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                    {contextLabel}
                    <span className="mx-1.5 text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-slate-800 dark:text-slate-200 normal-case tracking-normal">
                        {contextValue}
                    </span>
                </div>

                <div className="shrink-0">
                    <FilterPanel
                        activeCount={activeFilterCount}
                        title="Filter"
                        applyLabel="Terapkan"
                        resetLabel="Reset"
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                        isProcessing={isProcessing}
                        activeTab={activeTab}
                        projectOptions={projectOptions}
                        departmentOptions={departmentOptions}
                        project={project}
                        department={department}
                        startDate={startDate}
                        endDate={endDate}
                    />
                </div>
            </div>

            <Card className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardContent className="p-0">
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => onTabChange?.('PROYEK')}
                                    disabled={isProcessing}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        activeTab === 'PROYEK'
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <BriefcaseBusiness className="w-3.5 h-3.5" />
                                    <span>Proyek</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onTabChange?.('NON_PROYEK')}
                                    disabled={isProcessing}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        activeTab === 'NON_PROYEK'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Building2 className="w-3.5 h-3.5" />
                                    <span>Non Proyek</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleExpandAll}
                                    disabled={!pivotRows.length || isProcessing}
                                    className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Expand Semua
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCollapseAll}
                                    disabled={!pivotRows.length || isProcessing}
                                    className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Collapse
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                    Analisis Barang Keluar
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    {isProject
                                        ? 'Proyek → Barang → Kode PPL → Serial Number'
                                        : 'Non Proyek → Barang → Kode PPL → Serial Number'}
                                </p>
                            </div>

                            <Search
                                value={searchTerm}
                                onChange={setSearchTerm}
                                onSearch={onSearch}
                                placeholder="Cari barang / kode PPL / SN..."
                                disabled={isProcessing}
                                className="w-72 hidden lg:block"
                            />
                        </div>
                    </div>

                    <div className="lg:hidden px-5 py-3 border-b border-slate-200 dark:border-slate-800">
                        <Search
                            value={searchTerm}
                            onChange={setSearchTerm}
                            onSearch={onSearch}
                            placeholder="Cari barang / kode PPL / SN..."
                            disabled={isProcessing}
                            className="w-full"
                        />
                    </div>

                    <TabelPivot
                        ref={pivotRef}
                        data={pivotRows}
                        levels={pivotLevels}
                        valueColumns={valueColumns}
                        rowLabelHeader="ROW LABELS"
                        grandTotalLabel="Grand Total"
                        emptyMessage="Tidak ada data barang keluar."
                        emptySubMessage="Coba ubah filter atau periode yang digunakan."
                        indentation={24}
                        zoomLevel={Math.min(zoomLevel, 95)}
                        defaultExpanded={false}
                        showGrandTotal
                        showFooter
                        footerLeftText="Klik ikon › untuk melihat rincian."
                    />
                </CardContent>
            </Card>
        </div>
    );
}