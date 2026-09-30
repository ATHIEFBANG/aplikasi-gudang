import React, { useState, useMemo, useRef, useEffect } from 'react';
import Tabel from '@/components/Tabel';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';

// 1. Kolom RINCIAN KELUAR Dihapus agar tabel lebih ringkas
const REKONSILIASI_COLUMNS = [
    { key: 'kode_barang', label: 'KODE PPL' },
    { key: 'nama_barang', label: 'NAMA & DESKRIPSI BARANG' },
    { key: 'stok_awal', label: 'STOK AWAL' },
    { key: 'masuk', label: 'MASUK (+)' },
    { key: 'keluar', label: 'KELUAR (-)' },       // Menampilkan dropdown rincian kondisi saat diklik
    { key: 'transfer_net', label: 'TRF NET' },    // Menampilkan dropdown rincian transfer saat diklik
    { key: 'stok_akhir', label: 'STOK AKHIR' },
    { key: 'sisa_fisik', label: 'SISA FISIK DI GUDANG' },
    { key: 'grand_total', label: 'GRAND TOTAL' },
];

// Component Dropdown Rincian Keluar (Baru, Bekas, Rusak)
function KeluarDropdown({ item }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const val = item.keluar || 0;

    // Jika tidak ada barang keluar, tampilkan angka statis -0
    if (val <= 0) {
        return <span className="font-mono font-bold text-xs text-rose-600/50 dark:text-rose-400/50">-0</span>;
    }

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-1 font-mono font-bold text-xs text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 hover:underline cursor-pointer focus:outline-none"
            >
                <span>-{val.toLocaleString('id-ID')}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-2.5 z-40 font-mono text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-[10px] font-sans font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Rincian Keluar
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                            <span className="font-sans text-[11px] text-slate-600 dark:text-slate-300">Baru</span>
                            <span className="font-bold">{(item.keluar_baru || 0).toLocaleString('id-ID')} Unit</span>
                        </div>
                        <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                            <span className="font-sans text-[11px] text-slate-600 dark:text-slate-300">Bekas</span>
                            <span className="font-bold">{(item.keluar_bekas || 0).toLocaleString('id-ID')} Unit</span>
                        </div>
                        <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                            <span className="font-sans text-[11px] text-slate-600 dark:text-slate-300">Rusak</span>
                            <span className="font-bold">{(item.keluar_rusak || 0).toLocaleString('id-ID')} Unit</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Component Dropdown Rincian Transfer Net (Transfer Masuk vs Transfer Keluar)
function TransferNetDropdown({ item }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const trfIn = item.transfer_in || 0;
    const trfOut = item.transfer_out || 0;
    const trfNet = item.transfer_net !== undefined ? item.transfer_net : (trfIn - trfOut);

    const hasTransfer = trfIn > 0 || trfOut > 0;

    // Jika tidak ada mutasi transfer sama sekali, tampilkan angka statis 0
    if (!hasTransfer && trfNet === 0) {
        return <span className="font-mono font-bold text-xs text-indigo-600/50 dark:text-indigo-400/50">0</span>;
    }

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-1 font-mono font-bold text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline cursor-pointer focus:outline-none"
            >
                <span>{trfNet >= 0 ? `+${trfNet.toLocaleString('id-ID')}` : trfNet.toLocaleString('id-ID')}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-1 w-48 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-2.5 z-40 font-mono text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-[10px] font-sans font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Rincian Transfer
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                            <span className="font-sans text-[11px] text-slate-600 dark:text-slate-300">Trf Masuk (+)</span>
                            <span className="font-bold">+{trfIn.toLocaleString('id-ID')} Unit</span>
                        </div>
                        <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                            <span className="font-sans text-[11px] text-slate-600 dark:text-slate-300">Trf Keluar (-)</span>
                            <span className="font-bold">-{trfOut.toLocaleString('id-ID')} Unit</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-indigo-600 dark:text-indigo-400 font-bold">
                            <span className="font-sans text-[11px] text-slate-700 dark:text-slate-200">Net Transfer</span>
                            <span>{trfNet >= 0 ? `+${trfNet.toLocaleString('id-ID')}` : trfNet.toLocaleString('id-ID')} Unit</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TabelRekonsiliasi({
    dataList = [],
    zoomLevel = 100,
    getRowNumber
}) {
    const getItemId = (item) => item?.id || item?.kode_barang;

    const formattedColumns = useMemo(() => {
        return REKONSILIASI_COLUMNS.map((col) => ({
            ...col,
            render: (item) => {
                switch (col.key) {
                    case 'kode_barang':
                        return (
                            <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                {item.kode_barang || '-'}
                            </span>
                        );
                    case 'nama_barang':
                        return (
                            <div className="flex flex-col max-w-[200px]">
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate" title={item.nama_barang}>
                                    {item.nama_barang || '-'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    PN: {item.part_number !== '-' ? item.part_number : 'Standar'} &bull; {item.satuan}
                                </span>
                            </div>
                        );
                    case 'stok_awal':
                        return (
                            <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                                {(item.stok_awal || 0).toLocaleString('id-ID')}
                            </span>
                        );
                    case 'masuk':
                        return (
                            <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                                +{(item.masuk || 0).toLocaleString('id-ID')}
                            </span>
                        );
                    case 'keluar':
                        return <KeluarDropdown item={item} />;
                    case 'transfer_net':
                        return <TransferNetDropdown item={item} />;
                    case 'stok_akhir':
                        return (
                            <Badge variant="outline" className="font-mono font-black text-xs bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5">
                                {(item.stok_akhir || 0).toLocaleString('id-ID')}
                            </Badge>
                        );
                    case 'sisa_fisik':
                        return (
                            <div className="flex items-center gap-2 text-xs font-mono whitespace-nowrap">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {(item.kondisi_baru || 0).toLocaleString('id-ID')} <span className="font-sans font-medium text-[10px] text-slate-400">Baru</span>
                                </span>
                                <span className="text-slate-300 dark:text-slate-700 font-sans">&bull;</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                    {(item.kondisi_bekas || 0).toLocaleString('id-ID')} <span className="font-sans font-medium text-[10px] text-slate-400">Bekas</span>
                                </span>
                                <span className="text-slate-300 dark:text-slate-700 font-sans">&bull;</span>
                                <span className="font-bold text-rose-600 dark:text-rose-400">
                                    {(item.kondisi_rusak || 0).toLocaleString('id-ID')} <span className="font-sans font-medium text-[10px] text-slate-400">Rusak</span>
                                </span>
                            </div>
                        );
                    case 'grand_total': {
                        const total = item.grand_total !== undefined 
                            ? item.grand_total 
                            : ((item.kondisi_baru || 0) + (item.kondisi_bekas || 0) + (item.kondisi_rusak || 0));
                        return (
                            <Badge variant="outline" className="font-mono font-black text-xs bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-2.5 py-0.5">
                                {total.toLocaleString('id-ID')}
                            </Badge>
                        );
                    }
                    default:
                        return '-';
                }
            },
        }));
    }, []);

    return (
        <Tabel
            data={dataList}
            columns={formattedColumns}
            getItemId={getItemId}
            getRowNumber={getRowNumber}
            zoomLevel={zoomLevel}
            emptyMessage="Tidak ada data rekonsiliasi stok pada periode ini."
        />
    );
}