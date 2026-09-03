import React, { useState, useEffect } from 'react';
import ApplicationLogo from '@/components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { 
    Wifi, 
    BatteryCharging, 
    Boxes, 
    Truck, 
    Warehouse, 
    Volume2, 
    Search, 
    Image as ImageIcon, 
    LayoutGrid,
    ArrowLeft
} from 'lucide-react';

export default function ForgotPassword() {
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [bgIndex, setBgIndex] = useState(0);

    // Jam & tanggal real-time
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
            setCurrentDate(now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }));
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Pergantian wallpaper animasi otomatis
    useEffect(() => {
        const bgTimer = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % 3);
        }, 7000);
        return () => clearInterval(bgTimer);
    }, []);

    return (
        <div className="dark min-h-screen w-full bg-slate-950 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
            <Head title="Lupa Password - System Gudang" />

            {/* ANIMASI CSS GRAFIK GUDANG */}
            <style>{`
                @keyframes conveyorTrack {
                    0% { stroke-dashoffset: 24; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes scanLine {
                    0% { transform: translateY(0px); opacity: 0.2; }
                    50% { opacity: 1; }
                    100% { transform: translateY(140px); opacity: 0.2; }
                }
                @keyframes pulseData {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.9; }
                }
                .animate-conveyor-track {
                    stroke-dasharray: 6 6;
                    animation: conveyorTrack 1s linear infinite;
                }
                .animate-scan-line {
                    animation: scanLine 2.5s ease-in-out infinite alternate;
                }
                .animate-pulse-data {
                    animation: pulseData 2s ease-in-out infinite;
                }
            `}</style>

            {/* AMBIENT LIGHTING BACKGROUND */}
            <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none animate-pulse duration-[5000ms]" />
            <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

            {/* 1. TOP HEADER */}
            <header className="w-full max-w-4xl mx-auto flex items-center justify-start z-30 mb-2 sm:mb-4">
                <Link 
                    href="/" 
                    className="flex items-center gap-3 transition-transform duration-200 hover:scale-105 cursor-pointer select-none"
                    title="Kembali ke Halaman Utama"
                >
                    <ApplicationLogo 
                        className="h-9 sm:h-10 w-auto" 
                        textClassName="text-white"
                        showTextOnMobile={true}
                    />
                </Link>
            </header>

            {/* 2. LAPTOP MOCKUP CONTAINER */}
            <div className="w-full max-w-4xl relative z-10 my-auto">
                {/* A. SCREEN FRAME (BEZEL) */}
                <div className="bg-slate-900 border border-slate-700/80 rounded-t-2xl p-2.5 sm:p-3.5 shadow-2xl relative z-20">
                    {/* Webcam Notch */}
                    <div className="flex justify-center items-center pb-2 pt-0.5">
                        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-950 border border-slate-800">
                            <div className="w-2 h-2 rounded-full bg-slate-800" />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>

                    {/* B. INNER DISPLAY */}
                    <div className="relative w-full min-h-[480px] sm:min-h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 flex flex-col justify-between">
                        {/* WORKSPACE */}
                        <div className="relative flex-1 py-6 px-6 sm:px-10 md:px-12 flex items-center justify-between overflow-hidden">
                            {/* BACKGROUND ANIMASI GRAFIK GUDANG */}
                            <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:32px_32px] z-10" />

                                {/* TEMA 1: RAK & CONVEYOR BELT */}
                                <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${bgIndex === 0 ? 'opacity-100' : 'opacity-0'}`}>
                                    <div className="absolute right-10 top-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-blue-600/15 rounded-full blur-3xl" />
                                    <div className="absolute inset-0 w-full h-full flex items-center justify-center opacity-55">
                                        <svg viewBox="0 0 440 300" className="w-full h-auto max-h-[360px]">
                                            <g stroke="#334155" strokeWidth="1.5" fill="none">
                                                <rect x="40" y="40" width="160" height="180" rx="4" stroke="#1e293b" strokeWidth="2" />
                                                <line x1="40" y1="100" x2="200" y2="100" stroke="#2563eb" strokeWidth="1.5" />
                                                <line x1="40" y1="160" x2="200" y2="160" stroke="#2563eb" strokeWidth="1.5" />
                                                <line x1="93" y1="40" x2="93" y2="220" stroke="#1e293b" strokeDasharray="3 3" />
                                                <line x1="146" y1="40" x2="146" y2="220" stroke="#1e293b" strokeDasharray="3 3" />
                                            </g>
                                            <g fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5">
                                                <rect x="48" y="65" width="38" height="30" rx="3" />
                                                <rect x="101" y="65" width="38" height="30" rx="3" fill="#1e293b" stroke="#f59e0b" />
                                                <rect x="154" y="125" width="38" height="30" rx="3" />
                                                <rect x="48" y="185" width="38" height="30" rx="3" fill="#1e293b" stroke="#3b82f6" />
                                                <rect x="101" y="185" width="38" height="30" rx="3" stroke="#f59e0b" />
                                            </g>
                                            <g transform="translate(48, 48)">
                                                <rect x="0" y="0" width="45" height="12" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                                                <text x="22.5" y="8.5" textAnchor="middle" fill="#94a3b8" fontSize="7" fontStyle="monospace" fontWeight="bold">BAY A-01</text>
                                            </g>
                                            <g>
                                                <line x1="200" y1="190" x2="400" y2="190" stroke="#0284c7" strokeWidth="2" />
                                                <line x1="200" y1="190" x2="400" y2="190" stroke="#fbbf24" strokeWidth="2" className="animate-conveyor-track" />
                                                {[220, 250, 280, 310, 340, 370].map((cx, i) => (
                                                    <circle key={i} cx={cx} cy={195} r="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                                                ))}
                                                <g transform="translate(260, 155)">
                                                    <rect x="0" y="0" width="40" height="32" rx="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                                                    <path d="M 0 10 L 40 10" stroke="#3b82f6" strokeWidth="1" />
                                                    <rect x="14" y="16" width="12" height="8" rx="1" fill="#2563eb" />
                                                </g>
                                                <g transform="translate(340, 155)">
                                                    <rect x="0" y="0" width="40" height="32" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                                                    <path d="M 0 10 L 40 10" stroke="#f59e0b" strokeWidth="1" />
                                                    <circle cx="20" cy="20" r="4" fill="#fbbf24" className="animate-ping" />
                                                </g>
                                            </g>
                                        </svg>
                                    </div>
                                </div>

                                {/* TEMA 2: TELEMETRI & RFID HUD */}
                                <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${bgIndex === 1 ? 'opacity-100' : 'opacity-0'}`}>
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-amber-500/15 rounded-full blur-3xl" />
                                    <div className="absolute inset-0 w-full h-full flex items-center justify-center opacity-55">
                                        <svg viewBox="0 0 440 300" className="w-full h-auto max-h-[360px]">
                                            <g transform="translate(100, 50)">
                                                <path d="M 0 20 L 0 0 L 20 0" stroke="#f59e0b" strokeWidth="2" fill="none" />
                                                <path d="M 220 0 L 240 0 L 240 20" stroke="#f59e0b" strokeWidth="2" fill="none" />
                                                <path d="M 0 160 L 0 180 L 20 180" stroke="#f59e0b" strokeWidth="2" fill="none" />
                                                <path d="M 220 180 L 240 180 L 240 160" stroke="#f59e0b" strokeWidth="2" fill="none" />
                                                <rect x="35" y="25" width="170" height="130" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
                                                <g transform="translate(60, 50)">
                                                    {[0, 8, 14, 26, 34, 40, 52, 64, 72, 80, 92, 100, 110].map((x, i) => (
                                                        <rect key={i} x={x} y="0" width={i % 3 === 0 ? 5 : 2} height="45" fill={i % 2 === 0 ? "#60a5fa" : "#fbbf24"} />
                                                    ))}
                                                    <text x="60" y="60" textAnchor="middle" fill="#94a3b8" fontSize="8" fontStyle="monospace">SYS-RFID-9942-X</text>
                                                </g>
                                                <g className="animate-scan-line" transform="translate(15, 20)">
                                                    <line x1="0" y1="0" x2="210" y2="0" stroke="#fbbf24" strokeWidth="2" />
                                                    <rect x="0" y="0" width="210" height="12" fill="url(#scanGlowWarehouse)" opacity="0.4" />
                                                </g>
                                                <g transform="translate(45, 125)" className="animate-pulse-data">
                                                    <rect x="0" y="0" width="70" height="18" rx="3" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />
                                                    <text x="35" y="12" textAnchor="middle" fill="#60a5fa" fontSize="8" fontStyle="monospace" fontWeight="bold">STATUS: OK</text>
                                                    <rect x="80" y="0" width="70" height="18" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                                                    <text x="115" y="12" textAnchor="middle" fill="#fbbf24" fontSize="8" fontStyle="monospace" fontWeight="bold">MATCH: 100%</text>
                                                </g>
                                            </g>
                                            <defs>
                                                <linearGradient id="scanGlowWarehouse" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                                                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>

                                {/* TEMA 3: ALUR ISOMETRIK PALET */}
                                <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${bgIndex === 2 ? 'opacity-100' : 'opacity-0'}`}>
                                    <div className="absolute right-10 bottom-10 w-[450px] h-[450px] bg-blue-500/15 rounded-full blur-3xl" />
                                    <div className="absolute inset-0 w-full h-full flex items-center justify-center opacity-45">
                                        <svg viewBox="0 0 400 300" className="w-full h-auto max-h-[360px]">
                                            <g transform="translate(140, 90)">
                                                <polygon points="40,0 80,20 40,40 0,20" fill="#3b82f6" opacity="0.8" stroke="#60a5fa" strokeWidth="1" />
                                                <polygon points="0,20 40,40 40,80 0,60" fill="#1d4ed8" opacity="0.9" stroke="#3b82f6" strokeWidth="1" />
                                                <polygon points="40,40 80,20 80,60 40,80" fill="#1e40af" stroke="#3b82f6" strokeWidth="1" />
                                            </g>
                                            <g transform="translate(200, 120)">
                                                <polygon points="40,0 80,20 40,40 0,20" fill="#fbbf24" opacity="0.9" stroke="#fef08a" strokeWidth="1" />
                                                <polygon points="0,20 40,40 40,80 0,60" fill="#d97706" opacity="0.9" stroke="#fbbf24" strokeWidth="1" />
                                                <polygon points="40,40 80,20 80,60 40,80" fill="#b45309" stroke="#fbbf24" strokeWidth="1" />
                                            </g>
                                            <g transform="translate(80, 150)">
                                                <polygon points="40,0 80,20 40,40 0,20" fill="#0284c7" opacity="0.8" stroke="#38bdf8" strokeWidth="1" />
                                                <polygon points="0,20 40,40 40,80 0,60" fill="#0369a1" stroke="#0284c7" strokeWidth="1" />
                                                <polygon points="40,40 80,20 80,60 40,80" fill="#075985" stroke="#0284c7" strokeWidth="1" />
                                            </g>
                                            <path d="M 120 170 L 180 110 L 240 140 L 310 90" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" className="animate-conveyor-track" />
                                            <circle cx="180" cy="110" r="4" fill="#3b82f6" />
                                            <circle cx="240" cy="140" r="5" fill="#fbbf24" className="animate-ping" />
                                            <circle cx="310" cy="90" r="4" fill="#3b82f6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* SHORTCUT DESKTOP ICONS */}
                            <div className="hidden lg:flex flex-col gap-4 z-10 select-none absolute top-6 left-6 xl:left-8">
                                <div className="flex flex-col items-center gap-1 group cursor-pointer w-16">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-amber-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md backdrop-blur-sm">
                                        <Boxes className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] text-slate-300 font-medium group-hover:text-white text-center drop-shadow-md">Stok Barang</span>
                                </div>

                                <div className="flex flex-col items-center gap-1 group cursor-pointer w-16">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md backdrop-blur-sm">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] text-slate-300 font-medium group-hover:text-white text-center drop-shadow-md">Logistik</span>
                                </div>

                                <div className="flex flex-col items-center gap-1 group cursor-pointer w-16">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-md backdrop-blur-sm">
                                        <Warehouse className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] text-slate-300 font-medium group-hover:text-white text-center drop-shadow-md">Area Gudang</span>
                                </div>
                            </div>

                            {/* WALLPAPER SWITCHER */}
                            <div className="absolute top-5 right-6 sm:right-8 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 shadow-lg">
                                <ImageIcon className="w-3 h-3 text-slate-400 mr-1" />
                                {[0, 1, 2].map((idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setBgIndex(idx)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                            bgIndex === idx 
                                                ? (idx === 0 ? 'bg-blue-500 w-4' : idx === 1 ? 'bg-amber-400 w-4' : 'bg-sky-400 w-4')
                                                : 'bg-slate-700 hover:bg-slate-500'
                                        }`}
                                        title={`Ganti grafik tema ${idx + 1}`}
                                    />
                                ))}
                            </div>

                            {/* INFORMASI LUPA PASSWORD (BERSIH SEPERTI TAMPILAN AWAL) */}
                            <div className="relative z-10 w-full max-w-sm ml-auto my-auto py-2 pr-1 sm:pr-2">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md">
                                        Lupa Password?
                                    </h1>
                                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                        Silakan hubungi Administrator Gudang untuk melakukan reset password akun Anda.
                                    </p>
                                </div>

                                <div className="mt-6">
                                    <Link href={route('login')} className="block w-full">
                                        <Button 
                                            type="button" 
                                            className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            <span>Kembali ke Halaman Login</span>
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* WINDOWS BOTTOM TASKBAR */}
                        <div className="w-full h-10 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-300 select-none z-30">
                            <div className="flex items-center gap-2">
                                <Link href={route('login')}>
                                    <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer">
                                        <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Start</span>
                                    </button>
                                </Link>

                                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 text-[11px] w-36">
                                    <Search className="w-3 h-3 text-slate-500" />
                                    <span>Cari aplikasi...</span>
                                </div>

                                <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                                    <div className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer" title="Stok Barang">
                                        <Boxes className="w-3.5 h-3.5 text-amber-400" />
                                    </div>
                                    <div className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer" title="Area Gudang">
                                        <Warehouse className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                </div>
                            </div>

                            {/* SYSTEM TRAY KANAN */}
                            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                                <Wifi className="w-3.5 h-3.5 text-slate-300" />
                                <Volume2 className="w-3.5 h-3.5 text-slate-300" />
                                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                                
                                <div className="flex flex-col items-end text-[10px] leading-tight text-slate-200 border-l border-slate-800 pl-2.5">
                                    <span className="font-semibold">{currentTime || '12:00'}</span>
                                    <span className="text-slate-500 text-[9px]">{currentDate || '03/09/2026'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* C. LAPTOP HINGE */}
                <div className="w-[96%] mx-auto h-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-x border-slate-700/60 relative z-20" />

                {/* D. LAPTOP BASE DECK (PERSIS MITRATEL) */}
                <div className="relative z-10 -mt-0.5">
                    <div className="w-[108%] -ml-[4%] h-3.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-b-md border-t border-slate-500/60 shadow-md relative z-20 flex items-start justify-center">
                        <div className="w-24 h-1.5 bg-slate-950 rounded-b-md border-x border-b border-slate-700/70" />
                    </div>
                    <div 
                        className="w-[114%] -ml-[7%] h-20 bg-gradient-to-b from-black/40 via-black/15 to-transparent blur-md relative z-0 -mt-1 pointer-events-none opacity-40"
                        style={{
                            clipPath: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)'
                        }}
                    />
                </div>
            </div>

            {/* 3. FOOTER */}
            <footer className="w-full text-center py-2 text-[11px] text-slate-600 font-medium relative z-10">
                &copy; {new Date().getFullYear()} PT Panca Pilar Laksana. All rights reserved.
            </footer>
        </div>
    );
}