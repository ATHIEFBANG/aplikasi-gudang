
import React, { useMemo, useRef } from 'react';
import TabelPivot from '@/components/gabungan/TabelPivot';
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

const buildPivotRows = (dataList, isProject) => {
    const rows = Array.isArray(dataList) ? dataList : [];
    const expandedRows = rows.flatMap((item, index) => {
        const serials = normalizeSerials(item?.serials ?? item?.serial_numbers ?? item?.serial_number ?? item?.sn);
        const qty = Number(item?.qty ?? item?.jumlah ?? item?.quantity ?? 0);
        const sign = qty < 0 ? -1 : 1;
        const absQty = Math.abs(qty);
        const harga = Number(item?.harga ?? item?.harga_satuan ?? item?.unit_price ?? 0);
        const baseData = { ...item, _source_index: index, nama_barang_display: getBarangName(item), kode_ppl: item?.kode_barang || '-' };

        if (!serials.length) {
            return [{ ...baseData, serial_number: '-', pivot_qty: qty, pivot_nilai: qty * harga }];
        }

        const serialRows = serials.map(serial => ({
            ...baseData,
            serial_number: serial,
            pivot_qty: sign,
            pivot_nilai: sign * harga,
        }));

        if (absQty > serials.length) {
            serialRows.push({
                ...baseData,
                serial_number: '-',
                pivot_qty: sign * (absQty - serials.length),
                pivot_nilai: sign * (absQty - serials.length) * harga,
            });
        }

        return serialRows;
    });

    if (!isProject) return expandedRows;

    const getBalanceKey = row => `${row?.project || '-'}::${row?.barang_id ?? row?.kode_ppl ?? '-'}::${row?.serial_number || '-'}`;
    const balances = new Map();
    expandedRows.forEach(row => balances.set(getBalanceKey(row), (balances.get(getBalanceKey(row)) || 0) + Number(row.pivot_qty || 0)));

    return expandedRows.filter(row => (balances.get(getBalanceKey(row)) || 0) > 0);
};

export default function TabelRincianAset({
    activeTab = 'PROYEK',
    onTabChange,
    dataList = [],
    isProcessing = false,
    searchTerm = '',
    setSearchTerm,
    onSearch,
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
    const isProject = activeTab === 'PROYEK';
    const pivotRows = useMemo(() => buildPivotRows(dataList, isProject), [dataList, isProject]);

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

    const handleExpandAll = () => {
        pivotRef.current?.expandAll();
    };

    const handleCollapseAll = () => {
        pivotRef.current?.collapseAll();
    };

    return (
        <div className="w-full">
            <Card className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardContent className="p-0">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">

                              <div className="flex max-w-full flex-wrap items-center gap-3">
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

                            <div className="flex items-center gap-2">
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
                            </div>
                        </div>
                    </div>

                    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-3 dark:border-slate-800 sm:gap-5 sm:px-5 sm:py-4">
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base lg:text-lg">
                                Analisis Barang Keluar
                            </h2>
                            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs">
                                {isProject ? 'Saldo pengeluaran proyek setelah pengembalian → Nama Barang → Serial Number' : 'Pemakaian internal → Nama Barang → Serial Number'}
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

                    <TabelPivot
                        ref={pivotRef}
                        data={pivotRows}
                        levels={pivotLevels}
                        valueColumns={valueColumns}
                        rowLabelHeader="ROW LABELS"
                        grandTotalLabel="Grand Total"
                        emptyMessage={isProject ? "Tidak ada saldo aset aktif di proyek." : "Tidak ada data pemakaian nonproyek."}
                        emptySubMessage={isProject ? "Barang mungkin sudah dikembalikan seluruhnya." : "Belum ada data yang sesuai dengan pencarian."}
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
