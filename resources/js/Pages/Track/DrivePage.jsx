import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { 
    Navigation, 
    CheckCircle2, 
    MapPin, 
    Truck, 
    AlertTriangle, 
    ShieldCheck, 
    RotateCcw, 
    Loader2, 
    ExternalLink, 
    Gauge, 
    ArrowRight, 
    Activity, 
    Compass, 
    TrendingUp 
} from 'lucide-react';

import Map from '@/components/Map';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';

const DRIVER_MAP_CONFIG = {
    'DRIVER': {
        label: 'Posisi Anda',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.35)',
    },
    'DESTINATION': {
        label: 'Tujuan Site',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.35)',
    }
};

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
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

const getJenisPergerakanInfo = (trip) => {
    if (!trip) {
        return { label: 'Mobilisasi Unit', badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }

    const jenisId = trip.jenis_rute || trip.ip_gps;
    if (jenisId === 'DEPLOY') {
        return { label: 'Deploy (Gudang ke Site)', badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
    }
    if (jenisId === 'PENARIKAN') {
        return { label: 'Penarikan (Site ke Gudang)', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    }
    if (jenisId === 'RELOKASI') {
        return { label: 'Relokasi (Antar Site)', badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    }
    if (jenisId === 'MAINTENANCE') {
        return { label: 'Maintenance (Ke Workshop)', badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    }

    const dest = (trip.destination_name || '').toLowerCase();
    if (dest.includes('workshop') || dest.includes('repair') || dest.includes('perbaikan')) {
        return { label: 'Maintenance (Ke Workshop)', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    }
    if (dest.includes('gudang') || dest.includes('basecamp') || dest.includes('wh')) {
        return { label: 'Penarikan (Site ke Gudang)', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
    return { label: 'Deploy (Gudang ke Site)', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
};

export default function DriverPage({ trip }) {
    const [status, setStatus] = useState(trip?.status || 'ASSIGNED');
    const [isGpsActive, setIsGpsActive] = useState(false);
    const [gpsError, setGpsError] = useState(null);
    const [currentCoords, setCurrentCoords] = useState(null);
    const [lastPingTime, setLastPingTime] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [speedHistory, setSpeedHistory] = useState([
        { time: 'Mulai', speed: 0 }
    ]);

    const token = trip?.tracking_token;
    const watchIdRef = useRef(null);
    const wakeLockRef = useRef(null);
    const lastPingTimestampRef = useRef(0);
    const lastValidCoordRef = useRef(null);

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.warn('WakeLock tidak didukung atau ditolak:', err);
            }
        }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release().then(() => {
                wakeLockRef.current = null;
            });
        }
    };

    // 👉 Menggunakan prefix /track-api untuk Vercel
    const sendGpsPing = useCallback(async (lat, lng, speed, accuracy) => {
        const now = Date.now();
        if (now - lastPingTimestampRef.current < 4000) return;
        lastPingTimestampRef.current = now;

        try {
            await axios.post(`/track-api/${token}/ping`, {
                latitude: lat,
                longitude: lng,
                speed: speed ? Number(speed) : 0,
                accuracy: accuracy ? Number(accuracy) : null,
            });

            const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLastPingTime(timeStr);
            setGpsError(null);

            setSpeedHistory(prev => {
                const next = [...prev, { time: timeStr, speed: parseFloat(speed) || 0 }];
                return next.slice(-15);
            });
        } catch (err) {
            console.error('Gagal mengirim koordinat:', err);
        }
    }, [token]);

    const startGpsWatcher = useCallback(() => {
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
                const accuracyValue = Math.round(accuracy || 0);

                lastValidCoordRef.current = { latitude, longitude };
                setGpsError(null);

                const speedKmh = speed && speed > 0.5 ? (speed * 3.6).toFixed(1) : '0.0';

                setCurrentCoords({
                    latitude,
                    longitude,
                    speed: speedKmh,
                    accuracy: accuracyValue,
                });

                sendGpsPing(latitude, longitude, speedKmh, accuracy);
            },
            (error) => {
                console.error('Error Geolocation:', error);
                if (error.code === error.PERMISSION_DENIED) {
                    setGpsError('Izin GPS ditolak. Buka pengaturan browser HP dan izinkan akses lokasi.');
                } else {
                    setGpsError('Mencari sinyal satelit GPS...');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 1000,
            }
        );
    }, [sendGpsPing]);

    const stopGpsWatcher = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsGpsActive(false);
        releaseWakeLock();
    }, []);

    useEffect(() => {
        if (status === 'IN_TRANSIT') {
            startGpsWatcher();
        }
        return () => stopGpsWatcher();
    }, [status, startGpsWatcher, stopGpsWatcher]);

    // 👉 Menggunakan prefix /track-api untuk Vercel
    const handleStartTrip = async () => {
        setIsSubmitting(true);
        try {
            await axios.post(`/track-api/${token}/start`);
            setStatus('IN_TRANSIT');
            startGpsWatcher();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memulai perjalanan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 👉 Menggunakan prefix /track-api untuk Vercel
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
                (pos) => {
                    executeComplete(pos.coords.latitude, pos.coords.longitude);
                },
                () => {
                    setIsSubmitting(false);
                    alert('GPS belum mengunci posisi. Pastikan izin lokasi browser HP aktif.');
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    };

    const combat = trip?.combat || {};
    const jenisInfo = useMemo(() => getJenisPergerakanInfo(trip), [trip]);

    const mapMarkers = useMemo(() => {
        const list = [];
        if (trip?.destination_lat && trip?.destination_lng) {
            list.push({
                id: 'destination',
                latitude: parseFloat(trip.destination_lat),
                longitude: parseFloat(trip.destination_lng),
                is_destination: true,
                status: 'DESTINATION',
                title: `Tujuan: ${trip.destination_name}`
            });
        }
        if (currentCoords) {
            list.push({
                id: 'driver',
                latitude: currentCoords.latitude,
                longitude: currentCoords.longitude,
                is_origin: true,
                status: 'DRIVER',
                title: 'Posisi Anda Saat Ini'
            });
        }
        return list;
    }, [trip?.destination_lat, trip?.destination_lng, trip?.destination_name, currentCoords]);

    const activeRouteHistory = useMemo(() => {
        if (currentCoords?.latitude && currentCoords?.longitude && trip?.destination_lat && trip?.destination_lng) {
            return [
                [currentCoords.longitude, currentCoords.latitude],
                [parseFloat(trip.destination_lng), parseFloat(trip.destination_lat)]
            ];
        }
        return [];
    }, [currentCoords, trip?.destination_lat, trip?.destination_lng]);

    const mapInitialCenter = useMemo(() => {
        if (currentCoords) {
            return [currentCoords.longitude, currentCoords.latitude];
        }
        if (trip?.destination_lng && trip?.destination_lat) {
            return [parseFloat(trip.destination_lng), parseFloat(trip.destination_lat)];
        }
        return [106.8456, -6.2088];
    }, [currentCoords, trip?.destination_lng, trip?.destination_lat]);

    const remainingDistanceKm = useMemo(() => {
        if (!currentCoords || !trip?.destination_lat || !trip?.destination_lng) return '-';
        const distKm = calculateDistanceKm(
            currentCoords.latitude,
            currentCoords.longitude,
            parseFloat(trip.destination_lat),
            parseFloat(trip.destination_lng)
        );
        return distKm || '-';
    }, [currentCoords, trip?.destination_lat, trip?.destination_lng]);

    const googleMapsNavUrl = useMemo(() => {
        if (trip?.destination_lat && trip?.destination_lng) {
            return `https://www.google.com/maps/dir/?api=1&origin=${currentCoords ? `${currentCoords.latitude},${currentCoords.longitude}` : ''}&destination=${trip.destination_lat},${trip.destination_lng}&travelmode=driving`;
        }
        if (trip?.destination_name) {
            return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.destination_name)}`;
        }
        return '#';
    }, [trip?.destination_lat, trip?.destination_lng, trip?.destination_name, currentCoords]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between max-w-lg mx-auto border-x border-slate-800/80 shadow-2xl relative">
            <Head title={`Tracking Driver - ${combat.asset_name || 'COMBAT'}`} />

            <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-md shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md shadow-red-600/20">
                        M
                    </div>
                    <div className="truncate">
                        <div className="flex items-center gap-1.5">
                            <h1 className="font-bold text-xs text-white truncate">
                                {combat.asset_name || 'Unit COMBAT'}
                            </h1>
                            <span className="text-[10px] text-slate-400 font-mono">
                                ({combat.sn || '-'})
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                            Driver: <span className="text-slate-200 font-medium">{trip?.pic_name || 'PIC'}</span>
                        </p>
                    </div>
                </div>

                <div className="shrink-0">
                    {status === 'ASSIGNED' && (
                        <Button
                            type="button"
                            onClick={handleStartTrip}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-2 h-auto rounded-xl shadow-md shadow-red-600/20 active:scale-95 transition-all gap-1.5 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Navigation className="w-3.5 h-3.5" />
                            )}
                            <span>Mulai</span>
                        </Button>
                    )}

                    {status === 'IN_TRANSIT' && (
                        <Button
                            type="button"
                            onClick={handleCompleteTrip}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 h-auto rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all gap-1.5 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Tiba di Lokasi</span>
                        </Button>
                    )}

                    {status === 'COMPLETED' && (
                        <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2.5 py-1.5 rounded-lg gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Selesai</span>
                        </Badge>
                    )}
                </div>
            </header>

            <main className="w-full relative bg-slate-900 border-b border-slate-800 shrink-0">
                {gpsError && (
                    <div className="p-3 bg-slate-950">
                        <Alert className="bg-rose-950/95 border-rose-800 text-rose-300 py-2.5 px-3 rounded-xl shadow-xl flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs truncate">
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                <AlertDescription className="truncate font-medium">{gpsError}</AlertDescription>
                            </div>
                            <Button 
                                type="button" 
                                size="icon" 
                                onClick={startGpsWatcher} 
                                className="h-7 w-7 rounded bg-rose-800 hover:bg-rose-700 text-white shrink-0 ml-2 cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                        </Alert>
                    </div>
                )}

                <div className="w-full h-[330px]">
                    <Map 
                        data={mapMarkers}
                        trackHistory={activeRouteHistory}
                        center={mapInitialCenter}
                        zoom={13}
                        height="h-[330px]"
                        showControls={false}
                        statusKey={(item) => item.status || 'DRIVER'}
                        statusConfig={DRIVER_MAP_CONFIG}
                        getPopupData={(item, lat, lng) => ({
                            title: item.title || (item.is_destination ? 'Lokasi Tujuan' : 'Posisi Anda'),
                            details: [
                                { label: 'Koordinat', value: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, isMonospace: true }
                            ],
                            statusText: item.status === 'DESTINATION' ? 'TUJUAN' : 'DRIVER'
                        })}
                    />
                </div>
            </main>

            <div className="flex-1 p-4 bg-slate-950 space-y-3.5 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2">
                    <Card className="bg-slate-900 border-slate-800 rounded-xl p-3 shadow-sm">
                        <CardContent className="p-0 flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-[10px] uppercase font-semibold">Kecepatan</span>
                                <Gauge className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <div className="mt-1">
                                <span className="text-xl font-black font-mono text-slate-100">
                                    {currentCoords?.speed || '0.0'}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-1">km/h</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 rounded-xl p-3 shadow-sm">
                        <CardContent className="p-0 flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-[10px] uppercase font-semibold">Sisa Jarak</span>
                                <Compass className="w-3.5 h-3.5 text-sky-400" />
                            </div>
                            <div className="mt-1">
                                <span className="text-xl font-black font-mono text-sky-400">
                                    {remainingDistanceKm}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-1">km</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 rounded-xl p-3 shadow-sm">
                        <CardContent className="p-0 flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="text-[10px] uppercase font-semibold">Akurasi</span>
                                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div className="mt-1">
                                <span className="text-xl font-black font-mono text-emerald-400">
                                    ±{currentCoords?.accuracy || 0}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-1">m</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-slate-900 border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                            <CardTitle className="text-xs font-bold text-slate-200">
                                Grafik Kecepatan Berkendara (km/h)
                            </CardTitle>
                        </div>
                        <Badge variant="outline" className="bg-slate-950 border-slate-800 text-[10px] text-slate-400 font-mono px-2 py-0.5">
                            Live Telemetri
                        </Badge>
                    </CardHeader>

                    <CardContent className="p-3.5 pt-2">
                        <div className="w-full h-28">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={speedHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="speedColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
                                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} domain={[0, 'auto']} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
                                        formatter={(value) => [`${value} km/h`, 'Kecepatan']}
                                    />
                                    <Area type="monotone" dataKey="speed" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#speedColor)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <CardContent className="p-3.5 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${status === 'IN_TRANSIT' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                                <span className="text-xs font-bold text-slate-200">
                                    {status === 'IN_TRANSIT' ? 'GPS Pelacakan Aktif' : 'GPS Siap Transmisi'}
                                </span>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${jenisInfo.badgeClass}`}>
                                {jenisInfo.label}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs py-1">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="text-slate-400 truncate">{trip?.origin_name || 'Gudang / Basecamp'}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                                <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="font-bold text-emerald-400 truncate">{trip?.destination_name || 'Lokasi Tujuan'}</span>
                            </div>
                        </div>

                        <Button 
                            asChild 
                            className="w-full py-2.5 h-auto bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 active:scale-98 transition-all cursor-pointer"
                        >
                            <a
                                href={googleMapsNavUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Buka Navigasi di Google Maps</span>
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}