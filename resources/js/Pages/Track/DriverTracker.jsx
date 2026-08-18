import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';

// Helper Rumus Haversine: Hitung sisa jarak lurus ke tujuan (dalam KM)
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
};

// Helper Pendeteksi Jenis Pergerakan
export const getJenisPergerakanInfo = (trip) => {
    if (!trip) {
        return { label: 'Mobilisasi Unit', badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }

    const jenisId = trip.jenis_rute || trip.ip_gps;
    if (jenisId === 'DEPLOY') return { label: 'Deploy (Gudang ke Site)', badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
    if (jenisId === 'PENARIKAN') return { label: 'Penarikan (Site ke Gudang)', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    if (jenisId === 'RELOKASI') return { label: 'Relokasi (Antar Site)', badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    if (jenisId === 'MAINTENANCE') return { label: 'Maintenance (Ke Workshop)', badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };

    const dest = (trip.destination_name || '').toLowerCase();
    if (dest.includes('workshop') || dest.includes('repair') || dest.includes('perbaikan')) return { label: 'Maintenance (Ke Workshop)', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    if (dest.includes('gudang') || dest.includes('basecamp') || dest.includes('wh')) return { label: 'Penarikan (Site ke Gudang)', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    return { label: 'Deploy (Gudang ke Site)', badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
};

// Helper Token Perangkat Unik
const getOrCreateDeviceToken = () => {
    if (typeof window === 'undefined') return null;
    let token = localStorage.getItem('combat_driver_device_token');
    if (!token) {
        token = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
        localStorage.setItem('combat_driver_device_token', token);
    }
    return token;
};

// 👉 CUSTOM HOOK LOGIKA UTAMA TRACKER
export default function useDriverTracker(trip) {
    const [status, setStatus] = useState(trip?.status || 'ASSIGNED');
    const [isGpsActive, setIsGpsActive] = useState(false);
    const [gpsError, setGpsError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastPingTime, setLastPingTime] = useState(null);

    // Titik awal supir (langsung terisi agar mode pantau tidak kosong)
    const [currentCoords, setCurrentCoords] = useState(() => {
        const latest = trip?.latest_coordinate || trip?.latestCoordinate;
        if (latest?.latitude && latest?.longitude) {
            return {
                latitude: parseFloat(latest.latitude),
                longitude: parseFloat(latest.longitude),
                speed: latest.speed ? String(latest.speed) : '0.0',
                accuracy: latest.accuracy ? parseInt(latest.accuracy) : 0,
            };
        }
        if (trip?.combat?.long_lat && trip.combat.long_lat.includes(';')) {
            const parts = trip.combat.long_lat.split(';');
            return {
                latitude: parseFloat(parts[0]),
                longitude: parseFloat(parts[1]),
                speed: '0.0',
                accuracy: 0,
            };
        }
        return null;
    });

    const [myDeviceToken] = useState(() => getOrCreateDeviceToken());
    const [lockedDeviceToken, setLockedDeviceToken] = useState(trip?.device_token || null);
    const [speedHistory, setSpeedHistory] = useState([{ time: 'Mulai', speed: 0 }]);

    const token = trip?.tracking_token;
    const watchIdRef = useRef(null);
    const wakeLockRef = useRef(null);
    const lastPingTimestampRef = useRef(0);
    const lastValidCoordRef = useRef(null);

    // Verifikasi identitas HP Driver Utama vs Mode Pantau
    const isAuthorizedDriver = useMemo(() => {
        if (status === 'ASSIGNED') return true;
        if (lockedDeviceToken) return lockedDeviceToken === myDeviceToken;
        return true;
    }, [status, lockedDeviceToken, myDeviceToken]);

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            } catch (err) {}
        }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release().then(() => {
                wakeLockRef.current = null;
            });
        }
    };

    // 1. PING GPS (Hanya jika Driver Utama)
    const sendGpsPing = useCallback(async (lat, lng, speed, accuracy) => {
        if (!isAuthorizedDriver) return;
        const now = Date.now();
        if (now - lastPingTimestampRef.current < 4000) return;
        lastPingTimestampRef.current = now;

        try {
            await axios.post(`/track-api/${token}/ping`, {
                latitude: lat,
                longitude: lng,
                speed: speed ? Number(speed) : 0,
                accuracy: accuracy ? Number(accuracy) : null,
                device_token: myDeviceToken
            });

            const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLastPingTime(timeStr);
            setGpsError(null);

            setSpeedHistory(prev => [...prev, { time: timeStr, speed: parseFloat(speed) || 0 }].slice(-15));
        } catch (err) {
            if (err.response?.status === 403) {
                setGpsError('Perangkat ini bukan driver utama. Masuk ke Mode Pantau.');
                stopGpsWatcher();
            }
        }
    }, [token, isAuthorizedDriver, myDeviceToken]);

    // 2. WATCHER SENSOR GPS HP
    const startGpsWatcher = useCallback(() => {
        if (!isAuthorizedDriver) return;
        if (!navigator.geolocation) {
            setGpsError('Browser HP kamu tidak mendukung fitur GPS.');
            return;
        }

        setIsGpsActive(true);
        setGpsError(null);
        requestWakeLock();

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, speed, accuracy } = position.coords;
                lastValidCoordRef.current = { latitude, longitude };
                setGpsError(null);

                const speedKmh = speed && speed > 0.5 ? (speed * 3.6).toFixed(1) : '0.0';
                setCurrentCoords({
                    latitude,
                    longitude,
                    speed: speedKmh,
                    accuracy: Math.round(accuracy || 0),
                });

                sendGpsPing(latitude, longitude, speedKmh, accuracy);
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    setGpsError('Izin GPS ditolak. Buka pengaturan browser HP dan izinkan akses lokasi.');
                } else {
                    setGpsError('Mencari sinyal satelit GPS...');
                }
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );
    }, [sendGpsPing, isAuthorizedDriver]);

    const stopGpsWatcher = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsGpsActive(false);
        releaseWakeLock();
    }, []);

    // 3. POLLING POSISI UNTUK MODE PANTAU (HP KEDUA)
    const fetchObserverLiveStatus = useCallback(async () => {
        try {
            const res = await axios.get(`/track-api/${token}/status`);
            const data = res.data;

            if (data.status) setStatus(data.status);
            if (data.device_token) setLockedDeviceToken(data.device_token);

            if (data.driver_coords) {
                setCurrentCoords({
                    latitude: data.driver_coords.latitude,
                    longitude: data.driver_coords.longitude,
                    speed: data.driver_coords.speed || '0.0',
                    accuracy: data.driver_coords.accuracy || 0,
                });

                if (data.driver_coords.recorded_at) setLastPingTime(data.driver_coords.recorded_at);

                setSpeedHistory(prev => [...prev, { 
                    time: data.driver_coords.recorded_at || 'Sync', 
                    speed: parseFloat(data.driver_coords.speed) || 0 
                }].slice(-15));
            }
        } catch (err) {
            console.error("Gagal menarik data live driver:", err);
        }
    }, [token]);

    useEffect(() => {
        if (status === 'IN_TRANSIT') {
            if (isAuthorizedDriver) {
                startGpsWatcher();
            } else {
                fetchObserverLiveStatus();
                const pollInterval = setInterval(fetchObserverLiveStatus, 4000);
                return () => clearInterval(pollInterval);
            }
        }
        return () => stopGpsWatcher();
    }, [status, isAuthorizedDriver, startGpsWatcher, stopGpsWatcher, fetchObserverLiveStatus]);

    // 4. ACTION HANDLERS: MULAI & SELESAI
    const handleStartTrip = async () => {
        setIsSubmitting(true);
        try {
            await axios.post(`/track-api/${token}/start`, { device_token: myDeviceToken });
            setStatus('IN_TRANSIT');
            setLockedDeviceToken(myDeviceToken);
            startGpsWatcher();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memulai perjalanan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteTrip = () => {
        if (!confirm('Apakah unit COMBAT sudah tiba di lokasi tujuan dengan aman?')) return;

        const executeComplete = async (lat, lng) => {
            stopGpsWatcher();
            setStatus('COMPLETED');
            setIsSubmitting(false);

            try {
                await axios.post(`/track-api/${token}/complete`, {
                    final_latitude: lat,
                    final_longitude: lng,
                    device_token: myDeviceToken
                });
            } catch (err) {
                console.error('Gagal sinkronisasi trip ke server:', err);
            }
        };

        if (currentCoords?.latitude && currentCoords?.longitude) {
            executeComplete(currentCoords.latitude, currentCoords.longitude);
        } else if (lastValidCoordRef.current?.latitude) {
            executeComplete(lastValidCoordRef.current.latitude, lastValidCoordRef.current.longitude);
        } else {
            setIsSubmitting(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => executeComplete(pos.coords.latitude, pos.coords.longitude),
                () => {
                    setIsSubmitting(false);
                    alert('GPS belum mengunci posisi. Pastikan izin lokasi browser HP aktif.');
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    };

    return {
        status,
        isGpsActive,
        gpsError,
        isSubmitting,
        currentCoords,
        speedHistory,
        isAuthorizedDriver,
        startGpsWatcher,
        handleStartTrip,
        handleCompleteTrip
    };
}