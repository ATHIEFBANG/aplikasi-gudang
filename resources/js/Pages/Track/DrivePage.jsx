import React, { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Navigation, 
    CheckCircle2, 
    ShieldCheck, 
    RotateCcw, 
    Loader2, 
    Eye,
    Lock,
    AlertTriangle,
    MapPin, 
    Truck, 
    ArrowRight, 
    ExternalLink 
} from 'lucide-react';

import Map from '@/components/Map';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

// 👉 Import Logika (DriverTracker) & Tampilan Telemetri (DriverTelemetry)
import useDriverTracker, { calculateDistanceKm, getJenisPergerakanInfo } from './DriverTracker';
import DriverTelemetry from './DriverTelemetry';

const DRIVER_MAP_CONFIG = {
    'DRIVER': {
        label: 'Posisi Driver',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.35)',
    },
    'DESTINATION': {
        label: 'Tujuan Site',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.35)',
    }
};

export default function DrivePage({ trip }) {
    // 🧠 Panggil seluruh logika utama dari DriverTracker.jsx
    const {
        status,
        gpsError,
        isSubmitting,
        currentCoords,
        speedHistory,
        isAuthorizedDriver,
        startGpsWatcher,
        handleStartTrip,
        handleCompleteTrip
    } = useDriverTracker(trip);

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
        if (currentCoords?.latitude && currentCoords?.longitude) {
            list.push({
                id: 'driver',
                latitude: currentCoords.latitude,
                longitude: currentCoords.longitude,
                is_driver: true,
                status: 'DRIVER',
                title: isAuthorizedDriver ? 'Posisi Anda Saat Ini' : `Posisi Supir (${trip?.pic_name || 'Driver'})`
            });
        }
        return list;
    }, [trip?.destination_lat, trip?.destination_lng, trip?.destination_name, currentCoords, isAuthorizedDriver, trip?.pic_name]);

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
        if (currentCoords) return [currentCoords.longitude, currentCoords.latitude];
        if (trip?.destination_lng && trip?.destination_lat) return [parseFloat(trip.destination_lng), parseFloat(trip.destination_lat)];
        return [106.8456, -6.2088];
    }, [currentCoords, trip?.destination_lng, trip?.destination_lat]);

    const remainingDistanceKm = useMemo(() => {
        if (!currentCoords || !trip?.destination_lat || !trip?.destination_lng) return '-';
        return calculateDistanceKm(
            currentCoords.latitude,
            currentCoords.longitude,
            parseFloat(trip.destination_lat),
            parseFloat(trip.destination_lng)
        ) || '-';
    }, [currentCoords, trip?.destination_lat, trip?.destination_lng]);

    const googleMapsNavUrl = useMemo(() => {
        if (trip?.destination_lat && trip?.destination_lng) {
            return `https://www.google.com/maps/dir/?api=1&origin=${currentCoords ? `${currentCoords.latitude},${currentCoords.longitude}` : ''}&destination=${trip.destination_lat},${trip.destination_lng}&travelmode=driving`;
        }
        if (trip?.destination_name) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.destination_name)}`;
        }
        return '#';
    }, [trip?.destination_lat, trip?.destination_lng, trip?.destination_name, currentCoords]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between max-w-lg mx-auto border-x border-slate-800/80 shadow-2xl relative">
            <Head title={`Tracking Driver - ${combat.asset_name || 'COMBAT'}`} />

            {/* HEADER ATAS */}
            <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-md shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md shadow-red-600/20">
                        M
                    </div>
                    <div className="truncate">
                        <div className="flex items-center gap-1.5">
                            <h1 className="font-bold text-xs text-white truncate">{combat.asset_name || 'Unit COMBAT'}</h1>
                            <span className="text-[10px] text-slate-400 font-mono">({combat.sn || '-'})</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">Driver: <span className="text-slate-200 font-medium">{trip?.pic_name || 'PIC'}</span></p>
                    </div>
                </div>

                <div className="shrink-0">
                    {status === 'ASSIGNED' && (
                        <Button type="button" onClick={handleStartTrip} disabled={isSubmitting} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-2 h-auto rounded-xl shadow-md active:scale-95 gap-1.5 cursor-pointer">
                            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                            <span>Mulai</span>
                        </Button>
                    )}

                    {status === 'IN_TRANSIT' && isAuthorizedDriver && (
                        <Button type="button" onClick={handleCompleteTrip} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 h-auto rounded-xl shadow-md active:scale-95 gap-1.5 cursor-pointer">
                            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>Tiba di Lokasi</span>
                        </Button>
                    )}

                    {status === 'IN_TRANSIT' && !isAuthorizedDriver && (
                        <Badge variant="outline" className="bg-sky-500/10 border-sky-500/30 text-sky-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg gap-1">
                            <Eye className="w-3 h-3" />
                            <span>Mode Pantau</span>
                        </Badge>
                    )}

                    {status === 'COMPLETED' && (
                        <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2.5 py-1.5 rounded-lg gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Selesai</span>
                        </Badge>
                    )}
                </div>
            </header>

            {/* BANNER MODE PANTAU */}
            {status === 'IN_TRANSIT' && !isAuthorizedDriver && (
                <div className="bg-sky-950/80 border-b border-sky-800/80 px-4 py-2 flex items-center gap-2 text-sky-300 text-xs">
                    <Lock className="w-4 h-4 text-sky-400 shrink-0" />
                    <p className="leading-tight text-[11px]">
                        <strong>Mode Pantau Aktif:</strong> Posisi GPS driver utama ({trip?.pic_name}) ditampilkan secara live tanpa menyalakan GPS HP ini.
                    </p>
                </div>
            )}

            {/* PETA TENGAH */}
            <main className="w-full relative bg-slate-900 border-b border-slate-800 shrink-0">
                {gpsError && (
                    <div className="p-3 bg-slate-950">
                        <Alert className="bg-rose-950/95 border-rose-800 text-rose-300 py-2.5 px-3 rounded-xl shadow-xl flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs truncate">
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                <AlertDescription className="truncate font-medium">{gpsError}</AlertDescription>
                            </div>
                            {isAuthorizedDriver && (
                                <Button type="button" size="icon" onClick={startGpsWatcher} className="h-7 w-7 rounded bg-rose-800 hover:bg-rose-700 text-white shrink-0 ml-2 cursor-pointer">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </Button>
                            )}
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
                            title: item.title || (item.is_destination ? 'Lokasi Tujuan' : 'Posisi Driver'),
                            details: [
                                { label: 'Koordinat', value: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, isMonospace: true }
                            ],
                            statusText: item.status === 'DESTINATION' ? 'TUJUAN' : 'DRIVER'
                        })}
                    />
                </div>
            </main>

            {/* AREA BAWAH: TELEMETRI & KARTU RUTE LANGSUNG DI SINI */}
            <div className="flex-1 p-4 bg-slate-950 space-y-3.5 overflow-y-auto">
                <DriverTelemetry 
                    currentCoords={currentCoords}
                    remainingDistanceKm={remainingDistanceKm}
                    speedHistory={speedHistory}
                />

                {/* Kartu Informasi Rute & Navigasi */}
                <Card className="bg-slate-900 border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <CardContent className="p-3.5 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                    status === 'IN_TRANSIT' 
                                        ? (isAuthorizedDriver ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400 animate-pulse') 
                                        : 'bg-slate-500'
                                }`} />
                                <span className="text-xs font-bold text-slate-200">
                                    {status === 'IN_TRANSIT' 
                                        ? (isAuthorizedDriver ? 'GPS Pelacakan Aktif' : 'Memantau Live Posisi Driver') 
                                        : 'GPS Siap Transmisi'
                                    }
                                </span>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${jenisInfo?.badgeClass}`}>
                                {jenisInfo?.label}
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