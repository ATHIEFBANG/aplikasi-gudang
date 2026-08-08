import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import MapControls, { MAP_STYLES, DEFAULT_INDONESIA_CENTER, DEFAULT_INDONESIA_ZOOM, parseCoordinates } from './MapControls';

export default function Map({ 
    data = [], 
    center = [106.8272, -6.1754], 
    zoom = 9,
    height = "h-[600px]"
}) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);
    const hasInitialFitted = useRef(false);

    const [currentStyle, setCurrentStyle] = useState('dark');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [isClustered, setIsClustered] = useState(true);

    // Style Popup Transparan
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

    // Hitung Angka Status & Non-Location
    const { statusCounts, noLocationCount } = useMemo(() => {
        const counts = { ALL: 0, LOCKED: 0, UNLOCKED: 0, NA: 0 };
        let noLoc = 0;

        rawList.forEach((item) => {
            counts.ALL++;
            const coord = parseCoordinates(item);
            const st = String(item.status_aktifitas || item.status || '').toUpperCase();

            if (!coord) noLoc++;

            if (!coord || st === 'N/A' || st === '#N/A' || st === '' || (st !== 'LOCKED' && st !== 'UNLOCKED')) {
                counts.NA++;
            } else if (st === 'LOCKED') {
                counts.LOCKED++;
            } else if (st === 'UNLOCKED') {
                counts.UNLOCKED++;
            }
        });

        return { statusCounts: counts, noLocationCount: noLoc };
    }, [rawList]);

    // Filter Data Berdasarkan Filter Aktif
    const filteredList = useMemo(() => {
        return rawList.filter((item) => {
            const coord = parseCoordinates(item);
            if (!coord) return false;

            const stUpper = String(item.status_aktifitas || item.status || '').toUpperCase();
            if (selectedStatus === 'LOCKED') return stUpper === 'LOCKED';
            if (selectedStatus === 'UNLOCKED') return stUpper === 'UNLOCKED';
            if (selectedStatus === 'NA') return stUpper !== 'LOCKED' && stUpper !== 'UNLOCKED';
            return true;
        });
    }, [rawList, selectedStatus]);

    // Pembuat Marker Tunggal
    const createSingleMarker = useCallback((item, lng, lat) => {
        const statusAct = item.status_aktifitas || item.status || 'N/A';
        const stUpper = String(statusAct).toUpperCase();
        
        let colorMain = '#94a3b8';
        let colorBg = 'rgba(148,163,184,0.35)';
        let colorGlow = '#94a3b8';
        let badgeBg = 'rgba(148,163,184,0.15)';
        let badgeBorder = 'rgba(148,163,184,0.3)';

        if (stUpper === 'LOCKED') {
            colorMain = '#38bdf8';
            colorBg = 'rgba(14,165,233,0.35)';
            colorGlow = '#0ea5e9';
            badgeBg = 'rgba(14,165,233,0.15)';
            badgeBorder = 'rgba(14,165,233,0.3)';
        } else if (stUpper === 'UNLOCKED') {
            colorMain = '#fbbf24';
            colorBg = 'rgba(245,158,11,0.35)';
            colorGlow = '#f59e0b';
            badgeBg = 'rgba(245,158,11,0.15)';
            badgeBorder = 'rgba(245,158,11,0.3)';
        }

        const siteName = item.site_name || item.nama_site || item.site || 'Site SmartKey';
        const towerId = item.tower_id || item.site_id || '-';
        const sn = item.serial_number || item.sn || '-';

        const el = document.createElement('div');
        el.style.cursor = 'pointer';
        el.innerHTML = `
            <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: ${colorBg}; box-shadow: 0 0 10px ${colorGlow};"></div>
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${colorMain}; border: 2px solid #ffffff; z-index: 2;"></div>
            </div>
        `;

        const popupHTML = `
            <div style="font-family: system-ui, -apple-system, sans-serif; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); color: #f8fafc; padding: 14px 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 30px -10px rgba(0,0,0,0.8); min-width: 180px;">
                <div style="font-size: 13.5px; font-weight: 700; color: ${colorMain}; margin-bottom: 6px; letter-spacing: -0.01em;">${siteName}</div>
                <div style="font-size: 11px; color: #94a3b8; line-height: 1.6;">
                    <span style="color: #64748b;">Tower ID:</span> ${towerId}<br/>
                    <span style="color: #64748b;">SN:</span> ${sn}<br/>
                    <span style="color: ${colorMain}; font-family: monospace; font-weight: 600;">Lat, Long: ${item.coord ? item.coord.text : `${lat.toFixed(5)}, ${lng.toFixed(5)}`}</span>
                </div>
                <div style="margin-top: 10px; display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: ${badgeBg}; color: ${colorMain}; border: 1px solid ${badgeBorder};">
                    ${statusAct}
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
    }, []);

    // Render Markers / Clusters
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
                        pitch: 55, // Otomatis miring 3D saat cluster di-klik!
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

    // Inisialisasi Peta & Fitur Kemiringan 3D
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: MAP_STYLES[currentStyle].style,
            center: center,
            zoom: zoom,
            pitch: 0, // Posisi awal datar
            maxPitch: 85, // Memungkinkan sudut kemiringan kamera 3D sampai 85 derajat
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

        // KONTROL NAVIGASI (Dengan Kompas 3D)
        map.current.addControl(
            new maplibregl.NavigationControl({
                visualizePitch: true, // Menampilkan indikator kemiringan 3D pada tombol kompas
            }), 
            'top-right'
        );

        // OTOMATIS BERUBAH KE SUDUT 3D SAAT USER ZOOM-IN DALAM (> Level 14)
        map.current.on('zoom', () => {
            if (!map.current) return;
            const currentZoom = map.current.getZoom();
            const currentPitch = map.current.getPitch();

            // Jika zoom in cukup dalam dan peta masih datar, buat kemiringan 3D otomatis
            if (currentZoom > 14 && currentPitch < 30) {
                map.current.easeTo({ pitch: 60, duration: 400 });
            } else if (currentZoom <= 10 && currentPitch > 20) {
                // Jika zoom out ke skala pulau/dunia, kembalikan posisi tegak lurus
                map.current.easeTo({ pitch: 0, duration: 400 });
            }
        });

        map.current.on('move', () => {
            if (isClustered) renderMarkers();
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

    // Effect Render Marker & Fit Bounds Initial
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

    const handleResetViewIndonesia = () => {
        if (!map.current) return;
        map.current.flyTo({
            center: DEFAULT_INDONESIA_CENTER,
            zoom: DEFAULT_INDONESIA_ZOOM,
            pitch: 0, // Reset sudut kamera ke datar saat kembali ke wilayah Indonesia
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
            />

            <div ref={mapContainer} className="w-full h-full" />
        </div>
    );
}