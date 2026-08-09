import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/components/ApplicationLogo';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 dark:bg-[#0B1437] text-slate-900 dark:text-slate-100 p-4 transition-colors duration-300">
            {/* Logo Terpusat */}
            <div className="mb-6 flex flex-col items-center gap-2">
                <Link href="/" className="group">
                    <ApplicationLogo />
                </Link>
            </div>

            {/* Container tanpa double-border, menyerahkan styling ke <Card> shadcn */}
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    );
}