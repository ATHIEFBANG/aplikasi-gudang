import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import MapControls, { MAP_STYLES, DEFAULT_INDONESIA_CENTER, DEFAULT_INDONESIA_ZOOM, parseCoordinates } from './MapControls';

// 1. Default Status Config Netral
const DEFAULT_STATUS_CONFIG = {
    ACTIVE: {
        label: 'ACTIVE',
        color: '#38bdf8',
        bg: 'rgba(14,165,233,0.35)',
        badgeBg: 'rgba(14,165,233,0.15)',
        badgeBorder: 'rgba(14,165,233,0.3)',
    },
    INACTIVE: {
        label: 'INACTIVE',
        color: '#fbbf24',
        bg: 'rgba(245,158,11,0.35)',
        badgeBg: 'rgba(245,158,11,0.15)',
        badgeBorder: 'rgba(245,158,11,0.3)',
    },
};

// 2. Default Popup Renderer Netral
const DEFAULT_POPUP_RENDERER = (item, lat, lng) => {
    const title = item.name || item.site_name || item.title || 'Location Detail';
    const id = item.id || item.code || item.site_id || '-';
    const statusText = item.status || item.state || 'N/A';

    return {
        title: title,
        details: [
            { label: 'ID / Code', value: id },
            { label: 'Coordinates', value: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, isMonospace: true },
        ],
        statusText: statusText,
    };
};

