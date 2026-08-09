import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export function NavLink({ href, active, children, className, ...props }) {
    const { url } = usePage();
    
    // Otomatis aktif jika URL saat ini cocok dengan href (jika prop 'active' tidak diisi)
    const isActive = active !== undefined ? active : url.startsWith(href);

    return (
        <Link
            href={href}
            {...props}
            className={cn(
                'inline-flex items-center px-3.5 py-2 text-sm font-medium transition-all duration-200 rounded-lg',
                isActive
                    ? 'text-red-600 dark:text-red-400 bg-red-500/10 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60',
                className
            )}
        >
            {children}
        </Link>
    );
}

// Tambahkan baris ini di paling bawah:
export default NavLink;