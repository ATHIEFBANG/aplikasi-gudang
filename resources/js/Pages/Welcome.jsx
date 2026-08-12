import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// Lucide Icons Aman
import { 
    LayoutDashboard, 
    LogIn, 
    ChevronRight, 
    Globe,
    Radio,
    Cpu,
    FileCheck,
    Layers,
    Users,
    Briefcase,
    Award,
    CheckSquare,
    ArrowRight,
    Send
} from 'lucide-react';

export default function Welcome({ auth }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [email, setEmail] = useState('');

    const slides = [
        {
            subtitle: "FOR TELECOMMUNICATION & INFRASTRUCTURE",
            title: "PUSAT KENDALI EKOSISTEM DIGITAL",
            description: "Kelola operasi jaringan menara, konektivitas fiber optik, serta pemantauan site secara terintegrasi dan real-time di seluruh Indonesia.",
            image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop"
        },
        {
            subtitle: "SMART MONITORING & ANALYTICS",
            title: "PEMANTAUAN ASET REAL-TIME 24/7",
            description: "Pengawasan utilitas daya listrik, status baterai cadangan, dan penanganan insiden lapangan secara cepat serta terukur.",
            image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1200&auto=format&fit=crop"
        },
        {
            subtitle: "NATIONAL COVERAGE & HIGH SLA",
            title: "KEANDALAN OPERASIONAL TERINTEGRASI",
            description: "Dukungan penuh keandalan jaringan telekomunikasi nasional dengan ketersediaan SLA hingga 99.9%.",
            image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop"
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email) {
            alert(`Terima kasih! Email ${email} berhasil terdaftar.`);
            setEmail('');
        }
    };

    return (
        <>
            <Head title="Mitratel - Command Center" />

            <div className="min-h-screen bg-[#070714] text-white font-sans selection:bg-red-500 selection:text-white overflow-x-hidden">
                
                {/* ================= NAVBAR ================= */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-[#070714]/90 backdrop-blur-md border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                        
                        {/* Logo Mitratel */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-cyan-400 flex items-center justify-center font-black text-white text-xl rounded-sm shadow-[0_0_12px_rgba(239,68,68,0.5)] group-hover:scale-105 transition-transform">
                                M
                            </div>
                            <span className="font-extrabold text-lg tracking-widest text-white uppercase">
                                MITRA<span className="text-red-500">TEL</span>
                            </span>
                        </Link>

                        {/* Menu Navigasi */}
                        <nav className="hidden lg:flex items-center gap-8 text-xs font-bold tracking-[0.2em] text-slate-300 uppercase">
                            <a href="#home" className="text-red-500 border-b-2 border-red-500 pb-1">Beranda</a>
                            <a href="#services" className="hover:text-cyan-400 transition-colors">Layanan</a>
                            <a href="#stats" className="hover:text-cyan-400 transition-colors">Statistik</a>
                            <a href="#portfolio" className="hover:text-cyan-400 transition-colors">Portofolio</a>
                        </nav>

                        {/* Sosmed Top Bar & Login Button */}
                        <div className="flex items-center gap-5">
                            <div className="hidden sm:flex items-center gap-4 text-slate-400 text-sm border-r border-white/10 pr-5">
                                <a href="#" className="hover:text-red-500 transition-colors" title="Website"><Globe className="w-4 h-4" /></a>
                                <a href="#" className="hover:text-cyan-400 transition-colors" title="X / Twitter">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                </a>
                                <a href="#" className="hover:text-red-500 transition-colors" title="Instagram">
                                    <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                                </a>
                            </div>

                            {auth?.user ? (
                                <Link 
                                    href="/home"
                                    className="bg-gradient-to-r from-red-600 to-cyan-500 hover:from-red-500 hover:to-cyan-400 text-white font-extrabold tracking-wider text-xs uppercase px-5 py-2.5 flex items-center gap-2 rounded-none shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>
                            ) : (
                                <Link 
                                    href="/login"
                                    className="bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold tracking-wider text-xs uppercase px-5 py-2.5 flex items-center gap-2 rounded-none shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all"
                                >
                                    <LogIn className="h-4 w-4" />
                                    Masuk
                                </Link>
                            )}
                        </div>

                    </div>
                </header>

                {/* ================= HERO SECTION (Tinggi Disimpulkan & Ditinggikan Pas) ================= */}
                <section id="home" className="relative pt-28 lg:pt-32 pb-12 flex items-center justify-center overflow-hidden bg-[#0a071a]">
                    
                    {/* 1. Gambar Background Utama */}
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop" 
                            alt="Hero Cyber Background" 
                            className="w-full h-full object-cover opacity-50 mix-blend-luminosity filter brightness-90 contrast-125"
                        />
                    </div>

                    {/* 2. Vektor Siluet & Glow Magenta/Purple */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0d0928]/95 via-[#120e36]/80 to-[#070714]/90" />
                    
                    {/* Glowing Orbs Latar Belakang */}
                    <div className="absolute top-1/4 left-10 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-5 left-1/3 w-72 h-72 bg-cyan-500/20 rounded-full blur-[90px] pointer-events-none" />
                    <div className="absolute top-5 right-10 w-80 h-80 bg-red-600/15 rounded-full blur-[100px] pointer-events-none" />

                    {/* Pattern Grid Line Cyber */}
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
                        <div className="grid lg:grid-cols-12 gap-10 items-center">
                            
                            {/* Kiri: Teks Hero */}
                            <div className="lg:col-span-6 space-y-6">
                                <div className="text-red-500 text-xs font-bold tracking-[0.25em] uppercase flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-red-500 inline-block" />
                                    {slides[currentSlide].subtitle}
                                </div>

                                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white uppercase transition-all duration-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                                    {slides[currentSlide].title}
                                </h1>

                                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl font-normal drop-shadow">
                                    {slides[currentSlide].description}
                                </p>

                                <div className="pt-2">
                                    <Link href={auth?.user ? "/home" : "/login"} className="inline-block group">
                                        <div className="relative border-2 border-red-500/80 p-1 transition-all duration-300 group-hover:border-red-500">
                                            <div className="bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-[0.2em] uppercase px-7 py-3.5 flex items-center gap-3 transition-transform group-hover:translate-x-1 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                                                <span>{auth?.user ? "BUKA COMMAND CENTER" : "MASUK KE SISTEM"}</span>
                                                <ChevronRight className="w-4 h-4 stroke-[3]" />
                                            </div>
                                        </div>
                                    </Link>
                                </div>

                                {/* Slide Numbers 01 02 03 */}
                                <div className="pt-4 flex items-center gap-6 text-sm font-mono tracking-widest text-slate-400">
                                    {slides.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentSlide(idx)}
                                            className={`transition-all duration-300 flex flex-col items-center gap-1 cursor-pointer ${
                                                currentSlide === idx ? 'text-white font-bold scale-110' : 'hover:text-slate-200'
                                            }`}
                                        >
                                            <span>0{idx + 1}</span>
                                            <span className={`h-[2px] transition-all duration-300 ${currentSlide === idx ? 'w-8 bg-red-500' : 'w-0 bg-transparent'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Kanan: Box Frame Foto */}
                            <div className="lg:col-span-6 relative">
                                <div className="relative mx-auto max-w-lg lg:max-w-none">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600/50 to-cyan-500/50 blur-lg opacity-60" />

                                    <div className="relative aspect-[4/3] bg-[#0c0d21] border-2 border-red-500/70 overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                                        <img 
                                            src={slides[currentSlide].image} 
                                            alt="Showcase Preview" 
                                            className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                                        />
                                        
                                        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-red-500 pointer-events-none" />
                                        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ================= SECTION LAYANAN ("WHAT WE DO?") ================= */}
                <section id="services" className="py-20 bg-[#050510] relative border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid lg:grid-cols-12 gap-12 items-start">
                            
                            <div className="lg:col-span-5 space-y-6">
                                <div className="text-red-500 text-xs font-extrabold tracking-[0.25em] uppercase">
                                    OUR SERVICES
                                </div>
                                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-tight">
                                    WHAT WE DO?
                                </h2>
                                <div className="w-16 h-[3px] bg-gradient-to-r from-red-500 to-cyan-400" />

                                <p className="text-slate-400 text-sm leading-relaxed pr-6">
                                    Kami menyediakan solusi terpadu infrastruktur telekomunikasi mulai dari manajemen menara, pemantauan jaringan fiber optic, hingga pengelolaan daya site secara terpusat.
                                </p>

                                <div className="pt-4">
                                    <a href="#services" className="inline-block relative group">
                                        <div className="relative px-8 py-4 text-xs font-extrabold tracking-[0.2em] text-white uppercase bg-[#0e0f24] border border-white/10 group-hover:text-red-500 transition-colors">
                                            <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-red-500" />
                                            <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
                                            VIEW ALL SERVICES
                                        </div>
                                    </a>
                                </div>
                            </div>

                            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 border border-red-500/60 flex items-center justify-center text-red-500 bg-[#0c0d21]">
                                        <Radio className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                                        Tower & Collocation
                                    </h3>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        Pengelolaan tenancy menara makro dan mikrosite untuk efisiensi ekosistem penyedia layanan seluler.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="w-12 h-12 border border-cyan-400/60 flex items-center justify-center text-cyan-400 bg-[#0c0d21]">
                                        <Cpu className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                                        Fiber Optic Network
                                    </h3>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        Konektivitas serat optik berkecepatan tinggi yang menghubungkan antar site dengan transmisi stabil.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="w-12 h-12 border border-red-500/60 flex items-center justify-center text-red-500 bg-[#0c0d21]">
                                        <FileCheck className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                                        Power & Utility Control
                                    </h3>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        Pengawasan otomatis terhadap genset, rectifiers, dan backup baterai cadangan secara real-time.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="w-12 h-12 border border-cyan-400/60 flex items-center justify-center text-cyan-400 bg-[#0c0d21]">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                                        Field Work Order
                                    </h3>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        Sistem tiket otomatis untuk penyelesaian gangguan operasional teknisi di lapangan secara efisien.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ================= SECTION STATISTIK KETUPAT ZIG-ZAG RAPI ================= */}
                <section id="stats" className="py-28 bg-[#04040c] relative overflow-hidden border-t border-white/5">
                    
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
                    <div className="hidden lg:block absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-14 lg:gap-16">
                            
                            {/* Ketupat 1 (BAWAH) */}
                            <div className="relative group transition-all duration-300 md:translate-y-12">
                                <div className="w-48 h-48 sm:w-52 sm:h-52 md:w-56 md:h-56 border border-cyan-500/40 bg-[#0a0b1e]/90 rotate-45 flex items-center justify-center transition-all duration-300 group-hover:border-cyan-400 group-hover:bg-[#0c132d] shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                                    <div className="-rotate-45 text-center px-4">
                                        <Briefcase className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
                                        <div className="text-3xl font-black text-white tracking-tight">38,000+</div>
                                        <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-1">TOWER SITES</div>
                                    </div>
                                </div>
                            </div>

                            {/* Ketupat 2 (ATAS) */}
                            <div className="relative group transition-all duration-300 md:-translate-y-12">
                                <div className="w-48 h-48 sm:w-52 sm:h-52 md:w-56 md:h-56 border border-cyan-500/40 bg-[#0a0b1e]/90 rotate-45 flex items-center justify-center transition-all duration-300 group-hover:border-cyan-400 group-hover:bg-[#0c132d] shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                                    <div className="-rotate-45 text-center px-4">
                                        <Users className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
                                        <div className="text-3xl font-black text-white tracking-tight">1,068</div>
                                        <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-1">HAPPY CLIENTS</div>
                                    </div>
                                </div>
                            </div>

                            {/* Ketupat 3 (BAWAH) */}
                            <div className="relative group transition-all duration-300 md:translate-y-12">
                                <div className="w-48 h-48 sm:w-52 sm:h-52 md:w-56 md:h-56 border border-cyan-500/40 bg-[#0a0b1e]/90 rotate-45 flex items-center justify-center transition-all duration-300 group-hover:border-cyan-400 group-hover:bg-[#0c132d] shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                                    <div className="-rotate-45 text-center px-4">
                                        <CheckSquare className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
                                        <div className="text-3xl font-black text-white tracking-tight">99.9%</div>
                                        <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-1">SLA AVAILABILITY</div>
                                    </div>
                                </div>
                            </div>

                            {/* Ketupat 4 (ATAS) */}
                            <div className="relative group transition-all duration-300 md:-translate-y-12">
                                <div className="w-48 h-48 sm:w-52 sm:h-52 md:w-56 md:h-56 border border-cyan-500/40 bg-[#0a0b1e]/90 rotate-45 flex items-center justify-center transition-all duration-300 group-hover:border-cyan-400 group-hover:bg-[#0c132d] shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                                    <div className="-rotate-45 text-center px-4">
                                        <Award className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
                                        <div className="text-3xl font-black text-white tracking-tight">230+</div>
                                        <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-1">COMPILED PROJECTS</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ================= PORTOFOLIO / PHOTO GALLERY ================= */}
                <section id="portfolio" className="py-20 bg-[#070714] border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
                        <div>
                            <div className="text-red-500 text-xs font-bold tracking-[0.2em] uppercase">PORTFOLIO & ASSETS</div>
                            <h2 className="text-3xl font-black text-white uppercase mt-1">OUR RECENT WORKS</h2>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-7 grid grid-cols-2 gap-4">
                            <div className="relative aspect-video overflow-hidden border border-white/10 group">
                                <img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Work 1" />
                            </div>
                            <div className="relative aspect-video overflow-hidden border border-white/10 group">
                                <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Work 2" />
                            </div>
                            <div className="relative aspect-video overflow-hidden border border-white/10 group">
                                <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Work 3" />
                            </div>
                            <div className="relative aspect-video overflow-hidden border border-white/10 group">
                                <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Work 4" />
                            </div>
                        </div>

                        <div className="md:col-span-5 relative overflow-hidden border border-white/10 min-h-[300px] group">
                            <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Main Work" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#070714] via-transparent to-transparent opacity-70" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="text-xs font-bold text-red-500 tracking-widest uppercase">FEATURED PROJECT</div>
                                <div className="text-lg font-black text-white uppercase mt-1">COMMAND CENTER INTEGRATION</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= CALL TO ACTION (CTA) BANNER ================= */}
                <section className="relative py-24 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1600&auto=format&fit=crop" 
                            alt="Drone Infrastructure" 
                            className="w-full h-full object-cover filter brightness-50"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#181035]/90 via-[#0a1228]/85 to-[#070714]/90" />
                    </div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="max-w-2xl space-y-6">
                            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-tight">
                                Fresh Ideas, Fresh Infrastructure Giving Wings to your Stories.
                            </h2>
                            <p className="text-xs sm:text-sm font-bold tracking-[0.2em] text-slate-300 uppercase">
                                INC5000, BEST PLACES TO WORK 2031
                            </p>
                            <div className="pt-4">
                                <Link 
                                    href={auth?.user ? "/home" : "/login"}
                                    className="inline-block bg-cyan-400 hover:bg-red-500 text-black hover:text-white font-extrabold text-xs tracking-[0.2em] uppercase px-8 py-4 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-300"
                                >
                                    START YOUR STORIES
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= FOOTER ================= */}
                <footer className="bg-[#030309] text-white pt-16 pb-8 border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-6">
                        
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-12 border-b border-white/10">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-cyan-400 flex items-center justify-center font-black text-white text-lg rounded-sm">
                                    M
                                </div>
                                <span className="font-extrabold text-xl tracking-widest text-white uppercase">
                                    MITRA<span className="text-red-500">TEL</span>
                                </span>
                            </Link>

                            <div className="flex items-center gap-3">
                                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-600 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all" title="Facebook">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                </a>

                                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-cyan-400 border border-white/10 flex items-center justify-center text-slate-300 hover:text-black transition-all" title="Twitter / X">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                </a>

                                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-600 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all" title="Website">
                                    <Globe className="w-4 h-4" />
                                </a>

                                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-cyan-400 border border-white/10 flex items-center justify-center text-slate-300 hover:text-black transition-all" title="Instagram">
                                    <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                                </a>

                                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-600 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all" title="Youtube">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                </a>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 py-12 border-b border-white/10 text-xs text-slate-400">
                            <div className="lg:col-span-4 space-y-4">
                                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">About us</h3>
                                <p className="leading-relaxed text-slate-400 pr-4">
                                    Formed with precision and commitment, Mitratel is an award-winning digital infrastructure provider specializing in telecommunication towers, fiber optic, and smart monitoring solutions.
                                </p>
                                <a href="#" className="inline-flex items-center gap-2 text-cyan-400 hover:text-red-500 font-extrabold tracking-widest uppercase transition-colors pt-2">
                                    <span>READ MORE</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </a>
                            </div>

                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Who we are</h3>
                                <ul className="space-y-2.5 font-medium">
                                    <li><a href="#" className="hover:text-cyan-400 transition-colors">Team</a></li>
                                    <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
                                    <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact us</a></li>
                                    <li><a href="#" className="hover:text-cyan-400 transition-colors">Locations</a></li>
                                </ul>
                            </div>

                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Our work</h3>
                                <ul className="space-y-2.5 font-medium">
                                    <li><a href="#" className="hover:text-red-500 transition-colors">Tower Sites</a></li>
                                    <li><a href="#" className="hover:text-red-500 transition-colors">Fiber Optic</a></li>
                                    <li><a href="#" className="hover:text-red-500 transition-colors">Browse Archive</a></li>
                                    <li><a href="#" className="hover:text-red-500 transition-colors">Command Center</a></li>
                                </ul>
                            </div>

                            <div className="lg:col-span-4 space-y-4">
                                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Newsletter</h3>
                                <p className="leading-relaxed text-slate-400">
                                    Mitratel is an award-winning, full-service telecommunication infrastructure company specializing in national network coverage.
                                </p>
                                
                                <form onSubmit={handleSubscribe} className="flex items-center pt-2">
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="Email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#090918] border border-white/20 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                                    />
                                    <button 
                                        type="submit"
                                        className="bg-cyan-400 hover:bg-red-500 text-black hover:text-white px-5 py-3 transition-colors flex items-center justify-center"
                                    >
                                        <Send className="w-4 h-4 fill-current" />
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="pt-8 text-center text-xs text-slate-500">
                            Copyright © 2026 All rights reserved | Made with <span className="text-cyan-400">♥</span> for <span className="text-red-500 font-bold">Mitratel Command Center</span>
                        </div>

                    </div>
                </footer>

            </div>
        </>
    );
}