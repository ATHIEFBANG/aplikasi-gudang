import React, { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
    History, Search, Calendar, ArrowRight, User, Truck, 
    Navigation, Loader2, ArrowLeft, ChevronLeft, ChevronRight, 
    Clock, ListFilter, RotateCcw, X, Activity, Route as RouteIcon,
    FileSpreadsheet
} from 'lucide-react';
import Map from '@/components/Map';
import { parseCoordinates } from '@/components/MapControls';

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

// Helper: Hitung Durasi Perjalanan
const calculateTripDuration = (startStr, endStr) => {
    if (!startStr || !endStr || startStr === '-' || endStr === '-') return '-';
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMs = end - start;
    if (diffMs <= 0 || isNaN(diffMs)) return '-';
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
        return `${hours} Jam ${mins} Menit`;
    }
    return `${mins} Menit`;
};

// Helper: Hitung Total Jarak Tempuh Riil dari Akumulasi Titik GPS (Rumus Haversine)
const calculateTotalTrailDistanceKm = (coords) => {
    if (!Array.isArray(coords) || coords.length < 2) return '0.0';
    let totalKm = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        const [lon1, lat1] = coords[i];
        const [lon2, lat2] = coords[i + 1];
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        totalKm += (R * c);
    }
    return totalKm.toFixed(1);
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
    if (jenisId === 'DEPLOY') return { label: 'Deploy (Gudang ke Site)', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
    if (jenisId === 'PENARIKAN') return { label: 'Penarikan (Site ke Gudang)', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    if (jenisId === 'RELOKASI') return { label: 'Relokasi (Antar Site)', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    if (jenisId === 'MAINTENANCE') return { label: 'Maintenance (Ke Workshop)', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };

    const orig = (item.origin_name || '').toLowerCase();
    const dest = (item.destination_name || '').toLowerCase();
    if (dest.includes('workshop') || dest.includes('repair') || dest.includes('perbaikan')) return { label: 'Maintenance (Ke Workshop)', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    if ((orig.includes('gudang') || orig.includes('basecamp')) && (!dest.includes('gudang') && !dest.includes('basecamp'))) return { label: 'Deploy (Gudang ke Site)', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
    if ((!orig.includes('gudang') && !orig.includes('basecamp')) && (dest.includes('gudang') || dest.includes('basecamp'))) return { label: 'Penarikan (Site ke Gudang)', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    return { label: 'Relokasi (Antar Site)', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
};

export default function RiwayatCombat({ initialTrips = [], onBack }) {
    const [historySearch, setHistorySearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const [historyData, setHistoryData] = useState(initialTrips);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // State Modal Rekaman Jejak
    const [selectedTrailTrip, setSelectedTrailTrip] = useState(null);
    const [trailCoordinates, setTrailCoordinates] = useState([]);
    const [isLoadingTrail, setIsLoadingTrail] = useState(false);

    const fetchHistory = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const response = await axios.get('/combat-api/history?per_page=100');
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

    // 👉 HANDLER EXPORT EXCEL / CSV
    const handleExportExcel = () => {
        window.location.href = '/combat-api/history/export';
    };

    // Handler Buka Modal Jejak (Hanya untuk COMPLETED / ONSITE)
    const handleOpenTrailModal = async (tripItem) => {
        setSelectedTrailTrip(tripItem);
        setIsLoadingTrail(true);
        setTrailCoordinates([]);

        try {
            const res = await axios.get(`/combat-api/trips/${tripItem.id}/route`);
            const coords = res.data?.data?.coordinates || [];
            setTrailCoordinates(coords);
        } catch (err) {
            console.error("Gagal memuat koordinat jejak:", err);
            setTrailCoordinates([]);
        } finally {
            setIsLoadingTrail(false);
        }
    };

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
                pic_phone: item.pic_phone || '-',
                origin_name: item.origin_name || 'Gudang / Basecamp',
                destination_name: item.destination_name || '-',
                destination_lat: item.destination_lat,
                destination_lng: item.destination_lng,
                combat: item.combat,
                status: (item.status || 'COMPLETED').toUpperCase().trim(),
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

    const trailMapMarkers = useMemo(() => {
        if (!selectedTrailTrip) return [];
        const markers = [];

        const originCoord = parseCoordinates(selectedTrailTrip.combat || selectedTrailTrip);
        if (originCoord) {
            markers.push({
                id: 'trail-origin',
                latitude: originCoord.lat,
                longitude: originCoord.lng,
                is_origin: true,
                status: 'ORIGIN',
                title: `Asal: ${selectedTrailTrip.origin_name}`
            });
        }

        if (selectedTrailTrip.destination_lat && selectedTrailTrip.destination_lng) {
            markers.push({
                id: 'trail-destination',
                latitude: parseFloat(selectedTrailTrip.destination_lat),
                longitude: parseFloat(selectedTrailTrip.destination_lng),
                is_destination: true,
                status: 'DESTINATION',
                title: `Tujuan: ${selectedTrailTrip.destination_name}`
            });
        }

        return markers;
    }, [selectedTrailTrip]);

    const modalMapCenter = useMemo(() => {
        if (trailCoordinates.length > 0) return [trailCoordinates[0][0], trailCoordinates[0][1]];
        if (trailMapMarkers.length > 0) return [trailMapMarkers[0].longitude, trailMapMarkers[0].latitude];
        return [106.8456, -6.2088];
    }, [trailCoordinates, trailMapMarkers]);

    const totalDistanceRecorded = useMemo(() => {
        return calculateTotalTrailDistanceKm(trailCoordinates);
    }, [trailCoordinates]);

    return (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between min-h-[600px] relative">
            <div>
                {/* HEADER UTAMA */}
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
                                <p className="text-xs text-slate-400">Catatan pergerakan, rekaman jejak GPS selesai, dan arsip mobilisasi</p>
                            </div>
                        </div>
                    </div>

                    {/* 👉 TOMBOL EXPORT EXCEL (BERSIH TANPA TOMBOL RESET) */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            title="Unduh semua riwayat ke format Excel (CSV)"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Export Excel</span>
                        </button>
                    </div>
                </div>

                {/* SEARCH & FILTER TOOLBAR */}
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

                {/* TABEL RIWAYAT */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4">Asset COMBAT</th>
                                <th className="py-3 px-4">Rute & Jenis Pergerakan</th>
                                <th className="py-3 px-4">Jadwal & Waktu</th>
                                <th className="py-3 px-4">Tim Pelaksana</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-center">Rekaman Jejak</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                            {isLoadingData ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-slate-400">
                                        <Loader2 className="w-8 h-8 mx-auto mb-2 opacity-50 animate-spin text-red-500" />
                                        <p className="font-medium">Memuat ulang data dari server...</p>
                                    </td>
                                </tr>
                            ) : currentTableData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-slate-400">
                                        <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="font-medium">Tidak ada riwayat pergerakan yang ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                currentTableData.map((item, idx) => {
                                    const st = item.status;
                                    const jenis = item.jenis_info;
                                    const isTripCompleted = st === 'COMPLETED' || st === 'ONSITE';

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

                                            {/* 👉 AKSI: HANYA STATUS COMPLETED / ONSITE YANG MEMILIKI TOMBOL LIHAT JEJAK */}
                                            <td className="py-3 px-4 text-center">
                                                {isTripCompleted ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenTrailModal(item)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 transition-all cursor-pointer shadow-2xs active:scale-95"
                                                    >
                                                        <RouteIcon className="w-3.5 h-3.5 text-red-500" />
                                                        <span>Lihat Jejak</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">
                                                        {st === 'IN_TRANSIT' ? 'Sedang Berjalan' : st === 'ASSIGNED' ? 'Belum Mulai' : 'Dibatalkan'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAGINATION FOOTER */}
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

            {/* MODAL REKAMAN JEJAK */}
            {selectedTrailTrip && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                                    <RouteIcon className="w-5 h-5" />
                                </div>
                                <div className="truncate">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                        Rekaman Lintasan: {selectedTrailTrip.asset_name} ({selectedTrailTrip.sn})
                                    </h4>
                                    <p className="text-[11px] text-slate-400 truncate">
                                        Rute: <span className="text-slate-300">{selectedTrailTrip.origin_name}</span> $\rightarrow$ <span className="font-semibold text-emerald-400">{selectedTrailTrip.destination_name}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTrailTrip(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3">
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Jarak Riil</span>
                                    <span className="text-lg font-black font-mono text-sky-500">
                                        {totalDistanceRecorded} <span className="text-xs text-slate-400 font-sans">km</span>
                                    </span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3">
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Durasi Waktu</span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-1">
                                        {calculateTripDuration(selectedTrailTrip.started_at, selectedTrailTrip.ended_at)}
                                    </span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3">
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Titik Satelit</span>
                                    <span className="text-lg font-black font-mono text-emerald-500">
                                        {trailCoordinates.length} <span className="text-xs text-slate-400 font-sans">titik GPS</span>
                                    </span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3">
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Driver Pelaksana</span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block mt-1">
                                        {selectedTrailTrip.pic_name}
                                    </span>
                                </div>
                            </div>

                            <div className="w-full h-[380px] bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner relative">
                                {isLoadingTrail ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
                                        <span className="text-xs font-medium">Memuat rekaman lintasan GPS...</span>
                                    </div>
                                ) : (
                                    <Map
                                        data={trailMapMarkers}
                                        trackHistory={trailCoordinates}
                                        center={modalMapCenter}
                                        height="h-full min-h-[380px]"
                                        zoom={12}
                                        showControls={true}
                                        statusKey="status"
                                        statusConfig={{
                                            'ORIGIN': { label: 'Titik Asal', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.35)' },
                                            'DESTINATION': { label: 'Lokasi Tujuan', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.35)' }
                                        }}
                                        getPopupData={(item) => ({
                                            title: item.title,
                                            details: [
                                                { label: 'Keterangan', value: item.status === 'ORIGIN' ? 'Titik Berangkat' : 'Titik Tiba' }
                                            ],
                                            statusText: item.status
                                        })}
                                    />
                                )}
                            </div>

                            {trailCoordinates.length === 0 && !isLoadingTrail && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                                    <Activity className="w-4 h-4 shrink-0" />
                                    <span>Tidak ada koordinat GPS yang terekam pada perjalanan ini.</span>
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => setSelectedTrailTrip(null)}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                Tutup Rekaman
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}