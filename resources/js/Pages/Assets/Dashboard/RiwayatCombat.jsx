import React, { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
    History, Search, Calendar, ArrowRight, User, Truck, 
    Navigation, Loader2, ArrowLeft, ChevronLeft, ChevronRight, 
    Clock, ListFilter, RotateCcw
} from 'lucide-react';

const formatDateTime = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const getStatusBadgeStyle = (status) => {
    const st = (status || '').toUpperCase().trim();
    switch (st) {
        case 'IN_TRANSIT':
        case 'IN TRANSIT': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        case 'ASSIGNED': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        case 'ONSITE':
        case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'READY TO USE':
        case 'READY': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
        case 'BROKEN':
        case 'CANCELLED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
};

const getJenisPergerakanInfo = (item) => {
    const jenisId = item.ip_gps || item.jenis_rute;
    if (jenisId === 'DEPLOY') {
        return { label: 'Deploy (Gudang ke Site)', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
    }
    if (jenisId === 'PENARIKAN') {
        return { label: 'Penarikan (Site ke Gudang)', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
    if (jenisId === 'RELOKASI') {
        return { label: 'Relokasi (Antar Site)', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    }
    if (jenisId === 'MAINTENANCE') {
        return { label: 'Maintenance (Ke Workshop)', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    }

    const orig = (item.origin_name || '').toLowerCase();
    const dest = (item.destination_name || '').toLowerCase();
    if (dest.includes('workshop') || dest.includes('repair') || dest.includes('perbaikan')) {
        return { label: 'Maintenance (Ke Workshop)', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    }
    if ((orig.includes('gudang') || orig.includes('basecamp')) && (!dest.includes('gudang') && !dest.includes('basecamp'))) {
        return { label: 'Deploy (Gudang ke Site)', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
    }
    if ((!orig.includes('gudang') && !orig.includes('basecamp')) && (dest.includes('gudang') || dest.includes('basecamp'))) {
        return { label: 'Penarikan (Site ke Gudang)', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
    return { label: 'Relokasi (Antar Site)', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
};

export default function RiwayatCombat({ initialTrips = [], onBack }) {
    const [historySearch, setHistorySearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const [historyData, setHistoryData] = useState(initialTrips);
    const [isLoadingData, setIsLoadingData] = useState(false); // 👉 Hapus auto-loading karena data dari backend sudah instan!

    const fetchHistory = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const response = await axios.get('/api/combat/history?per_page=100');
            const data = response.data?.data || response.data || [];
            if (Array.isArray(data)) {
                setHistoryData(data);
            }
        } catch (error) {
            console.error("Gagal memuat data riwayat:", error);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    const tripHistoryList = useMemo(() => {
        return historyData.map(item => {
            const combatObj = item.combat || {};
            const picObj = item.pic || item.pic_user || item.picUser || {};
            const jenisInfo = getJenisPergerakanInfo(item);

            return {
                id: item.id,
                tracking_token: item.tracking_token,
                asset_name: combatObj.asset_name || item.asset_name || 'Unit COMBAT',
                sn: combatObj.sn || combatObj.serial_number || item.sn || '-',
                type_combat: combatObj.type_combat || item.type_combat || '-',
                pic_name: picObj.name || item.pic_name || '-',
                origin_name: item.origin_name || 'Gudang / Basecamp',
                destination_name: item.destination_name || '-',
                status: item.status || 'COMPLETED',
                started_at: item.started_at || '-',
                ended_at: item.ended_at || '-',
                ip_gps: item.ip_gps,
                jenis_info: jenisInfo
            };
        });
    }, [historyData]);

    const filteredHistoryData = useMemo(() => {
        const searchLower = historySearch.toLowerCase().trim();
        if (!searchLower) return tripHistoryList;
        return tripHistoryList.filter((item) => {
            return (item.asset_name || '').toLowerCase().includes(searchLower) || 
                   (item.destination_name || '').toLowerCase().includes(searchLower) ||
                   (item.origin_name || '').toLowerCase().includes(searchLower) ||
                   (item.sn || '').toLowerCase().includes(searchLower) || 
                   (item.type_combat || '').toLowerCase().includes(searchLower) ||
                   (item.pic_name || '').toLowerCase().includes(searchLower) ||
                   (item.jenis_info?.label || '').toLowerCase().includes(searchLower);
        });
    }, [tripHistoryList, historySearch]);

    const totalPages = Math.ceil(filteredHistoryData.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTableData = filteredHistoryData.slice(startIndex, endIndex);

    return (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between min-h-[600px]">
            <div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onBack} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer shadow-2xs"
                        >
                            <ArrowLeft className="w-4 h-4 text-slate-500" />
                            <span>Kembali ke Dashboard</span>
                        </button>
                        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                                <History className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">Riwayat Perjalanan COMBAT</h3>
                                <p className="text-xs text-slate-400">Catatan pergerakan, jadwal deploy, dan penempatan unit</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari site, SN, PIC, atau jenis pergerakan..." 
                            value={historySearch} 
                            onChange={(e) => {
                                setHistorySearch(e.target.value);
                                setCurrentPage(1);
                            }} 
                            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500/50" 
                        />
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={fetchHistory}
                            disabled={isLoadingData}
                            title="Refresh Data Riwayat"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingData ? 'animate-spin text-red-500' : ''}`} />
                            <span>Refresh</span>
                        </button>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                            <span>Tampilkan:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                            >
                                <option value={10}>10 Baris</option>
                                <option value={30}>30 Baris</option>
                                <option value={50}>50 Baris</option>
                                <option value={100}>100 Baris</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4">Asset COMBAT</th>
                                <th className="py-3 px-4">Rute & Jenis Pergerakan</th>
                                <th className="py-3 px-4">Jadwal & Waktu</th>
                                <th className="py-3 px-4">Tim Pelaksana</th>
                                <th className="py-3 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                            {isLoadingData ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-slate-400">
                                        <Loader2 className="w-8 h-8 mx-auto mb-2 opacity-50 animate-spin text-red-500" />
                                        <p className="font-medium">Memuat ulang data dari server...</p>
                                    </td>
                                </tr>
                            ) : currentTableData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-slate-400">
                                        <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="font-medium">Tidak ada riwayat pergerakan yang ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                currentTableData.map((item, idx) => {
                                    const st = item.status || 'COMPLETED';
                                    const jenis = item.jenis_info;

                                    return (
                                        <tr key={item.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-800 dark:text-slate-100">{item.asset_name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                                    <span>Type: {item.type_combat}</span>
                                                    <span>•</span>
                                                    <span>SN: {item.sn}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <Navigation className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    <span>{item.origin_name}</span>
                                                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                                    <span className="text-slate-900 dark:text-slate-100 font-semibold">{item.destination_name}</span>
                                                </div>
                                                <div className="mt-1">
                                                    <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-md border ${jenis.badgeClass}`}>
                                                        {jenis.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                        <span className="font-mono">{formatDateTime(item.started_at)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="text-[10px]">s/d</span>
                                                        <span className="font-mono text-slate-600 dark:text-slate-300">{formatDateTime(item.ended_at)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span>{item.pic_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded border uppercase ${getStatusBadgeStyle(st)}`}>
                                                    {st}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div>
                    Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredHistoryData.length > 0 ? startIndex + 1 : 0}</span> - <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(endIndex, filteredHistoryData.length)}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredHistoryData.length}</span> data
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] mr-2">Halaman <strong className="text-slate-700 dark:text-slate-200">{currentPage}</strong> dari <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong></span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={currentPage === 1} 
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={currentPage === totalPages || totalPages === 0} 
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}