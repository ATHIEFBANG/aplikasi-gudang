import React from 'react';
import Modal from '@/components/Modal';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    AlertCircle, 
    Check, 
    QrCode, 
    PlusCircle, 
    Trash2, 
    Search, 
    X, 
    CheckSquare,
    Minus,
    Plus,
    Coins
} from 'lucide-react';
import HybridDropdown from '@/components/HybridDropdown';
import { 
    useModalBarangMasukControl, 
    CATEGORIES_MASUK, 
    MAX_ROWS_LIMIT 
} from './ModalBarangMasukControl';

export default function ModalBarangMasuk({
    isOpen,
    onClose,
    isEditMode = false,
    selectedItem = null,
    gudangs = [],
    suppliers = [],
    barangs = []
}) {
    const {
        isProcessing,
        rows,
        snSearches,
        setSnSearches,
        gudangOptions,
        supplierOptions,
        getBarangPplOptionsForRow,
        getBarangNamaOptionsForRow,
        getBarangStockInWarehouse,
        handleAddMoreRows,
        handleRemoveRow,
        handleRowFieldChange,
        handleBarangChange,
        handleQtyChange,
        handleManualSerialChange,
        handleToggleTransferSn,
        handleAutoSelectTransferSns,
        handleClearTransferSns,
        getAvailableSerialsForTransfer,
        handleSubmitForm,
    } = useModalBarangMasukControl({
        isOpen,
        isEditMode,
        selectedItem,
        gudangs,
        suppliers,
        barangs,
        onClose
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Data Transaksi' : 'Tambah Data Transaksi'}
            onSubmit={handleSubmitForm}
            submitLabel={isEditMode ? 'Simpan Perubahan' : 'Simpan Semua Data'}
            isProcessing={isProcessing}
            headerExtra={
                !isEditMode && (
                    <Badge 
                        variant="secondary" 
                        className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold px-2.5 py-0.5"
                    >
                        {rows.length} / {MAX_ROWS_LIMIT} Baris
                    </Badge>
                )
            }
        >
            {!isEditMode && (
                <Alert className="shrink-0 mb-3 bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-[11px] leading-relaxed">
                        <strong>Pencatatan Logistik:</strong> Untuk <strong>Pembelian</strong>, lengkapi harga beli per unit. Untuk <strong>Transfer Gudang</strong>, pilih gudang asal terlebih dahulu untuk menyaring stok barang.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                {rows.map((row, rowIdx) => {
                    const targetBarang = barangs.find(b => String(b.id) === String(row.barang_id));
                    const isWajibSn = Boolean(targetBarang?.is_wajib_sn === true || targetBarang?.is_wajib_sn === 1 || targetBarang?.is_wajib_sn === '1');
                    const isWajibPn = Boolean(targetBarang?.is_wajib_pn === true || targetBarang?.is_wajib_pn === 1 || targetBarang?.is_wajib_pn === '1');
                    
                    const statusText = isWajibSn && isWajibPn 
                        ? 'Wajib SN & PN' 
                        : isWajibSn 
                        ? 'Wajib SN' 
                        : isWajibPn 
                        ? 'Wajib PN' 
                        : 'Standar';

                    const pplOptions = getBarangPplOptionsForRow(row);
                    const namaOptions = getBarangNamaOptionsForRow(row);

                    const stockInOrigin = (row.sub_jenis === 'TRANSFER_GUDANG' && targetBarang && row.gudang_asal_id)
                        ? getBarangStockInWarehouse(targetBarang, row.gudang_asal_id)
                        : null;

                    const availableSnsForTransfer = row.sub_jenis === 'TRANSFER_GUDANG' 
                        ? getAvailableSerialsForTransfer(row.barang_id, row.gudang_asal_id)
                        : [];

                    const searchFilter = (snSearches[rowIdx] || '').toLowerCase().trim();
                    const filteredAvailableSns = availableSnsForTransfer.filter(s => 
                        !searchFilter || s.serial_number.toLowerCase().includes(searchFilter)
                    );

                    const kondisiOptions = row.sub_jenis === 'TRANSFER_GUDANG' || row.sub_jenis === 'PENGEMBALIAN'
                        ? ['Baru', 'Bekas', 'Rusak']
                        : ['Baru', 'Bekas'];

                    const pihakAsalLabel = row.sub_jenis === 'PEMBELIAN' 
                        ? 'Supplier / Vendor Asal *' 
                        : row.sub_jenis === 'PEMINJAMAN' 
                        ? 'Peminjam / Vendor Terkait *' 
                        : row.sub_jenis === 'PENGEMBALIAN' 
                        ? 'Dikembalikan Oleh *' 
                        : 'Pihak Terkait *';

                    const subtotalBeli = row.sub_jenis === 'PEMBELIAN' && row.harga 
                        ? (parseFloat(row.harga) || 0) * (parseInt(row.qty, 10) || 1) 
                        : 0;

                    return (
                        <div 
                            key={`row-${rowIdx}`}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 relative group space-y-3 transition-all"
                        >
                            {/* Header Baris */}
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        Baris #{rowIdx + 1}
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                        (Status Item: <strong className="text-blue-600 dark:text-blue-400">{statusText}</strong>)
                                    </span>
                                </div>
                                {rows.length > 1 && !isEditMode && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveRow(rowIdx)}
                                        className="h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs gap-1 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Hapus Baris
                                    </Button>
                                )}
                            </div>

                            {/* 1. Kategori Jenis Penerimaan */}
                            {!isEditMode && (
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Jenis Penerimaan *</Label>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {CATEGORIES_MASUK.map((cat) => {
                                            const Icon = cat.icon;
                                            const isSelected = row.sub_jenis === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => handleRowFieldChange(rowIdx, 'sub_jenis', cat.id)}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
                                                        isSelected
                                                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                                    }`}
                                                >
                                                    <Icon className="w-3 h-3" />
                                                    <span>{cat.label}</span>
                                                    {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 2. BAGIAN A: GUDANG ASAL -> OMC & GUDANG TUJUAN -> IMC */}
                            <div className="pt-1">
                                {row.sub_jenis === 'TRANSFER_GUDANG' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="space-y-2.5">
                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                                    1. Gudang Asal (Pengirim) *
                                                </Label>
                                                <HybridDropdown
                                                    value={gudangs.find(g => String(g.id) === String(row.gudang_asal_id))?.nama_gudang || ''}
                                                    options={gudangOptions}
                                                    onChange={(val) => {
                                                        const found = gudangs.find(g => g.nama_gudang.toLowerCase() === val.toLowerCase());
                                                        handleRowFieldChange(rowIdx, 'gudang_asal_id', found ? String(found.id) : '');
                                                    }}
                                                    placeholder="Pilih Gudang Asal..."
                                                    searchPlaceholder="Cari Gudang Asal..."
                                                    disabled={isProcessing || isEditMode}
                                                    inputClassName="h-8 text-xs font-semibold"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                                    Nomor OMC *
                                                </Label>
                                                <Input
                                                    placeholder="Contoh: OMC-2026-01"
                                                    disabled={isProcessing}
                                                    value={row.nomor_omc}
                                                    onChange={(e) => handleRowFieldChange(rowIdx, 'nomor_omc', e.target.value)}
                                                    className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    2. Gudang Tujuan (Penerima) *
                                                </Label>
                                                <HybridDropdown
                                                    value={gudangs.find(g => String(g.id) === String(row.gudang_tujuan_id))?.nama_gudang || ''}
                                                    options={gudangOptions}
                                                    onChange={(val) => {
                                                        const found = gudangs.find(g => g.nama_gudang.toLowerCase() === val.toLowerCase());
                                                        handleRowFieldChange(rowIdx, 'gudang_tujuan_id', found ? String(found.id) : '');
                                                    }}
                                                    placeholder="Pilih Gudang Penerima..."
                                                    searchPlaceholder="Cari Gudang Penerima..."
                                                    disabled={isProcessing}
                                                    inputClassName="h-8 text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                                    Nomor IMC *
                                                </Label>
                                                <Input
                                                    placeholder="Contoh: IMC-00123"
                                                    disabled={isProcessing}
                                                    value={row.nomor_imc}
                                                    onChange={(e) => handleRowFieldChange(rowIdx, 'nomor_imc', e.target.value)}
                                                    className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{pihakAsalLabel}</Label>
                                            <HybridDropdown
                                                value={row.pihak_asal}
                                                options={supplierOptions}
                                                onChange={(val) => handleRowFieldChange(rowIdx, 'pihak_asal', val)}
                                                placeholder="Ketik atau pilih Supplier / Pengirim..."
                                                searchPlaceholder="Cari Pengirim..."
                                                disabled={isProcessing}
                                                inputClassName="h-8 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    Gudang Tujuan (Penerima) *
                                                </Label>
                                                <HybridDropdown
                                                    value={gudangs.find(g => String(g.id) === String(row.gudang_tujuan_id))?.nama_gudang || ''}
                                                    options={gudangOptions}
                                                    onChange={(val) => {
                                                        const found = gudangs.find(g => g.nama_gudang.toLowerCase() === val.toLowerCase());
                                                        handleRowFieldChange(rowIdx, 'gudang_tujuan_id', found ? String(found.id) : '');
                                                    }}
                                                    placeholder="Pilih Gudang Penerima..."
                                                    searchPlaceholder="Cari Gudang Penerima..."
                                                    disabled={isProcessing}
                                                    inputClassName="h-8 text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                                    Nomor IMC *
                                                </Label>
                                                <Input
                                                    placeholder="Contoh: IMC-00123"
                                                    disabled={isProcessing}
                                                    value={row.nomor_imc}
                                                    onChange={(e) => handleRowFieldChange(rowIdx, 'nomor_imc', e.target.value)}
                                                    className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3. BAGIAN B: RINCIAN BARANG, KUANTITAS & HARGA BELI */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                {/* Tanggal Transaksi */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Tanggal Transaksi *</Label>
                                    <Input
                                        type="date"
                                        disabled={isProcessing}
                                        value={row.tanggal}
                                        onClick={(e) => {
                                            try {
                                                if (typeof e.target.showPicker === 'function') e.target.showPicker();
                                            } catch (err) {}
                                        }}
                                        onChange={(e) => handleRowFieldChange(rowIdx, 'tanggal', e.target.value)}
                                        className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 cursor-pointer"
                                        required
                                    />
                                </div>

                                {/* Kode PPL */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kode PPL *</Label>
                                    <HybridDropdown
                                        value={targetBarang?.kode_barang || ''}
                                        options={pplOptions}
                                        onChange={(val) => {
                                            const found = barangs.find(b => b.kode_barang.toLowerCase() === val.split(' ')[0].toLowerCase());
                                            if (found) handleBarangChange(rowIdx, found.id);
                                        }}
                                        placeholder={
                                            row.sub_jenis === 'TRANSFER_GUDANG' && !row.gudang_asal_id
                                                ? "Pilih Gudang Asal Dulu..."
                                                : (pplOptions.length === 0 && row.sub_jenis === 'TRANSFER_GUDANG' ? "Tidak Ada Stok di Gudang Ini" : "Pilih PPL...")
                                        }
                                        searchPlaceholder="Cari Kode PPL..."
                                        disabled={isProcessing || isEditMode || (row.sub_jenis === 'TRANSFER_GUDANG' && !row.gudang_asal_id)}
                                        inputClassName="h-8 text-xs font-mono font-bold"
                                    />
                                </div>

                                {/* Nama Barang */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nama Barang *</Label>
                                    <HybridDropdown
                                        value={targetBarang ? ([targetBarang.brand, targetBarang.tipe, targetBarang.kategori].filter(Boolean).join(' ') || targetBarang.nama_barang) : ''}
                                        options={namaOptions}
                                        onChange={(val) => {
                                            const cleanVal = val.split(' (Stok:')[0].trim().toLowerCase();
                                            const found = barangs.find(b => {
                                                const fullName = [b.brand, b.tipe, b.kategori].filter(Boolean).join(' ') || b.nama_barang;
                                                return fullName.toLowerCase() === cleanVal || b.kode_barang.toLowerCase() === cleanVal;
                                            });
                                            if (found) handleBarangChange(rowIdx, found.id);
                                        }}
                                        placeholder={
                                            row.sub_jenis === 'TRANSFER_GUDANG' && !row.gudang_asal_id
                                                ? "Pilih Gudang Asal Dulu..."
                                                : (namaOptions.length === 0 && row.sub_jenis === 'TRANSFER_GUDANG' ? "Tidak Ada Stok di Gudang Ini" : "Pilih Barang...")
                                        }
                                        searchPlaceholder="Cari Nama Barang..."
                                        disabled={isProcessing || isEditMode || (row.sub_jenis === 'TRANSFER_GUDANG' && !row.gudang_asal_id)}
                                        inputClassName="h-8 text-xs"
                                    />
                                </div>

                                {/* Part Number */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Part Number</Label>
                                    <Input
                                        disabled
                                        placeholder={isWajibPn ? "Part Number" : "-"}
                                        value={isWajibPn ? (targetBarang?.part_number || '') : '-'}
                                        className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-mono text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                                    />
                                </div>

                                {/* Satuan / Unit */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Satuan / Unit</Label>
                                    <Input
                                        disabled
                                        value={targetBarang?.deskripsi || targetBarang?.satuan || 'Unit'}
                                        className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                                    />
                                </div>

                                {/* Quantity (Stepper + Auto-Select on Focus) */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Quantity *</Label>
                                        {stockInOrigin !== null && (
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                (Maks: {stockInOrigin})
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            disabled={isProcessing || isEditMode || row.qty <= 1}
                                            onClick={() => handleQtyChange(rowIdx, row.qty - 1)}
                                            className="h-8 w-8 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={stockInOrigin || 50}
                                            disabled={isProcessing || isEditMode}
                                            value={row.qty}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => handleQtyChange(rowIdx, e.target.value)}
                                            className="h-8 w-full text-center font-bold text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-1 focus-visible:ring-blue-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            disabled={isProcessing || isEditMode || (stockInOrigin !== null && row.qty >= stockInOrigin)}
                                            onClick={() => handleQtyChange(rowIdx, row.qty + 1)}
                                            className="h-8 w-8 rounded-r-lg border border-l-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>

                                {/* FORM HARGA SATUAN (Hanya muncul jika PEMBELIAN) */}
                                {row.sub_jenis === 'PEMBELIAN' && (
                                    <div className="space-y-1 sm:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                <Coins className="w-3 h-3" />
                                                <span>Harga Satuan (Rp) *</span>
                                            </Label>
                                            {subtotalBeli > 0 && (
                                                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                                    Total: <strong className="text-emerald-600 dark:text-emerald-400">Rp {subtotalBeli.toLocaleString('id-ID')}</strong>
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                Rp
                                            </span>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={100}
                                                placeholder="Contoh: 1500000"
                                                disabled={isProcessing}
                                                value={row.harga}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => handleRowFieldChange(rowIdx, 'harga', e.target.value)}
                                                className="h-8 pl-8 text-xs bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Kondisi Fisik */}
                                <div className={`space-y-1 ${row.sub_jenis === 'PEMBELIAN' ? 'sm:col-span-2 lg:col-span-4' : 'sm:col-span-2'}`}>
                                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kondisi Fisik *</Label>
                                    <HybridDropdown
                                        value={row.kondisi}
                                        options={kondisiOptions}
                                        onChange={(val) => handleRowFieldChange(rowIdx, 'kondisi', val)}
                                        placeholder="Pilih Kondisi..."
                                        searchPlaceholder="Cari Kondisi..."
                                        disabled={isProcessing}
                                        inputClassName="h-8 text-xs"
                                    />
                                </div>
                            </div>

                            {/* 4. SEKSI MULTI-SELECT SERIAL NUMBER */}
                            {isWajibSn && !isEditMode && (
                                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <QrCode className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                {row.sub_jenis === 'TRANSFER_GUDANG' 
                                                    ? 'Pilih Serial Number dari Gudang Asal' 
                                                    : `Daftar Serial Number (${row.serials.length} Unit) *`
                                                }
                                            </span>
                                        </div>

                                        <div className="text-[11px] font-mono font-bold">
                                            <span className={row.serials.length === row.qty ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                                                {row.serials.length} / {row.qty} Unit Terpilih
                                            </span>
                                        </div>
                                    </div>

                                    {row.sub_jenis === 'TRANSFER_GUDANG' ? (
                                        !row.gudang_asal_id ? (
                                            <div className="py-2 text-[11px] text-amber-700 dark:text-amber-400">
                                                Pilih <strong>Gudang Asal</strong> terlebih dahulu untuk memuat daftar Serial Number yang tersedia.
                                            </div>
                                        ) : availableSnsForTransfer.length === 0 ? (
                                            <div className="py-2 text-[11px] text-rose-600 dark:text-rose-400">
                                                Tidak ada Serial Number aktif untuk barang ini di gudang asal terpilih.
                                            </div>
                                        ) : (
                                            <div className="space-y-2 pt-1">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="relative flex-1 min-w-[160px] max-w-xs">
                                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <Input
                                                            value={snSearches[rowIdx] || ''}
                                                            onChange={(e) => setSnSearches(prev => ({ ...prev, [rowIdx]: e.target.value }))}
                                                            placeholder="Cari nomor SN..."
                                                            className="h-7 text-[11px] pl-7 pr-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                                        />
                                                        {snSearches[rowIdx] && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setSnSearches(prev => ({ ...prev, [rowIdx]: '' }))}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleAutoSelectTransferSns(rowIdx, availableSnsForTransfer)}
                                                            className="h-7 px-2 text-[10px] gap-1 border-blue-200 text-blue-600 dark:border-blue-900 dark:text-blue-400 cursor-pointer"
                                                        >
                                                            <CheckSquare className="w-3 h-3" />
                                                            <span>Pilih Otomatis ({row.qty})</span>
                                                        </Button>
                                                        {row.serials.length > 0 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleClearTransferSns(rowIdx)}
                                                                className="h-7 px-2 text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer"
                                                            >
                                                                Reset
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {row.serials.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto py-1">
                                                        {row.serials.map((snVal) => (
                                                            <span
                                                                key={snVal}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                                                            >
                                                                {snVal}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleTransferSn(rowIdx, snVal)}
                                                                    className="hover:text-rose-500 cursor-pointer"
                                                                >
                                                                    <X className="w-2.5 h-2.5" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pt-1">
                                                    {filteredAvailableSns.length === 0 ? (
                                                        <div className="col-span-full py-3 text-center text-xs text-slate-400">
                                                            Tidak ada SN yang cocok.
                                                        </div>
                                                    ) : (
                                                        filteredAvailableSns.map((s) => {
                                                            const isChecked = row.serials.includes(s.serial_number);
                                                            return (
                                                                <button
                                                                    key={s.id || s.serial_number}
                                                                    type="button"
                                                                    onClick={() => handleToggleTransferSn(rowIdx, s.serial_number)}
                                                                    className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                                                        isChecked
                                                                            ? 'bg-blue-600/10 border-blue-600/60 text-blue-700 dark:text-blue-300 font-bold'
                                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <div className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border shrink-0 ${
                                                                            isChecked 
                                                                                ? 'bg-blue-600 border-blue-600 text-white' 
                                                                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                                                        }`}>
                                                                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                                                        </div>
                                                                        <span className="font-mono text-[11px] truncate">
                                                                            {s.serial_number}
                                                                        </span>
                                                                    </div>
                                                                    <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                                                                        s.kondisi === 'RUSAK' 
                                                                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                                                                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                    }`}>
                                                                        {s.kondisi || 'BAIK'}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto p-1">
                                            {row.serials.map((sn, snIdx) => (
                                                <div key={`sn-input-${rowIdx}-${snIdx}`} className="space-y-0.5">
                                                    <Label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                        SN Unit #{snIdx + 1}
                                                    </Label>
                                                    <Input
                                                        placeholder={`Ketik Serial Number #${snIdx + 1}`}
                                                        disabled={isProcessing}
                                                        value={sn}
                                                        onChange={(e) => handleManualSerialChange(rowIdx, snIdx, e.target.value)}
                                                        className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono border-slate-200 dark:border-slate-700"
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {!isEditMode && (
                    <div className="flex items-center gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddMoreRows(1)}
                            disabled={isProcessing || rows.length >= MAX_ROWS_LIMIT}
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
                            disabled={isProcessing || rows.length >= MAX_ROWS_LIMIT}
                            className="h-8 text-xs gap-1.5 cursor-pointer"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Tambah 5 Baris</span>
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}