import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Check, Copy, Send, Trash2, X, ExternalLink, 
    Edit, Loader2, Link as LinkIcon, MapPin, Play, ChevronDown, 
    Route as RouteIcon, Truck
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSearchInput
} from '@/components/ui/dropdown-menu';
import { parseCoordinates } from '@/components/MapControls';

// KONFIGURASI JENIS PERGERAKAN LOGISTIK PROFESIONAL
const JENIS_PERGERAKAN_OPTIONS = [
    { id: 'DEPLOY', label: 'Deploy (Gudang ke Site)', target_status: 'ONSITE' },
    { id: 'PENARIKAN', label: 'Penarikan (Site ke Gudang)', target_status: 'READY TO USE' },
    { id: 'RELOKASI', label: 'Relokasi (Antar Site)', target_status: 'ONSITE' },
    { id: 'MAINTENANCE', label: 'Maintenance (Ke Workshop/Perbaikan)', target_status: 'BROKEN / INOP' },
];

// 👉 PENDETEKSI RESMI JENIS PERGERAKAN DARI DATA DATABASE TRIP
const getJenisPergerakanInfo = (trip) => {
    if (!trip) {
        return { label: 'Mobilisasi Unit', badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
    }

    const jenisId = trip.jenis_rute || trip.ip_gps;
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

    // Fallback deteksi jika data lama belum memiliki ip_gps
    const orig = (trip.origin_name || '').toLowerCase();
    const dest = (trip.destination_name || '').toLowerCase();
    if (dest.includes('workshop') || dest.includes('repair') || dest.includes('perbaikan')) {
        return { label: 'Maintenance (Ke Workshop)', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    }
    if ((orig.includes('gudang') || orig.includes('basecamp')) && (!dest.includes('gudang') && !dest.includes('basecamp'))) {
        return { label: 'Deploy (Gudang ke Site)', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
    }
    if ((!orig.includes('gudang') && !orig.includes('basecamp')) && (dest.includes('gudang') || dest.includes('basecamp'))) {
        return { label: 'Penarikan (Site ke Gudang)', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
    if ((!orig.includes('gudang') && !orig.includes('basecamp')) && (!dest.includes('gudang') && !dest.includes('basecamp'))) {
        return { label: 'Relokasi (Antar Site)', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    }
    return { label: 'Mobilisasi Unit', badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
};

export default function ModalTrackingCombat({
    mode = 'detail', 
    trip = null,
    combatList = [],
    draftLocation = null,
    onClose,
    onStartEdit,
    onSuccess,
    onDelete,
    onCombatSelect
}) {
    const [copiedWA, setCopiedWA] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedCombat, setSelectedCombat] = useState(null);
    const [combatSearch, setCombatSearch] = useState('');

    const [selectedPergerakan, setSelectedPergerakan] = useState(JENIS_PERGERAKAN_OPTIONS[0]);

    const [createForm, setCreateForm] = useState({
        origin_name: 'Gudang / Basecamp',
        destination_name: '',
        destination_lat: '',
        destination_lng: '',
        pic_name: '',
    });

    useEffect(() => {
        if (mode === 'create' && draftLocation) {
            setCreateForm(prev => ({
                ...prev,
                destination_lat: draftLocation.lat ? Number(draftLocation.lat).toFixed(6) : prev.destination_lat,
                destination_lng: draftLocation.lng ? Number(draftLocation.lng).toFixed(6) : prev.destination_lng
            }));
        }
    }, [draftLocation, mode]);

    const filteredCombats = useMemo(() => {
        if (!combatSearch.trim()) return combatList;
        const q = combatSearch.toLowerCase().trim();
        return combatList.filter((c) => {
            const name = String(c.asset_name || c.nama_site || '').toLowerCase();
            const sn = String(c.sn || c.serial_number || '').toLowerCase();
            const type = String(c.type_combat || '').toLowerCase();
            return name.includes(q) || sn.includes(q) || type.includes(q);
        });
    }, [combatList, combatSearch]);

    const handleSelectCombat = (unit) => {
        setSelectedCombat(unit);
        let newOrigin = unit.lokasi_saat_ini || unit.nama_site || 'Gudang / Basecamp';
        setCreateForm(prev => ({
            ...prev,
            origin_name: newOrigin
        }));
        if (onCombatSelect) onCombatSelect(unit);
    };

    const handlePergerakanChange = (opt) => {
        setSelectedPergerakan(opt);
        let newOrigin = createForm.origin_name;
        if (selectedCombat) {
            newOrigin = selectedCombat.lokasi_saat_ini || selectedCombat.nama_site || 'Gudang / Basecamp';
        }
        setCreateForm(prev => ({
            ...prev,
            origin_name: newOrigin
        }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCombat?.id) {
            alert('Pilih unit COMBAT terlebih dahulu!');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                combat_master_id: selectedCombat.id,
                origin_name: createForm.origin_name,
                destination_name: createForm.destination_name,
                destination_lat: createForm.destination_lat ? parseFloat(createForm.destination_lat) : null,
                destination_lng: createForm.destination_lng ? parseFloat(createForm.destination_lng) : null,
                pic_name: createForm.pic_name,
                pic_phone: '-', 
                jenis_rute: selectedPergerakan.id,
                target_status: selectedPergerakan.target_status 
            };

            const res = await axios.post('/api/combat/dispatch', payload);
            alert('Penugasan rute baru berhasil dibuat!');
            if (onSuccess) onSuccess(res.data?.data || res.data);
        } catch (err) {
            console.error('Gagal membuat rute:', err);
            alert(err.response?.data?.message || 'Gagal membuat rute baru.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateWaText = (t) => {
        if (!t) return '';
        const trackingUrl = `${window.location.origin}/track/${t.tracking_token}`;
        return `Halo *${t.pic_name}*,\n\nKamu ditugaskan untuk melakukan mobilisasi unit *${t.combat?.asset_name || 'COMBAT'}* dari *${t.origin_name || 'Lokasi Asal'}* menuju *${t.destination_name}*.\n\nKlik link di bawah ini saat kamu siap berangkat untuk menyalakan GPS Tracker:\n${trackingUrl}\n\nHati-hati di jalan dan terima kasih!`;
    };

    const handleCopyWA = (t) => {
        navigator.clipboard.writeText(generateWaText(t));
        setCopiedWA(true);
        setTimeout(() => setCopiedWA(false), 2500);
    };

    const handleCopyDirectLink = (t) => {
        if (!t?.tracking_token) return;
        const trackingUrl = `${window.location.origin}/track/${t.tracking_token}`;
        navigator.clipboard.writeText(trackingUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
    };

    const getWALink = (t) => {
        if (!t) return '#';
        return `https://wa.me/?text=${encodeURIComponent(generateWaText(t))}`;
    };

    const getGoogleMapsDirectionsUrl = (t) => {
        if (!t) return '#';
        const originCoord = parseCoordinates(t.combat || t);
        const destLat = parseFloat(t.destination_lat);
        const destLng = parseFloat(t.destination_lng);

        if (originCoord && !isNaN(destLat) && !isNaN(destLng)) {
            return `https://www.google.com/maps/dir/?api=1&origin=${originCoord.lat},${originCoord.lng}&destination=${destLat},${destLng}&travelmode=driving`;
        }
        if (t.destination_name) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.destination_name)}`;
        }
        return '#';
    };

    const detailPergerakan = trip ? getJenisPergerakanInfo(trip) : null;

    return (
        <div className="absolute top-4 right-4 z-[9999] w-88 flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right-6 duration-300 overflow-hidden">
            
            {/* MODE CREATE */}
            {mode === 'create' && (
                <div>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                <RouteIcon className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                Form Penugasan Mobilisasi
                            </h3>
                        </div>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateSubmit} className="p-4 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
                        <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Pilih Unit Aset COMBAT <span className="text-red-500">*</span>
                            </label>
                            <DropdownMenu onOpenChange={(open) => { if (!open) setCombatSearch(''); }}>
                                <DropdownMenuTrigger className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 shadow-xs cursor-pointer">
                                    <span className="truncate font-semibold">
                                        {selectedCombat 
                                            ? `${selectedCombat.asset_name || selectedCombat.nama_site} (${selectedCombat.sn || '-'})` 
                                            : '-- Pilih Unit Disini --'
                                        }
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-80 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-2xl z-[10000]">
                                    <DropdownMenuSearchInput 
                                        value={combatSearch} 
                                        onChange={(e) => setCombatSearch(e.target.value)} 
                                        placeholder="Cari nama aset, site, atau SN..." 
                                    />
                                    {filteredCombats.length === 0 ? (
                                        <div className="px-3 py-3 text-xs text-slate-400 text-center">Tidak ada unit ditemukan</div>
                                    ) : (
                                        filteredCombats.map((c) => {
                                            const isSelected = selectedCombat?.id === c.id;
                                            return (
                                                <DropdownMenuItem 
                                                    key={c.id}
                                                    onClick={() => handleSelectCombat(c)}
                                                    className={`cursor-pointer py-2 px-2.5 rounded-lg border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 text-xs flex items-center justify-between transition-colors ${
                                                        isSelected ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                                    }`}
                                                >
                                                    <div className="flex flex-col truncate pr-2">
                                                        <span className="font-semibold text-xs truncate">{c.asset_name || c.nama_site || 'Unit COMBAT'}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono truncate mt-0.5">SN: {c.sn || c.serial_number || '-'} • {c.type_combat || 'COMBAT'}</span>
                                                    </div>
                                                </DropdownMenuItem>
                                            );
                                        })
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                                    Jenis Pergerakan <span className="text-red-500">*</span>
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-[11px] flex items-center justify-between outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 shadow-xs cursor-pointer font-medium">
                                        <span className="truncate">{selectedPergerakan.label}</span>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-2xl z-[10000] rounded-xl">
                                        {JENIS_PERGERAKAN_OPTIONS.map(opt => (
                                            <DropdownMenuItem 
                                                key={opt.id}
                                                onClick={() => handlePergerakanChange(opt)}
                                                className={`cursor-pointer py-2 px-2.5 rounded-lg border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 text-xs flex items-center justify-between transition-colors ${
                                                    selectedPergerakan.id === opt.id 
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold' 
                                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                                }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-xs">{opt.label}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                        Status Target: <strong className="text-sky-500">{opt.target_status}</strong>
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                                    Lokasi Asal (Origin) <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Titik Awal..."
                                    value={createForm.origin_name}
                                    onChange={(e) => setCreateForm({...createForm, origin_name: e.target.value})}
                                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 outline-none"
                                />
                            </div>
                        </div>

                        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                    <span>Lokasi Tujuan (Destination)</span>
                                </label>
                                <span className="text-[9px] text-amber-500 font-medium">
                                    (Klik peta untuk pin koordinat)
                                </span>
                            </div>
                            <input 
                                type="text"
                                required
                                placeholder="Nama Site / Titik Akhir..."
                                value={createForm.destination_name}
                                onChange={(e) => setCreateForm({...createForm, destination_name: e.target.value})}
                                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    type="number"
                                    step="any"
                                    placeholder="Latitude"
                                    value={createForm.destination_lat}
                                    onChange={(e) => setCreateForm({...createForm, destination_lat: e.target.value})}
                                    className="w-full h-7 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[11px] font-mono outline-none"
                                />
                                <input 
                                    type="number"
                                    step="any"
                                    placeholder="Longitude"
                                    value={createForm.destination_lng}
                                    onChange={(e) => setCreateForm({...createForm, destination_lng: e.target.value})}
                                    className="w-full h-7 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[11px] font-mono outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                                Nama Driver / Tim Pelaksana <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                required
                                placeholder="Nama Lengkap..."
                                value={createForm.pic_name}
                                onChange={(e) => setCreateForm({...createForm, pic_name: e.target.value})}
                                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 outline-none"
                            />
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all cursor-pointer active:scale-95"
                            >
                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                <span>Buat Penugasan Rute</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODE DETAIL */}
            {mode === 'detail' && trip && (
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <Truck className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                                {trip.combat?.asset_name || 'Detail Rute COMBAT'}
                            </h3>

                            {trip.tracking_token && (
                                <button 
                                    type="button"
                                    onClick={() => handleCopyDirectLink(trip)}
                                    title={copiedLink ? "Link Tracking Tersalin!" : "Salin Link Tracking GPS"}
                                    className="text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                                >
                                    {copiedLink ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in-50" />
                                    ) : (
                                        <LinkIcon className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            )}
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md transition-colors cursor-pointer shrink-0">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    
                    {/* Box Info Rute & Status */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl space-y-2 text-xs">
                        
                        {/* Status Misi & Jenis Pergerakan (Otomatis membaca data ip_gps / jenis_rute hasil update) */}
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${detailPergerakan.badgeClass}`}>
                                {detailPergerakan.label}
                            </span>
                            <span className="font-bold text-sky-500 uppercase text-[10px] bg-sky-500/10 px-2 py-0.5 rounded-full">
                                {trip.status || 'IN TRANSIT'}
                            </span>
                        </div>

                        {/* Visual Rute Perjalanan */}
                        <div className="pt-0.5 space-y-1.5">
                            <div className="flex items-start gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-400 mt-1 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] text-slate-400 block leading-tight">Titik Asal:</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                                        {trip.origin_name || 'Gudang / Basecamp'}
                                    </span>
                                </div>
                            </div>

                            <div className="pl-1 text-slate-300 dark:text-slate-700 leading-none">
                                •
                            </div>

                            <div className="flex items-start gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] text-slate-400 block leading-tight">Titik Tujuan:</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                                        {trip.destination_name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Driver / Tim Pelaksana */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                            <span className="text-slate-400 text-[11px]">Tim Pelaksana:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {trip.pic_name}
                            </span>
                        </div>
                    </div>

                    <a 
                        href={getGoogleMapsDirectionsUrl(trip)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Navigasi di Google Maps</span>
                    </a>

                    {['ASSIGNED', 'IN_TRANSIT'].includes(trip.status) && (
                        <div className="flex items-center gap-2 pt-0.5">
                            <button 
                                type="button"
                                onClick={() => handleCopyWA(trip)} 
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all duration-200 active:scale-95"
                            >
                                {copiedWA ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Teks Disalin</> : <><Copy className="w-3.5 h-3.5" /> Salin Pesan WA</>}
                            </button>
                            <a 
                                href={getWALink(trip)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all duration-200 active:scale-95"
                            >
                                <Send className="w-3.5 h-3.5" /> WA
                            </a>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button 
                            type="button"
                            onClick={onStartEdit} 
                            className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
                        >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Data</span>
                        </button>
                        
                        <button 
                            type="button"
                            onClick={() => onDelete && onDelete(trip.id)} 
                            className="flex items-center justify-center gap-1.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}