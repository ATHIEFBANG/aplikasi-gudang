import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

import { 
    Pencil, 
    Plus, 
    Loader2 
} from 'lucide-react';
import { router } from '@inertiajs/react';

// --- SKEMA KOLOM MASTER DATA TERPERBARUI ---
const TABLE_COLUMNS = {
    rpm: [
        { key: 'rpm_id', label: 'ID RPM' },
        { key: 'site_id', label: 'Site ID' },
        { key: 'rtp', label: 'RTP' },
        { key: 'mitra', label: 'Mitra' },
        { key: 'bulan_tahun', label: 'Bulan / Tahun' },
        { key: 'approve', label: 'Approve Status' },
        { key: 'tanggal_submit', label: 'Tanggal Submit' },
        { key: 'tanggal_approve', label: 'Tanggal Approve' },
    ],
    smartkey: [
        { key: 'serial_number', label: 'Serial Number (Lock ID)' },
        { key: 'new_sn', label: 'New SN' },
        { key: 'tower_id', label: 'Tower ID' },
        { key: 'site_name', label: 'Site Name' },
        { key: 'kota_kab', label: 'Kota / Kab' },
        { key: 'long_lat', label: 'Long Lat' },
        { key: 'infrako', label: 'Infrako' },
        { key: 'status', label: 'Status' },
        { key: 'status_aktifitas', label: 'Status Aktifitas' },
        { key: 'ksm', label: 'KSM' },
        { key: 'posisi_unit', label: 'Posisi Unit' },
        { key: 'batch', label: 'Batch' },
    ]
};