export default function Map({ 
    data = [], 
    center = DEFAULT_INDONESIA_CENTER, 
    zoom = 4.5,
    height = "h-[600px]",
    statusKey = 'status',
    statusConfig = DEFAULT_STATUS_CONFIG,
    getPopupData = DEFAULT_POPUP_RENDERER
}) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);
    const hasInitialFitted = useRef(false);

    const [currentStyle, setCurrentStyle] = useState('dark');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [isClustered, setIsClustered] = useState(true);

    // Custom Transparent Popup Style
    useEffect(() => {
        const styleId = 'maplibre-custom-transparent-popup-style';
        if (!document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.innerHTML = `
                .custom-dark-popup .maplibregl-popup-content {
                    background: transparent !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                }
                .custom-dark-popup .maplibregl-popup-tip {
                    border-top-color: rgba(15, 23, 42, 0.95) !important;
                    border-bottom-color: rgba(15, 23, 42, 0.95) !important;
                }
            `;
            document.head.appendChild(styleEl);
        }
    }, []);

    const rawList = useMemo(() => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        return [];
    }, [data]);

    // Extract status string from item
    const getItemStatus = useCallback((item) => {
        if (typeof statusKey === 'function') return statusKey(item);
        const val = item[statusKey] || item.status || item.status_aktifitas;
        return val ? String(val).toUpperCase().trim() : 'N/A';
    }, [statusKey]);

    // Calculate Status Counts
    const { statusCounts, noLocationCount } = useMemo(() => {
        const counts = { ALL: 0 };
        Object.keys(statusConfig).forEach((k) => { counts[k] = 0; });
        let noLoc = 0;

        const naKey = Object.keys(statusConfig).find(k => 
            ['#N/A', 'N/A', 'NA', 'NO_LOCATION'].includes(k.trim().toUpperCase())
        ) || '#N/A';

        rawList.forEach((item) => {
            counts.ALL++;
            const coord = parseCoordinates(item);
            const st = getItemStatus(item);

            if (!coord) noLoc++;

            // Jika LongLat TIDAK ADA/N/A ATAU status bernilai N/A/kosong -> Masukkan ke count #N/A
            if (!coord || st === 'N/A' || st === '#N/A' || st === '' || !statusConfig[st]) {
                if (counts[naKey] !== undefined) {
                    counts[naKey] = counts[naKey] + 1;
                } else {
                    counts['#N/A'] = (counts['#N/A'] || 0) + 1;
                }
            } else {
                counts[st] = (counts[st] || 0) + 1;
            }
        });

        return { statusCounts: counts, noLocationCount: noLoc };
    }, [rawList, statusConfig, getItemStatus]);

    // Filter List by Status
    const filteredList = useMemo(() => {
        return rawList.filter((item) => {
            const coord = parseCoordinates(item);
            if (!coord) return false; // Hanya tampilkan di peta jika punya koordinat

            if (selectedStatus === 'ALL') return true;

            const stUpper = getItemStatus(item);
            if (selectedStatus === 'NA' || selectedStatus === '#N/A') {
                return !statusConfig[stUpper] || stUpper === 'N/A' || stUpper === '#N/A';
            }

            return stUpper === selectedStatus;
        });
    }, [rawList, selectedStatus, statusConfig, getItemStatus]);

    // Marker Creator
    const createSingleMarker = useCallback((item, lng, lat) => {
        const stUpper = getItemStatus(item);
        const cfg = statusConfig[stUpper] || {
            color: '#94a3b8',
            bg: 'rgba(148,163,184,0.35)',
            badgeBg: 'rgba(148,163,184,0.15)',
            badgeBorder: 'rgba(148,163,184,0.3)',
        };

        const colorMain = cfg.color || '#94a3b8';
        const colorBg = cfg.bg || 'rgba(148,163,184,0.35)';
        const colorGlow = colorMain;
        const badgeBg = cfg.badgeBg || 'rgba(148,163,184,0.15)';
        const badgeBorder = cfg.badgeBorder || 'rgba(148,163,184,0.3)';

        const popupData = getPopupData(item, lat, lng);
        const title = popupData.title || 'Location Detail';
        const details = popupData.details || [];
        const statusText = popupData.statusText || stUpper;

        const el = document.createElement('div');
        el.style.cursor = 'pointer';
        el.innerHTML = `
            <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: ${colorBg}; box-shadow: 0 0 10px ${colorGlow};"></div>
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${colorMain}; border: 2px solid #ffffff; z-index: 2;"></div>
            </div>
        `;

        const detailsHTML = details.map((d) => `
            <span style="color: #64748b;">${d.label}:</span> 
            <span style="${d.isMonospace ? `color: ${colorMain}; font-family: monospace; font-weight: 600;` : ''}">${d.value}</span><br/>
        `).join('');

        const popupHTML = `
            <div style="font-family: system-ui, -apple-system, sans-serif; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); color: #f8fafc; padding: 14px 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 30px -10px rgba(0,0,0,0.8); min-width: 180px;">
                <div style="font-size: 13.5px; font-weight: 700; color: ${colorMain}; margin-bottom: 6px; letter-spacing: -0.01em;">${title}</div>
                <div style="font-size: 11px; color: #94a3b8; line-height: 1.6;">
                    ${detailsHTML}
                </div>
                <div style="margin-top: 10px; display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: ${badgeBg}; color: ${colorMain}; border: 1px solid ${badgeBorder};">
                    ${statusText}
                </div>
            </div>
        `;

        const popup = new maplibregl.Popup({
            offset: 14,
            closeButton: false,
            className: 'custom-dark-popup',
        }).setHTML(popupHTML);

        return new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .setPopup(popup);
    }, [getItemStatus, statusConfig, getPopupData]);

    // Render Markers & Clusters
    const renderMarkers = useCallback(() => {
        if (!map.current) return;

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        if (!isClustered) {
            filteredList.forEach((item) => {
                const coord = parseCoordinates(item);
                if (!coord) return;
                const marker = createSingleMarker({ ...item, coord }, coord.lng, coord.lat);
                marker.addTo(map.current);
                markersRef.current.push(marker);
            });
            return;
        }

        const projectedPoints = filteredList.map((item) => {
            const coord = parseCoordinates(item);
            if (!coord) return null;
            const pixel = map.current.project([coord.lng, coord.lat]);
            return { ...item, coord, x: pixel.x, y: pixel.y };
        }).filter(Boolean);

        const clusters = [];
        const visited = new Set();
        const clusterRadiusPx = 50;

        for (let i = 0; i < projectedPoints.length; i++) {
            if (visited.has(i)) continue;
            visited.add(i);

            const current = projectedPoints[i];
            const members = [current];

            for (let j = i + 1; j < projectedPoints.length; j++) {
                if (visited.has(j)) continue;
                const other = projectedPoints[j];

                const dx = current.x - other.x;
                const dy = current.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= clusterRadiusPx) {
                    visited.add(j);
                    members.push(other);
                }
            }

            if (members.length === 1) {
                clusters.push({
                    type: 'single',
                    item: members[0],
                    lng: members[0].coord.lng,
                    lat: members[0].coord.lat,
                });
            } else {
                const avgLng = members.reduce((sum, m) => sum + m.coord.lng, 0) / members.length;
                const avgLat = members.reduce((sum, m) => sum + m.coord.lat, 0) / members.length;
                clusters.push({
                    type: 'cluster',
                    count: members.length,
                    members,
                    lng: avgLng,
                    lat: avgLat,
                });
            }
        }

        clusters.forEach((cl) => {
            if (cl.type === 'cluster') {
                const el = document.createElement('div');
                const size = cl.count > 50 ? 46 : cl.count > 15 ? 40 : 34;

                el.style.cssText = `
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, rgba(14,165,233,0.9), rgba(99,102,241,0.9));
                    border: 2px solid #ffffff;
                    box-shadow: 0 0 15px rgba(14,165,233,0.6), inset 0 0 8px rgba(255,255,255,0.3);
                    color: #ffffff;
                    font-family: system-ui, -apple-system, sans-serif;
                    font-weight: 800;
                    font-size: ${size > 40 ? '13px' : '11px'};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    user-select: none;
                    transition: transform 0.2s ease;
                `;

                el.innerText = cl.count;

                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const currentZoom = map.current.getZoom();
                    map.current.easeTo({
                        center: [cl.lng, cl.lat],
                        zoom: currentZoom + 2.2,
                        pitch: 55,
                        duration: 600,
                    });
                });

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat([cl.lng, cl.lat])
                    .addTo(map.current);

                markersRef.current.push(marker);
            } else {
                const marker = createSingleMarker(cl.item, cl.lng, cl.lat);
                marker.addTo(map.current);
                markersRef.current.push(marker);
            }
        });
    }, [filteredList, isClustered, createSingleMarker]);

    // Simpan reference renderMarkers terbaru untuk event listener
    const renderMarkersRef = useRef(renderMarkers);
    useEffect(() => {
        renderMarkersRef.current = renderMarkers;
    }, [renderMarkers]);

    // Map Initialization
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: MAP_STYLES[currentStyle].style,
            center: center,
            zoom: zoom,
            pitch: 0,
            maxPitch: 85,
            renderWorldCopies: false,
            minZoom: 1,
            maxZoom: 22,
        });

        map.current.once('load', () => {
            if (map.current && typeof map.current.setProjection === 'function') {
                try {
                    map.current.setProjection({ type: 'globe' });
                } catch (err) {
                    console.warn("Globe projection unsupported:", err);
                }
            }
        });

        map.current.addControl(
            new maplibregl.NavigationControl({
                visualizePitch: true,
            }), 
            'top-right'
        );

        map.current.on('zoom', () => {
            if (!map.current) return;
            const currentZoom = map.current.getZoom();
            const currentPitch = map.current.getPitch();

            if (currentZoom > 14 && currentPitch < 30) {
                map.current.easeTo({ pitch: 60, duration: 400 });
            } else if (currentZoom <= 10 && currentPitch > 20) {
                map.current.easeTo({ pitch: 0, duration: 400 });
            }
        });

        // 💡 PERBAIKAN: Gunakan moveend agar smooth (tidak lag) dan pakai ref.current
        map.current.on('moveend', () => {
            if (renderMarkersRef.current) renderMarkersRef.current();
        });

        const resizeObserver = new ResizeObserver(() => {
            if (map.current) map.current.resize();
        });
        resizeObserver.observe(mapContainer.current);

        return () => {
            resizeObserver.disconnect();
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Render Markers Effect
    useEffect(() => {
        if (!map.current) return;

        renderMarkers();

        if (!hasInitialFitted.current && filteredList.length > 0) {
            const validCoords = filteredList.map((i) => parseCoordinates(i)).filter(Boolean);
            if (validCoords.length > 0) {
                const bounds = new maplibregl.LngLatBounds();
                validCoords.forEach((c) => bounds.extend([c.lng, c.lat]));
                map.current.fitBounds(bounds, { padding: 80, maxZoom: 12, duration: 800 });
                hasInitialFitted.current = true;
            }
        }
    }, [filteredList, isClustered, renderMarkers]);

    const changeStyle = (styleKey) => {
        if (!map.current || currentStyle === styleKey) return;
        setCurrentStyle(styleKey);
        map.current.setStyle(MAP_STYLES[styleKey].style);

        map.current.once('style.load', () => {
            if (map.current && typeof map.current.setProjection === 'function') {
                try {
                    map.current.setProjection({ type: 'globe' });
                } catch (err) {
                    console.warn("Globe projection error on style change:", err);
                }
            }
            renderMarkers();
        });
    };

    // Fungsi Reset Tampilan Peta ke Indonesia
    const handleResetViewIndonesia = () => {
        if (!map.current) return;
        map.current.flyTo({
            center: DEFAULT_INDONESIA_CENTER,
            zoom: DEFAULT_INDONESIA_ZOOM,
            pitch: 0,
            bearing: 0,
            duration: 1200,
            essential: true,
        });
    };

    return (
        <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950`}>
            <MapControls
                currentStyle={currentStyle}
                onChangeStyle={changeStyle}
                onResetView={handleResetViewIndonesia}
                isClustered={isClustered}
                onToggleCluster={() => setIsClustered(!isClustered)}
                noLocationCount={noLocationCount}
                selectedStatus={selectedStatus}
                onSelectStatus={setSelectedStatus}
                statusCounts={statusCounts}
                statusConfig={statusConfig}
            />

            <div ref={mapContainer} className="w-full h-full" />
        </div>
    );
}