import React from 'react';

// ==========================================
// 1. KONFIGURASI TILE & STYLE PETA
// ==========================================
export const MAP_STYLES = {
    dark: {
        name: 'Dark Mode',
        style: {
            version: 8,
            projection: { type: 'globe' },
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
            projection: { type: 'globe' },
            sources: {
                'esri-sat': {
                    type: 'raster',
                    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                    tileSize: 256,
                    maxzoom: 18,
                    attribution: '&copy; Esri World Imagery',
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
            projection: { type: 'globe' },
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
// 2. HELPER PARSER KOORDINAT UNIVERSAL
// ==========================================
export function parseCoordinates(item) {
    if (!item || typeof item !== 'object') return null;

    let lat = null;
    let lng = null;

    const latKeys = ['lat', 'latitude', 'Lat', 'LAT', 'lat_site', 'latitude_site'];
    const lngKeys = ['lng', 'long', 'longitude', 'Lng', 'Long', 'LONGITUDE', 'lng_site', 'long_site'];

    for (const k of latKeys) {
        if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
            lat = parseFloat(item[k]);
            break;
        }
    }
    for (const k of lngKeys) {
        if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
            lng = parseFloat(item[k]);
            break;
        }
    }

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
        const combinedKeys = ['longlat', 'latlong', 'coordinat', 'coordinates', 'location', 'koordinat', 'coord'];
        let rawVal = null;
        for (const k of Object.keys(item)) {
            const cleanKey = k.toLowerCase().replace(/[\s_]+/g, '');
            if (combinedKeys.includes(cleanKey)) {
                rawVal = item[k];
                if (rawVal) break;
            }
        }

        if (typeof rawVal === 'string' && rawVal.trim() && !rawVal.toUpperCase().includes('N/A')) {
            const parts = rawVal.trim().split(/[;,]/).map((p) => parseFloat(p.trim()));
            if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                let [p1, p2] = parts;
                if (p1 >= -11 && p1 <= 10 && p2 >= 90 && p2 <= 145) {
                    lat = p1; lng = p2;
                } else if (p2 >= -11 && p2 <= 10 && p1 >= 90 && p1 <= 145) {
                    lat = p2; lng = p1;
                } else {
                    lat = p1; lng = p2;
                }
            }
        }
    }

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return null;
    if (lat === 0 && lng === 0) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

    return { lng, lat, text: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
}

// ==========================================
// 3. KOMPONEN UI OVERLAY & CONTROLS UNIVERSAL
// ==========================================
export default function MapControls({
    currentStyle,
    onChangeStyle,
    onResetView,
    isClustered,
    onToggleCluster,
    noLocationCount,
    selectedStatus,
    onSelectStatus,
    statusCounts,
    statusConfig = {},
}) {
    return (
        <>
            {/* TOP BAR CONTROL */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                {/* Switcher Style Peta */}
                <div className="bg-slate-900/80 backdrop-blur-xl p-1 rounded-full border border-white/10 shadow-2xl flex gap-1">
                    {Object.keys(MAP_STYLES).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onChangeStyle(key)}
                            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                                currentStyle === key
                                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                            {MAP_STYLES[key].name}
                        </button>
                    ))}
                </div>

                {/* Tombol Globe (Reset View Indonesia) */}
                <button
                    type="button"
                    onClick={onResetView}
                    title="Zoom Out ke Peta Indonesia"
                    className="p-2 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/10 transition-all duration-200 shadow-2xl group"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 transition-transform group-hover:rotate-45"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7a2 2 0 00-2-2h-1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                {/* Toggle Cluster */}
                <button
                    type="button"
                    onClick={onToggleCluster}
                    title={isClustered ? "Matikan Clustering" : "Aktifkan Clustering"}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 flex items-center gap-1.5 shadow-2xl ${
                        isClustered
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                            : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-white/5'
                    }`}
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>{isClustered ? 'Cluster ON' : 'Cluster OFF'}</span>
                </button>
            </div>

            {/* BADGE DATA TANPA LOKASI */}
            {noLocationCount > 0 && (
                <div className="absolute top-4 right-14 z-10 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                    <span>{noLocationCount} Data Tanpa Lokasi (N/A)</span>
                </div>
            )}

            {/* BOTTOM BAR FILTER STATUS (DINAMIS DARI PROPS) */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl max-w-[calc(100vw-32px)] overflow-x-auto scrollbar-none">
                {/* Tombol ALL */}
                <button
                    type="button"
                    onClick={() => onSelectStatus('ALL')}
                    className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                        selectedStatus === 'ALL'
                            ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                >
                    <span>ALL</span>
                    <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-slate-950/60 text-slate-300">
                        {statusCounts.ALL || 0}
                    </span>
                </button>

                {/* Tombol Dinamis berdasarkan statusConfig */}
                {Object.entries(statusConfig).map(([key, cfg]) => {
                    const isSelected = selectedStatus === key;
                    const color = cfg.color || '#38bdf8';
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onSelectStatus(key)}
                            style={{
                                backgroundColor: isSelected ? `${color}20` : undefined,
                                borderColor: isSelected ? `${color}60` : undefined,
                                color: isSelected ? color : undefined,
                            }}
                            className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 border whitespace-nowrap ${
                                isSelected
                                    ? 'shadow-md'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                            <span>{cfg.label || key}</span>
                            <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-slate-950/60" style={{ color: color }}>
                                {statusCounts[key] || 0}
                            </span>
                        </button>
                    );
                })}

                {/* Tombol NA / Lainnya */}
                {(statusCounts.NA > 0 || selectedStatus === 'NA') && (
                    <button
                        type="button"
                        onClick={() => onSelectStatus('NA')}
                        className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                            selectedStatus === 'NA'
                                ? 'bg-slate-700/60 text-slate-200 border border-slate-500/50 shadow-md'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <span>#N/A</span>
                        <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-slate-950/60 text-slate-300">
                            {statusCounts.NA || 0}
                        </span>
                    </button>
                )}
            </div>
        </>
    );
}