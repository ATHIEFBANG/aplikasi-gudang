import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import {
    Home,
    Wrench,
    LayoutDashboard,
    Database,
    User as UserIcon,
    LogOut,
    Sun,
    Moon,
    Menu,
    X,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

// =========================================================================
// MAPPING FALLBACK URL (Penyelamat Jika Ziggy Route Belum Sync)
// =========================================================================
const ROUTE_FALLBACKS = {
    'home': '/home', // ✅ DIPERBAIKI: Ubah ke 'home'
    'maintenance.dashboard': '/maintenance/dashboard',
    'maintenance.data-management.index': '/maintenance/data-management',
    'profile.edit': '/profile',
    'logout': '/logout',
};

const getRoute = (routeName, params = undefined) => {
    try {
        if (typeof route !== 'undefined' && route().has(routeName)) {
            return route(routeName, params);
        }
    } catch (e) {
        // Abaikan error Ziggy jika terjadi
    }
    return ROUTE_FALLBACKS[routeName] || '#';
};

export default function AuthenticatedLayout({ header, children }) {
    const { auth, flash, url } = usePage().props;
    const currentUrl = usePage().url; // Mendapatkan path URL aktif saat ini
    const user = auth?.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(true);
    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);

    // Helper Pengecekan Active Link (Anti Crash)
    const checkActive = (routeName) => {
        try {
            if (typeof route !== 'undefined' && route().has(routeName)) {
                if (route().current(routeName)) return true;
            }
        } catch (e) {
            // Fallback
        }

        const fallbackPath = ROUTE_FALLBACKS[routeName];
        if (fallbackPath && currentUrl) {
            return currentUrl === fallbackPath || currentUrl.startsWith(fallbackPath);
        }
        return false;
    };

            // Logika Theme Switcher
        const [isDark, setIsDark] = useState(() => {
            if (typeof window !== 'undefined') {
                const savedTheme = localStorage.getItem('theme');
                return savedTheme ? savedTheme === 'dark' : true;
            }
            return true;
        });

        // ✅ TAMBAHKAN FUNGSI INI
        const toggleTheme = () => {
            setIsDark((prev) => !prev);
        };

        useEffect(() => {
            if (isDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }, [isDark]);

    // Auto Pop-Up Toast
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0B1437] text-slate-900 dark:text-slate-100 font-sans selection:bg-red-500 selection:text-white transition-colors duration-300">
            
            <Toaster position="bottom-right" theme={isDark ? "dark" : "light"} richColors closeButton />

            {/* HEADER UTAMA */}
            <header className="sticky top-0 z-50 w-full flex flex-col shadow-sm transition-all duration-300 relative group">
                
                {/* --- TIER 1: Topbar --- */}
                <div className="relative z-50 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-8 flex items-center justify-between">
                    
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-700 to-red-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-600/40">
                            M
                        </div>
                        <div className="hidden sm:block">
                            <span className="font-bold text-lg tracking-wider text-slate-800 dark:text-slate-100 block leading-none">
                                MITRATEL
                            </span>
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium tracking-widest uppercase mt-1 block">
                                Command Center
                            </span>
                        </div>

                       {header && (
                        <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200 dark:border-white/10">
                            <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium gap-1.5">
                                {/* ✅ DIPERBAIKI: getRoute('home') */}
                                <Link href={getRoute('home')} className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                    Home
                                </Link>
                                <span>/</span>
                                <div className="text-slate-800 dark:text-slate-200 font-semibold text-xs leading-none">
                                    {header}
                                </div>
                            </nav>
                        </div>
                    )}
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:scale-105 transition-all shadow-sm"
                            title="Ganti Tema"
                        >
                            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                        </button>

                        <div className="relative">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition duration-150 shadow-sm"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-red-600/20 dark:bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xs">
                                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <span className="hidden sm:inline">{user?.name}</span>
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl text-slate-800 dark:text-slate-200 relative z-[60]">
                                    <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10 text-xs">
                                        <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                                        <p className="text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                                    </div>
                                    <Dropdown.Link href={getRoute('profile.edit')} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors">
                                        <UserIcon className="w-4 h-4 text-slate-400" /> Profile
                                    </Dropdown.Link>
                                    <Dropdown.Link href={getRoute('logout')} method="post" as="button" className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors">
                                        <LogOut className="w-4 h-4" /> Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        <button
                            onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:hidden"
                        >
                            {showingNavigationDropdown ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* --- TIER 2: Navigation Menu --- */}
                <div 
                    className={`hidden md:block transition-all duration-300 ease-in-out z-40 ${
                        isNavOpen ? 'max-h-16 opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                >
                    <nav className="flex h-14 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-8 items-center gap-2">
                        
                        {/* ✅ DIPERBAIKI: getRoute('home') dan checkActive('home') */}
                        <Link
                            href={getRoute('home')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                checkActive('home')
                                    ? 'bg-red-500/10 text-red-600 dark:bg-red-600/20 dark:text-red-400 font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Home className="w-4 h-4" /> Home
                        </Link>

                        <div 
                            className="relative py-2"
                            onMouseEnter={() => setIsMaintenanceOpen(true)}
                            onMouseLeave={() => setIsMaintenanceOpen(false)}
                        >
                            <button
                                type="button"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                    isMaintenanceOpen || checkActive('maintenance.dashboard') || checkActive('maintenance.data-management.index')
                                        ? 'bg-slate-200/60 dark:bg-white/10 text-slate-900 dark:text-white font-semibold' 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Wrench className="w-4 h-4" /> Maintenance
                                <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isMaintenanceOpen ? 'rotate-180 text-red-500' : ''}`} />
                            </button>

                            {isMaintenanceOpen && (
                                <div className="absolute left-0 top-full pt-1 z-[60] w-56 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl text-slate-800 dark:text-slate-200">
                                        <Link 
                                            href={getRoute('maintenance.dashboard')} 
                                            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                                                checkActive('maintenance.dashboard')
                                                    ? 'bg-red-500/10 text-red-600 dark:bg-red-600/20 dark:text-red-400 font-semibold'
                                                    : 'hover:bg-slate-100 dark:hover:bg-white/10 hover:text-red-600 dark:hover:text-red-400 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <LayoutDashboard className="w-4 h-4" /> Dashboard Maintenance
                                        </Link>
                                        <Link 
                                            href={getRoute('maintenance.data-management.index')} 
                                            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                                                checkActive('maintenance.data-management.index')
                                                    ? 'bg-red-500/10 text-red-600 dark:bg-red-600/20 dark:text-red-400 font-semibold'
                                                    : 'hover:bg-slate-100 dark:hover:bg-white/10 hover:text-red-600 dark:hover:text-red-400 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <Database className="w-4 h-4" /> Data Management
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                    </nav>
                </div>

                {/* Floating Toggle Button */}
                <button
                    onClick={() => setIsNavOpen(!isNavOpen)}
                    className="hidden md:flex absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-50 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 hover:border-red-500 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 cursor-pointer pointer-events-none group-hover:pointer-events-auto"
                    title={isNavOpen ? "Sembunyikan Navigasi" : "Tampilkan Navigasi"}
                >
                    {isNavOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Mobile Navigation Drawer */}
                {showingNavigationDropdown && (
                    <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200 dark:border-white/10 px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
                        
                        {/* ✅ DIPERBAIKI: getRoute('home') dan checkActive('home') */}
                        <Link 
                            href={getRoute('home')} 
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                                checkActive('home')
                                    ? 'bg-red-500/10 text-red-600 dark:bg-red-600/20 dark:text-red-400 font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Home className="w-5 h-5" /> Home
                        </Link>
                        
                        <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Maintenance</p>
                            <Link 
                                href={getRoute('maintenance.dashboard')} 
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${
                                    checkActive('maintenance.dashboard')
                                        ? 'bg-red-500/10 text-red-600 dark:bg-red-600/20 dark:text-red-400 font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4" /> Dashboard Maintenance
                            </Link>
                            <Link 
                                href={getRoute('maintenance.data-management.index')} 
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${
                                    checkActive('maintenance.data-management.index')
                                        ? 'bg-red-500/10 text-red-600 dark:bg-red-600/20 dark:text-red-400 font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Database className="w-4 h-4" /> Data Management
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* AREA KONTEN UTAMA */}
            <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 relative z-10 pt-6">
                {children}
            </main>
        </div>
    );
}