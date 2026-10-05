import React from 'react';
import Toolbar from '@/components/Toolbar';
import Tabel from '@/components/Tabel';
import HybridDropdown from '@/components/HybridDropdown';
import DateRangeFilter from '@/components/DateRangeFilter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    X,
} from 'lucide-react';

const formatNumber = value => Number(value || 0).toLocaleString('id-ID');

const formatCurrency = value => {
    const amount = Number(value || 0);
    if (!amount) return '-';
    return `Rp ${amount.toLocaleString('id-ID')}`;
};

const formatDate = value => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const getBarangName = item => {
    return [item?.brand, item?.tipe, item?.kategori].filter(Boolean).join(' ') || item?.nama_barang || '-';
};

export default function TabelRincianAset({
    activeTab = 'TERPASANG',
    dataList = [],
    pagination = {},
    isProcessing = false,
    searchTerm = '',
    setSearchTerm,
    project = '',
    projectOptions = [],
    onProjectChange,
    gudangId = 'ALL',
    gudangOptions = [],
    onGudangChange,
    startDate = '',
    endDate = '',
    onDateApply,
    onDateReset,
    onReset,
    onExport,
    sortOrder = 'desc',
    onToggleSort,
    zoomLevel = 100,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onFitZoom,
    onPageChange,
    onPerPageChange,
    perPage = 10,
}) {
    const currentPage = Number(pagination?.current_page || 1);
    const lastPage = Number(pagination?.last_page || 1);
    const total = Number(pagination?.total || 0);
    const from = Number(pagination?.from || 0);
    const to = Number(pagination?.to || 0);

    const tabTitles = {
        TERPASANG: 'Daftar Aset Project Terpasang',
        GUDANG: 'Daftar Aset Project di Gudang',
        STOK: 'Daftar Stok per Gudang',
    };

    const renderBarang = item => (
        <div className="min-w-[220px] max-w-[320px]">
            <p
                className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate"
                title={getBarangName(item)}
            >
                {getBarangName(item)}
            </p>

            <div className="flex items-center gap-2 mt-0.5">
                {item?.nama_barang && getBarangName(item) !== item.nama_barang && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {item.nama_barang}
                    </span>
                )}

                {item?.part_number && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                        PN: {item.part_number}
                    </span>
                )}
            </div>
        </div>
    );

    const baseColumns = {
        kodeBarang: {
            key: 'kode_barang',
            label: 'KODE PPL',
            className: 'w-[140px]',
            cellClassName: 'font-mono font-bold text-blue-600 dark:text-blue-400',
            render: item => item.kode_barang || '-',
        },
        barang: {
            key: 'nama_barang',
            label: 'BARANG',
            render: renderBarang,
        },
        jumlah: {
            key: 'jumlah',
            label: 'JUMLAH',
            className: 'w-[110px] text-center',
            cellClassName: 'text-center font-mono font-bold',
            render: item => formatNumber(item.jumlah),
        },
        harga: {
            key: 'harga',
            label: 'HARGA SATUAN',
            className: 'w-[160px] text-right',
            cellClassName: 'text-right font-mono',
            render: item => formatCurrency(item.harga),
        },
        nilaiAset: {
            key: 'nilai_aset',
            label: 'NILAI ASET',
            className: 'w-[170px] text-right',
            cellClassName: 'text-right font-mono font-bold text-slate-900 dark:text-white',
            render: item => formatCurrency(item.nilai_aset),
        },
    };

    const getColumns = () => {
        if (activeTab === 'GUDANG') {
            return [
                {
                    key: 'keluar_data',
                    label: 'KELUAR',
                    className: 'w-[130px]',
                    cellClassName: 'text-slate-500 dark:text-slate-400',
                    render: item => formatDate(item.keluar_data),
                },
                baseColumns.kodeBarang,
                baseColumns.barang,
                {
                    key: 'nama_gudang',
                    label: 'GUDANG',
                    className: 'w-[180px]',
                    render: item => (
                        <div>
                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                {item.nama_gudang || '-'}
                            </p>

                            {item.kode_gudang && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {item.kode_gudang}
                                </p>
                            )}
                        </div>
                    ),
                },
                baseColumns.jumlah,
                baseColumns.harga,
                baseColumns.nilaiAset,
            ];
        }

        if (activeTab === 'STOK') {
            return [
                {
                    key: 'nama_gudang',
                    label: 'GUDANG',
                    className: 'w-[180px]',
                    render: item => (
                        <div>
                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                {item.nama_gudang || '-'}
                            </p>

                            {item.kode_gudang && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {item.kode_gudang}
                                </p>
                            )}
                        </div>
                    ),
                },
                baseColumns.kodeBarang,
                baseColumns.barang,
                {
                    key: 'total_stok',
                    label: 'TOTAL STOK',
                    className: 'w-[130px] text-center',
                    cellClassName: 'text-center font-mono font-bold',
                    render: item => formatNumber(item.total_stok),
                },
                baseColumns.harga,
                baseColumns.nilaiAset,
            ];
        }

        return [
            baseColumns.kodeBarang,
            baseColumns.barang,
            {
                key: 'project',
                label: 'PROJECT',
                className: 'w-[190px]',
                render: item => (
                    <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {item.project || '-'}
                        </p>

                        {item.nama_customer && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[170px]">
                                {item.nama_customer}
                            </p>
                        )}
                    </div>
                ),
            },
            baseColumns.jumlah,
            baseColumns.harga,
            baseColumns.nilaiAset,
            {
                key: 'status',
                label: 'STATUS',
                className: 'w-[120px] text-center',
                cellClassName: 'text-center',
                render: item => (
                    <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {item.status || 'Terpasang'}
                    </span>
                ),
            },
        ];
    };

    const columns = getColumns();

    const getRowNumber = index => {
        const limit = pagination?.per_page || perPage;
        return (currentPage - 1) * limit + index + 1;
    };

    return (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
            <CardContent className="p-0">
                <Toolbar
                    sortOrder={sortOrder}
                    onToggleSort={onToggleSort}
                    onReset={onReset}
                    onExport={onExport}
                    isProcessing={isProcessing}
                    zoomLevel={zoomLevel}
                    onZoomIn={onZoomIn}
                    onZoomOut={onZoomOut}
                    onResetZoom={onResetZoom}
                    onFitZoom={onFitZoom}
                    leftContent={
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {tabTitles[activeTab] || tabTitles.TERPASANG}
                        </span>
                    }
                />

                <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Filter Aset
                    </span>

                    <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-end">
                        <DateRangeFilter
                            startDate={startDate}
                            endDate={endDate}
                            onApply={onDateApply}
                            onReset={onDateReset}
                            isProcessing={isProcessing}
                        />

                        {activeTab === 'TERPASANG' && (
                            <div className="w-44 shrink-0">
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
                        )}

                        <div className="w-44 shrink-0">
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

                        <div className="relative w-full sm:w-48">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                            <Input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Cari data..."
                                disabled={isProcessing}
                                className="h-8 pl-8 pr-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            />

                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full overflow-x-auto border-b border-slate-200 dark:border-slate-800">
                    <Tabel
                        data={dataList}
                        columns={columns}
                        selectedIds={[]}
                        mainTab={activeTab}
                        getItemId={(item, index) => `${item?.barang_id || 'barang'}-${item?.gudang_id || 'gudang'}-${item?.project || 'project'}-${index}`}
                        getRowNumber={getRowNumber}
                        zoomLevel={zoomLevel}
                        emptyMessage="Tidak ada data aset ditemukan."
                    />
                </div>

                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <span>Tampilkan</span>

                        <select
                            value={perPage}
                            onChange={e => onPerPageChange(Number(e.target.value))}
                            disabled={isProcessing}
                            className="h-8 w-16 text-center text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 cursor-pointer outline-none"
                        >
                            {[10, 20, 50, 100].map(value => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>

                        <span>data per halaman</span>
                    </div>

                    <div className="text-slate-500">
                        Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{from}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{to}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{total}</span> data
                    </div>

                    {lastPage > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={currentPage <= 1 || isProcessing}
                                onClick={() => onPageChange(currentPage - 1)}
                                className="w-8 h-8 rounded-md border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            {Array.from({ length: Math.min(lastPage, 5) }, (_, index) => {
                                const page = index + 1;

                                return (
                                    <button
                                        key={page}
                                        type="button"
                                        disabled={isProcessing}
                                        onClick={() => onPageChange(page)}
                                        className={`h-8 min-w-[32px] px-2 rounded-md text-xs font-semibold cursor-pointer ${
                                            page === currentPage
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                disabled={currentPage >= lastPage || isProcessing}
                                onClick={() => onPageChange(currentPage + 1)}
                                className="w-8 h-8 rounded-md border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}