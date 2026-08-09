import { cn } from '@/lib/utils';

export function AppLogo({ className, ...props }) {
    return (
        <div className={cn('flex items-center gap-2.5 select-none', className)} {...props}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-700 to-red-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-red-600/30">
                M
            </div>
            <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-wider text-slate-900 dark:text-white leading-none">
                    MITRATEL
                </span>
                <span className="text-[9px] font-bold text-red-600 dark:text-red-400 tracking-widest uppercase mt-0.5">
                    Command Center
                </span>
            </div>
        </div>
    );
}

// Tambahkan baris ini di paling bawah agar support default import & named import sekaligus:
export default AppLogo;