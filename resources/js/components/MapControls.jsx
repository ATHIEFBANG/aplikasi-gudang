import React from 'react';

export const MAP_STYLES = {
    dark: {
        name: 'Dark Mode',
        style: {
            version: 8,
            sources: {
                'carto-dark': {
                    type: 'raster',
                    tiles: [
                        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                    ],
                    tileSize: 256,
                    maxzoom: 19,
                    attribution: '&copy; CARTO',
                },
            },
            layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }],
        },
    },
    satellite: {
        name: 'Satelit',
        style: {
            version: 8,
            sources: {
                'esri-sat': {
                    type: 'raster',
                    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                    tileSize: 256,
                    maxzoom: 18,
                    attribution: '&copy; Esri',
                },
                'esri-labels': {
                    type: 'raster',
                    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
                    tileSize: 256,
                    maxzoom: 18,
                    attribution: '&copy; Esri',
                },
            },
            layers: [
                { id: 'esri-sat-layer', type: 'raster', source: 'esri-sat' },
                { id: 'esri-labels-layer', type: 'raster', source: 'esri-labels' },
            ],
        },
    },
    streets: {
        name: 'Streets',
        style: {
            version: 8,
            sources: {
                'osm-tiles': {
                    type: 'raster',
                    tiles: [
                        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    ],
                    tileSize: 256,
                    maxzoom: 19,
                    attribution: '&copy; OpenStreetMap',
                },
            },
            layers: [{ id: 'osm-layer', type: 'raster', source: 'osm-tiles' }],
        },
    },
};

export const DEFAULT_INDONESIA_CENTER = [117.8888, -2.4833];
export const DEFAULT_INDONESIA_ZOOM = 4.5;

// ==========================================
// PARSER KOORDINAT UNIVERSAL (DENGAN SUPPORT "Long Lat" EXCEL & SEMICOLON)
// ==========================================
export function parseCoordinates(item) {
    if (!item) return null;

    // A. Handled jika item adalah Array langsung [lng, lat]
    if (Array.isArray(item) && item.length >= 2) {
        const p1 = parseFloat(item[0]);
        const p2 = parseFloat(item[1]);
        if (!isNaN(p1) && !isNaN(p2) && !(p1 === 0 && p2 === 0)) {
            if (Math.abs(p1) <= 90 && Math.abs(p2) <= 180 && (Math.abs(p2) > 90 || Math.abs(p1) < Math.abs(p2))) {
                return { lng: p2, lat: p1, text: `${p1.toFixed(5)}, ${p2.toFixed(5)}` };
            }
            return { lng: p1, lat: p2, text: `${p2.toFixed(5)}, ${p1.toFixed(5)}` };
        }
    }

    if (typeof item !== 'object') return null;

    // B. Cari key gabungan dari header Excel (seperti "Long Lat", "long_lat", dll)
    let combined = null;
    const possibleKeys = [
        'Long Lat', 'Long Lat ', 'long lat', 'LONG LAT',
        'Long_Lat', 'long_lat', 'LONG_LAT',
        'Lat Long', 'Lat Long ', 'lat long', 'LAT LONG',
        'lat_long', 'latlong', 'coordinat', 'coordinates', 'location'
    ];

    for (const k of possibleKeys) {
        if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
            combined = String(item[k]).trim();
            break;
        }
    }

    // C. Jika tidak ada string gabungan, coba properti lat / lng terpisah
    if (!combined) {
        let lat = parseFloat(item.latitude ?? item.lat ?? item.Lat ?? item.LAT);
        let lng = parseFloat(item.longitude ?? item.lng ?? item.Long ?? item.LONGITUDE);

        if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lng, lat, text: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
        }
        return null;
    }

    // D. Abaikan data rusak (#N/A atau Tanggal seperti 26-Jun, 04-Jul)
    if (combined.includes('#N/A') || combined.includes('N/A') || combined.toUpperCase() === 'NA') {
        return null;
    }
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    if (months.some((m) => combined.toUpperCase().includes(m))) {
        return null;
    }

    // E. Pecah string berdasarkan separator (; , spasi /)
    const parts = combined
        .split(/[\s,;/]+/)
        .map((p) => parseFloat(p.replace(',', '.').trim()))
        .filter((n) => !isNaN(n));

    if (parts.length >= 2) {
        let p1 = parts[0];
        let p2 = parts[1];

        let latVal = p1;
        let lngVal = p2;

        // Otomatis menukar jika p1 adalah Longitude Indonesia (~100 s/d 140)
        if (Math.abs(p1) > 50 && Math.abs(p2) <= 90) {
            lngVal = p1;
            latVal = p2;
        } else if (Math.abs(p2) > 50 && Math.abs(p1) <= 90) {
            latVal = p1;
            lngVal = p2;
        }

        if (latVal >= -90 && latVal <= 90 && lngVal >= -180 && lngVal <= 180 && !(latVal === 0 && lngVal === 0)) {
            return { lng: lngVal, lat: latVal, text: `${latVal.toFixed(5)}, ${lngVal.toFixed(5)}` };
        }
    }

    return null;
}

export default function MapControls({
    currentStyle = 'dark',
    onChangeStyle,
    onResetView,
    isClustered = true,
    onToggleCluster,
    selectedStatus = 'ALL',
    onSelectStatus,
    statusCounts = {},
    statusConfig = {},
}) {
    return (
        <>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* CONTROL ATAS (MAP STYLE, RESET ZOOM, CLUSTER) */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 max-w-[calc(100vw-80px)] flex-wrap">
                <div className="bg-slate-900/80 backdrop-blur-xl p-1 rounded-full border border-white/10 shadow-2xl flex gap-1">
                    {Object.keys(MAP_STYLES).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onChangeStyle && onChangeStyle(key)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                                currentStyle === key
                                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                            {MAP_STYLES[key].name}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={onResetView}
                    title="Zoom Out ke Peta Indonesia"
                    className="p-2 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/10 transition-all duration-200 shadow-2xl group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7a2 2 0 00-2-2h-1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                <button
                    type="button"
                    onClick={onToggleCluster}
                    title={isClustered ? "Matikan Clustering" : "Aktifkan Clustering"}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-200 flex items-center gap-1.5 shadow-2xl ${
                        isClustered
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                            : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-white/5'
                    }`}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>{isClustered ? 'Cluster ON' : 'Cluster OFF'}</span>
                </button>
            </div>

            {/* STATUS BAR BAWAH */}
            {Object.keys(statusConfig).length > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 max-w-[90vw] overflow-x-auto no-scrollbar py-1 px-2">
                    {Object.entries(statusConfig).map(([key, cfg]) => {
                        const count = statusCounts[key] || 0;
                        const isSelected = selectedStatus === key;
                        const color = cfg.color || '#3b82f6';

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onSelectStatus && onSelectStatus(isSelected ? 'ALL' : key)}
                                style={{
                                    backgroundColor: isSelected ? cfg.bg || 'rgba(59,130,246,0.3)' : 'rgba(15, 23, 42, 0.85)',
                                    borderColor: isSelected ? color : 'rgba(255, 255, 255, 0.1)',
                                    color: isSelected ? '#ffffff' : '#94a3b8',
                                }}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-xl transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                            >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <span>{cfg.label || key}</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[10px] text-white/90">
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </>
    );
}