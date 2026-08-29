import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, Minus, Plus, Coins } from 'lucide-react';
import HybridDropdown from '@/components/HybridDropdown';
import ModalSerialSelector from './ModalSerialSelector';
import { CATEGORIES_MASUK } from './ModalBarangMasukControl';

export default function ModalBarangMasukRow({
    row,
    rowIdx,
    rowsCount,
    isEditMode,
    isProcessing,
    barangs,
    gudangs,
    gudangOptions,
    supplierOptions,
    pplOptions,
    namaOptions,
    stockInOrigin,
    availableSnsForTransfer,
    snSearch,
    onRemoveRow,
    onFieldChange,
    onBarangChange,
    onQtyChange,
    onSnSearchChange,
    onToggleTransferSn,
    onAutoSelectTransferSns,
    onClearTransferSns,
    onManualSerialChange
}) {
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

    const kondisiOptions = (row.sub_jenis === 'PEMBELIAN' || row.sub_jenis === 'PEMINJAMAN')
        ? ['Baru', 'Bekas']
        : ['Baru', 'Bekas', 'Rusak'];

    const displayKondisi = row.kondisi && row.kondisi.toUpperCase() === 'BAIK' ? 'Baru' : (row.kondisi || 'Baru');

    const pihakAsalLabel = row.sub_jenis === 'PEMBELIAN' 
        ? 'Supplier / Vendor Asal *' 
        : row.sub_jenis === 'PEMINJAMAN' 
        ? 'Peminjam / Vendor Terkait *' 
        : row.sub_jenis === 'PENGEMBALIAN' 
        ? 'Dikembalikan Oleh *' 
        : 'Pihak Terkait *';

    // Kalkulasi Total Nilai (Qty x Harga Satuan)
    const hargaSatuanNum = parseFloat(row.harga) || 0;
    const qtyNum = parseInt(row.qty, 10) || 1;
    const subtotalBeli = row.sub_jenis === 'PEMBELIAN' ? hargaSatuanNum * qtyNum : 0;

    return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 relative group space-y-3 transition-all">
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
                {rowsCount > 1 && !isEditMode && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveRow(rowIdx)}
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
                                    onClick={() => onFieldChange(rowIdx, 'sub_jenis', cat.id)}
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

            {/* 2. Gudang & Dokumen */}
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
                                        onFieldChange(rowIdx, 'gudang_asal_id', found ? String(found.id) : '');
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
                                    onChange={(e) => onFieldChange(rowIdx, 'nomor_omc', e.target.value)}
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
                                        onFieldChange(rowIdx, 'gudang_tujuan_id', found ? String(found.id) : '');
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
                                    onChange={(e) => onFieldChange(rowIdx, 'nomor_imc', e.target.value)}
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
                                onChange={(val) => onFieldChange(rowIdx, 'pihak_asal', val)}
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
                                        onFieldChange(rowIdx, 'gudang_tujuan_id', found ? String(found.id) : '');
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
                                    onChange={(e) => onFieldChange(rowIdx, 'nomor_imc', e.target.value)}
                                    className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Detail Barang, Kuantitas, Harga, Kondisi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
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
                        onChange={(e) => onFieldChange(rowIdx, 'tanggal', e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 cursor-pointer"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Kode PPL *
                    </Label>
                    <HybridDropdown
                        value={targetBarang?.kode_barang || ''}
                        options={pplOptions}
                        onChange={(val) => {
                            const found = barangs.find(b => b.kode_barang.toLowerCase() === val.split(' ')[0].toLowerCase());
                            if (found) onBarangChange(rowIdx, found.id);
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
                            if (found) onBarangChange(rowIdx, found.id);
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

                <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Part Number</Label>
                    <Input
                        disabled
                        placeholder={isWajibPn ? "Part Number" : "-"}
                        value={isWajibPn ? (targetBarang?.part_number || '') : '-'}
                        className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-mono text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Satuan / Unit</Label>
                    <Input
                        disabled
                        value={targetBarang?.deskripsi || targetBarang?.satuan || 'Unit'}
                        className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                    />
                </div>

                {/* Stepper Quantity (Bisa diedit kapan saja) */}
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
                            disabled={isProcessing || row.qty <= 1}
                            onClick={() => onQtyChange(rowIdx, row.qty - 1)}
                            className="h-8 w-8 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <Input
                            type="number"
                            min={1}
                            max={stockInOrigin || 50}
                            disabled={isProcessing}
                            value={row.qty}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => onQtyChange(rowIdx, e.target.value)}
                            className="h-8 w-full text-center font-bold text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-1 focus-visible:ring-blue-500"
                            required
                        />
                        <button
                            type="button"
                            disabled={isProcessing || (stockInOrigin !== null && row.qty >= stockInOrigin)}
                            onClick={() => onQtyChange(rowIdx, row.qty + 1)}
                            className="h-8 w-8 rounded-r-lg border border-l-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Input Harga Satuan & Real-Time Subtotal (Pembelian) */}
                {row.sub_jenis === 'PEMBELIAN' && (
                    <div className="space-y-1 sm:col-span-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Coins className="w-3 h-3" />
                                <span>Harga Satuan (Rp) *</span>
                            </Label>
                            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                Total: <strong className="text-emerald-600 dark:text-emerald-400">Rp {subtotalBeli.toLocaleString('id-ID')}</strong>
                            </span>
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
                                onChange={(e) => onFieldChange(rowIdx, 'harga', e.target.value)}
                                className="h-8 pl-8 text-xs bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                                required
                            />
                        </div>
                    </div>
                )}

                {/* Kondisi Fisik */}
                {row.sub_jenis === 'TRANSFER_GUDANG' ? (
                    <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kondisi Fisik</Label>
                        <Input
                            disabled
                            value="-"
                            className="h-8 text-xs bg-slate-100 dark:bg-slate-900/60 font-bold text-center text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        />
                    </div>
                ) : (
                    <div className={`space-y-1 ${row.sub_jenis === 'PEMBELIAN' ? 'sm:col-span-2 lg:col-span-4' : 'sm:col-span-2'}`}>
                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Kondisi Fisik *</Label>
                        <HybridDropdown
                            value={displayKondisi}
                            options={kondisiOptions}
                            onChange={(val) => onFieldChange(rowIdx, 'kondisi', val)}
                            placeholder="Pilih Kondisi..."
                            searchPlaceholder="Cari Kondisi..."
                            disabled={isProcessing}
                            inputClassName="h-8 text-xs font-semibold"
                        />
                    </div>
                )}
            </div>

            {/* 4. Pemilih Serial Number */}
            {isWajibSn && !isEditMode && (
                <ModalSerialSelector
                    rowIdx={rowIdx}
                    row={row}
                    isProcessing={isProcessing}
                    availableSnsForTransfer={availableSnsForTransfer}
                    snSearch={snSearch}
                    onSnSearchChange={onSnSearchChange}
                    onToggleTransferSn={onToggleTransferSn}
                    onAutoSelectTransferSns={onAutoSelectTransferSns}
                    onClearTransferSns={onClearTransferSns}
                    onManualSerialChange={onManualSerialChange}
                />
            )}
        </div>
    );
}