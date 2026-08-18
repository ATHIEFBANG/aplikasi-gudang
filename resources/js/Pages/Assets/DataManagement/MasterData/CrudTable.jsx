import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, PlusCircle, ClipboardPaste, AlertCircle } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';

import Tabel from '@/components/Tabel';
import Modal from '@/components/Modal';

const MAX_ROWS_LIMIT = 500;

// DEFINISI 12 KOLOM MASTER DATA COMBAT (Presisi sesuai Excel)
const TABLE_COLUMNS = {
    combat: [
        { key: 'asset_name', altKeys: ['asset_name', 'combat_id', 'nama_asset'], label: 'Asset Name' }, 
        { key: 'sn', altKeys: ['sn', 'serial_number'], label: 'SN' },
        { key: 'pic_data', altKeys: ['pic_data', 'data', 'pic', 'operator'], label: 'Data / PIC' },
        { key: 'nama_site', altKeys: ['nama_site', 'site_name', 'siteid'], label: 'Nama Site' },
        { key: 'lokasi_saat_ini', altKeys: ['lokasi_saat_ini', 'lokasi'], label: 'Lokasi Saat Ini' },
        { key: 'long_lat', altKeys: ['long_lat', 'longlat', 'coordinate', 'Long Lat', 'Long Lat '], label: 'Long Lat' },
        { key: 'status_combat', altKeys: ['status_combat', 'status'], label: 'Status COMBAT' },
        { key: 'type_combat', altKeys: ['type_combat', 'tipe_combat', 'type'], label: 'Type COMBAT' },
        { key: 'ketinggian_combat', altKeys: ['ketinggian_combat', 'ketinggian'], label: 'Ketinggian (M)' },
        { key: 'tanggal_ambil', altKeys: ['tanggal_ambil', 'tgl_ambil'], label: 'Tanggal Ambil' },
        { key: 'tanggal_kembali', altKeys: ['tanggal_kembali', 'tgl_kembali'], label: 'Tanggal Kembali' },
        { key: 'remark', altKeys: ['remark', 'keterangan'], label: 'Remark' },
    ],
    template: [
        { key: 'asset_code', altKeys: ['asset_code', 'kode_aset'], label: 'Kode Aset' },
        { key: 'asset_name', altKeys: ['asset_name', 'nama_aset'], label: 'Nama Aset' },
        { key: 'kategori', altKeys: ['kategori', 'category'], label: 'Kategori' },
        { key: 'serial_number', altKeys: ['serial_number', 'sn'], label: 'Serial Number' },
        { key: 'lokasi', altKeys: ['lokasi', 'site_name'], label: 'Lokasi' },
        { key: 'status', altKeys: ['status'], label: 'Status' },
        { key: 'kondisi', altKeys: ['kondisi'], label: 'Kondisi' },
    ]
};

/**
 * STATE-MACHINE PARSER:
 * Menjaga sel yang berisi Alt+Enter di dalam tanda kutip ("...") agar TIDAK memecah baris.
 */
const parseTSV = (text) => {
    if (!text || typeof text !== 'string') return [];

    const cleanText = text.trim();
    if (!cleanText) return [];

    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const nextChar = cleanText[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === '\t' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\r' || char === '\n') && !insideQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            currentRow.push(currentCell.trim());
            if (currentRow.some(cell => cell.length > 0)) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell.length > 0)) {
            rows.push(currentRow);
        }
    }

    return rows;
};

