import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { 
    Signal, 
    Wifi, 
    BatteryCharging, 
    Volume2, 
    ShieldAlert, 
    ServerCrash, 
    FileQuestion, 
    Lock, 
    Wrench, 
    RefreshCw, 
    Home, 
    Search, 
    Terminal
} from 'lucide-react';

export default function Error({ status }) {
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    // Real-time clock & date untuk Windows Taskbar
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

    // Konfigurasi pesan error berdasarkan HTTP Status Code
    const errorConfigs = {
        404: {
            title: '404 - Page Not Found',
            subtitle: 'Halaman Tidak Ditemukan',
            description: 'Sistem tidak dapat menemukan halaman atau resource yang kamu cari. URL mungkin telah dipindahkan atau dihapus.',
            icon: FileQuestion,
            badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/80',
            iconBg: 'bg-amber-950/60 border-amber-800/80 text-amber-400',
            techCode: 'ERR_HTTP_NOT_FOUND',
        },
        500: {
            title: '500 - Internal Server Error',
            subtitle: 'Kesalahan Sistem Server',
            description: 'Terjadi kendala teknis pada server Mitratel Enterprise System. Tim teknis telah menerima log pemberitahuan ini.',
            icon: ServerCrash,
            badgeColor: 'text-red-400 bg-red-950/60 border-red-800/80',
            iconBg: 'bg-red-950/60 border-red-800/80 text-red-500',
            techCode: 'ERR_INTERNAL_SYSTEM_FAULT',
        },
        503: {
            title: '503 - Service Unavailable',
            subtitle: 'Sistem Dalam Pemeliharaan',
            description: 'Layanan sedang berada dalam mode pemeliharaan rutin (*scheduled maintenance*). Silakan coba beberapa saat lagi.',
            icon: Wrench,
            badgeColor: 'text-sky-400 bg-sky-950/60 border-sky-800/80',
            iconBg: 'bg-sky-950/60 border-sky-800/80 text-sky-400',
            techCode: 'ERR_SYSTEM_MAINTENANCE',
        },
        403: {
            title: '403 - Access Forbidden',
            subtitle: 'Akses Terbatas / Ditolak',
            description: 'Akun kamu tidak memiliki wewenang atau hak akses (*permission*) untuk membuka direktori/fitur ini.',
            icon: Lock,
            badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-800/80',
            iconBg: 'bg-rose-950/60 border-rose-800/80 text-rose-400',
            techCode: 'ERR_ACCESS_DENIED',
        },
    };

    // Default ke status 500 jika status code tidak terdaftar
    const config = errorConfigs[status] || errorConfigs[500];
    const IconComponent = config.icon;

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden font-sans selection:bg-red-600 selection:text-white">
            <Head title={`${config.title} - Mitratel Enterprise`} />

            {/* Custom Animations */}
            <style>{`
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.25; transform: scale(1.05); }
                }
                .animate-glow {
                    animation: pulseGlow 6s ease-in-out infinite;
                }
            `}</style>

            {/* BRAND LOGO (POJOK KIRI ATAS) */}
            <Link 
                href="/" 
                className="absolute top-6 left-6 sm:top-8 sm:left-8 z-50 flex items-center gap-2.5 group transition-transform duration-200 hover:scale-105"
            >
                <div className="p-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/30">
                    <Signal className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="font-bold text-white text-base tracking-wider uppercase leading-none">
                        Mitratel
                    </h2>
                    <span className="text-[10px] text-slate-400 font-medium">
                        Enterprise System
                    </span>
                </div>
            </Link>

            {/* AMBIENT LIGHT BACKGROUND */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none animate-glow" />

            {/* LAPTOP MOCKUP CONTAINER */}
            <div className="w-full max-w-4xl relative z-10 my-auto pt-12 sm:pt-0">
                
                {/* 1. SCREEN FRAME (BEZEL) */}
                <div className="bg-slate-900 border border-slate-700/80 rounded-t-2xl p-2.5 sm:p-3.5 shadow-2xl relative z-20">
                    
                    {/* Webcam Notch */}
                    <div className="flex justify-center items-center pb-2 pt-0.5">
                        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-950 border border-slate-800">
                            <div className="w-2 h-2 rounded-full bg-slate-800" />
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* INNER DISPLAY - WINDOWS DESKTOP OS CANVAS */}
                    {/* ========================================================================= */}
                    <div className="relative w-full min-h-[480px] sm:min-h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 flex flex-col justify-between">
                        
                        {/* Grid Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                        {/* --------------------------------------------------------------------- */}
                        {/* MAIN WORKSPACE: ERROR STATE DISPLAY */}
                        {/* --------------------------------------------------------------------- */}
                        <div className="relative flex-1 py-8 px-6 sm:px-12 flex items-center justify-center overflow-hidden z-10">
                            
                            {/* ERROR DIALOG WINDOW */}
                            <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden">
                                
                                {/* Window Header Bar */}
                                <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                        <span className="text-xs font-mono text-slate-400 ml-2 font-medium">
                                            System Diagnostic Alert
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {config.techCode}
                                    </span>
                                </div>

                                {/* Window Content */}
                                <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                                    
                                    {/* Error Icon */}
                                    <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 shadow-xl ${config.iconBg}`}>
                                        <IconComponent className="w-8 h-8" />
                                    </div>

                                    {/* Status Code Badge */}
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border mb-3 ${config.badgeColor}`}>
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        <span>{config.title}</span>
                                    </div>

                                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                        {config.subtitle}
                                    </h1>

                                    <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-sm">
                                        {config.description}
                                    </p>

                                    {/* Terminal Console Log Simulation */}
                                    <div className="w-full bg-slate-950/90 rounded-xl p-3 border border-slate-800/80 mt-5 text-left font-mono text-[11px] text-slate-400">
                                        <div className="flex items-center justify-between text-slate-500 pb-1.5 mb-2 border-b border-slate-800 text-[10px]">
                                            <span className="flex items-center gap-1">
                                                <Terminal className="w-3 h-3 text-red-400" /> Console Output
                                            </span>
                                            <span>STATUS: {status}</span>
                                        </div>
                                        <div className="text-red-400 font-mono text-[10px]">
                                            &gt; Event logged at {currentTime || '12:00:00'}
                                        </div>
                                        <div className="text-slate-500 font-mono text-[10px] truncate">
                                            &gt; Path: {typeof window !== 'undefined' ? window.location.pathname : '/'}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="w-full flex flex-col sm:flex-row items-center gap-3 mt-6">
                                        <Button
                                            onClick={() => router.reload()}
                                            variant="outline"
                                            className="w-full sm:w-1/2 h-10 bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700/80 text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            Coba Muat Ulang
                                        </Button>

                                        <Link href="/" className="w-full sm:w-1/2">
                                            <Button className="w-full h-10 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2">
                                                <Home className="w-3.5 h-3.5" />
                                                Ke Halaman Utama
                                            </Button>
                                        </Link>
                                    </div>

                                </div>
                            </div>

                        </div>

                        {/* --------------------------------------------------------------------- */}
                        {/* WINDOWS BOTTOM TASKBAR */}
                        {/* --------------------------------------------------------------------- */}
                        <div className="w-full h-10 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-300 select-none z-30">
                            
                            {/* Left Side */}
                            <div className="flex items-center gap-2">
                                <Link href="/">
                                    <button className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold text-xs transition-all shadow-md shadow-red-600/20">
                                        <Signal className="w-3.5 h-3.5" />
                                        <span>Start</span>
                                    </button>
                                </Link>

                                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 text-[11px] w-36">
                                    <Search className="w-3 h-3 text-slate-500" />
                                    <span>Cari aplikasi...</span>
                                </div>
                            </div>

                            {/* Right Side */}
                            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                                <span className="hidden sm:flex items-center gap-1 text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/50">
                                    System Error
                                </span>
                                <Wifi className="w-3.5 h-3.5 text-slate-300" />
                                <Volume2 className="w-3.5 h-3.5 text-slate-300" />
                                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                                
                                <div className="flex flex-col items-end text-[10px] leading-tight text-slate-200 border-l border-slate-800 pl-2.5">
                                    <span className="font-semibold">{currentTime || '12:00'}</span>
                                    <span className="text-slate-500 text-[9px]">{currentDate || '11/08/2026'}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 2. LAPTOP HINGE */}
                <div className="w-[96%] mx-auto h-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-x border-slate-700/60 relative z-20" />

                {/* 3. LAPTOP BASE DECK */}
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

            {/* Footer */}
            <p className="text-[11px] text-slate-600 mt-2 relative z-10 text-center font-medium">
                &copy; {new Date().getFullYear()} PT Dayamitra Telekomunikasi Tbk. All rights reserved.
            </p>
        </div>
    );
}