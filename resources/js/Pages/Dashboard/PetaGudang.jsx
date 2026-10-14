import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Tabel from '@/components/Tabel';
import Map from '@/components/Map';
import { MapPin, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import ModalGudang from './ModalGudang';
import { useConfirm } from '@/Layouts/AuthenticatedLayout';

const GUDANG_MAP_CONFIG = {
    ACTIVE: {
        label: 'Gudang Aktif',
        color: '#2563eb',
        bg: 'rgba(37, 99, 235, 0.35)',
    }
};

const TABLE_COLUMNS = [
    { key: 'kode_gudang', altKeys: ['kode_gudang', 'kode', 'code'], label: 'Kode Gudang' },
    { key: 'nama_gudang', altKeys: ['nama_gudang', 'name', 'nama'], label: 'Nama Gudang' },
    { key: 'lokasi', altKeys: ['lokasi', 'alamat', 'address'], label: 'Alamat / Lokasi' },
    { key: 'koordinat', label: 'Koordinat (Lat, Lng)' },
    { key: 'total_qty', label: 'Total Stok Fisik' },
];

export default function PetaGudang({ mapData = [] }) {
    const { auth } = usePage().props;
    const userRole = auth?.user?.role || 'view';
    const canWrite = userRole === 'admin' || userRole === 'staff';
    const isAdmin = userRole === 'admin';
    const confirm = useConfirm();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    // Client-Side Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [perPageInput, setPerPageInput] = useState(10);

    const getItemId = useCallback((item) => item?.id, []);
    const getRowNumber = (index) => (currentPage - 1) * perPage + index + 1;

    const totalData = mapData.length;
    const totalPages = Math.ceil(totalData / perPage) || 1;
    const fromIndex = totalData > 0 ? (currentPage - 1) * perPage + 1 : 0;
    const toIndex = Math.min(currentPage * perPage, totalData);

    const paginatedList = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return mapData.slice(start, start + perPage);
    }, [mapData, currentPage, perPage]);

    const handlePerPageSubmit = () => {
        let val = parseInt(perPageInput, 10);
        if (isNaN(val) || val < 1) val = 10;
        else if (val > 100) val = 100;
        setPerPageInput(val);
        setPerPage(val);
        setCurrentPage(1);
    };

    const handleOpenAdd = () => {
        if (!canWrite) return;
        setIsEditMode(false);
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (gudang) => {
        if (!canWrite || !gudang) return;
        setIsEditMode(true);
        setSelectedItem(gudang);
        setIsModalOpen(true);
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = mapData.map(item => getItemId(item)).filter(Boolean);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = () => {
        if (!isAdmin || selectedIds.length === 0) return;
        confirm({
            title: 'Hapus Lokasi Gudang',
            message: `Apakah Anda yakin ingin MENGHAPUS ${selectedIds.length} data lokasi gudang terpilih? Data yang dihapus tidak dapat dikembalikan.`,
            variant: 'danger',
            confirmText: 'Ya, Hapus Data',
            cancelText: 'Batal',
            onConfirm: () => {
                router.post('/gudang/bulk-delete', { ids: selectedIds }, {
                    preserveScroll: true,
                    onSuccess: () => setSelectedIds([])
                });
            }
        });
    };

    const getFieldValue = useCallback((item, colDef) => {
        if (!item || !colDef) return '';
        if (colDef.altKeys && Array.isArray(colDef.altKeys)) {
            for (const k of colDef.altKeys) {
                if (item[k] !== undefined && item[k] !== null && item[k] !== '') return item[k];
            }
        }
        return item[colDef.key] ?? '';
    }, []);

    const formattedColumns = useMemo(() => {
        return TABLE_COLUMNS.map(col => ({
            ...col,
            render: (item) => {
                const value = getFieldValue(item, col);
                switch (col.key) {
                    case 'kode_gudang':
                        return (
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                {value || '-'}
                            </span>
                        );

                    case 'nama_gudang':
                        return (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {value || '-'}
                            </span>
                        );

                    case 'lokasi':
                        return (
                            <span className="text-slate-600 dark:text-slate-400 text-xs">
                                {value || '-'}
                            </span>
                        );

                    case 'koordinat':
                        return (
                            <span className="font-mono text-slate-500 text-[11px]">
                                {item.latitude && item.longitude ? `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}` : '-'}
                            </span>
                        );

                    case 'total_qty':
                        return (
                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                {(item.total_qty || 0).toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-400">Unit</span>
                            </span>
                        );

                    default:
                        return value !== undefined && value !== null && value !== '' ? String(value) : '-';
                }
            }
        }));
    }, [getFieldValue]);

    return (
        <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            {/* 1. Header Card Peta */}
            <CardHeader className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-amber-400">
                        <MapPin className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        Peta Sebaran Gudang Logistik
                    </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        <strong className="text-blue-600 dark:text-amber-400 font-bold">{mapData.length}</strong> Lokasi Teridentifikasi
                    </span>
                </div>
            </CardHeader>

            {/* 2. Peta Leaflet */}
            <CardContent className="p-0">
                <div className="w-full h-[540px] relative border-b border-slate-200/80 dark:border-slate-800/80">
                    <Map
                        data={mapData}
                        statusKey="status"
                        statusConfig={GUDANG_MAP_CONFIG}
                        height="h-[540px]"
                        getPopupData={(item, lat, lng) => ({
                            title: item.nama_gudang || item.kode_gudang,
                            details: [
                                { label: 'Kode Gudang', value: item.kode_gudang || '-' },
                                { label: 'Lokasi Area', value: item.lokasi || '-' },
                                { label: 'Total Stok Fisik', value: `${(item.total_qty || 0).toLocaleString('id-ID')} Unit` },
                                { label: 'Koordinat', value: `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`, isMonospace: true }
                            ],
                            statusText: 'GUDANG AKTIF'
                        })}
                    />
                </div>

                {/* 3. Sub-Header Tabel */}
                <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Daftar Titik Gudang Operasional
                    </span>
                    <div className="flex items-center gap-2">
                        {isAdmin && selectedIds.length > 0 && (
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={handleDeleteSelected}
                                className="h-8 text-xs gap-1.5 shadow-sm cursor-pointer animate-in fade-in"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus ({selectedIds.length})</span>
                            </Button>
                        )}
                        {canWrite && (
                            <Button 
                                type="button"
                                size="sm"
                                onClick={handleOpenAdd}
                                className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Data Baru</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* 4. Tabel Rincian Stok */}
                <div className="w-full [&>div]:border-0 [&>div]:rounded-none [&>div]:shadow-none border-b border-slate-200 dark:border-slate-800">
                    <Tabel
                        data={paginatedList}
                        columns={formattedColumns}
                        selectedIds={selectedIds}
                        onSelectAll={handleSelectAll}
                        onSelectRow={handleSelectRow}
                        onEditRow={canWrite ? handleOpenEdit : undefined}
                        getItemId={getItemId}
                        getRowNumber={getRowNumber}
                        emptyMessage="Belum ada data titik lokasi gudang terdaftar."
                    />
                </div>

                {/* 5. Pagination Footer */}
                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <span>Tampilkan</span>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={perPageInput}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val !== '' && Number(val) > 100) setPerPageInput(100);
                                else setPerPageInput(val);
                            }}
                            onBlur={handlePerPageSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handlePerPageSubmit();
                                }
                            }}
                            className="h-8 w-16 text-center text-xs font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span>data per halaman</span>
                    </div>
                    <div className="text-slate-500">
                        Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{fromIndex}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{toIndex}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{totalData}</span> data
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <Button
                                key={`page-${pageNum}`}
                                type="button"
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 ${
                                    currentPage === pageNum
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {pageNum}
                            </Button>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="h-8 min-w-[32px] px-2 text-xs font-semibold dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Modal Tambah/Edit Lokasi Gudang */}
            <ModalGudang
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isEditMode={isEditMode}
                selectedItem={selectedItem}
            />
        </Card>
    );
}