export default function CrudTable({
    dataList = [],
    subTab = 'combat',
    selectedIds = [],
    onSelectAll,
    onSelectRow,
    getRowNumber
}) {
    const { auth } = usePage().props;
    const userRole = auth?.user?.role || 'view';
    const canWrite = userRole === 'admin' || userRole === 'staff';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [editData, setEditData] = useState({});
    const [addItems, setAddItems] = useState([]);

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
        if (!item) return '';
        return item.id || item.combat_id || item.asset_name || item.asset_code || '';
    }, []);

    const formattedColumns = useMemo(() => {
        const rawCols = TABLE_COLUMNS[subTab] || TABLE_COLUMNS.combat;
        return rawCols.map(col => ({
            ...col,
            render: (item) => {
                const value = getFieldValue(item, col);

                switch (col.key) {
                    case 'asset_name':
                    case 'asset_code':
                        return <span className="font-mono font-bold text-red-600 dark:text-red-400">{value || '-'}</span>;
                    case 'sn':
                        return <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{value || '-'}</span>;
                    case 'long_lat':
                        return <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{value || '-'}</span>;
                    case 'status_combat':
                    case 'status':
                        const statusVal = String(value || '').toLowerCase();
                        const isAktif = statusVal.includes('aktif') || statusVal.includes('ready') || statusVal.includes('onsite') || statusVal.includes('ok');
                        return (
                            <Badge variant="outline" className={`font-semibold ${
                                isAktif 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            }`}>
                                {value || '-'}
                            </Badge>
                        );
                    default:
                        return value !== undefined && value !== null && value !== '' ? String(value) : '-';
                }
            }
        }));
    }, [subTab, getFieldValue]);

    const createEmptyRow = useCallback(() => {
        const emptyObj = {};
        const rawCols = TABLE_COLUMNS[subTab] || TABLE_COLUMNS.combat;
        rawCols.forEach(col => { emptyObj[col.key] = ''; });
        return emptyObj;
    }, [subTab]);

    // =========================================================================
    // PARSER LANGSUNG (TANPA PEMOTONGAN BARIS PERTAMA)
    // =========================================================================
    const parseAndApplyExcelData = useCallback((pastedText) => {
        if (!pastedText || typeof pastedText !== 'string' || !pastedText.trim()) return false;

        let rawRows = parseTSV(pastedText);
        if (!rawRows || rawRows.length === 0) return false;

        if (rawRows.length > MAX_ROWS_LIMIT) {
            alert(`⚠️ Data paste berisi ${rawRows.length} baris. Dibatasi maksimal ${MAX_ROWS_LIMIT} baris.`);
            rawRows = rawRows.slice(0, MAX_ROWS_LIMIT);
        }

        const rawCols = TABLE_COLUMNS[subTab] || TABLE_COLUMNS.combat;
        const parsedItems = rawRows.map(cells => {
            const rowObj = createEmptyRow();
            rawCols.forEach((col, idx) => {
                let cellVal = cells[idx] ?? '';
                if (typeof cellVal === 'string') {
                    cellVal = cellVal.replace(/^"(.*)"$/, '$1').replace(/[\r\n]+/g, ' ').trim();
                }
                rowObj[col.key] = cellVal;
            });
            return rowObj;
        });

        if (parsedItems.length > 0) {
            setAddItems(parsedItems);
            return true;
        }
        return false;
    }, [subTab, createEmptyRow]);

    const handleContainerPaste = useCallback((e) => {
        if (isEditMode || !canWrite) return;
        const pastedText = e.clipboardData.getData('text');
        if (parseAndApplyExcelData(pastedText)) {
            e.preventDefault();
        }
    }, [isEditMode, canWrite, parseAndApplyExcelData]);

    const handlePasteFromClipboardButton = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text && parseAndApplyExcelData(text)) {
                return;
            }
        } catch (err) {
            console.warn("Clipboard API diblokir browser.");
        }
        alert("Tekan Ctrl + V pada area form modal untuk menempelkan data dari Excel.");
    }, [parseAndApplyExcelData]);

    const handleOpenAddModal = useCallback(() => {
        if (!canWrite) return;
        setIsEditMode(false);
        setAddItems([createEmptyRow()]);
        setIsModalOpen(true);
    }, [canWrite, createEmptyRow]);

    const handleOpenEditModal = useCallback((item) => {
        if (!canWrite || !item) return;
        setIsEditMode(true);
        const rawCols = TABLE_COLUMNS[subTab] || TABLE_COLUMNS.combat;
        const formattedItem = { ...item };
        rawCols.forEach(col => {
            formattedItem[col.key] = getFieldValue(item, col);
        });
        setEditData(formattedItem);
        setIsModalOpen(true);
    }, [canWrite, subTab, getFieldValue]);

    const handleCloseModal = useCallback(() => {
        if (isProcessing) return;
        setIsModalOpen(false);
        setEditData({});
        setAddItems([]);
    }, [isProcessing]);

    const handleAddMoreRows = useCallback((count = 1) => {
        setAddItems(prev => {
            if (prev.length + count > MAX_ROWS_LIMIT) return prev;
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
            return updated;
        });
    }, []);

    const handleSubmitForm = (e) => {
        e?.preventDefault();
        if (!canWrite) return;

        let payloadData;
        if (isEditMode) {
            payloadData = editData;
        } else {
            const cleanItems = addItems.filter(item => 
                item && Object.values(item).some(val => val !== null && val !== undefined && String(val).trim().length > 0)
            );

            if (cleanItems.length === 0) {
                alert('Tidak ada baris data yang valid untuk disimpan.');
                return;
            }
            payloadData = { items: cleanItems };
        }

        setIsProcessing(true);

        const routeName = subTab === 'combat' 
            ? (isEditMode ? 'assets.data-management.update-combat' : 'assets.data-management.store-combat')
            : (isEditMode ? 'assets.data-management.update-template' : 'assets.data-management.store-template');

        const method = isEditMode ? 'put' : 'post';
        
        const getUrl = () => {
            if (typeof window.route === 'function') {
                try {
                    return isEditMode ? window.route(routeName, getItemId(editData)) : window.route(routeName);
                } catch (err) {
                    // Fallback
                }
            }
            return isEditMode ? `/assets/data-management/${subTab}/${getItemId(editData)}` : `/assets/data-management/${subTab}`;
        };

        router[method](getUrl(), payloadData, {
            preserveScroll: true,
            onSuccess: () => {
                handleCloseModal();
                setIsProcessing(false);
            },
            onError: (err) => {
                console.error('Submit error:', err);
                setIsProcessing(false);
            },
            onFinish: () => setIsProcessing(false)
        });
    };

    return (
        <div className="space-y-3">
            {/* SUB-HEADER */}
            <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Kelola Master Data {subTab.toUpperCase()}
                </span>
                
                {canWrite && (
                    <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleOpenAddModal}
                        className="h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Data Baru</span>
                    </Button>
                )}
            </div>

            {/* TABEL DATA */}
            <Tabel
                data={dataList}
                columns={formattedColumns}
                selectedIds={selectedIds}
                onSelectAll={onSelectAll}
                onSelectRow={onSelectRow}
                onEditRow={canWrite ? handleOpenEditModal : undefined}
                getItemId={getItemId}
                getRowNumber={getRowNumber}
                emptyMessage={`Belum ada data Master ${subTab.toUpperCase()}.`}
            />

            {/* MODAL EDIT / TAMBAH */}
            {canWrite && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={`${isEditMode ? 'Edit Data' : 'Tambah Data Master'} (${subTab.toUpperCase()})`}
                    onSubmit={handleSubmitForm}
                    submitLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Semua Data'}
                    isProcessing={isProcessing}
                    onPaste={handleContainerPaste}
                    headerExtra={
                        !isEditMode && (
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePasteFromClipboardButton}
                                    className="h-7 text-xs gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                                >
                                    <ClipboardPaste className="w-3.5 h-3.5" />
                                    <span>Paste dari Excel</span>
                                </Button>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono">
                                    {addItems.length} Baris
                                </Badge>
                            </div>
                        )
                    }
                >
                    {!isEditMode && (
                        <Alert className="shrink-0 mb-3 bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 p-2.5 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <AlertDescription className="text-[11px] leading-relaxed">
                                <strong>Smart Paste Excel:</strong> Tekan <strong>Ctrl + V</strong> atau klik tombol <strong>Paste dari Excel</strong> untuk menempelkan data.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        {isEditMode ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                                {(TABLE_COLUMNS[subTab] || TABLE_COLUMNS.combat).map((col) => (
                                    <div key={col.key} className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{col.label}</Label>
                                        <Input 
                                            disabled={isProcessing}
                                            value={editData[col.key] || ''} 
                                            onChange={(e) => setEditData({ ...editData, [col.key]: e.target.value })} 
                                            placeholder={`Masukkan ${col.label}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {addItems.map((item, itemIdx) => (
                                    <div key={`add-row-${itemIdx}`} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                                Baris #{itemIdx + 1}
                                            </span>
                                            {addItems.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveAddRow(itemIdx)}
                                                    className="h-7 px-2 text-rose-500 hover:text-rose-700 text-xs gap-1 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Hapus Baris
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {(TABLE_COLUMNS[subTab] || TABLE_COLUMNS.combat).map((col) => (
                                                <div key={col.key} className="space-y-1">
                                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{col.label}</Label>
                                                    <Input 
                                                        disabled={isProcessing}
                                                        value={item ? (item[col.key] || '') : ''} 
                                                        onChange={(e) => handleAddItemChange(itemIdx, col.key, e.target.value)} 
                                                        placeholder={col.label}
                                                        className="h-8 text-xs bg-white dark:bg-slate-900"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddMoreRows(1)}
                                        disabled={isProcessing || addItems.length >= MAX_ROWS_LIMIT}
                                        className="h-8 text-xs gap-1.5 cursor-pointer"
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
                                        className="h-8 text-xs gap-1.5 cursor-pointer"
                                    >
                                        <PlusCircle className="w-3.5 h-3.5" />
                                        <span>Tambah 5 Baris</span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}