import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect, createContext, useContext } from 'react';

// --- IMPORT LOGO COMPONENT ---
import ApplicationLogo from '@/components/ApplicationLogo';

// --- IMPORT KOMPONEN NOTIFIKASI, CONFIRM MODAL & LOADING ---
import { Toast, ConfirmModal } from '@/components/ui/Notifikasi';
import Loading from '@/components/ui/Loading';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    LayoutDashboard,
    Package,
    ArrowLeftRight,
    FileSpreadsheet,
    User as UserIcon,
    LogOut,
    Sun,
    Moon,
    Menu,
    X,
    ChevronDown,
    ChevronUp,
    Shield,
} from 'lucide-react';

const ConfirmContext = createContext();
export const useConfirm = () => useContext(ConfirmContext);

const ROUTE_FALLBACKS = {
    'dashboard': '/dashboard',
    'home': '/dashboard',
    'barang.index': '/barang',
    'transaksi.index': '/transaksi',
    'laporan.index': '/laporan',
    'admin.users.index': '/admin/users',
    'profile.edit': '/profile',
    'logout': '/logout',
};

const getRoute = (routeName, params = undefined) => {
    try {
        if (typeof route !== 'undefined' && typeof route === 'function') {
            return route(routeName, params);
        }
    } catch (e) {}
    return ROUTE_FALLBACKS[routeName] || '#';
};

