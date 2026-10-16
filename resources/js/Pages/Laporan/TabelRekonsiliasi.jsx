import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Tabel from '@/components/gabungan/Tabel';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';

const REKONSILIASI_COLUMNS = [
    { key: 'kode_barang', label: 'KODE PPL' },
    { key: 'nama_barang', label: 'NAMA & DESKRIPSI BARANG' },
    { key: 'stok_awal', label: 'STOK AWAL' },
    { key: 'masuk', label: 'MASUK (+)' },
    { key: 'keluar', label: 'KELUAR (-)' },
    { key: 'transfer_net', label: 'TRF' },
    { key: 'stok_akhir', label: 'STOK USABLE' },
    { key: 'sisa_fisik', label: 'SISA FISIK DI GUDANG' },
    { key: 'grand_total', label: 'STOK KESELURUHAN' },
];

function useDropdownPosition(isOpen, buttonRef, menuRef, menuWidth = 224) {
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const updatePosition = () => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const menuHeight = menuRef.current?.offsetHeight || 0;
        const gap = 6;
        const padding = 8;

        let left = rect.left;
        let top = rect.bottom + gap;

        if (left + menuWidth > window.innerWidth - padding) {
            left = window.innerWidth - menuWidth - padding;
        }

        if (left < padding) {
            left = padding;
        }

        if (menuHeight > 0 && top + menuHeight > window.innerHeight - padding) {
            const topAbove = rect.top - menuHeight - gap;

            if (topAbove >= padding) {
                top = topAbove;
            } else {
                top = Math.max(padding, window.innerHeight - menuHeight - padding);
            }
        }

        setPosition({
            top: Math.max(padding, top),
            left: Math.max(padding, left),
        });
    };

    useLayoutEffect(() => {
        if (!isOpen) return;

        updatePosition();

        const handleScroll = () => updatePosition();
        const handleResize = () => updatePosition();

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    return position;
}

function useDropdownOutside(isOpen, setIsOpen, buttonRef, menuRef) {
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = event => {
            if (
                buttonRef.current &&
                !buttonRef.current.contains(event.target) &&
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, setIsOpen]);
}

function KeluarDropdown({ item }) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const menuPosition = useDropdownPosition(isOpen, buttonRef, menuRef, 224);

    useDropdownOutside(isOpen, setIsOpen, buttonRef, menuRef);

    const val = item.keluar || 0;

    if (val <= 0) {
        return (
            <span className="font-mono font-bold text-xs text-rose-600/50 dark:text-rose-400/50">
                -0
            </span>
        );
    }

    const menu = (
        <div
            ref={menuRef}
            className="fixed w-56 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 font-mono text-xs"
            style={{ top: menuPosition.top, left: menuPosition.left, zIndex: 99999 }}
        >
            <div className="text-[10px] font-sans font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                Rincian Keluar
            </div>

            <div className="space-y-1">
                <div className="flex justify-between items-center rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                    <span className="font-sans text-[11px] text-slate-600 dark:text-slate-300">Baru</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {(item.keluar_baru || 0).toLocaleString('id-ID')} Unit
                    </span>
                </div>

                <div className="flex justify-between items-center rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                    <span className="font-sans text-[11px] text-slate-600 dark:text-slate-300">Bekas</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                        {(item.keluar_bekas || 0).toLocaleString('id-ID')} Unit
                    </span>
                </div>

                <div className="flex justify-between items-center rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                    <span className="font-sans text-[11px] text-slate-600 dark:text-slate-300">Rusak</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                        {(item.keluar_rusak || 0).toLocaleString('id-ID')} Unit
                    </span>
                </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-right font-bold text-rose-600 dark:text-rose-400">
                Total {val.toLocaleString('id-ID')} Unit
            </div>
        </div>
    );

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="inline-flex items-center gap-1 font-mono font-bold text-xs text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 hover:underline cursor-pointer focus:outline-none"
            >
                <span>-{val.toLocaleString('id-ID')}</span>
                <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(menu, document.body)}
        </>
    );
}

function TransferNetDropdown({ item }) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const menuPosition = useDropdownPosition(isOpen, buttonRef, menuRef, 240);

    useDropdownOutside(isOpen, setIsOpen, buttonRef, menuRef);

    const trfIn = item.transfer_in || 0;
    const trfOut = item.transfer_out || 0;
    const trfNet = item.transfer_net !== undefined ? item.transfer_net : trfIn - trfOut;
    const hasTransfer = trfIn > 0 || trfOut > 0;

    if (!hasTransfer && trfNet === 0) {
        return (
            <span className="font-mono font-bold text-xs text-indigo-600/50 dark:text-indigo-400/50">
                0
            </span>
        );
    }

    const menu = (
        <div
            ref={menuRef}
            className="fixed w-60 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 font-mono text-xs"
            style={{ top: menuPosition.top, left: menuPosition.left, zIndex: 99999 }}
        >
            <div className="text-[10px] font-sans font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                Rincian Transfer
            </div>

            <div className="space-y-1">
                <div className="flex justify-between items-center rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                    <span className="font-sans text-[11px] text-slate-600 dark:text-slate-300">Trf Masuk (+)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{trfIn.toLocaleString('id-ID')} Unit
                    </span>
                </div>

                <div className="flex justify-between items-center rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                    <span className="font-sans text-[11px] text-slate-600 dark:text-slate-300">Trf Keluar (-)</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                        -{trfOut.toLocaleString('id-ID')} Unit
                    </span>
                </div>

                <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="font-sans text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                        Net Transfer
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {trfNet >= 0 ? `+${trfNet.toLocaleString('id-ID')}` : trfNet.toLocaleString('id-ID')} Unit
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="inline-flex items-center gap-1 font-mono font-bold text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline cursor-pointer focus:outline-none"
            >
                <span>
                    {trfNet >= 0 ? `+${trfNet.toLocaleString('id-ID')}` : trfNet.toLocaleString('id-ID')}
                </span>

                <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(menu, document.body)}
        </>
    );
}

