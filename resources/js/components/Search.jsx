import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

const SEARCH_STYLES = {
    // Kapsul memanjang dengan tombol lingkaran mengambang, ring putih, dan bayangan bawah.
    'capsule-float': {
        wrapper: 'gap-3 rounded-full border-0 bg-transparent',
        input: 'rounded-full border-2 border-[var(--search-color)] bg-white pl-5 pr-4 text-slate-700 dark:bg-slate-950 dark:text-slate-200',
        button: 'rounded-full border-0 bg-[var(--search-color)] text-white hover:brightness-95',
        buttonPosition: 'relative',
    },
    // Input dan tombol menyatu, bentuk kotak seperti referensi kiri atas.
    classic: {
        wrapper: 'rounded-none border-2 border-[var(--search-color)] bg-white dark:bg-slate-950',
        input: 'rounded-none border-0 bg-transparent pl-3 pr-3',
        button: 'rounded-none border-l-0 bg-[var(--search-color)] text-white hover:brightness-95',
        buttonPosition: 'relative',
    },
    // Input kapsul dengan tombol bulat terpisah.
    pill: {
        wrapper: 'gap-3 rounded-full border-0 bg-transparent',
        input: 'rounded-full border-2 border-[var(--search-color)] bg-white pl-5 pr-4 dark:bg-slate-950',
        button: 'rounded-full border-0 bg-[var(--search-color)] text-white hover:brightness-95',
        buttonPosition: 'relative',
    },
    // Tombol menempel di sisi kanan input, seluruh bidang kapsul.
    attached: {
        wrapper: 'rounded-full border-2 border-[var(--search-color)] bg-white dark:bg-slate-950',
        input: 'rounded-full border-0 bg-transparent pl-4 pr-3',
        button: 'rounded-r-full rounded-l-none bg-[var(--search-color)] text-white hover:brightness-95',
        buttonPosition: 'relative',
    },
    // Tombol kecil di kanan dengan garis pemisah.
    divider: {
        wrapper: 'rounded-none border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950',
        input: 'rounded-none border-0 bg-transparent pl-4 pr-3',
        button: 'rounded-none border-l border-slate-300 bg-transparent text-[var(--search-color)] hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900',
        buttonPosition: 'relative',
    },
    // Ikon di kiri, tanpa tombol submit terpisah.
    leading: {
        wrapper: 'rounded-none border-2 border-[var(--search-color)] bg-white dark:bg-slate-950',
        input: 'rounded-none border-0 bg-transparent pl-10 pr-3',
        button: 'hidden',
        buttonPosition: 'hidden',
    },
    // Minimal: input sederhana dengan ikon di ujung kanan.
    minimal: {
        wrapper: 'rounded-none border-b-2 border-[var(--search-color)] bg-white dark:bg-slate-950',
        input: 'rounded-none border-0 bg-transparent pl-4 pr-12',
        button: 'bg-transparent text-[var(--search-color)] hover:bg-slate-50 dark:hover:bg-slate-900',
        buttonPosition: 'absolute right-0 top-1/2 -translate-y-1/2',
    },
};

const SEARCH_COLORS = {
    blue: { color: '#2196D2', shadow: 'rgba(33, 150, 210, 0.25)' },
    cyan: { color: '#16B8BE', shadow: 'rgba(22, 184, 190, 0.25)' },
    teal: { color: '#10B8B8', shadow: 'rgba(16, 184, 184, 0.25)' },
    orange: { color: '#F28C28', shadow: 'rgba(242, 140, 40, 0.25)' },
    red: { color: '#EF3654', shadow: 'rgba(239, 54, 84, 0.25)' },
    slate: { color: '#64748B', shadow: 'rgba(100, 116, 139, 0.25)' },
};

const SIZES = {
    sm: { height: '2rem', button: '2rem', icon: '1rem', font: '0.75rem' },
    md: { height: '2.75rem', button: '2.75rem', icon: '1.35rem', font: '0.875rem' },
    lg: { height: '3.25rem', button: '3.25rem', icon: '1.5rem', font: '1rem' },
};

export default function Search({
    value = '',
    onChange,
    onSearch,
    placeholder = 'Search here',
    disabled = false,
    className = '',
    variant = 'pill',
    color = 'blue',
    size = 'md',
    buttonLabel = '',
    iconPosition,
}) {
    const style = SEARCH_STYLES[variant] ?? SEARCH_STYLES.pill;
    const isHexColor = typeof color === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim());
    const palette = isHexColor
        ? { color: color.trim(), shadow: `color-mix(in srgb, ${color.trim()} 28%, transparent)` }
        : (SEARCH_COLORS[color] ?? { color: '#2196D2', shadow: 'rgba(33, 150, 210, 0.25)' });
    const dimensions = SIZES[size] ?? SIZES.md;
    const showLeadingIcon = variant === 'leading' || iconPosition === 'left';
    const showButton = variant !== 'leading';

    const handleSubmit = () => {
        if (!disabled) onSearch?.(value);
    };

    const handleKeyDown = event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div
            className={`relative flex w-full min-w-0 items-center ${style.wrapper} ${className}`}
            style={{
                '--search-color': palette.color,
                '--search-shadow': palette.shadow,
                height: dimensions.height,
            }}
        >
            {showLeadingIcon && (
                <SearchIcon
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 z-10 text-[var(--search-color)]"
                    style={{ width: dimensions.icon, height: dimensions.icon }}
                />
            )}

            <input
                type="text"
                value={value}
                onChange={event => onChange?.(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                aria-label={placeholder || 'Search'}
                className={`h-full min-w-0 flex-1 text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--search-color)]/25 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:placeholder:text-slate-500 ${style.input}`}
                style={{ fontSize: dimensions.font }}
            />

            {showButton && (
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={disabled}
                    aria-label={buttonLabel || 'Search'}
                    title={buttonLabel || 'Search'}
                    className={`flex shrink-0 items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${style.button} ${style.buttonPosition}`}
                    style={{
                        width: ['classic', 'attached', 'divider'].includes(variant) ? 'auto' : (variant === 'capsule-float' ? `calc(${dimensions.button} + 0.5rem)` : dimensions.button),
                        minWidth: ['classic', 'attached', 'divider'].includes(variant) ? dimensions.button : undefined,
                        height: variant === 'capsule-float' ? `calc(${dimensions.button} + 0.5rem)` : dimensions.button,
                        paddingLeft: buttonLabel ? '0.9rem' : undefined,
                        paddingRight: buttonLabel ? '0.9rem' : undefined,
                    }}
                >
                    <SearchIcon
                        aria-hidden="true"
                        style={{ width: dimensions.icon, height: dimensions.icon }}
                    />
                    {buttonLabel && (
                        <span className="ml-2 whitespace-nowrap" style={{ fontSize: dimensions.font }}>
                            {buttonLabel}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
}
