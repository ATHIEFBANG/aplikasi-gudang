
import React, { useMemo, useRef, useState } from 'react';
import TabelPivot from '@/components/gabungan/TabelPivot';
import Search from '@/components/gabungan/Search';
import Button from '@/components/gabungan/Button';
import { Card, CardContent } from '@/components/ui/card';
import { BriefcaseBusiness, Building2, ClipboardList, Warehouse } from 'lucide-react';

const getBarangName = item => [
    item?.brand,
    item?.tipe,
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


const buildStockPivotRows = (dataList, searchTerm = '') => {
    const query = String(searchTerm || '').trim().toLocaleLowerCase('id-ID');
    const rows = Array.isArray(dataList) ? dataList : [];

    return rows
        .filter(item => {
            if (!query) return true;
            const searchable = [
                item?.warehouse_name,
                item?.warehouse_code,
                item?.kode_barang,
                item?.nama_barang,
                item?.brand,
                item?.tipe,
                item?.kategori,
                item?.part_number,
                item?.serial_number,
                item?.kondisi,
            ].filter(Boolean).join(' ').toLocaleLowerCase('id-ID');
            return searchable.includes(query);
        })
        .map((item, index) => {
            const qty = Number(item?.qty ?? item?.jumlah ?? 0);
            const harga = Number(item?.harga_satuan ?? item?.harga ?? 0);
            return {
                ...item,
                _stock_index: index,
                nama_barang_display: getBarangName(item),
                kode_ppl: item?.kode_barang || '-',
                warehouse_display: item?.warehouse_name || item?.warehouse_code || 'Gudang tidak diketahui',
                serial_number_display: item?.is_wajib_sn
                    ? (item?.serial_number || 'SN belum tercatat')
                    : `Stok Non-SN — ${item?.kondisi || 'Belum diketahui'}`,
                kategori_display: String(item?.kategori || '').trim() || 'Tanpa Kategori',
                pivot_qty: qty,
                pivot_baru: Number(item?.stok_baru || 0),
                pivot_bekas: Number(item?.stok_bekas || 0),
                pivot_rusak: Number(item?.stok_rusak || 0),
                pivot_lainnya: Number(item?.stok_lainnya || 0),
                pivot_usable: Number(item?.stok_baru || 0) + Number(item?.stok_bekas || 0),
                pivot_nilai: Number(item?.nilai_stok ?? (qty * harga)),
            };
        });
};

export default function TabelRincianAset({
    activeTab = 'PROYEK',
    onTabChange,
    dataList = [],
    stockDataList = [],
    projectCodeFilter = 'ALL',
    onProjectCodeFilterChange,
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
    const stockPivotRef = useRef(null);
    const [stockSearch, setStockSearch] = useState('');
    const [activeSection, setActiveSection] = useState('KELUAR');
    const isProject = activeTab === 'PROYEK';
    const pivotRows = useMemo(() => buildPivotRows(dataList, isProject), [dataList, isProject]);
    const stockPivotRows = useMemo(() => buildStockPivotRows(stockDataList, stockSearch), [stockDataList, stockSearch]);

    const pivotLevels = useMemo(() => {
        const barangLevel = {
            key: 'barang',
            getValue: row => `${row?.nama_barang_display || '-'}|||${row?.kode_ppl || '-'}`,
            format: value => value.split('|||')[0],
            subLabel: node => `Kode PPL: ${node.value.split('|||')[1] || '-'}`,
            showValues: true,
        };

        const categoryLevel = {
            key: 'kategori',
            getValue: row => String(row?.kategori || '').trim() || 'Tanpa Kategori',
            emptyLabel: 'Tanpa Kategori',
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
                categoryLevel,
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
            categoryLevel,
            barangLevel,
            serialNumberLevel,
        ];
    }, [isProject]);

    const stockPivotLevels = useMemo(() => [
        {
            key: 'warehouse',
            getValue: row => row?.warehouse_display || '-',
            emptyLabel: 'Gudang tidak diketahui',
            showValues: true,
        },
        {
            key: 'kategori',
            getValue: row => String(row?.kategori || '').trim() || 'Tanpa Kategori',
            emptyLabel: 'Tanpa Kategori',
            showValues: true,
        },
        {
            key: 'barang',
            getValue: row => `${row?.nama_barang_display || '-'}|||${row?.kode_ppl || '-'}`,
            format: value => value.split('|||')[0],
            subLabel: node => `Kode PPL: ${node.value.split('|||')[1] || '-'}`,
            showValues: true,
        },
        {
            key: 'stock_detail',
            getValue: row => row?.serial_number_display || '-',
            subLabel: node => {
                const row = node.rows?.[0];
                if (!row) return '';
                if (row.is_wajib_sn) return `Kondisi: ${row.kondisi || 'Baru'} • Serial Number di gudang`;
                return `Jenis: Non-SN • Kondisi: ${row.kondisi || 'Belum diketahui'}`;
            },
            showValues: true,
        },
    ], []);

    const stockValueColumns = useMemo(() => [
        { key: 'qty', label: 'JUMLAH', getValue: row => row?.pivot_qty || 0, aggregate: 'sum', format: 'number', align: 'center', grandTotalAlign: 'center', width: 90 },
        { key: 'usable', label: 'STOK USABLE', getValue: row => row?.pivot_usable || 0, aggregate: 'sum', format: 'number', align: 'center', grandTotalAlign: 'center', width: 95, cellClassName: 'text-sky-600 dark:text-sky-400' },
        { key: 'baru', label: 'BARU', getValue: row => row?.pivot_baru || 0, aggregate: 'sum', format: 'number', align: 'center', grandTotalAlign: 'center', width: 75, cellClassName: 'text-emerald-600 dark:text-emerald-400' },
        { key: 'bekas', label: 'BEKAS', getValue: row => row?.pivot_bekas || 0, aggregate: 'sum', format: 'number', align: 'center', grandTotalAlign: 'center', width: 75, cellClassName: 'text-amber-600 dark:text-amber-400' },
        { key: 'rusak', label: 'RUSAK', getValue: row => row?.pivot_rusak || 0, aggregate: 'sum', format: 'number', align: 'center', grandTotalAlign: 'center', width: 75, cellClassName: 'text-rose-600 dark:text-rose-400' },
        { key: 'lainnya', label: 'LAINNYA', getValue: row => row?.pivot_lainnya || 0, aggregate: 'sum', format: 'number', align: 'center', grandTotalAlign: 'center', width: 85 },
        { key: 'nilai', label: 'NILAI STOK (RP)', getValue: row => row?.pivot_nilai || 0, aggregate: 'sum', format: 'currency', align: 'right', grandTotalAlign: 'right', width: 155 },
    ], []);

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
            <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Kategori rincian aset">
                <Button
                    type="button"
                    role="tab"
                    aria-selected={activeSection === 'KELUAR'}
                    onClick={() => setActiveSection('KELUAR')}
                    disabled={isProcessing}
                    shape="default" flipHorizontal={false} flipVertical={false} variant="default"
                    effect="none" effectColor="#22D3EE" decoration="none" decorationColor="#FFFFFF"
                    color="rose" size="sm" width="fit" layer="normal" attached="none" hover
                    selected={activeSection === 'KELUAR'}
                    className={`!w-auto gap-2 px-4 py-2 text-xs font-bold transition-colors ${activeSection === 'KELUAR' ? '!bg-rose-600 !text-white shadow-sm' : '!bg-transparent !text-slate-600 hover:!bg-slate-100 dark:!text-slate-300 dark:hover:!bg-slate-800'}`}
                >
                    <ClipboardList className="h-4 w-4" />
                    <span>Rincian Keluar</span>
                </Button>
                <Button
                    type="button"
                    role="tab"
                    aria-selected={activeSection === 'STOK_AKHIR'}
                    onClick={() => setActiveSection('STOK_AKHIR')}
                    disabled={isProcessing}
                    shape="default" flipHorizontal={false} flipVertical={false} variant="default"
                    effect="none" effectColor="#22D3EE" decoration="none" decorationColor="#FFFFFF"
                    color="blue" size="sm" width="fit" layer="normal" attached="none" hover
                    selected={activeSection === 'STOK_AKHIR'}
                    className={`!w-auto gap-2 px-4 py-2 text-xs font-bold transition-colors ${activeSection === 'STOK_AKHIR' ? '!bg-blue-600 !text-white shadow-sm' : '!bg-transparent !text-slate-600 hover:!bg-slate-100 dark:!text-slate-300 dark:hover:!bg-slate-800'}`}
                >
                    <Warehouse className="h-4 w-4" />
                    <span>Rincian Stok Akhir</span>
                </Button>
            </div>

            {activeSection === 'KELUAR' && (
            <Card className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardContent className="p-0">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <Button type="button" onClick={() => onTabChange?.('PROYEK')} disabled={isProcessing} shape="default" flipHorizontal={false} flipVertical={false} variant="default" effect="none" effectColor="#22D3EE" decoration="none" decorationColor="#FFFFFF" color="rose" size="sm" width="fit" layer="normal" attached="none" hover selected={activeTab === 'PROYEK'} className={`!w-auto gap-1.5 px-3.5 py-1.5 text-xs font-bold ${activeTab === 'PROYEK' ? '!bg-rose-600 !text-white' : '!bg-transparent !text-slate-600 dark:!text-slate-400'}`}>
                                    <BriefcaseBusiness className="h-3.5 w-3.5" /><span>Proyek</span>
                                </Button>
                                <Button type="button" onClick={() => onTabChange?.('NON_PROYEK')} disabled={isProcessing} shape="default" flipHorizontal={false} flipVertical={false} variant="default" effect="none" effectColor="#22D3EE" decoration="none" decorationColor="#FFFFFF" color="blue" size="sm" width="fit" layer="normal" attached="none" hover selected={activeTab === 'NON_PROYEK'} className={`!w-auto gap-1.5 px-3.5 py-1.5 text-xs font-bold ${activeTab === 'NON_PROYEK' ? '!bg-blue-600 !text-white' : '!bg-transparent !text-slate-600 dark:!text-slate-400'}`}>
                                    <Building2 className="h-3.5 w-3.5" /><span>Non Proyek</span>
                                </Button>
                            </div>
                            <div className="flex min-w-0 flex-wrap items-center justify-start xl:justify-end gap-2">
                                {isProject && <>
                                    <Button type="button" aria-pressed={projectCodeFilter === 'MRC'} onClick={() => onProjectCodeFilterChange?.(projectCodeFilter === 'MRC' ? 'ALL' : 'MRC')} disabled={isProcessing} shape="default" flipHorizontal={false} flipVertical={false} variant={projectCodeFilter === 'MRC' ? 'default' : 'outlined'} effect="none" effectColor="#22D3EE" decoration="none" decorationColor="#FFFFFF" color="rose" size="sm" width="fit" layer="normal" attached="none" hover selected={projectCodeFilter === 'MRC'} className={`!w-auto px-3 py-1.5 text-[10px] font-bold ${projectCodeFilter === 'MRC' ? '!bg-rose-600 !text-white' : '!bg-transparent !text-rose-600 dark:!text-rose-300'}`}>MRC</Button>
                                    <Button type="button" aria-pressed={projectCodeFilter === 'OTC'} onClick={() => onProjectCodeFilterChange?.(projectCodeFilter === 'OTC' ? 'ALL' : 'OTC')} disabled={isProcessing} shape="default" flipHorizontal={false} flipVertical={false} variant={projectCodeFilter === 'OTC' ? 'default' : 'outlined'} effect="none" effectColor="#22D3EE" decoration="none" decorationColor="#FFFFFF" color="blue" size="sm" width="fit" layer="normal" attached="none" hover selected={projectCodeFilter === 'OTC'} className={`!w-auto px-3 py-1.5 text-[10px] font-bold ${projectCodeFilter === 'OTC' ? '!bg-blue-600 !text-white' : '!bg-transparent !text-blue-600 dark:!text-blue-300'}`}>OTC</Button>
                                </>}
                                <Button type="button" onClick={handleExpandAll} disabled={!pivotRows.length || isProcessing} shape="default" flipHorizontal={false} flipVertical={false} variant="outlined" effect="none" effectColor="#22D3EE" decoration="none" decorationColor="#FFFFFF" color="slate" size="sm" width="fit" layer="normal" attached="none" hover className="!w-auto px-3 py-1.5 text-[10px] font-bold">Expand Semua</Button>
                                <Button type="button" onClick={handleCollapseAll} disabled={!pivotRows.length || isProcessing} shape="default" flipHorizontal={false} flipVertical={false} variant="outlined" effect="none" effectColor="#22D3EE" decoration="none" decorationColor="#FFFFFF" color="slate" size="sm" width="fit" layer="normal" attached="none" hover className="!w-auto px-3 py-1.5 text-[10px] font-bold">Collapse</Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200 px-3 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-5 sm:py-4">
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base lg:text-lg">Analisis Barang Keluar</h2>
                            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs">{isProject ? 'Saldo pengeluaran proyek setelah pengembalian → Nama Barang → Serial Number' : 'Pemakaian internal → Nama Barang → Serial Number'}</p>
                        </div>
                        <div className="min-w-0 shrink-0 w-full sm:w-[clamp(12rem,24vw,24rem)]">
                            <Search value={searchTerm} onChange={setSearchTerm} onSearch={onSearch} placeholder="Cari barang / kode PPL / SN..." disabled={isProcessing} variant={searchVariant} color={searchColor} size={searchSize} buttonLabel={searchButtonLabel} iconPosition={searchIconPosition} className={`w-full ${searchClassName}`} />
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
            )}

            {activeSection === 'STOK_AKHIR' && (
            <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-0">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base lg:text-lg">Rincian Stok Akhir</h2>
                            <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs">
                                Stok aktual di gudang → Kategori → Nama Barang → Serial Number atau kondisi Non-SN
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                            <Button
                                type="button"
                                onClick={() => stockPivotRef.current?.expandAll()}
                                disabled={!stockPivotRows.length || isProcessing}
                                shape="default" flipHorizontal={false} flipVertical={false} variant="outlined"
                                effect="none" effectColor="#22D3EE" decoration="none" decorationColor="#FFFFFF"
                                color="slate" size="sm" width="fit" layer="normal" attached="none" hover
                                className="!w-auto px-3 py-1.5 text-[10px] font-bold"
                            >
                                Expand Semua
                            </Button>
                            <Button
                                type="button"
                                onClick={() => stockPivotRef.current?.collapseAll()}
                                disabled={!stockPivotRows.length || isProcessing}
                                shape="default" flipHorizontal={false} flipVertical={false} variant="outlined"
                                effect="none" effectColor="#22D3EE" decoration="none" decorationColor="#FFFFFF"
                                color="slate" size="sm" width="fit" layer="normal" attached="none" hover
                                className="!w-auto px-3 py-1.5 text-[10px] font-bold"
                            >
                                Collapse
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end border-b border-slate-200 px-3 py-3 dark:border-slate-800 sm:px-5">
                        <div className="min-w-0 w-full sm:w-[clamp(12rem,24vw,20rem)]">
                            <Search
                                value={stockSearch}
                                onChange={setStockSearch}
                                onSearch={value => setStockSearch(String(value ?? stockSearch).trim())}
                                placeholder="Cari gudang / kategori / barang / kode PPL / SN..."
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
                        ref={stockPivotRef}
                        data={stockPivotRows}
                        levels={stockPivotLevels}
                        valueColumns={stockValueColumns}
                        rowLabelHeader="ROW LABELS"
                        grandTotalLabel="Total Stok Akhir"
                        emptyMessage="Belum ada stok di gudang."
                        emptySubMessage="Coba ubah kata pencarian atau periksa lokasi stok yang tersedia."
                        indentation={24}
                        zoomLevel={Math.min(zoomLevel, 95)}
                        defaultExpanded={false}
                        showGrandTotal
                        showFooter
                        footerLeftText="Jumlah fisik termasuk Rusak; Stok Usable = Baru + Bekas. Non-SN dirinci berdasarkan kondisi."
                    />
                </CardContent>
            </Card>
            )}
        </div>
    );
}
