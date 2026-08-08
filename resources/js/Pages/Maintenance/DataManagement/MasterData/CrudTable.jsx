import React, { useState, useCallback, useMemo } from 'react';
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

import { 
    Pencil, 
    Plus, 
    Loader2, 
    Trash2, 
    PlusCircle, 
    ClipboardPaste,
    AlertCircle
} from 'lucide-react';
import { router } from '@inertiajs/react';

// Batas Maksimal Baris Paste Excel
const MAX_ROWS_LIMIT = 500;

// --- SKEMA & URUTAN KOLOM MASTER DATA ---
const TABLE_COLUMNS = {
    rpm: [
        { key: 'rpm_id', altKeys: ['rpm_id', 'id_rpm'], label: 'ID RPM' }, 
        { key: 'site_id', altKeys: ['siteid', 'site_id'], label: 'Site ID' },
        { key: 'rtp', altKeys: ['rtp'], label: 'RTP' },
        { key: 'mitra', altKeys: ['mitra'], label: 'Mitra' },
        { key: 'bulan', altKeys: ['bulan'], label: 'Bulan' },
        { key: 'tahun', altKeys: ['tahun'], label: 'Tahun' },
        { key: 'tanggal_submit', altKeys: ['tanggalsubn', 'tanggal_submit', 'tanggalsubmit'], label: 'Tanggal Submit', type: 'date' },
        { key: 'tanggal_approve', altKeys: ['tanggalappr', 'tanggal_approve', 'tanggalapprove'], label: 'Tanggal Approve', type: 'date' },
        { key: 'approve', altKeys: ['approve', 'status_approve'], label: 'Approve Status' },
    ],
    smartkey: [
        { key: 'infrako', altKeys: ['infrako'], label: 'Infrako' },
        { key: 'ksm', altKeys: ['ksm'], label: 'KSM' },
        { key: 'batch', altKeys: ['batch'], label: 'Batch' },
        { key: 'serial_number', altKeys: ['serial_number', 'sn', 'lock_id'], label: 'Serial Number (Lock ID)' },
        { key: 'new_sn', altKeys: ['new_sn'], label: 'New SN' },
        { key: 'tower_id', altKeys: ['tower_id'], label: 'Tower ID' },
        { key: 'site_name', altKeys: ['site_name'], label: 'Site Name' },
        { key: 'kota_kab', altKeys: ['kota_kab', 'kota', 'kabupaten'], label: 'Kota / Kab' },
        { key: 'status', altKeys: ['status'], label: 'Status' },
        { key: 'posisi_unit', altKeys: ['posisi_unit'], label: 'Posisi Unit' },
        { key: 'status_aktifitas', altKeys: ['status_aktifitas', 'status_aktivitas'], label: 'Status Aktifitas' },
        { key: 'long_lat', altKeys: ['long_lat', 'longlat', 'coordinate'], label: 'Long Lat' },
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
    const getFieldValue = useCallback((item, colDef) => {
        if (!item || !colDef) return '';
        if (colDef.altKeys && Array.isArray(colDef.altKeys)) {
            for (const k of colDef.altKeys) {
                if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
                    return item[k];
                }
            }
        }
        return item[colDef.key] ?? '';
    }, []);

    const getItemId = useCallback((item) => {
        return item?.id || item?.rpm_id || item?.serial_number || item?.infrako;
    }, []);

    const isAllSelected = useMemo(() => {
        return dataList.length > 0 && dataList.every(item => selectedIds.includes(getItemId(item)));
    }, [dataList, selectedIds, getItemId]);

    const currentColumns = useMemo(() => {
        return TABLE_COLUMNS[subTab] || TABLE_COLUMNS.rpm;
    }, [subTab]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [editData, setEditData] = useState({});
    const [addItems, setAddItems] = useState([]);

    const createEmptyRow = useCallback(() => {
        if (subTab === 'rpm') {
            return {
                rpm_id: '',
                site_id: '',
                rtp: '',
                mitra: '',
                bulan: '',
                tahun: '',
                tanggal_submit: '',
                tanggal_approve: '',
                approve: ''
            };
        }
        
        const emptyObj = {};
        currentColumns.forEach(col => { emptyObj[col.key] = ''; });
        return emptyObj;
    }, [subTab, currentColumns]);

    const parseAndApplyExcelData = useCallback((pastedText) => {
        if (!pastedText) return false;

        let rawRows = pastedText.trim().split(/\r\n|\n|\r/).filter(row => row.trim().length > 0);
        
        if (rawRows.length === 1 && !rawRows[0].includes('\t')) {
            return false;
        }

        if (rawRows.length > MAX_ROWS_LIMIT) {
            alert(`⚠️ Perhatian: Data paste berisi ${rawRows.length} baris. Dibatasi maksimal ${MAX_ROWS_LIMIT} baris.`);
            rawRows = rawRows.slice(0, MAX_ROWS_LIMIT);
        }

        const parsedItems = rawRows.map(rowStr => {
            const cells = rowStr.split('\t').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
            const rowObj = createEmptyRow();

            if (subTab === 'rpm') {
                rowObj.rpm_id = cells[0] ?? '';
                rowObj.site_id = cells[1] ?? '';
                rowObj.siteid = cells[1] ?? '';
                rowObj.rtp = cells[2] ?? '';
                rowObj.mitra = cells[3] ?? '';
                rowObj.bulan = cells[4] ?? '';
                rowObj.tahun = cells[5] ?? '';
                rowObj.tanggal_submit = cells[6] ?? '';
                rowObj.tanggalsubn = cells[6] ?? '';
                rowObj.tanggal_approve = cells[7] ?? '';
                rowObj.tanggalappr = cells[7] ?? '';
                rowObj.approve = cells[8] ?? '';
            } else {
                rowObj.infrako = cells[0] ?? '';
                rowObj.ksm = cells[1] ?? '';
                rowObj.batch = cells[2] ?? '';
                rowObj.serial_number = cells[3] ?? '';
                rowObj.new_sn = cells[4] ?? '';
                rowObj.tower_id = cells[5] ?? '';
                rowObj.site_name = cells[6] ?? '';
                rowObj.kota_kab = cells[7] ?? '';
                rowObj.status = cells[8] ?? '';
                rowObj.posisi_unit = cells[9] ?? '';
                rowObj.status_aktifitas = cells[10] ?? '';
                rowObj.long_lat = cells[11] ?? '';
            }

            return rowObj;
        });

        if (parsedItems.length > 0) {
            setAddItems(parsedItems);
            return true;
        }
        return false;
    }, [subTab, createEmptyRow]);

    const handleContainerPaste = useCallback((e) => {
        if (isEditMode) return;
        const pastedText = e.clipboardData.getData('text');
        const success = parseAndApplyExcelData(pastedText);
        if (success) {
            e.preventDefault();
        }
    }, [isEditMode, parseAndApplyExcelData]);

    const handlePasteFromClipboardButton = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                const success = parseAndApplyExcelData(text);
                if (!success) {
                    alert("Format teks clipboard bukan urutan tabel Excel yang valid.");
                }
            }
        } catch (err) {
            alert("Gagal membaca clipboard. Izinkan akses clipboard di browser atau gunakan Ctrl+V.");
        }
    }, [parseAndApplyExcelData]);

    const handleOpenAddModal = useCallback(() => {
        setIsEditMode(false);
        setAddItems([createEmptyRow()]);
        setIsModalOpen(true);
    }, [createEmptyRow]);

    const handleOpenEditModal = useCallback((item) => {
        setIsEditMode(true);
        const formattedItem = { ...item };
        currentColumns.forEach(col => {
            formattedItem[col.key] = getFieldValue(item, col);
        });
        formattedItem.bulan = item.bulan || '';
        formattedItem.tahun = item.tahun || '';
        setEditData(formattedItem);
        setIsModalOpen(true);
    }, [currentColumns, getFieldValue]);

    const handleCloseModal = useCallback(() => {
        if (isProcessing) return;
        setIsModalOpen(false);
        setEditData({});
        setAddItems([]);
    }, [isProcessing]);

    const handleAddMoreRows = useCallback((count = 1) => {
        setAddItems(prev => {
            if (prev.length + count > MAX_ROWS_LIMIT) {
                alert(`Maksimal penambahan data sekaligus adalah ${MAX_ROWS_LIMIT} baris.`);
                const allowedCount = MAX_ROWS_LIMIT - prev.length;
                if (allowedCount <= 0) return prev;
                return [...prev, ...Array.from({ length: allowedCount }, () => createEmptyRow())];
            }
            return [...prev, ...Array.from({ length: count }, () => createEmptyRow())];
        });
    }, [createEmptyRow]);

    const handleRemoveAddRow = useCallback((index) => {
        if (addItems.length <= 1) return;
        setAddItems(prev => prev.filter((_, i) => i !== index));
    }, [addItems.length]);

    const handleAddItemChange = useCallback((index, field, value) => {
        setAddItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            
            if (field === 'tanggal_submit') updated[index].tanggalsubn = value;
            if (field === 'tanggal_approve') updated[index].tanggalappr = value;
            if (field === 'site_id') updated[index].siteid = value;

            return updated;
        });
    }, []);

    const handleSubmitForm = (e) => {
        e.preventDefault();
        setIsProcessing(true);

        const routeName = subTab === 'rpm' 
            ? (isEditMode ? 'maintenance.data-management.update-rpm' : 'maintenance.data-management.store-rpm')
            : (isEditMode ? 'maintenance.data-management.update-smartkey' : 'maintenance.data-management.store-smartkey');

        const method = isEditMode ? 'put' : 'post';
        
        const getUrl = () => {
            if (typeof window.route === 'function') {
                return isEditMode ? window.route(routeName, getItemId(editData)) : window.route(routeName);
            }
            return isEditMode ? `/maintenance/data-management/${subTab}/${getItemId(editData)}` : `/maintenance/data-management/${subTab}`;
        };

        const payload = isEditMode ? editData : { items: addItems };

        router[method](getUrl(), payload, {
            preserveScroll: true,
            onSuccess: () => {
                handleCloseModal();
                setIsProcessing(false);
            },
            onError: () => setIsProcessing(false),
            onFinish: () => setIsProcessing(false)
        });
    };

    const renderTableCell = (item, colDef) => {
        const colKey = colDef.key;
        const value = getFieldValue(item, colDef);

        switch (colKey) {
            case 'rpm_id':
                return <TableCell key={colKey} className="font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">{value || '-'}</TableCell>;
            case 'site_id':
                return <TableCell key={colKey} className="font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{value || '-'}</TableCell>;
            case 'rtp':
                return <TableCell key={colKey} className="uppercase whitespace-nowrap">{value || '-'}</TableCell>;
            case 'mitra':
            case 'bulan':
            case 'tahun':
                return <TableCell key={colKey} className="whitespace-nowrap">{value || '-'}</TableCell>;
            case 'tanggal_submit':
            case 'tanggal_approve':
                return <TableCell key={colKey} className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{value || '-'}</TableCell>;
            case 'approve':
                const approveVal = String(value || '').toLowerCase();
                const isBelumApproved = approveVal.includes('belum');
                const isApproved = approveVal.includes('approve') || approveVal.includes('setuju') || approveVal.includes('sudah');

                return (
                    <TableCell key={colKey} className="whitespace-nowrap">
                        <Badge variant="outline" className={`font-semibold ${
                            isBelumApproved 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/10' 
                                : isApproved
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100'
                        }`}>
                            {value || '-'}
                        </Badge>
                    </TableCell>
                );
            case 'infrako':
                return <TableCell key={colKey} className="font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">{value || '-'}</TableCell>;
            case 'ksm':
            case 'batch':
                return <TableCell key={colKey} className="text-xs font-mono whitespace-nowrap">{value || '-'}</TableCell>;
            case 'serial_number':
                return <TableCell key={colKey} className="font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{value || '-'}</TableCell>;
            case 'new_sn':
                return <TableCell key={colKey} className="font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{value || '-'}</TableCell>;
            case 'tower_id':
                return <TableCell key={colKey} className="font-mono whitespace-nowrap">{value || '-'}</TableCell>;
            case 'site_name':
            case 'kota_kab':
            case 'status':
            case 'posisi_unit':
            case 'status_aktifitas':
                return <TableCell key={colKey} className="whitespace-nowrap">{value || '-'}</TableCell>;
            case 'long_lat':
                return <TableCell key={colKey} className="text-xs font-mono whitespace-nowrap">{value || '-'}</TableCell>;
            default:
                return <TableCell key={colKey} className="whitespace-nowrap">{value !== undefined && value !== null ? String(value) : '-'}</TableCell>;
        }
    };

    return (
        <div className="space-y-3">
            {/* HEADER BAR TABEL */}
            <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Kelola Data Master {subTab.toUpperCase()}
                </span>
                
                <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleOpenAddModal}
                    className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Data Baru</span>
                </Button>
            </div>

            {/* TABEL UTAMA */}
            <div className="relative overflow-x-auto rounded-b-xl border border-slate-200 dark:border-slate-800">
                <Table>
                    <TableHeader className="bg-slate-100/80 dark:bg-slate-800/80">
                        <TableRow>
                            <TableHead className="w-20 text-center sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-center gap-2">
                                    <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
                                    <span>Aksi</span>
                                </div>
                            </TableHead>

                            <TableHead className="w-12 text-center">No</TableHead>

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
                                const itemId = getItemId(item) || `row-${index}`;
                                const isSelected = selectedIds.includes(itemId);

                                return (
                                    <TableRow key={itemId} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <TableCell className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-100/90 dark:group-hover:bg-slate-800/90 border-r border-slate-200 dark:border-slate-800 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Checkbox checked={isSelected} onCheckedChange={() => onSelectRow(itemId)} />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                                    onClick={() => handleOpenEditModal(item)}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>

                                        <TableCell className="font-mono text-xs text-slate-400 text-center font-bold">
                                            {getRowNumber ? getRowNumber(index) : index + 1}
                                        </TableCell>

                                        {currentColumns.map((col) => renderTableCell(item, col))}
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

            {/* MODAL EDIT / TAMBAH */}
            <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
                {/* 📌 PERBAIKAN DI SINI: Added bg-white dark:bg-slate-900 & shadow-2xl untuk memastikan background modal solid 100% */}
                <DialogContent 
                    className="sm:max-w-3xl h-[85vh] flex flex-col p-6 gap-0 overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl z-50"
                    onPaste={handleContainerPaste}
                >
                    {/* FIXED HEADER */}
                    <DialogHeader className="shrink-0 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between pr-6">
                            <span>{isEditMode ? 'Edit Data' : 'Tambah Data Master'} ({subTab.toUpperCase()})</span>
                            
                            {!isEditMode && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePasteFromClipboardButton}
                                        className="h-7 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                                    >
                                        <ClipboardPaste className="w-3.5 h-3.5" />
                                        <span>Paste dari Excel</span>
                                    </Button>
                                    <Badge 
                                        variant="secondary"
                                        className={addItems.length >= MAX_ROWS_LIMIT 
                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }
                                    >
                                        {addItems.length} / {MAX_ROWS_LIMIT} Baris
                                    </Badge>
                                </div>
                            )}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulir pengisian data master {subTab}.
                        </DialogDescription>
                    </DialogHeader>

                    {/* FIXED NOTICE BANNER */}
                    {!isEditMode && (
                        <Alert className="shrink-0 mt-3 bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 p-2.5 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <AlertDescription className="text-[11px] leading-relaxed">
                                <strong>Smart Paste (Maks {MAX_ROWS_LIMIT} Baris):</strong> Tekan <strong>Ctrl + V</strong> untuk menempelkan sel dari Excel. Pastikan urutan 9 kolom Excel RPM meliputi: <em>ID RPM, Site ID, RTP, Mitra, Bulan, Tahun, Tanggal Submit, Tanggal Approve, Status Approve</em>.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* FORM CONTAINER */}
                    <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0 mt-3">
                        
                        {/* AREA SCROLLABLE */}
                        <div className="flex-1 overflow-y-auto pr-2 py-1 space-y-4">
                            {isEditMode ? (
                                /* FORM MODE EDIT */
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                                    {subTab === 'rpm' ? (
                                        <>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">ID RPM</Label>
                                                <Input disabled={isProcessing} value={editData.rpm_id || ''} onChange={(e) => setEditData({ ...editData, rpm_id: e.target.value })} placeholder="Masukkan ID RPM" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Site ID</Label>
                                                <Input disabled={isProcessing} value={editData.site_id || editData.siteid || ''} onChange={(e) => setEditData({ ...editData, site_id: e.target.value, siteid: e.target.value })} placeholder="Masukkan Site ID" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">RTP</Label>
                                                <Input disabled={isProcessing} value={editData.rtp || ''} onChange={(e) => setEditData({ ...editData, rtp: e.target.value })} placeholder="Masukkan RTP" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mitra</Label>
                                                <Input disabled={isProcessing} value={editData.mitra || ''} onChange={(e) => setEditData({ ...editData, mitra: e.target.value })} placeholder="Masukkan Mitra" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bulan</Label>
                                                <Input disabled={isProcessing} value={editData.bulan || ''} onChange={(e) => setEditData({ ...editData, bulan: e.target.value })} placeholder="Bulan" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tahun</Label>
                                                <Input disabled={isProcessing} value={editData.tahun || ''} onChange={(e) => setEditData({ ...editData, tahun: e.target.value })} placeholder="Tahun" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tanggal Submit</Label>
                                                <Input type="date" disabled={isProcessing} value={editData.tanggal_submit || editData.tanggalsubn || ''} onChange={(e) => setEditData({ ...editData, tanggal_submit: e.target.value, tanggalsubn: e.target.value })} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tanggal Approve</Label>
                                                <Input type="date" disabled={isProcessing} value={editData.tanggal_approve || editData.tanggalappr || ''} onChange={(e) => setEditData({ ...editData, tanggal_approve: e.target.value, tanggalappr: e.target.value })} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Approve Status</Label>
                                                <Input disabled={isProcessing} value={editData.approve || ''} onChange={(e) => setEditData({ ...editData, approve: e.target.value })} placeholder="Status Approve" />
                                            </div>
                                        </>
                                    ) : (
                                        currentColumns.map((col) => (
                                            <div key={col.key} className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{col.label}</Label>
                                                <Input 
                                                    type={col.type || 'text'}
                                                    disabled={isProcessing}
                                                    value={editData[col.key] || ''} 
                                                    onChange={(e) => setEditData({ ...editData, [col.key]: e.target.value })} 
                                                    placeholder={`Masukkan ${col.label}`}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                /* FORM MODE TAMBAH BARU MULTI-ROW */
                                <div className="space-y-4">
                                    {addItems.map((item, itemIdx) => (
                                        <div 
                                            key={`add-row-${itemIdx}`} 
                                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 relative group space-y-3 transition-all"
                                        >
                                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                                    Baris #{itemIdx + 1}
                                                </span>
                                                {addItems.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveAddRow(itemIdx)}
                                                        className="h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs gap-1"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Hapus Baris
                                                    </Button>
                                                )}
                                            </div>

                                            {subTab === 'rpm' ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">ID RPM</Label>
                                                        <Input disabled={isProcessing} value={item.rpm_id || ''} onChange={(e) => handleAddItemChange(itemIdx, 'rpm_id', e.target.value)} placeholder="ID RPM" className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Site ID</Label>
                                                        <Input disabled={isProcessing} value={item.site_id || item.siteid || ''} onChange={(e) => handleAddItemChange(itemIdx, 'site_id', e.target.value)} placeholder="Site ID" className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">RTP</Label>
                                                        <Input disabled={isProcessing} value={item.rtp || ''} onChange={(e) => handleAddItemChange(itemIdx, 'rtp', e.target.value)} placeholder="RTP" className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Mitra</Label>
                                                        <Input disabled={isProcessing} value={item.mitra || ''} onChange={(e) => handleAddItemChange(itemIdx, 'mitra', e.target.value)} placeholder="Mitra" className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Bulan</Label>
                                                        <Input disabled={isProcessing} value={item.bulan || ''} onChange={(e) => handleAddItemChange(itemIdx, 'bulan', e.target.value)} placeholder="Bulan" className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Tahun</Label>
                                                        <Input disabled={isProcessing} value={item.tahun || ''} onChange={(e) => handleAddItemChange(itemIdx, 'tahun', e.target.value)} placeholder="Tahun" className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Tanggal Submit</Label>
                                                        <Input type="date" disabled={isProcessing} value={item.tanggal_submit || item.tanggalsubn || ''} onChange={(e) => handleAddItemChange(itemIdx, 'tanggal_submit', e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Tanggal Approve</Label>
                                                        <Input type="date" disabled={isProcessing} value={item.tanggal_approve || item.tanggalappr || ''} onChange={(e) => handleAddItemChange(itemIdx, 'tanggal_approve', e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Status Approve</Label>
                                                        <Input disabled={isProcessing} value={item.approve || ''} onChange={(e) => handleAddItemChange(itemIdx, 'approve', e.target.value)} placeholder="Status Approve" className="h-8 text-xs bg-white dark:bg-slate-900" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {currentColumns.map((col) => (
                                                        <div key={col.key} className="space-y-1">
                                                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{col.label}</Label>
                                                            <Input 
                                                                type={col.type || 'text'}
                                                                disabled={isProcessing}
                                                                value={item[col.key] || ''} 
                                                                onChange={(e) => handleAddItemChange(itemIdx, col.key, e.target.value)} 
                                                                placeholder={col.label}
                                                                className="h-8 text-xs bg-white dark:bg-slate-900"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div className="flex items-center gap-2 pt-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddMoreRows(1)}
                                            disabled={isProcessing || addItems.length >= MAX_ROWS_LIMIT}
                                            className="h-8 text-xs gap-1.5"
                                        >
                                            <PlusCircle className="w-3.5 h-3.5" />
                                            <span>Tambah 1 Baris</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddMoreRows(5)}
                                            disabled={isProcessing || addItems.length >= MAX_ROWS_LIMIT}
                                            className="h-8 text-xs gap-1.5"
                                        >
                                            <PlusCircle className="w-3.5 h-3.5" />
                                            <span>Tambah 5 Baris</span>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* FIXED FOOTER */}
                        <DialogFooter className="shrink-0 pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-white dark:bg-slate-900">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseModal}
                                disabled={isProcessing}
                                className="h-9 text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isProcessing}
                                className="h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
                            >
                                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <span>{isEditMode ? 'Simpan Perubahan' : 'Simpan Semua Data'}</span>
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}