export default function CrudTable({
    dataList = [],
    subTab = 'rpm',
    selectedIds = [],
    onSelectAll,
    onSelectRow,
    getRowNumber
}) {
    // Helper untuk mendapatkan ID unik baris data
    const getItemId = (item) => item.id || item.rpm_id || item.serial_number;

    // Pengecekan Select All yang akurat berdasarkan dataList yang tampil
    const isAllSelected = dataList.length > 0 && dataList.every(item => selectedIds.includes(getItemId(item)));

    // Ambil daftar kolom aktif berdasarkan subTab
    const currentColumns = TABLE_COLUMNS[subTab] || TABLE_COLUMNS.rpm;

    // --- STATE MODAL BARIS (TAMBAH / EDIT) ---
    const [rowModalData, setRowModalData] = useState(null);
    const [isRowEditMode, setIsRowEditMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // ==========================================
    // --- HANDLER BARIS (ROW MANAGEMENT) ---
    // ==========================================
    const handleOpenAddRow = () => {
        setIsRowEditMode(false);
        const initialFormState = {};
        
        currentColumns.forEach(col => {
            if (col.key === 'bulan_tahun') {
                initialFormState.bulan = '';
                initialFormState.tahun = '';
            } else {
                initialFormState[col.key] = '';
            }
        });
        
        setRowModalData(initialFormState);
    };

    const handleOpenEditRow = (item) => {
        setIsRowEditMode(true);
        setRowModalData({ ...item });
    };

    const handleSubmitRow = (e) => {
        e.preventDefault();
        setIsProcessing(true);

        const routeName = subTab === 'rpm' 
            ? (isRowEditMode ? 'maintenance.data-management.update-rpm' : 'maintenance.data-management.store-rpm')
            : (isRowEditMode ? 'maintenance.data-management.update-smartkey' : 'maintenance.data-management.store-smartkey');

        const method = isRowEditMode ? 'put' : 'post';
        const targetId = getItemId(rowModalData);
        const url = isRowEditMode ? route(routeName, targetId) : route(routeName);

        router[method](url, rowModalData, {
            preserveScroll: true,
            onSuccess: () => {
                setRowModalData(null);
                setIsProcessing(false);
            },
            onError: () => setIsProcessing(false),
            onFinish: () => setIsProcessing(false)
        });
    };

    // --- RENDER SEL DATA BERDASARKAN KEY KOLOM ---
    const renderTableCell = (item, colKey) => {
        switch (colKey) {
            case 'rpm_id':
                return (
                    <TableCell key={colKey} className="font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {item.rpm_id || item.id_rpm || item.id_excel || '-'}
                    </TableCell>
                );
            case 'site_id':
                return (
                    <TableCell key={colKey} className="font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {item.site_id || item.siteid || '-'}
                    </TableCell>
                );
            case 'rtp':
                return <TableCell key={colKey} className="uppercase whitespace-nowrap">{item.rtp || '-'}</TableCell>;
            case 'mitra':
                return <TableCell key={colKey} className="whitespace-nowrap">{item.mitra || '-'}</TableCell>;
            case 'bulan_tahun':
                return <TableCell key={colKey} className="whitespace-nowrap">{item.bulan ? `${item.bulan} ${item.tahun || ''}` : '-'}</TableCell>;
            case 'approve':
                const approveVal = String(item.approve || '').toLowerCase();
                const isBelumApproved = approveVal.includes('belum');
                const isApproved = approveVal.includes('approve') || approveVal.includes('setuju') || approveVal.includes('sudah');

                return (
                    <TableCell key={colKey} className="whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            isBelumApproved 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                                : isApproved
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                            {item.approve || '-'}
                        </span>
                    </TableCell>
                );
            case 'tanggal_submit':
            case 'tanggal_approve':
                return <TableCell key={colKey} className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{item[colKey] || '-'}</TableCell>;
            case 'serial_number':
                return <TableCell key={colKey} className="font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{item.serial_number || '-'}</TableCell>;
            case 'new_sn':
                return <TableCell key={colKey} className="font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{item.new_sn || '-'}</TableCell>;
            case 'tower_id':
                return <TableCell key={colKey} className="font-mono whitespace-nowrap">{item.tower_id || '-'}</TableCell>;
            case 'site_name':
            case 'kota_kab':
            case 'infrako':
            case 'status':
            case 'status_aktifitas':
            case 'ksm':
            case 'posisi_unit':
                return <TableCell key={colKey} className="whitespace-nowrap">{item[colKey] || '-'}</TableCell>;
            case 'long_lat':
            case 'batch':
                return <TableCell key={colKey} className="text-xs font-mono whitespace-nowrap">{item[colKey] || '-'}</TableCell>;
            default:
                return <TableCell key={colKey} className="whitespace-nowrap">{item[colKey] !== undefined && item[colKey] !== null ? String(item[colKey]) : '-'}</TableCell>;
        }
    };

    // --- RENDER FIELD INPUT DI MODAL BARIS ---
    const renderModalInputFields = () => {
        if (!rowModalData) return null;

        return currentColumns.map((col) => {
            if (col.key === 'bulan_tahun') {
                return (
                    <div key={col.key} className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Bulan</label>
                            <Input 
                                disabled={isProcessing}
                                value={rowModalData.bulan || ''} 
                                onChange={(e) => setRowModalData({ ...rowModalData, bulan: e.target.value })} 
                                placeholder="Contoh: Januari"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Tahun</label>
                            <Input 
                                disabled={isProcessing}
                                value={rowModalData.tahun || ''} 
                                onChange={(e) => setRowModalData({ ...rowModalData, tahun: e.target.value })} 
                                placeholder="Contoh: 2026"
                            />
                        </div>
                    </div>
                );
            }

            const isFullWidth = ['approve', 'long_lat', 'tanggal_submit', 'tanggal_approve'].includes(col.key);

            return (
                <div key={col.key} className={isFullWidth ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">{col.label}</label>
                    <Input 
                        disabled={isProcessing}
                        value={rowModalData[col.key] || ''} 
                        onChange={(e) => setRowModalData({ ...rowModalData, [col.key]: e.target.value })} 
                        placeholder={`Masukkan ${col.label.toLowerCase()}`}
                    />
                </div>
            );
        });
    };

    return (
        <div className="space-y-3">
            {/* ACTION BAR SUB-TABEL */}
            <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Kelola Data Master {subTab.toUpperCase()}
                </span>
                
                <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleOpenAddRow}
                    className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Data Baru</span>
                </Button>
            </div>

            {/* TABEL UTAMA */}
            <div className="relative overflow-x-auto rounded-b-xl">
                <Table>
                    <TableHeader className="bg-slate-100/80 dark:bg-slate-800/80">
                        <TableRow>
                            {/* Checkbox Select All & Action */}
                            <TableHead className="w-20 text-center sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center justify-center gap-2">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={onSelectAll}
                                        title="Pilih Semua"
                                    />
                                    <span>Aksi</span>
                                </div>
                            </TableHead>

                            {/* Nomor Baris */}
                            <TableHead className="w-12 text-center">No</TableHead>

                            {/* Header Kolom */}
                            {currentColumns.map((col) => (
                                <TableHead key={col.key} className="font-semibold text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                    {col.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {dataList.length > 0 ? (
                            dataList.map((item, index) => {
                                const itemId = getItemId(item);
                                const isSelected = selectedIds.includes(itemId);

                                return (
                                    <TableRow key={itemId || index} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        {/* Sticky Cell Checkbox & Edit Baris */}
                                        <TableCell className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-100/90 dark:group-hover:bg-slate-800/90 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-center transition-colors">
                                            <div className="flex items-center justify-center gap-2">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => onSelectRow(itemId)}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                                    onClick={() => handleOpenEditRow(item)}
                                                    title="Edit Baris Ini"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>

                                        {/* Nomor Urut */}
                                        <TableCell className="font-mono text-xs text-slate-400 text-center font-bold">
                                            {getRowNumber ? getRowNumber(index) : index + 1}
                                        </TableCell>

                                        {/* Render Data Kolom */}
                                        {currentColumns.map((col) => renderTableCell(item, col.key))}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={currentColumns.length + 2} className="h-24 text-center text-slate-400 dark:text-slate-500">
                                    Belum ada data Master {subTab.toUpperCase()}.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* MODAL SHADCN: BARIS (TAMBAH / EDIT) */}
            <Dialog open={!!rowModalData} onOpenChange={(open) => !open && !isProcessing && setRowModalData(null)}>
                <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {isRowEditMode ? 'Edit Baris Data' : 'Tambah Baris Baru'} ({subTab.toUpperCase()})
                        </DialogTitle>
                    </DialogHeader>

                    {rowModalData && (
                        <form onSubmit={handleSubmitRow} className="space-y-4 py-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {renderModalInputFields()}
                            </div>

                            <DialogFooter className="pt-4 sticky bottom-0 bg-white dark:bg-slate-900 pb-1 border-t border-slate-100 dark:border-slate-800">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setRowModalData(null)} 
                                    disabled={isProcessing}
                                >
                                    Batal
                                </Button>
                                <Button 
                                    type="submit" 
                                    size="sm" 
                                    disabled={isProcessing} 
                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                                >
                                    {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{isRowEditMode ? 'Simpan Perubahan' : 'Tambah Baris'}</span>
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}