export default function AuthenticatedLayout({ header, children }) {
    const { auth, flash, errors } = usePage().props;
    const currentUrl = usePage().url;
    const user = auth?.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(true);
    const [isPageLoading, setIsPageLoading] = useState(false);

    // Inertia Loading Listener
    useEffect(() => {
        const removeStartEventListener = router.on('start', () => setIsPageLoading(true));
        const removeFinishEventListener = router.on('finish', () => setIsPageLoading(false));
        return () => {
            removeStartEventListener();
            removeFinishEventListener();
        };
    }, []);

    // Toast State
    const [toastState, setToastState] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        key: Date.now()
    });

    // Confirm Modal State
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        confirmText: 'Ya, Lanjutkan',
        cancelText: 'Batal',
        onConfirm: null,
    });

    const confirm = ({ 
        title, 
        message, 
        variant = 'danger', 
        confirmText = 'Ya, Lanjutkan', 
        cancelText = 'Batal', 
        onConfirm 
    }) => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            variant,
            confirmText,
            cancelText,
            onConfirm: () => {
                onConfirm?.();
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Flash Notification Watcher
    useEffect(() => {
        const hasErrors = errors && Object.keys(errors).length > 0;
        if (flash?.success) {
            setToastState({ isOpen: true, type: 'success', title: 'BERHASIL', message: flash.success, key: Date.now() });
        } else if (flash?.error || hasErrors) {
            const errorMsg = flash?.error || Object.values(errors)[0] || "Terjadi kesalahan pada sistem atau inputan Anda.";
            setToastState({ isOpen: true, type: 'error', title: 'GAGAL', message: errorMsg, key: Date.now() });
        } else if (flash?.info) {
            setToastState({ isOpen: true, type: 'info', title: 'INFORMASI', message: flash.info, key: Date.now() });
        }
    }, [flash, errors]);

    // Active Route Check
    const checkActive = (routeName) => {
        try {
            if (typeof route !== 'undefined' && typeof route === 'function') {
                if (route().current(routeName) || route().current(`${routeName.split('.')[0]}.*`)) return true;
            }
        } catch (e) {}
        const fallbackPath = ROUTE_FALLBACKS[routeName];
        if (fallbackPath && currentUrl) {
            return currentUrl === fallbackPath || currentUrl.startsWith(fallbackPath);
        }
        return false;
    };

    // Dark Mode Theme Handler
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            return savedTheme ? savedTheme === 'dark' : true;
        }
        return true;
    });

    const toggleTheme = () => setIsDark((prev) => !prev);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
            case 'staff':
                return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
            default:
                return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
        }
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-amber-50/20 dark:from-[#080d24] dark:via-[#0c1538] dark:to-[#060a1c] text-slate-900 dark:text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300 relative overflow-x-hidden">
                
                {/* BACKGROUND ANIMASI LOGISTIK */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-25 print:hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f615_1px,transparent_1px),linear-gradient(to_bottom,#3b82f615_1px,transparent_1px)] bg-[size:48px_48px]" />
                    
                    <div className="absolute inset-x-0 bottom-36 h-48 flex items-end">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1200 200">
                            <defs>
                                <linearGradient id="lineGradPPL" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
                                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                                </linearGradient>
                            </defs>
                            <path 
                                d="M 0,150 Q 150,50 300,120 T 600,80 T 900,40 T 1200,100" 
                                fill="none" 
                                stroke="url(#lineGradPPL)" 
                                strokeWidth="3.5"
                                className="animate-pulse"
                            />
                            <path 
                                d="M 0,150 Q 150,50 300,120 T 600,80 T 900,40 T 1200,100 L 1200,200 L 0,200 Z" 
                                fill="url(#lineGradPPL)" 
                                fillOpacity="0.08" 
                            />
                        </svg>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-48 flex items-end justify-between px-6">
                        {[40, 65, 30, 85, 50, 90, 60, 35, 80, 55, 25, 75, 45, 70, 55, 85, 40, 80, 30, 90, 50, 65, 35, 75].map((height, i) => (
                            <div 
                                key={i} 
                                className="w-3.5 bg-gradient-to-t from-blue-600/20 via-blue-500/35 to-amber-500/40 rounded-t-sm"
                                style={{
                                    height: `${height}%`,
                                    animation: `pulse ${2 + (i % 3)}s ease-in-out infinite alternate`,
                                    animationDelay: `${i * 0.12}s`
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-[180px] pointer-events-none animate-pulse duration-1000 print:hidden" />
                <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-[190px] pointer-events-none print:hidden" />

                {isPageLoading && <Loading message="Memproses Data Gudang..." />}

                {/* NAVBAR & HEADER */}
                <header className="sticky top-0 z-50 w-full flex flex-col shadow-lg transition-all duration-300 relative group print:hidden">
                    
                    {/* TIER 1: Top Header Bar */}
                    <div className="relative z-50 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 flex justify-center w-full">
                        <div className="w-full max-w-screen-2xl px-6 sm:px-12 flex items-center justify-between h-full">
                            
                            {/* Logo PPL & Breadcrumb */}
                            <div className="flex items-center gap-4">
                                <Link 
                                    href={getRoute('dashboard')} 
                                    className="focus:outline-none transition-transform active:scale-95"
                                    title="Panca Pilar Laksana"
                                >
                                    <ApplicationLogo />
                                </Link>

                                {header && (
                                    <div className="hidden md:flex items-center gap-2 ml-4 pl-5 border-l border-slate-200 dark:border-white/10">
                                        <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium gap-2">
                                            <Link href={getRoute('dashboard')} className="hover:text-blue-600 dark:hover:text-amber-400 transition-colors">
                                                Dashboard
                                            </Link>
                                            <span className="text-slate-300 dark:text-slate-600">/</span>
                                            <div className="text-slate-800 dark:text-slate-200 font-bold text-xs bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-white/10">
                                                {header}
                                            </div>
                                        </nav>
                                    </div>
                                )}
                            </div>

                            {/* Tools, Theme, Role & Profil Dropdown */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition-all focus:outline-none active:scale-95 border border-transparent hover:border-slate-300/50 dark:hover:border-white/10 cursor-pointer"
                                    title="Ganti Tema"
                                >
                                    {isDark ? <Sun className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> : <Moon className="w-5 h-5 text-blue-600" />}
                                </button>

                                {user?.role === 'admin' && (
                                    <Link
                                        href={getRoute('admin.users.index')}
                                        className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                                            checkActive('admin.users.index')
                                                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-sm'
                                                : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-blue-600 dark:hover:text-amber-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <Shield className="w-4 h-4 text-amber-500" />
                                        <span className="hidden lg:inline">Admin Panel</span>
                                    </Link>
                                )}

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 px-3.5 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 transition duration-200 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/40 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 active:scale-98 cursor-pointer"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-amber-500 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <span className="hidden sm:inline font-medium">{user?.name}</span>
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 z-[60]">
                                        <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-1">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{user?.name}</p>
                                            <div className="mt-1 mb-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md border ${getRoleBadgeStyle(user?.role)}`}>
                                                    {user?.role || 'User'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                                        </div>

                                        <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/10 my-1" />
                                        
                                        <DropdownMenuItem className="p-0 focus:bg-transparent">
                                            <Link href={getRoute('profile.edit')} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                                <UserIcon className="w-4 h-4 text-slate-400" /> Edit Profile
                                            </Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="p-0 focus:bg-transparent">
                                            <Link href={getRoute('logout')} method="post" as="button" className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors text-left cursor-pointer">
                                                <LogOut className="w-4 h-4" /> Log Out
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <button
                                    type="button"
                                    onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
                                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:hidden cursor-pointer"
                                >
                                    {showingNavigationDropdown ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TIER 2: Main Navigation Menu (Dashboard, Master Barang, Transaksi Stok, Laporan Bulanan) */}
                    <div 
                        className={`hidden md:flex justify-center w-full transition-all duration-300 ease-in-out z-40 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 border-b border-blue-800/80 dark:border-blue-900/60 shadow-md ${
                            isNavOpen ? 'max-h-14 opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
                        }`}
                    >
                        <nav className="w-full max-w-screen-2xl px-6 sm:px-12 flex h-14 items-center gap-6 sm:gap-8">
                            
                            {/* 1. DASHBOARD */}
                            <Link
                                href={getRoute('dashboard')}
                                className={`flex items-center gap-2 px-1 h-full font-medium text-sm transition-all duration-200 outline-none border-b-[3px] ${
                                    checkActive('dashboard')
                                        ? 'border-amber-400 text-amber-300 font-bold'
                                        : 'border-transparent text-white/80 hover:text-white hover:border-white/50'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Dashboard</span>
                            </Link>

                            {/* 2. MASTER BARANG */}
                            <Link
                                href={getRoute('barang.index')}
                                className={`flex items-center gap-2 px-1 h-full font-medium text-sm transition-all duration-200 outline-none border-b-[3px] ${
                                    checkActive('barang.index')
                                        ? 'border-amber-400 text-amber-300 font-bold'
                                        : 'border-transparent text-white/80 hover:text-white hover:border-white/50'
                                }`}
                            >
                                <Package className="w-4 h-4" />
                                <span>Master Barang</span>
                            </Link>

                            {/* 3. TRANSAKSI STOK */}
                            <Link
                                href={getRoute('transaksi.index')}
                                className={`flex items-center gap-2 px-1 h-full font-medium text-sm transition-all duration-200 outline-none border-b-[3px] ${
                                    checkActive('transaksi.index')
                                        ? 'border-amber-400 text-amber-300 font-bold'
                                        : 'border-transparent text-white/80 hover:text-white hover:border-white/50'
                                }`}
                            >
                                <ArrowLeftRight className="w-4 h-4" />
                                <span>Transaksi Stok</span>
                            </Link>

                            {/* 4. LAPORAN BULANAN */}
                            <Link
                                href={getRoute('laporan.index')}
                                className={`flex items-center gap-2 px-1 h-full font-medium text-sm transition-all duration-200 outline-none border-b-[3px] ${
                                    checkActive('laporan.index')
                                        ? 'border-amber-400 text-amber-300 font-bold'
                                        : 'border-transparent text-white/80 hover:text-white hover:border-white/50'
                                }`}
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                <span>Laporan Bulanan</span>
                            </Link>

                        </nav>
                    </div>

                    {/* Floating Toggle Nav Button */}
                    <button
                        type="button"
                        onClick={() => setIsNavOpen(!isNavOpen)}
                        className="hidden md:flex absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-50 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-500 dark:hover:text-amber-400 transition-all duration-300 cursor-pointer pointer-events-none group-hover:pointer-events-auto"
                        title={isNavOpen ? "Sembunyikan Navigasi" : "Tampilkan Navigasi"}
                    >
                        {isNavOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Mobile Navigation Drawer */}
                    {showingNavigationDropdown && (
                        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200 dark:border-white/10 px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
                            <Link 
                                href={getRoute('dashboard')} 
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    checkActive('dashboard') 
                                        ? 'bg-blue-600 text-white shadow-sm' 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </Link>
                            <Link 
                                href={getRoute('barang.index')} 
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    checkActive('barang.index') 
                                        ? 'bg-blue-600 text-white shadow-sm' 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Package className="w-4 h-4" /> Master Barang
                            </Link>
                            <Link 
                                href={getRoute('transaksi.index')} 
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    checkActive('transaksi.index') 
                                        ? 'bg-blue-600 text-white shadow-sm' 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <ArrowLeftRight className="w-4 h-4" /> Transaksi Stok
                            </Link>
                            <Link 
                                href={getRoute('laporan.index')} 
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    checkActive('laporan.index') 
                                        ? 'bg-blue-600 text-white shadow-sm' 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <FileSpreadsheet className="w-4 h-4" /> Laporan Bulanan
                            </Link>

                            {user?.role === 'admin' && (
                                <Link 
                                    href={getRoute('admin.users.index')} 
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-amber-500/30 ${
                                        checkActive('admin.users.index') 
                                            ? 'bg-amber-500 text-white shadow-sm' 
                                            : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                                    }`}
                                >
                                    <Shield className="w-4 h-4" /> Kelola User (Admin)
                                </Link>
                            )}
                        </div>
                    )}
                </header>

                {/* KONTEN UTAMA */}
                <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 relative z-10 pt-6">
                    {children}
                </main>

                {/* CONTAINER NOTIFIKASI TOAST (Ditinggikan ke z-[99999] agar di atas modal) */}
                <div className="relative z-[99999]">
                    <Toast 
                        key={toastState.key} 
                        isOpen={toastState.isOpen} 
                        type={toastState.type} 
                        title={toastState.title} 
                        message={toastState.message} 
                        duration={4000} 
                        onClose={() => setToastState(prev => ({ ...prev, isOpen: false }))} 
                    />
                </div>
                
                {/* CONTAINER CONFIRM MODAL (Ditinggikan ke z-[99999] agar di atas modal) */}
                <div className="relative z-[99999]">
                    <ConfirmModal 
                        isOpen={confirmState.isOpen} 
                        title={confirmState.title} 
                        message={confirmState.message} 
                        variant={confirmState.variant} 
                        confirmText={confirmState.confirmText} 
                        cancelText={confirmState.cancelText} 
                        onConfirm={confirmState.onConfirm} 
                        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))} 
                    />
                </div>
            </div>
        </ConfirmContext.Provider>
    );
}