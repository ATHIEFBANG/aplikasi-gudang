
import React, { useMemo, useRef } from 'react';
import TabelPivot from '@/components/gabungan/TabelPivot';
import FilterPanel from '@/components/gabungan/FilterPanel';
import Search from '@/components/gabungan/Search';
import Button from '@/components/gabungan/Button';
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
        if (Array.isArray(parsed)) return normalizeSerials(parsed);
    } catch {
        //
    }

    return raw.split(/\r?\n|,|;/).map(item => item.trim()).filter(Boolean);
};

const buildPivotRows = dataList => {
    const rows = Array.isArray(dataList) ? dataList : [];

    return rows.flatMap((item, index) => {
        const serials = normalizeSerials(
            item?.serials ?? item?.serial_numbers ?? item?.serial_number ?? item?.sn
        );

        const qty = Number(item?.qty ?? item?.jumlah ?? item?.quantity ?? 0);
        const harga = Number(item?.harga ?? item?.harga_satuan ?? item?.unit_price ?? 0);

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
    projectView = 'OUTBOUND',
    onProjectViewChange,
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
    searchVariant = 'pill',
    searchColor = 'blue',
    searchSize = 'sm',
    searchButtonLabel = '',
    searchIconPosition,
    searchClassName = '',
    searchWidth = 'clamp(7rem, 20vw, 20rem)',
}) {
    const pivotRef = useRef(null);
    const pivotRows = useMemo(() => buildPivotRows(dataList), [dataList]);
    const isProject = activeTab === 'PROYEK';
    const isTransferView = isProject && projectView === 'TRANSFER';

    const pivotLevels = useMemo(() => {
        const barangLevel = {
            key: 'barang',
            getValue: row => `${row?.nama_barang_display || '-'}|||${row?.kode_ppl || '-'}`,
            format: value => value.split('|||')[0],
            subLabel: node => `Kode PPL: ${node.value.split('|||')[1] || '-'}`,
            showValues: true,
        };

        const serialNumberLevel = {
            key: 'serial_number',
            getValue: row => row?.serial_number || '-',
            showValues: true,
        };

        if (isProject) {
            return [
                {
                    key: 'project',
                    getValue: row => row?.project || '-',
                    emptyLabel: 'Tanpa Project',
                    showValues: true,
                },
                barangLevel,
                serialNumberLevel,
            ];
        }

        return [
            {
                key: 'department',
                getValue: row => row?.department || row?.pihak_asal || '-',
                emptyLabel: 'Tanpa Departemen',
                showValues: true,
            },
            barangLevel,
            serialNumberLevel,
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
        const normalizeOutput = value => Array.isArray(value) && value.length === 1 ? value[0] : value || '';

        onFilterApply?.({
            project: isProject ? normalizeOutput(values?.project) : '',
            department: isProject ? '' : normalizeOutput(values?.department),
            start_date: values?.start_date || values?.periode?.startDate || '',
            end_date: values?.end_date || values?.periode?.endDate || '',
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
            <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div className="flex max-w-full flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => onProjectViewChange?.('OUTBOUND')}
          disabled={isProcessing}
          shape="default"
          flipHorizontal={false}
          flipVertical={false}
          variant="default"
          effect="none"
          effectColor="#22D3EE"
          decoration="none"
          decorationColor="#FFFFFF"
          color="blue"
          size="sm"
          width="fit"
          layer="behind"
          attached="none"
          hover
          selected={!isTransferView}
          className={`!w-auto px-3 py-1.5 text-[11px] font-bold${!isTransferView ? '!bg-blue-600 !text-white' : '!bg-slate-100 !text-slate-600 dark:!bg-slate-800 dark:!text-slate-300'}`}
        >
          Pengeluaran Proyek
        </Button>
        <Button
          type="button"
          onClick={() => onProjectViewChange?.('TRANSFER')}
          disabled={isProcessing}
          shape="default"
          flipHorizontal={false}
          flipVertical={false}
          variant="default"
          effect="none"
          effectColor="#22D3EE"
          decoration="none"
          decorationColor="#FFFFFF"
          color="blue"
          size="sm"
          width="fit"
          layer="behind"
          attached="none"
          hover
          selected={isTransferView}
          className={`!w-auto px-3 py-1.5 text-[11px] font-bold${isTransferView ? '!bg-blue-600 !text-white' : '!bg-slate-100 !text-slate-600 dark:!bg-slate-800 dark:!text-slate-300'}`}
        >
          Aset Transfer
        </Button>
      </div>
                </div>
                <div className="ml-auto shrink-0">
                    <FilterPanel
                        title="Filter"
                        panelTitle="Filter Rincian Aset"
                        applyLabel="Terapkan"
                        resetLabel="Reset"
                        isProcessing={isProcessing}
                        activeCount={activeFilterCount}
                        filters={[
                            ...(isProject
                                ? [{
                                    key: 'project',
                                    label: 'Project',
                                    type: 'multi-select',
                                    options: projectOptions,
                                    value: project,
                                    description: 'Pilih satu atau beberapa project.',
                                }]
                                : [{
                                    key: 'department',
                                    label: 'Departemen',
                                    type: 'multi-select',
                                    options: departmentOptions,
                                    value: department,
                                    description: 'Pilih satu atau beberapa departemen.',
                                }]),
                            {
                                key: 'periode',
                                label: 'Periode',
                                type: 'date-range',
                                startDate,
                                endDate,
                                description: 'Tentukan rentang tanggal transaksi.',
                            },
                        ]}
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                        buttonProps={{
                            shape: 'kiri-atas-kanan-bawah',
                            flipHorizontal: false,
                            flipVertical: false,
                            variant: 'ghost',
                            effect: 'neon',
                            effectColor: '#22D3EE',
                            decoration: 'none',
                            decorationColor: '#FFF000',
                            color: 'blue',
                            size: 'none',
                            width: 'fit',
                            edge: 'none',
                            layer: 'behind',
                            className: 'max-w-full translate-x-[10px] translate-y-[15px]',
                        }}
                    />
                </div>
            </div>

            <Card className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardContent className="p-0">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">

                              <div className="flex max-w-full flex-wrap items-center gap-1">
                                <Button
                                    type="button"
                                    onClick={() => onTabChange?.('PROYEK')}
                                    disabled={isProcessing}
                                    shape="default"
                                    flipHorizontal={false}
                                    flipVertical={false}
                                    variant="default"
                                    effect="none"
                                    effectColor="#22D3EE"
                                    decoration="none"
                                    decorationColor="#FFFFFF"
                                    color="rose"
                                    size="sm"
                                    width="fit"
                                    layer="normal"
                                    attached="none"
                                    hover
                                    selected={activeTab === 'PROYEK'}
                                    className={`!w-auto gap-1.5 px-3.5 py-1.5 text-xs font-bold ${activeTab === 'PROYEK' ? '!bg-rose-600 !text-white' : '!bg-transparent !text-slate-600 dark:!text-slate-400'}`}
                                >
                                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                                    <span>Proyek</span>
                                </Button>

                                <Button
                                    type="button"
                                    onClick={() => onTabChange?.('NON_PROYEK')}
                                    disabled={isProcessing}
                                    shape="default"
                                    flipHorizontal={false}
                                    flipVertical={false}
                                    variant="default"
                                    effect="none"
                                    effectColor="#22D3EE"
                                    decoration="none"
                                    decorationColor="#FFFFFF"
                                    color="blue"
                                    size="sm"
                                    width="fit"
                                    layer="normal"
                                    attached="none"
                                    hover
                                    selected={activeTab === 'NON_PROYEK'}
                                    className={`!w-auto gap-1.5 px-3.5 py-1.5 text-xs font-bold ${activeTab === 'NON_PROYEK' ? '!bg-blue-600 !text-white' : '!bg-transparent !text-slate-600 dark:!text-slate-400'}`}
                                >
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>Non Proyek</span>
                                </Button>
                              </div>
                            </div>

                            {!isTransferView && <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={handleExpandAll}
                                    disabled={!pivotRows.length || isProcessing}
                                    shape="default"
                                    flipHorizontal={false}
                                    flipVertical={false}
                                    variant="outlined"
                                    effect="none"
                                    effectColor="#22D3EE"
                                    decoration="none"
                                    decorationColor="#FFFFFF"
                                    color="slate"
                                    size="sm"
                                    width="fit"
                                    layer="normal"
                                    attached="none"
                                    hover
                                    className="!w-auto px-3 py-1.5 text-[10px] font-bold"
                                >
                                    Expand Semua
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleCollapseAll}
                                    disabled={!pivotRows.length || isProcessing}
                                    shape="default"
                                    flipHorizontal={false}
                                    flipVertical={false}
                                    variant="outlined"
                                    effect="none"
                                    effectColor="#22D3EE"
                                    decoration="none"
                                    decorationColor="#FFFFFF"
                                    color="slate"
                                    size="sm"
                                    width="fit"
                                    layer="normal"
                                    attached="none"
                                    hover
                                    className="!w-auto px-3 py-1.5 text-[10px] font-bold"
                                >
                                    Collapse
                                </Button>
                            </div>}
                        </div>
                    </div>

                    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-3 dark:border-slate-800 sm:gap-5 sm:px-5 sm:py-4">
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base lg:text-lg">
                                {isTransferView ? 'Rincian Aset Transfer Proyek' : 'Analisis Barang Keluar'}
                            </h2>
                            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs">
                                {isTransferView
                                    ? 'Saldo aset yang masih tercatat di proyek sampai transaksi pengembalian dilakukan.'
                                    : isProject
                                        ? 'Pengeluaran proyek → Nama Barang → Serial Number'
                                        : 'Non Proyek → Nama Barang → Serial Number'}
                            </p>
                        </div>

                        <div className="min-w-0 shrink-0" style={{ width: searchWidth, maxWidth: '48%' }}>
                            <Search
                                value={searchTerm}
                                onChange={setSearchTerm}
                                onSearch={onSearch}
                                placeholder="Cari barang / kode PPL / SN..."
                                disabled={isProcessing}
                                variant={searchVariant}
                                color={searchColor}
                                size={searchSize}
                                buttonLabel={searchButtonLabel}
                                iconPosition={searchIconPosition}
                                className={`w-full ${searchClassName}`}
                            />
                        </div>
                    </div>

                    {isTransferView ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] text-left text-xs">
                                <thead className="bg-slate-100/90 text-[10px] uppercase tracking-wide text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                                    <tr>
                                        <th className="px-4 py-3">Proyek / Site</th>
                                        <th className="px-4 py-3">Kode PPL</th>
                                        <th className="px-4 py-3">Nama Barang</th>
                                        <th className="px-4 py-3">Part Number</th>
                                        <th className="px-4 py-3">Kondisi</th>
                                        <th className="px-4 py-3">Serial Number</th>
                                        <th className="px-4 py-3">Transfer Terakhir</th>
                                        <th className="px-4 py-3 text-center">Saldo Aktif</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {dataList.map((item, index) => (
                                        <tr key={`${item.project}-${item.barang_id}-${item.kondisi}-${index}`} className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3">
                                                <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{item.project || '—'}</div>
                                                <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">{item.project_name || item.project || '—'}</div>
                                                <div className="mt-0.5 text-[10px] text-slate-500">{item.nama_customer || item.lokasi || '—'}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono font-semibold text-slate-600 dark:text-slate-300">{item.kode_barang || '—'}</td>
                                            <td className="px-4 py-3"><div className="font-semibold text-slate-900 dark:text-white">{item.nama_barang_display || getBarangName(item)}</div><div className="mt-0.5 text-[10px] text-slate-500">{item.brand} {item.tipe} {item.kategori}</div></td>
                                            <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{item.part_number || '—'}</td>
                                            <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${String(item.kondisi).toLowerCase() === 'rusak' ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300' : String(item.kondisi).toLowerCase() === 'bekas' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>{item.kondisi || 'Baru'}</span></td>
                                            <td className="px-4 py-3"><div className="flex max-w-[260px] flex-wrap gap-1">{(Array.isArray(item.serials) ? item.serials : []).length ? item.serials.map(sn => <span key={sn} className="rounded border border-slate-200 bg-slate-50 px-1.5 py-1 font-mono text-[10px] dark:border-slate-700 dark:bg-slate-800">{sn}</span>) : <span className="text-slate-400">Non-SN</span>}</div></td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{item.tanggal || '—'}<div className="mt-0.5 font-mono text-[10px] text-slate-400">{item.no_transaksi || ''}</div></td>
                                            <td className="px-4 py-3 text-center"><span className="inline-flex min-w-9 justify-center rounded-lg bg-blue-50 px-2 py-1.5 font-mono font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{Number(item.qty || 0).toLocaleString('id-ID')}</span></td>
                                            <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-emerald-700 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{item.status_aset || 'Aktif di Proyek'}</span></td>
                                        </tr>
                                    ))}
                                    {dataList.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">Tidak ada aset transfer aktif untuk filter ini.</td></tr>}
                                </tbody>
                                <tfoot className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"><tr><td colSpan={7} className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300">Total saldo aset aktif</td><td className="px-4 py-3 text-center font-mono font-black text-blue-700 dark:text-blue-300">{dataList.reduce((sum, item) => sum + Number(item.qty || 0), 0).toLocaleString('id-ID')}</td><td /></tr></tfoot>
                            </table>
                        </div>
                    ) : (
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
