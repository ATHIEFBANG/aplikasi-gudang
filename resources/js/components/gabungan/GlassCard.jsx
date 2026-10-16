import { cn } from "@/lib/utils";

export default function GlassCard({ children, className, ...props }) {
    return (
        <div
            className={cn(
                // Mode Terang: Latar putih, border abu-abu halus, shadow lembut
                "bg-white/80 border-slate-200/80 text-slate-800 shadow-sm",
                // Mode Gelap: Latar kaca Vision UI (#0B1437/slate-900), border transparan
                "dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-100 dark:shadow-2xl",
                "backdrop-blur-xl border rounded-2xl p-5 transition-all duration-300",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}