function kondisiLabel(kondisi) {
    if (kondisi === 'baru') return 'Baru';
    if (kondisi === 'bekas') return 'Bekas';
    return 'Rusak';
}

function KondisiGudangDropdown({ item, kondisi, value, colorClass, hoverClass }) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const menuPosition = useDropdownPosition(isOpen, buttonRef, menuRef, 280);

    useDropdownOutside(isOpen, setIsOpen, buttonRef, menuRef);

    const gudangData = Array.isArray(item.kondisi_per_gudang)
        ? item.kondisi_per_gudang.filter(g => Number(g?.[kondisi] || 0) > 0)
        : [];

    const total = Number(value || 0);
    const hasBreakdown = gudangData.length > 0;
    const label = kondisiLabel(kondisi);

    if (!hasBreakdown || total <= 0) {
        return (
            <span className={`font-bold ${colorClass}`}>
                {total.toLocaleString('id-ID')}{' '}
                <span className="font-sans font-medium text-[10px] text-slate-400">{label}</span>
            </span>
        );
    }

    const menu = (
        <div
            ref={menuRef}
            className="fixed w-72 max-h-[min(70vh,360px)] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-3 font-mono text-xs"
            style={{ top: menuPosition.top, left: menuPosition.left, zIndex: 99999 }}
        >
            <div className="flex items-center justify-between gap-2 text-[10px] font-sans font-bold uppercase tracking-wider mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className={colorClass}>{label}</span>
                <span className="text-slate-400 dark:text-slate-500">Semua Gudang</span>
            </div>

            <div className="space-y-1">
                {gudangData.map(gudang => {
                    const jumlah = Number(gudang?.[kondisi] || 0);

                    return (
                        <div
                            key={`${gudang.gudang_id}-${kondisi}`}
                            className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                        >
                            <div className="min-w-0">
                                <div
                                    className="font-sans text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate"
                                    title={gudang.nama_gudang}
                                >
                                    {gudang.nama_gudang}
                                </div>

                                {gudang.kode_gudang && (
                                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                        {gudang.kode_gudang}
                                    </div>
                                )}
                            </div>

                            <span className={`shrink-0 font-bold ${colorClass}`}>
                                {jumlah.toLocaleString('id-ID')}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className={`mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-right font-bold ${colorClass}`}>
                Total {total.toLocaleString('id-ID')} Unit
            </div>
        </div>
    );

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className={`inline-flex items-center gap-1 font-mono text-xs cursor-pointer hover:underline focus:outline-none ${colorClass} ${hoverClass}`}
            >
                <span className="font-bold">{total.toLocaleString('id-ID')}</span>

                <span className="font-sans font-medium text-[10px] text-slate-400">
                    {label}
                </span>

                <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(menu, document.body)}
        </>
    );
}

export default function TabelRekonsiliasi({ dataList = [], zoomLevel = 100, getRowNumber }) {
    const getItemId = item => item?.id || item?.kode_barang;

    const formattedColumns = useMemo(() => {
        return REKONSILIASI_COLUMNS.map(col => ({
            ...col,
            render: item => {
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
                                <span
                                    className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate"
                                    title={item.nama_barang}
                                >
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
                            <Badge
                                variant="outline"
                                className="font-mono font-black text-xs bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5"
                            >
                                {(item.stok_akhir || 0).toLocaleString('id-ID')}
                            </Badge>
                        );

                    case 'sisa_fisik':
                        return (
                            <div className="flex items-center gap-2 text-xs font-mono whitespace-nowrap">
                                <KondisiGudangDropdown
                                    item={item}
                                    kondisi="baru"
                                    value={item.kondisi_baru}
                                    colorClass="text-emerald-600 dark:text-emerald-400"
                                    hoverClass="hover:text-emerald-700 dark:hover:text-emerald-300"
                                />

                                <span className="text-slate-300 dark:text-slate-700 font-sans">&bull;</span>

                                <KondisiGudangDropdown
                                    item={item}
                                    kondisi="bekas"
                                    value={item.kondisi_bekas}
                                    colorClass="text-amber-600 dark:text-amber-400"
                                    hoverClass="hover:text-amber-700 dark:hover:text-amber-300"
                                />

                                <span className="text-slate-300 dark:text-slate-700 font-sans">&bull;</span>

                                <KondisiGudangDropdown
                                    item={item}
                                    kondisi="rusak"
                                    value={item.kondisi_rusak}
                                    colorClass="text-rose-600 dark:text-rose-400"
                                    hoverClass="hover:text-rose-700 dark:hover:text-rose-300"
                                />
                            </div>
                        );

                    case 'grand_total': {
                        const total = item.grand_total !== undefined
                            ? item.grand_total
                            : (item.kondisi_baru || 0) + (item.kondisi_bekas || 0) + (item.kondisi_rusak || 0);

                        return (
                            <Badge
                                variant="outline"
                                className="font-mono font-black text-xs bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-2.5 py-0.5"
                            >
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