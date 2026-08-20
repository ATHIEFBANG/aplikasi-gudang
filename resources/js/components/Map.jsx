import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapControls, { MAP_STYLES, DEFAULT_INDONESIA_CENTER, DEFAULT_INDONESIA_ZOOM, parseCoordinates } from './MapControls';

// Default Fallback Generik
const GENERIC_DEFAULT_CONFIG = {
    'ACTIVE': { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.35)' },
    'INACTIVE': { label: 'Inactive', color: '#64748b', bg: 'rgba(100,116,139,0.35)' }
};

// Default Renderer Popup Generik
const GENERIC_POPUP_RENDERER = (item, lat, lng) => ({
    title: item.title || item.name || item.asset_name || 'Detail Lokasi',
    details: [
        { label: 'Koordinat', value: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, isMonospace: true },
    ],
    statusText: item.status || 'ACTIVE',
});

export default function Map({ 
    data = [], 
    trackHistory = [], 
    center = DEFAULT_INDONESIA_CENTER, 
    zoom = 4.5,
    height = "h-[600px]",
    statusKey = 'status',
    statusConfig = GENERIC_DEFAULT_CONFIG,
    getPopupData = GENERIC_POPUP_RENDERER,
    onMapClick
}) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);

    const onMapClickRef = useRef(onMapClick);
    useEffect(() => {
        onMapClickRef.current = onMapClick;
    }, [onMapClick]);

    const [currentStyle, setCurrentStyle] = useState('dark');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [isClustered, setIsClustered] = useState(true);

    // CSS Styling Universal untuk Popup & Efek Halo Pulse
    useEffect(() => {
        const styleId = 'maplibre-universal-clean-styles';
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
                @keyframes universal-smooth-beacon {
                    0% { transform: scale(0.9); opacity: 0.85; }
                    50% { transform: scale(1.45); opacity: 0.2; }
                    100% { transform: scale(0.9); opacity: 0.85; }
                }
                .universal-halo-pulse {
                    animation: universal-smooth-beacon 2.6s infinite ease-in-out;
                    pointer-events: none;
                }
            `;
            document.head.appendChild(styleEl);
        }
    }, []);

    // Format array koordinat rute: [[lng, lat], ...]
    const routeCoordinates = useMemo(() => {
        if (!Array.isArray(trackHistory) || trackHistory.length === 0) return [];
        return trackHistory.map(item => {
            if (Array.isArray(item) && item.length >= 2) {
                const lng = parseFloat(item[0]);
                const lat = parseFloat(item[1]);
                if (!isNaN(lng) && !isNaN(lat)) return [lng, lat];
            }
            if (item && typeof item === 'object') {
                const parsed = parseCoordinates(item);
                if (parsed) return [parsed.lng, parsed.lat];
            }
            return null;
        }).filter(Boolean);
    }, [trackHistory]);

    const rawList = useMemo(() => (Array.isArray(data) ? data : data?.data || []), [data]);

    const getItemStatus = useCallback((item) => {
        if (!item) return 'UNKNOWN';
        if (typeof statusKey === 'function') {
            return statusKey(item);
        }
        const val = item[statusKey] || item.status || item.status_aktifitas;
        return val ? String(val).toUpperCase().trim() : 'UNKNOWN';
    }, [statusKey]);

    const { statusCounts, noLocationCount } = useMemo(() => {
        const counts = { ALL: 0 };
        Object.keys(statusConfig).forEach((k) => { counts[k] = 0; });

        let noLoc = 0;
        rawList.forEach((item) => {
            const coord = parseCoordinates(item);
            const st = getItemStatus(item);

            if (!coord) {
                noLoc++;
            } else {
                counts.ALL += 1;
                if (counts[st] !== undefined) {
                    counts[st] = (counts[st] || 0) + 1;
                } else {
                    counts[st] = 1;
                }
            }
        });
        return { statusCounts: counts, noLocationCount: noLoc };
    }, [rawList, statusConfig, getItemStatus]);

    const filteredList = useMemo(() => {
        return rawList.filter((item) => {
            const coord = parseCoordinates(item);
            if (!coord) return false;
            if (item.is_destination || item.is_origin) return true;
            if (selectedStatus === 'ALL') return true;
            return getItemStatus(item) === selectedStatus;
        });
    }, [rawList, selectedStatus, getItemStatus]);

    // RENDER PIN MARKER
    const createSingleMarker = useCallback((item, lng, lat) => {
        const isDestination = item.is_destination === true;
        const isOrigin = item.is_origin === true;
        const stUpper = getItemStatus(item);

        let cfg = statusConfig[stUpper] || { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.35)' };
        let isAnimated = false;

        if (isDestination) {
            cfg = { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.35)' };
            isAnimated = true;
        } else if (isOrigin) {
            cfg = { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.35)' };
            isAnimated = true;
        }

        const popupData = getPopupData(item, lat, lng);
        const title = popupData.title || item.title || item.name || 'Detail Lokasi';
        const details = popupData.details || [];
        const statusText = popupData.statusText || stUpper;

        const el = document.createElement('div');
        el.style.cursor = 'pointer';

        el.innerHTML = `
            <div style="
                position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            " onmouseenter="this.style.transform='scale(1.22)';" onmouseleave="this.style.transform='scale(1)';">
                <div class="${isAnimated ? 'universal-halo-pulse' : ''}" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${cfg.bg}; box-shadow: 0 0 12px ${cfg.color};"></div>
                <div style="width: 13px; height: 13px; border-radius: 50%; background: ${cfg.color}; border: 2.5px solid #ffffff; z-index: 2; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
            </div>
        `;

        const detailsHTML = details.map((d) => `
            <span style="color: #64748b;">${d.label}:</span> 
            <span style="${d.isMonospace ? `color: #38bdf8; font-family: monospace; font-weight: 600;` : ''}">${d.value}</span><br/>
        `).join('');

        const popupHTML = `
            <div style="font-family: system-ui, -apple-system, sans-serif; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); color: #f8fafc; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 30px -10px rgba(0,0,0,0.8); min-width: 180px;">
                <div style="font-size: 13px; font-weight: 700; color: ${isDestination ? '#ef4444' : cfg.color}; margin-bottom: 5px;">${title}</div>
                <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">${detailsHTML}</div>
                <div style="margin-top: 8px; display: inline-block; padding: 2.5px 9px; border-radius: 9999px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; background: rgba(255,255,255,0.1); color: #f8fafc; border: 1px solid rgba(255,255,255,0.15);">
                    ${statusText}
                </div>
            </div>
        `;

        const popup = new maplibregl.Popup({ offset: 16, closeButton: false, className: 'custom-dark-popup' }).setHTML(popupHTML);
        return new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup);
    }, [getItemStatus, statusConfig, getPopupData]);

    // RENDER MARKER & CLUSTERING
    const renderMarkers = useCallback(() => {
        if (!map.current) return;
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        const shouldCluster = isClustered && filteredList.length > 3;

        if (!shouldCluster) {
            filteredList.forEach((item) => {
                const coord = parseCoordinates(item);
                if (!coord) return;
                const marker = createSingleMarker(item, coord.lng, coord.lat);
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
        const clusterRadiusPx = 45;

        for (let i = 0; i < projectedPoints.length; i++) {
            if (visited.has(i)) continue;
            visited.add(i);
            const current = projectedPoints[i];
            const members = [current];

            for (let j = i + 1; j < projectedPoints.length; j++) {
                if (visited.has(j)) continue;
                const other = projectedPoints[j];
                const dist = Math.sqrt(Math.pow(current.x - other.x, 2) + Math.pow(current.y - other.y, 2));
                if (dist <= clusterRadiusPx) { visited.add(j); members.push(other); }
            }

            if (members.length === 1) {
                clusters.push({ type: 'single', item: members[0], lng: members[0].coord.lng, lat: members[0].coord.lat });
            } else {
                const avgLng = members.reduce((sum, m) => sum + m.coord.lng, 0) / members.length;
                const avgLat = members.reduce((sum, m) => sum + m.coord.lat, 0) / members.length;
                clusters.push({ type: 'cluster', count: members.length, members, lng: avgLng, lat: avgLat });
            }
        }

        clusters.forEach((cl) => {
            if (cl.type === 'cluster') {
                const el = document.createElement('div');
                el.style.cursor = 'pointer';

                const size = cl.count > 50 ? 46 : cl.count > 15 ? 40 : 34;

                el.innerHTML = `
                    <div style="
                        width: ${size}px; height: ${size}px; border-radius: 50%;
                        background: linear-gradient(135deg, rgba(14,165,233,0.95), rgba(99,102,241,0.95));
                        border: 2px solid #ffffff; box-shadow: 0 0 12px rgba(14,165,233,0.5);
                        color: #ffffff; font-family: system-ui, sans-serif; font-weight: 800; font-size: ${size > 40 ? '13px' : '11px'};
                        display: flex; align-items: center; justify-content: center; user-select: none;
                        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
                    " onmouseenter="this.style.transform='scale(1.12)'; this.style.boxShadow='0 0 18px rgba(14,165,233,0.85)';" onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 0 12px rgba(14,165,233,0.5)';">
                        ${cl.count}
                    </div>
                `;

                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!map.current) return;

                    const bounds = new maplibregl.LngLatBounds();
                    let hasDifferentCoords = false;
                    const firstCoord = cl.members[0]?.coord;

                    cl.members.forEach((m) => {
                        if (m.coord) {
                            bounds.extend([m.coord.lng, m.coord.lat]);
                            if (firstCoord && (Math.abs(m.coord.lng - firstCoord.lng) > 0.0001 || Math.abs(m.coord.lat - firstCoord.lat) > 0.0001)) {
                                hasDifferentCoords = true;
                            }
                        }
                    });

                    if (hasDifferentCoords) {
                        map.current.fitBounds(bounds, {
                            padding: 85,
                            maxZoom: 16,
                            duration: 700,
                            essential: true
                        });
                    } else {
                        map.current.easeTo({
                            center: [cl.lng, cl.lat],
                            zoom: Math.min(map.current.getZoom() + 3.5, 17),
                            duration: 700,
                            essential: true
                        });
                    }
                });

                const marker = new maplibregl.Marker({ element: el }).setLngLat([cl.lng, cl.lat]).addTo(map.current);
                markersRef.current.push(marker);
            } else {
                const marker = createSingleMarker(cl.item, cl.lng, cl.lat);
                marker.addTo(map.current);
                markersRef.current.push(marker);
            }
        });
    }, [filteredList, isClustered, createSingleMarker]);

    const renderMarkersRef = useRef(renderMarkers);
    useEffect(() => { renderMarkersRef.current = renderMarkers; }, [renderMarkers]);

    // RENDER GARIS RUTE
    const renderRouteLayer = useCallback(() => {
        if (!map.current) return;

        const routeSourceId = 'map-universal-route-source';
        const routeLayerId = 'map-universal-route-layer-main';
        const routeOutlineLayerId = 'map-universal-route-layer-outline';

        const validCoords = routeCoordinates.length >= 2 ? routeCoordinates : [];

        const routeGeoJSON = { 
            type: 'Feature', 
            properties: {},
            geometry: { 
                type: 'LineString', 
                coordinates: validCoords 
            }
        };

        const existingSource = map.current.getSource(routeSourceId);

        if (existingSource) {
            existingSource.setData(routeGeoJSON);
        } else {
            try {
                map.current.addSource(routeSourceId, { 
                    type: 'geojson', 
                    data: routeGeoJSON 
                });
                
                if (!map.current.getLayer(routeOutlineLayerId)) {
                    map.current.addLayer({
                        id: routeOutlineLayerId, 
                        type: 'line', 
                        source: routeSourceId,
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: { 'line-color': '#ffffff', 'line-width': 7.5, 'line-opacity': 0.85 }
                    });
                }

                if (!map.current.getLayer(routeLayerId)) {
                    map.current.addLayer({
                        id: routeLayerId, 
                        type: 'line', 
                        source: routeSourceId,
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 1.0 }
                    });
                }
            } catch (err) {}
        }
    }, [routeCoordinates]);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: MAP_STYLES[currentStyle].style,
            center: center,
            zoom: zoom,
            preserveDrawingBuffer: true, // 👉 KUNCI UTAMA: Agar kanvas peta tidak menjadi hitam saat di-export / capture
            attributionControl: false,
            renderWorldCopies: false,
            transformRequest: (url) => ({ url })
        });

        map.current.on('click', (e) => {
            if (onMapClickRef.current) {
                onMapClickRef.current(e.lngLat);
            }
        });

        map.current.on('load', () => {
            if (typeof map.current.setProjection === 'function') {
                try {
                    map.current.setProjection({ type: 'globe' });
                } catch (err) {}
            }
            renderRouteLayer();
            if (map.current) map.current.resize();
        });

        map.current.on('style.load', () => {
            if (typeof map.current.setProjection === 'function') {
                try {
                    map.current.setProjection({ type: 'globe' });
                } catch (err) {}
            }
            renderRouteLayer();
            if (map.current) map.current.resize();
        });

        map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

        map.current.on('moveend', () => {
            if (renderMarkersRef.current) renderMarkersRef.current();
        });

        const resizeObserver = new ResizeObserver(() => { 
            if (map.current) map.current.resize(); 
        });
        resizeObserver.observe(mapContainer.current);

        setTimeout(() => {
            if (map.current) map.current.resize();
        }, 150);

        return () => {
            resizeObserver.disconnect();
            if (map.current) { map.current.remove(); map.current = null; }
        };
    }, []);

    useEffect(() => {
        if (!map.current) return;
        renderMarkers();
        renderRouteLayer();
    }, [filteredList, isClustered, renderMarkers, renderRouteLayer, routeCoordinates]);

    const changeStyle = (styleKey) => {
        if (!map.current || currentStyle === styleKey) return;
        setCurrentStyle(styleKey);
        map.current.setStyle(MAP_STYLES[styleKey].style);
        map.current.once('style.load', () => {
            if (typeof map.current.setProjection === 'function') {
                try {
                    map.current.setProjection({ type: 'globe' });
                } catch (err) {}
            }
            renderMarkers();
            renderRouteLayer(); 
        });
    };

    const handleResetViewIndonesia = () => {
        if (!map.current) return;
        map.current.flyTo({ 
            center: DEFAULT_INDONESIA_CENTER, 
            zoom: DEFAULT_INDONESIA_ZOOM, 
            duration: 900,
            essential: true 
        });
    };

    return (
        <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950`}>
            {/* Selalu render MapControls di semua tempat (baik Dashboard maupun DrivePage) */}
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