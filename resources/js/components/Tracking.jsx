import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * Komponen Universal Tracking GPS untuk HP PIC
 * Props:
 * - trip: Data objek tugas aktif (id, status, origin_name, destination_name, dll)
 * - combatList: Array daftar master COMBAT (opsional, untuk opsi Self-Start jika trip null)
 * - onTripUpdated: Callback function untuk merefresh data utama jika status berubah
 */
export default function Tracking({ trip, combatList = [], onTripUpdated }) {
    const [isTracking, setIsTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);

    // State Form Self-Dispatch (Jika trip null)
    const [selectedCombatId, setSelectedCombatId] = useState('');
    const [destinationName, setDestinationName] = useState('');
    const [originName, setOriginName] = useState('');

    const watchIdRef = useRef(null);

    useEffect(() => {
        // Jika tugas sedang berjalan (IN_TRANSIT), otomatis jalankan GPS Tracking
        if (trip && trip.status === 'IN_TRANSIT') {
            startGpsTracking(trip.id);
        } else {
            stopGpsTracking();
        }

        return () => stopGpsTracking();
    }, [trip]);

    // 1. Mengirim Lokasi ke Server Laravel
    const sendGpsPing = (tripId, lat, lng, speed) => {
        axios.post(`/api/trips/${tripId}/ping`, {
            latitude: lat,
            longitude: lng,
            speed: speed || 0
        })
        .then(() => setStatusMessage(`Ping OK (${new Date().toLocaleTimeString('id-ID')})`))
        .catch(() => setStatusMessage('Gagal terhubung ke server.'));
    };

    // 2. Menyalakan Tracking GPS HP (Menggunakan watchPosition agar akurat & efisien)
    const startGpsTracking = (tripId) => {
        if (!("geolocation" in navigator)) {
            alert("Browser HP tidak mendukung GPS.");
            return;
        }

        setIsTracking(true);
        setStatusMessage("Mencari sinyal GPS HP...");

        // Gunakan watchPosition bawaan browser HP
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, speed } = position.coords;
                const speedKmh = speed ? (speed * 3.6).toFixed(1) : 0; // konversi m/s ke km/h

                setCurrentLocation({ latitude, longitude, speed: speedKmh });
                sendGpsPing(tripId, latitude, longitude, speedKmh);
            },
            (err) => setStatusMessage("Sinyal GPS lemah / Izin lokasi ditolak."),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
    };

    const stopGpsTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
    };

    // 3. Action Tombol "Mulai Perjalanan" (Tugas dari Admin)
    const handleStart = async () => {
        setLoadingAction(true);
        try {
            await axios.post(`/api/trips/${trip.id}/start`);
            if (onTripUpdated) onTripUpdated();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memulai perjalanan.');
        } finally {
            setLoadingAction(false);
        }
    };

    // 4. Action "Mulai Perjalanan Mandiri" (Self-Dispatch jika trip belum di-assign)
    const handleSelfStart = async (e) => {
        e.preventDefault();
        if (!selectedCombatId || !destinationName) {
            alert('Pilih unit COMBAT dan nama lokasi tujuan!');
            return;
        }

        setLoadingAction(true);
        try {
            await axios.post('/api/trips/self-start', {
                combat_master_id: selectedCombatId,
                origin_name: originName || 'Gudang / Basecamp',
                destination_name: destinationName,
            });
            if (onTripUpdated) onTripUpdated();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal membuat perjalanan mandiri.');
        } finally {
            setLoadingAction(false);
        }
    };

    // 5. Action Tombol "Sampai di Lokasi"
    const handleComplete = async () => {
        if (!confirm('Apakah kamu sudah sampai di lokasi tujuan?')) return;

        setLoadingAction(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    await axios.post(`/api/trips/${trip.id}/complete`, {
                        final_latitude: pos.coords.latitude,
                        final_longitude: pos.coords.longitude
                    });
                    stopGpsTracking();
                    alert('Lokasi COMBAT telah diperbarui dan tugas selesai!');
                    if (onTripUpdated) onTripUpdated();
                } catch (err) {
                    alert(err.response?.data?.message || 'Gagal menyelesaikan tugas.');
                } finally {
                    setLoadingAction(false);
                }
            },
            () => {
                setLoadingAction(false);
                alert('Pastikan izin lokasi / GPS HP kamu sudah di-aktifkan!');
            },
            { enableHighAccuracy: true }
        );
    };

    // TAMPILAN JIKA TIDAK ADA TUGAS AKTIF (Form Self-Start)
    if (!trip) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-800 text-sm">Mulai Perjalanan Mandiri</h3>
                    <p className="text-[11px] text-slate-500">Belum ada tugas dari Admin? Buat perjalanan mandiri di sini.</p>
                </div>

                <form onSubmit={handleSelfStart} className="space-y-2.5 text-xs">
                    <div>
                        <label className="block font-medium text-slate-600 mb-1">Pilih Unit COMBAT</label>
                        <select
                            value={selectedCombatId}
                            onChange={(e) => setSelectedCombatId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50"
                            required
                        >
                            <option value="">-- Pilih Unit --</option>
                            {combatList.map((c) => (
                                <option key={c.id} value={c.id}>{c.asset_name || c.nama_site}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium text-slate-600 mb-1">Lokasi Tujuan</label>
                        <input
                            type="text"
                            placeholder="Contoh: Site Telkomsel BSD"
                            value={destinationName}
                            onChange={(e) => setDestinationName(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loadingAction}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs shadow transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loadingAction ? 'Memproses...' : '🚀 Mulai Perjalanan Mandiri'}
                    </button>
                </form>
            </div>
        );
    }

    // TAMPILAN JIKA ADA TUGAS AKTIF (ASSIGNED / IN_TRANSIT)
    return (
        <div className="bg-white p-4 rounded-xl shadow-md border space-y-3">
            {/* Header Info */}
            <div className="flex justify-between items-center border-b pb-2">
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm">
                        {trip.combat?.asset_name || trip.combat?.nama_site || 'Unit COMBAT'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                        Tujuan: <strong>{trip.destination_name}</strong>
                    </span>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                    trip.status === 'IN_TRANSIT' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-purple-100 text-purple-700'
                }`}>
                    {trip.status}
                </span>
            </div>

            {/* Status Radar GPS */}
            {isTracking && (
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-xs flex justify-between items-center border border-emerald-200">
                    <span className="flex items-center gap-1.5 font-semibold">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                        GPS HP Aktif
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono">{statusMessage}</span>
                </div>
            )}

            {/* Tombol Kontrol */}
            <div>
                {trip.status === 'ASSIGNED' && (
                    <button
                        onClick={handleStart}
                        disabled={loadingAction}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs shadow transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loadingAction ? 'Memproses...' : '🚀 Mulai Perjalanan'}
                    </button>
                )}

                {trip.status === 'IN_TRANSIT' && (
                    <button
                        onClick={handleComplete}
                        disabled={loadingAction}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-lg text-xs shadow transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loadingAction ? 'Memproses...' : '📍 Tiba di Lokasi / Onsite'}
                    </button>
                )}
            </div>
        </div>
    );
}