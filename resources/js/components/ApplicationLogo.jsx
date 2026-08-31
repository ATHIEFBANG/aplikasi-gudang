import React from 'react';
import { cn } from '@/lib/utils';
import { Boxes } from 'lucide-react';

// Import asset langsung dari resources/images agar diproses & di-hash oleh Vite
import defaultLogo from '../../images/ppl.png';

export function AppLogo({ 
    className, 
    imageSrc = defaultLogo, 
    showTextOnMobile = false, 
    ...props 
}) {
    return (
        <div className={cn('flex items-center gap-3 select-none group/logo', className)} {...props}>
            {/* LOGO IMAGE / FALLBACK ICON */}
            {imageSrc ? (
                <img 
                    src={imageSrc} 
                    alt="Logo Panca Pilar Laksana" 
                    className="w-10 h-10 object-contain group-hover/logo:scale-105 transition-transform duration-300"
                />
            ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover/logo:scale-105 group-hover/logo:shadow-amber-500/40 transition-all duration-300">
                    <Boxes className="w-5 h-5 text-amber-200" />
                </div>
            )}

            {/* BRAND TEXT */}
            <div className={showTextOnMobile ? "flex flex-col" : "hidden sm:flex flex-col"}>
                <span className="font-extrabold text-base tracking-wider text-slate-800 dark:text-slate-100 block leading-none group-hover/logo:text-blue-600 dark:group-hover/logo:text-amber-400 transition-colors duration-200">
                    PANCA PILAR LAKSANA
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold tracking-[0.2em] uppercase mt-1 block">
                    Warehouse Management
                </span>
            </div>
        </div>
    );
}

export default AppLogo;