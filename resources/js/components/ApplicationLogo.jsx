import React from 'react';
import { cn } from '@/lib/utils';
import { Boxes } from 'lucide-react';

// Import asset langsung dari resources/images agar dibundle oleh Vite
import defaultLogo from '../../images/ppll.png';

export function AppLogo({ 
    className, 
    imageSrc = defaultLogo, 
    showTextOnMobile = false, 
    ...props 
}) {
    return (
        <div className={cn('flex items-center gap-3 select-none', className)} {...props}>
            {/* LOGO IMAGE / FALLBACK ICON (Tanpa Bayangan) */}
            {imageSrc ? (
                <img 
                    src={imageSrc} 
                    alt="Logo Panca Pilar Laksana" 
                    className="w-10 h-10 object-contain"
                />
            ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-amber-500 flex items-center justify-center text-white">
                    <Boxes className="w-5 h-5 text-amber-200" />
                </div>
            )}

            {/* BRAND TEXT (Adaptif: Terbaca Jelas di Light Mode & Dark Mode) */}
            <div className={showTextOnMobile ? "flex flex-col" : "hidden sm:flex flex-col"}>
                <span className="font-extrabold text-base tracking-wider text-slate-900 dark:text-white block leading-none">
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