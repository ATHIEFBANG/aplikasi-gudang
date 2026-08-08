import React from 'react';
import { MapPin, Navigation, Layers } from 'lucide-react';

export default function SiteMap({
    title = 'Peta Sebaran Menara',
    totalSites = 0,
    height = 'h-96',
}) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col justify-between">
            {/* Header Map */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {totalSites} Titik Menara Terdaftar
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1 transition">
                        <Layers className="w-4 h-4" /> Filter
                    </button>
                </div>
            </div>

            {/* Container Peta (Placeholder Visual Interaktif) */}
            <div className={`relative w-full ${height} rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 overflow-hidden flex items-center justify-center`}>
                {/* Visual Grid Peta */}
                <div className="absolute inset-0 opacity-20 dark:opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
                
                {/* Mock Markers */}
                <div className="absolute top-1/3 left-1/4 p-2 rounded-full bg-red-600 text-white shadow-lg animate-bounce">
                    <Navigation className="w-4 h-4" />
                </div>
                <div className="absolute top-1/2 left-2/3 p-2 rounded-full bg-red-600 text-white shadow-lg">
                    <Navigation className="w-4 h-4" />
                </div>

                {/* Badge Overlay */}
                <div className="relative z-10 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10 text-center shadow-lg">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        🗺️ Leaflet / Mapbox Map Engine Ready
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Siap dihubungkan dengan koordinat Lat/Long database
                    </p>
                </div>
            </div>
        </div>
    );
}