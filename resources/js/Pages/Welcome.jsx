import { Head, Link } from '@inertiajs/react';

// Helper logo
import AppLogo from '@/components/ApplicationLogo';

// UI Primitives (shadcn/ui)
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Icons
import { 
    TowerControl, 
    Network, 
    BarChart3, 
    ShieldCheck, 
    ArrowRight, 
    LayoutDashboard, 
    LogIn, 
    Building2 
} from 'lucide-react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    return (
        <>
            <Head title="Mitratel - Command Center & Infrastructure Platform" />

            <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between dark:bg-slate-950 dark:text-slate-100 selection:bg-red-600 selection:text-white">
                {/* Accent Top Bar */}
                <div className="h-1 w-full bg-red-600" />

                {/* Header / Navbar */}
                <header className="border-b border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <Link href="/" className="transition hover:opacity-90">
                            <AppLogo />
                        </Link>

                        {/* Nav Action */}
                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link href={route('home')}>
                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <Link href={route('login')}>
                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm">
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Masuk
                                    </Button>
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16 flex flex-col justify-center">
                    
                    {/* Hero Section */}
                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        
                        {/* Text Hero */}
                        <div className="lg:col-span-7 space-y-6">
                            <Badge variant="outline" className="px-3 py-1 text-xs font-semibold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-red-600 inline-block mr-2" />
                                Portal Operasional & Manajemen Aset Menara
                            </Badge>

                            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                                Pusat Kendali Ekosistem <br />
                                <span className="text-red-600">Infrastruktur Digital</span> Indonesia
                            </h1>

                            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                                Kelola operasi jaringan menara, konektivitas fiber optik, serta pemantauan site secara terintegrasi untuk mendukung keandalan layanan telekomunikasi nasional.
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                {auth.user ? (
                                    <Link href={route('home')}>
                                        <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 shadow-sm">
                                            Buka Command Center
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href={route('login')}>
                                        <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 shadow-sm">
                                            Masuk ke Sistem
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Operational Stats Grid */}
                        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardContent className="p-6">
                                    <TowerControl className="h-6 w-6 text-red-600 mb-3" />
                                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">38,000+</div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Total Menara Telekomunikasi</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardContent className="p-6">
                                    <Network className="h-6 w-6 text-red-600 mb-3" />
                                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">99.9%</div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">SLA Availability Status</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardContent className="p-6">
                                    <Building2 className="h-6 w-6 text-red-600 mb-3" />
                                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">National</div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Cakupan Seluruh Indonesia</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardContent className="p-6">
                                    <BarChart3 className="h-6 w-6 text-red-600 mb-3" />
                                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Real-time</div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Monitoring & Reporting</p>
                                </CardContent>
                            </Card>
                        </div>

                    </div>

                    {/* Modul Utama */}
                    <div className="mt-20">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Modul Layanan Utama</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Integrasi sistem untuk pengelolaan aset dan operasional secara akurat.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-600/40 transition-colors">
                                <CardHeader className="p-6">
                                    <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mb-3 border border-red-100 dark:border-red-900/50">
                                        <TowerControl className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-base font-bold">Manajemen Site & Collocation</CardTitle>
                                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                                        Pengelolaan profil menara, kapasitas tenancy, pendaftaran site baru, serta integrasi data aset terkini.
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-600/40 transition-colors">
                                <CardHeader className="p-6">
                                    <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mb-3 border border-red-100 dark:border-red-900/50">
                                        <Network className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-base font-bold">Fiber Optic & Power Monitoring</CardTitle>
                                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                                        Pengawasan utilitas jaringan serat optik, konsumsi daya listrik, dan cadangan baterai site secara aktif.
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-600/40 transition-colors">
                                <CardHeader className="p-6">
                                    <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mb-3 border border-red-100 dark:border-red-900/50">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-base font-bold">Ticketing & Work Order</CardTitle>
                                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                                        Sistem penanganan insiden, pemeliharaan berkala (preventive maintenance), dan respon teknisi lapangan.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>

                </main>

                {/* Footer */}
                <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">PT Dayamitra Telekomunikasi Tbk</span>
                            <span>&bull;</span>
                            <span>Mitratel Digital Infrastructure</span>
                        </div>
                        <div className="text-slate-400">
                            Laravel v{laravelVersion} (PHP v{phpVersion})
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}