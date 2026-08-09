import React, { useState } from 'react';
import InputError from '@/components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    Signal, 
    Lock, 
    Mail, 
    Eye, 
    EyeOff
} from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden font-sans selection:bg-red-600 selection:text-white">
            <Head title="Login - Mitratel Dashboard" />

            {/* ========================================================================= */}
            {/* LOGO & BRAND MITRATEL (DILUAR LAPTOP - POJOK KIRI ATAS & BISA DIKLIK) */}
            {/* ========================================================================= */}
            <Link 
                href="/" 
                className="absolute top-6 left-6 sm:top-8 sm:left-8 z-50 flex items-center gap-2.5 group transition-transform duration-200 hover:scale-105"
                title="Kembali ke Halaman Utama"
            >
                <div className="p-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/30 group-hover:bg-red-500 transition-colors">
                    <Signal className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="font-bold text-white text-base tracking-wider uppercase leading-none">
                        Mitratel
                    </h2>
                    <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-300 transition-colors">
                        Dashboard System
                    </span>
                </div>
            </Link>

            {/* ========================================================================= */}
            {/* BACKGROUND PATTERN & LIGHTING */}
            {/* ========================================================================= */}
            <div 
                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
                    backgroundSize: '28px 28px'
                }}
            />

            {/* Ambient Red Glow */}
            <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[140px] rounded-full pointer-events-none animate-pulse duration-[5000ms]" />
            <div className="absolute bottom-1/3 right-1/3 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-rose-700/10 blur-[130px] rounded-full pointer-events-none" />

            {/* ========================================================================= */}
            {/* LAPTOP MOCKUP CONTAINER */}
            {/* ========================================================================= */}
            <div className="w-full max-w-4xl relative z-10 my-auto pt-12 sm:pt-0">
                
                {/* 1. SCREEN FRAME */}
                <div className="bg-slate-900 border border-slate-700/80 rounded-t-2xl p-3 sm:p-4 shadow-2xl relative z-20">
                    
                    {/* Webcam Notch */}
                    <div className="flex justify-center items-center pb-3 pt-0.5">
                        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-950 border border-slate-800">
                            <div className="w-2 h-2 rounded-full bg-slate-800" />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>

                    {/* Inner Display */}
                    <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
                        
                        {/* ========================================================================= */}
                        {/* KIRI: FORM LOGIN */}
                        {/* ========================================================================= */}
                        <div className="lg:col-span-6 bg-slate-900/90 p-8 sm:p-10 flex flex-col justify-between border-r border-slate-800/80">
                            
                            {/* Form Header */}
                            <div className="my-auto py-2">
                                <h1 className="text-xl font-bold tracking-tight text-white">
                                    Selamat Datang
                                </h1>
                                <p className="text-xs text-slate-400 mt-1">
                                    Masuk dengan email dan password kamu untuk melanjutkan.
                                </p>

                                {/* Status Alert */}
                                {status && (
                                    <div className="mt-4 text-xs font-medium text-emerald-400 bg-emerald-950/50 p-3 rounded-xl border border-emerald-800/50">
                                        {status}
                                    </div>
                                )}

                                {/* Form Inputs */}
                                <form onSubmit={submit} className="space-y-4 mt-6">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                                            Email
                                        </Label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                value={data.email}
                                                autoComplete="username"
                                                autoFocus
                                                placeholder="nama@mitratel.co.id"
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="pl-10 h-10 text-xs rounded-xl bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={data.password}
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="pl-10 pr-10 h-10 text-xs rounded-xl bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="remember"
                                                checked={data.remember}
                                                onCheckedChange={(checked) => setData('remember', !!checked)}
                                                className="border-slate-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            />
                                            <Label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer font-normal">
                                                Ingat saya
                                            </Label>
                                        </div>

                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
                                            >
                                                Lupa password?
                                            </Link>
                                        )}
                                    </div>

                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="w-full h-10 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-red-600/25 transition-all duration-200 mt-2"
                                    >
                                        {processing ? 'Memproses...' : 'Masuk ke Dashboard'}
                                    </Button>
                                </form>
                            </div>

                            {/* Footer Notice */}
                            <div className="pt-4 border-t border-slate-800/60 mt-auto">
                                <p className="text-[11px] text-slate-500 text-center">
                                    Ada masalah saat login? Hubungi <span className="font-semibold text-slate-300">Admin Mitratel</span>.
                                </p>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* KANAN: FUTURISTIC VISION GRAPHIC + TOWER */}
                        {/* ========================================================================= */}
                        <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                            
                            {/* Radial Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

                            {/* Top HUD Header */}
                            <div className="flex items-center justify-between text-[11px] text-slate-500 relative z-10 font-mono">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Network Vision HUD
                                </span>
                                <span>Real-time Sync</span>
                            </div>

                            {/* CENTER SVG GRAPHIC */}
                            <div className="my-auto py-2 relative z-10 w-full flex items-center justify-center">
                                <div className="relative w-full max-w-[320px] aspect-[4/3] flex items-center justify-center">
                                    
                                    <svg viewBox="0 0 320 240" className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(239,68,68,0.25)]">
                                        <defs>
                                            <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                                            </linearGradient>
                                            <linearGradient id="towerGlow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f43f5e" />
                                                <stop offset="100%" stopColor="#334155" />
                                            </linearGradient>
                                        </defs>

                                        {/* HUD Target Concentric Grid Circles */}
                                        <circle cx="160" cy="120" r="90" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                                        <circle cx="160" cy="120" r="60" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="6 6" opacity="0.2" className="animate-spin duration-[25s]" />

                                        {/* Floating Equalizer / Bar Graph HUD Elements */}
                                        <g opacity="0.6">
                                            <rect x="30" y="150" width="5" height="30" rx="2" fill="#334155" />
                                            <rect x="40" y="130" width="5" height="50" rx="2" fill="#ef4444" className="animate-pulse duration-[1500ms]" />
                                            <rect x="50" y="140" width="5" height="40" rx="2" fill="#334155" />
                                            <rect x="60" y="120" width="5" height="60" rx="2" fill="#f43f5e" className="animate-pulse duration-[2000ms]" />
                                            
                                            <rect x="250" y="135" width="5" height="45" rx="2" fill="#334155" />
                                            <rect x="260" y="115" width="5" height="65" rx="2" fill="#ef4444" className="animate-pulse duration-[1800ms]" />
                                            <rect x="270" y="145" width="5" height="35" rx="2" fill="#334155" />
                                            <rect x="280" y="125" width="5" height="55" rx="2" fill="#f43f5e" className="animate-pulse duration-[2200ms]" />
                                        </g>

                                        {/* Telecom Wireframe Tower */}
                                        <g stroke="url(#towerGlow)" strokeLinecap="round">
                                            <line x1="160" y1="35" x2="130" y2="195" strokeWidth="2" />
                                            <line x1="160" y1="35" x2="190" y2="195" strokeWidth="2" />
                                            <line x1="160" y1="35" x2="160" y2="195" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

                                            <line x1="150" y1="80" x2="170" y2="80" strokeWidth="1.5" />
                                            <line x1="142" y1="120" x2="178" y2="120" strokeWidth="1.5" />
                                            <line x1="135" y1="160" x2="185" y2="160" strokeWidth="1.5" />

                                            <line x1="150" y1="80" x2="178" y2="120" strokeWidth="1" opacity="0.6" />
                                            <line x1="170" y1="80" x2="142" y2="120" strokeWidth="1" opacity="0.6" />
                                            <line x1="142" y1="120" x2="185" y2="160" strokeWidth="1" opacity="0.6" />
                                            <line x1="178" y1="120" x2="135" y2="160" strokeWidth="1" opacity="0.6" />

                                            <circle cx="160" cy="35" r="3.5" fill="#ef4444" className="animate-pulse" />
                                            <line x1="145" y1="48" x2="175" y2="48" strokeWidth="2" />
                                        </g>

                                        {/* Signal Pulse Waves */}
                                        <path d="M 140 28 A 25 25 0 0 1 180 28" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" className="animate-pulse" />
                                        <path d="M 125 18 A 45 45 0 0 1 195 18" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

                                        {/* Futuristic Line Chart */}
                                        <path 
                                            d="M 10 170 Q 50 110 90 140 T 160 80 T 230 130 T 310 90 L 310 205 L 10 205 Z" 
                                            fill="url(#areaGlow)" 
                                        />
                                        <path 
                                            d="M 10 170 Q 50 110 90 140 T 160 80 T 230 130 T 310 90" 
                                            fill="none" 
                                            stroke="#ef4444" 
                                            strokeWidth="2.5" 
                                            strokeLinecap="round"
                                            className="drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                                        />

                                        {/* Glowing Node Points */}
                                        <circle cx="90" cy="140" r="3.5" fill="#ef4444" />
                                        <circle cx="90" cy="140" r="7" fill="none" stroke="#ef4444" strokeWidth="1" className="animate-ping" />

                                        <circle cx="160" cy="80" r="4.5" fill="#ffffff" />
                                        <circle cx="160" cy="80" r="9" fill="none" stroke="#ef4444" strokeWidth="1.5" className="animate-ping" />

                                        <circle cx="230" cy="130" r="3.5" fill="#ef4444" />
                                        <circle cx="310" cy="90" r="3.5" fill="#ef4444" />
                                    </svg>
                                </div>
                            </div>

                            {/* Bottom Footer Info */}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 relative z-10 font-mono">
                                <span>PT Dayamitra Telekomunikasi</span>
                                <span>v3.0</span>
                            </div>

                        </div>

                    </div>
                </div>

                {/* 2. LAPTOP HINGE */}
                <div className="w-[96%] mx-auto h-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-x border-slate-700/60 relative z-20" />

                {/* 3. LAPTOP BASE DECK & SOFT TRAPEZOID SHADOW */}
                <div className="relative z-10 -mt-0.5">
                    
                    {/* Base Lip */}
                    <div className="w-[108%] -ml-[4%] h-3.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-b-md border-t border-slate-500/60 shadow-md relative z-20 flex items-start justify-center">
                        <div className="w-24 h-1.5 bg-slate-950 rounded-b-md border-x border-b border-slate-700/70" />
                    </div>

                    {/* SOFT TRAPEZOID SHADOW */}
                    <div 
                        className="w-[114%] -ml-[7%] h-20 bg-gradient-to-b from-black/40 via-black/15 to-transparent blur-md relative z-0 -mt-1 pointer-events-none opacity-40"
                        style={{
                            clipPath: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)'
                        }}
                    />

                </div>

            </div>

            {/* Copyright */}
            <p className="text-[11px] text-slate-600 mt-2 relative z-10 text-center font-medium">
                &copy; {new Date().getFullYear()} PT Dayamitra Telekomunikasi Tbk. All rights reserved.
            </p>
        </div>
    );
}