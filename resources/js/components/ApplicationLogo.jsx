import React from 'react';
import { cn } from '@/lib/utils';
import { Boxes } from 'lucide-react';

// Import asset langsung dari resources/images
import defaultLogo from '../../images/ppl.png';

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

            {/* BRAND TEXT (Warna Putih Bersih Tanpa Hover Biru & Tanpa Bayangan) */}
            <div className={showTextOnMobile ? "flex flex-col" : "hidden sm:flex flex-col"}>
                <span className="font-extrabold text-base tracking-wider text-white block leading-none">
                    PANCA PILAR LAKSANA
                </span>
                <span className="text-[10px] text-amber-400 font-bold tracking-[0.2em] uppercase mt-1 block">
                    Warehouse Management
                </span>
            </div>
        </div>
    );
}

export default AppLogo;