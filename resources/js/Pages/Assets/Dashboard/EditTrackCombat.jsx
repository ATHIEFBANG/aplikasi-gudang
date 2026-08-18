import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, X, MapPin, Loader2, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const JENIS_PERGERAKAN_OPTIONS = [
    { id: 'DEPLOY', label: 'Deploy (Gudang ke Site)', target_status: 'ONSITE' },
    { id: 'PENARIKAN', label: 'Penarikan (Site ke Gudang)', target_status: 'READY TO USE' },
    { id: 'RELOKASI', label: 'Relokasi (Antar Site)', target_status: 'ONSITE' },
    { id: 'MAINTENANCE', label: 'Maintenance (Ke Workshop/Perbaikan)', target_status: 'BROKEN / INOP' },
];

export default function EditTrackCombat({
    trip,
    draftLocation,
    onClose,
    onSuccess
}) {
    const [selectedPergerakan, setSelectedPergerakan] = useState(() => {
        if (!trip) return JENIS_PERGERAKAN_OPTIONS[0];
        const jenisId = trip.jenis_rute || trip.ip_gps;
        if (jenisId) {
            const found = JENIS_PERGERAKAN_OPTIONS.find(o => o.id === jenisId);
            if (found) return found;
        }
        const dest = (trip.destination_name || '').toLowerCase();
        if (dest.includes('workshop') || dest.includes('repair') || dest.includes('perbaikan')) {
            return JENIS_PERGERAKAN_OPTIONS[3];
        }
        if (dest.includes('gudang') || dest.includes('basecamp') || dest.includes('wh')) {
            return JENIS_PERGERAKAN_OPTIONS[1];
        }
        return JENIS_PERGERAKAN_OPTIONS[0];
    });

    const [formData, setFormData] = useState({
        origin_name: trip?.origin_name || 'Gudang / Basecamp',
        destination_name: trip?.destination_name || '',
        destination_lat: trip?.destination_lat ?? '',
        destination_lng: trip?.destination_lng ?? '',
        pic_name: trip?.pic_name || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sinkronisasi data ketika modal dibuka
    useEffect(() => {
        if (trip) {
            setFormData({
                origin_name: trip.origin_name || 'Gudang / Basecamp',
                destination_name: trip.destination_name || '',
                destination_lat: trip.destination_lat ?? '',
                destination_lng: trip.destination_lng ?? '',
                pic_name: trip.pic_name || '',
            });
            const jenisId = trip.jenis_rute || trip.ip_gps;
            if (jenisId) {
                const found = JENIS_PERGERAKAN_OPTIONS.find(o => o.id === jenisId);
                if (found) setSelectedPergerakan(found);
            }
        }
    }, [trip]);

    // Sinkronisasi koordinat klik peta
    useEffect(() => {
        if (draftLocation) {
            setFormData(prev => ({
                ...prev,
                destination_lat: draftLocation.lat ? Number(draftLocation.lat).toFixed(6) : prev.destination_lat,
                destination_lng: draftLocation.lng ? Number(draftLocation.lng).toFixed(6) : prev.destination_lng
            }));
        }
    }, [draftLocation]);

    const handlePergerakanChange = (opt) => {
        setSelectedPergerakan(opt);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!trip?.id) return;

        setIsSubmitting(true);
        try {
            const payload = {
                origin_name: formData.origin_name,
                destination_name: formData.destination_name,
                destination_lat: formData.destination_lat ? parseFloat(formData.destination_lat) : null,
                destination_lng: formData.destination_lng ? parseFloat(formData.destination_lng) : null,
                pic_name: formData.pic_name,
                pic_phone: '-',
                jenis_rute: selectedPergerakan.id,
                ip_gps: selectedPergerakan.id,
                target_status: selectedPergerakan.target_status
            };

            // 👉 Menggunakan prefix aman /combat-api untuk Vercel
            const res = await axios.put(`/combat-api/trips/${trip.id}`, payload);
            
            const updatedData = {
                ...trip,
                ...payload,
                ip_gps: selectedPergerakan.id,
                jenis_rute: selectedPergerakan.id,
                ...(res.data?.data || {})
            };

            alert('Data penugasan dan rute berhasil diperbarui!');
            if (onSuccess) onSuccess(updatedData);
        } catch (err) {
            console.error('Gagal update trip:', err);
            alert(err.response?.data?.message || 'Gagal memperbarui penugasan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute top-4 right-4 z-[9999] w-88 flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right-6 duration-300 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        <Edit className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            Edit Rute & Penugasan
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono">
                            {trip?.combat?.asset_name || 'Unit COMBAT'}
                        </p>
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <form id="editFloatingForm" onSubmit={handleSubmit} className="p-4 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
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
                            value={formData.origin_name}
                            onChange={(e) => setFormData({...formData, origin_name: e.target.value})}
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 outline-none"
                        />
                    </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>Lokasi Tujuan Baru</span>
                        </label>
                        <span className="text-[9px] text-amber-500 font-medium">
                            (Klik peta untuk pin)
                        </span>
                    </div>

                    <input 
                        type="text"
                        required
                        placeholder="Nama Site / Kota Tujuan..."
                        value={formData.destination_name}
                        onChange={(e) => setFormData({...formData, destination_name: e.target.value})}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[9px] text-slate-400 mb-0.5">Latitude</label>
                            <input 
                                type="number"
                                step="any"
                                placeholder="Lat"
                                value={formData.destination_lat}
                                onChange={(e) => setFormData({...formData, destination_lat: e.target.value})}
                                className="w-full h-7 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[11px] font-mono outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] text-slate-400 mb-0.5">Longitude</label>
                            <input 
                                type="number"
                                step="any"
                                placeholder="Lng"
                                value={formData.destination_lng}
                                onChange={(e) => setFormData({...formData, destination_lng: e.target.value})}
                                className="w-full h-7 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[11px] font-mono outline-none"
                            />
                        </div>
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
                        value={formData.pic_name}
                        onChange={(e) => setFormData({...formData, pic_name: e.target.value})}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 outline-none"
                    />
                </div>
            </form>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    form="editFloatingForm"
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Simpan Perubahan</span>
                </button>
            </div>
        </div>
    );
}