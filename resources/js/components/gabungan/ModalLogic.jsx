// ModalLogic.jsx
// Styling logic for Modal components using shared tokens from Style.jsx.

import { cn } from '@/lib/utils';
import {
    COLORS,
    GRADIENTS,
    THREE_D,
    GLASS,
    DUOTONE,
    HOLOGRAPHIC,
    MODAL_COLOR_STYLES,
    getBorderStyle,
    getColorRgba,
    getStyleColorValue,
} from './Style';

export const MODAL_SIZES = {
    xs: 'sm:max-w-xs',
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
    full: 'sm:max-w-none w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] lg:w-[calc(100%-4rem)]',
    fullscreen: 'h-[100dvh] max-h-none w-screen max-w-none rounded-none sm:w-screen',
};

// Variant menentukan efek permukaan, sedangkan color menentukan paletnya.
export const MODAL_VARIANTS = {
    clean: 'border border-border/80 bg-background text-foreground shadow-xl shadow-black/10 dark:shadow-black/30',
    elevated: 'border border-white/70 bg-background text-foreground shadow-2xl shadow-slate-950/20 ring-1 ring-black/[0.03] dark:border-white/10 dark:shadow-black/45 dark:ring-white/[0.04]',
    accent: 'border border-primary/20 bg-background text-foreground shadow-2xl shadow-primary/10 ring-1 ring-primary/10',
    glass: 'border border-white/40 bg-background/90 text-foreground shadow-2xl shadow-black/15 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 dark:border-white/10 dark:shadow-black/40',
    bordered: 'border-2 border-border bg-background text-foreground shadow-lg shadow-black/5',
    danger: 'border border-red-500/25 bg-background text-foreground shadow-2xl shadow-red-950/10 ring-1 ring-red-500/10',
    flat: 'border border-border/70 bg-background text-foreground shadow-lg shadow-black/5',
   '3d': 'border border-white/30 text-white shadow-[0_8px_0_color-mix(in_srgb,var(--modal-accent-color)_22%,transparent),0_18px_40px_rgba(0,0,0,0.18)] dark:border-white/10 dark:shadow-[0_8px_0_color-mix(in_srgb,var(--modal-accent-color)_18%,transparent),0_18px_40px_rgba(0,0,0,0.4)]',
    ghost: 'border border-transparent bg-transparent text-foreground shadow-none ring-0',
    none: 'border-transparent bg-transparent text-foreground shadow-none ring-0',
    soft: 'border border-transparent text-foreground shadow-sm',
    outlined: 'border bg-transparent text-foreground shadow-none',
    filled: 'border text-white shadow-sm',
    gradient: 'border-transparent text-white shadow-md',
    duotone: 'relative border border-white/20 text-white shadow-md',
    holographic: 'relative border border-white/30 text-white shadow-lg',
};

export const MODAL_SHAPES = {
    default: 'rounded-2xl',
    soft: 'rounded-xl',
    rounded: 'rounded-3xl',
    square: 'rounded-md',
    pill: 'rounded-[2rem]',
};

export const MODAL_PLACEMENTS = {
    center: 'top-1/2 -translate-y-1/2',
    top: 'top-[max(1rem,env(safe-area-inset-top))] -translate-y-0',
    bottom: 'top-auto bottom-[max(1rem,env(safe-area-inset-bottom))] -translate-y-0',
};

export const MODAL_OVERLAYS = {
    soft: 'bg-slate-950/25 supports-backdrop-filter:backdrop-blur-[2px]',
    default: 'bg-slate-950/40 supports-backdrop-filter:backdrop-blur-sm',
    dark: 'bg-slate-950/60 supports-backdrop-filter:backdrop-blur-sm',
    blur: 'bg-slate-950/30 supports-backdrop-filter:backdrop-blur-md',
};

export const MODAL_DENSITIES = {
    compact: { header: 'px-4 py-3 sm:px-5 sm:py-4', body: 'p-4 sm:p-5', footer: 'px-4 py-3 sm:px-5 sm:py-3', gap: 'gap-3', section: 'space-y-3' },
    comfortable: { header: 'px-5 py-4 sm:px-6 sm:py-5', body: 'p-5 sm:p-6', footer: 'px-5 py-4 sm:px-6', gap: 'gap-4', section: 'space-y-4' },
    spacious: { header: 'px-6 py-5 sm:px-8 sm:py-6', body: 'p-6 sm:p-8', footer: 'px-6 py-4 sm:px-8 sm:py-5', gap: 'gap-5', section: 'space-y-5' },
};

export const MODAL_HEADER_STYLES = {
    default: 'border-b border-border/70 bg-background text-foreground',
    minimal: 'border-b border-transparent bg-transparent text-foreground',
    accent: 'border-b border-border/60 bg-background text-foreground',
    muted: 'border-b border-border/60 bg-muted/35 text-foreground',
    danger: 'border-b border-red-500/15 bg-red-500/[0.035] text-foreground',
    clean: 'border-b border-border/50 bg-background text-foreground',
    elevated: 'border-b border-border/70 bg-background shadow-sm text-foreground',
    glass: 'border-b border-white/30 bg-background/65 text-foreground backdrop-blur-xl dark:border-white/10 dark:bg-background/50',
    bordered: 'border-b-2 border-border bg-background text-foreground',
    flat: 'border-b border-transparent bg-background text-foreground',
    '3d': 'border-b border-border/60 bg-background text-foreground',
    ghost: 'border-b border-transparent bg-transparent text-foreground',
    none: 'border-b-0 bg-transparent text-foreground',
};

export const MODAL_ICON_STYLES = {
    default: 'bg-muted text-foreground ring-1 ring-border/70',
    accent: 'bg-primary/10 text-primary ring-1 ring-primary/15',
    blue: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/15 dark:text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/15 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/15 dark:text-amber-400',
    red: 'bg-red-500/10 text-red-600 ring-1 ring-red-500/15 dark:text-red-400',
    purple: 'bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/15 dark:text-purple-400',
};

export const MODAL_BODY_LAYOUTS = {
    default: 'block',
    compact: 'block',
    'grid-2': 'grid grid-cols-1 gap-4 sm:grid-cols-2',
    'grid-3': 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3',
    split: 'grid grid-cols-1 gap-0 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]',
    flush: 'p-0',
};

// Body variants are independent of the outer modal surface.
export const MODAL_BODY_VARIANTS = {
    default: 'bg-transparent text-foreground',
    none: 'bg-transparent text-foreground',
    clean: 'bg-background text-foreground',
    muted: 'bg-muted/25 text-foreground',
    accent: 'bg-primary/[0.035] text-foreground',
    glass: 'bg-background/65 text-foreground backdrop-blur-xl supports-[backdrop-filter]:bg-background/55',
    bordered: 'border border-border/70 bg-background text-foreground',
    danger: 'bg-red-500/[0.025] text-foreground',
    flat: 'bg-background text-foreground',
    '3d': 'bg-background text-foreground shadow-inner',
    ghost: 'bg-transparent text-foreground',
    soft: 'bg-muted/20 text-foreground',
    outlined: 'border border-border bg-transparent text-foreground',
    filled: 'bg-background text-foreground',
    gradient: 'bg-background text-foreground',
    duotone: 'bg-background text-foreground',
    holographic: 'bg-background text-foreground',
};

export const MODAL_SECTION_COLUMNS = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
};

// Shared variants for sidebars and nested panels.
export const MODAL_PANEL_VARIANTS = {
    default: 'bg-background text-foreground',
    none: 'bg-transparent text-foreground',
    clean: 'bg-background text-foreground',
    muted: 'bg-muted/35 text-foreground',
    accent: 'bg-primary/[0.04] text-foreground',
    bordered: 'border border-border/70 rounded-xl bg-background text-foreground',
    elevated: 'bg-background text-foreground shadow-md shadow-black/5 dark:shadow-black/20',
    glass: 'bg-background/65 text-foreground backdrop-blur-xl supports-[backdrop-filter]:bg-background/55',
    danger: 'bg-red-500/[0.035] text-foreground',
    flat: 'bg-background text-foreground shadow-none',
    '3d': 'bg-background text-foreground shadow-[inset_-3px_0_0_color-mix(in_srgb,var(--modal-accent-color)_18%,transparent)]',
    ghost: 'bg-transparent text-foreground shadow-none',
    soft: 'bg-muted/20 text-foreground',
    outlined: 'border border-border bg-transparent text-foreground',
    filled: 'bg-background text-foreground',
    gradient: 'bg-background text-foreground',
    duotone: 'bg-background text-foreground',
    holographic: 'bg-background text-foreground',
};

export const MODAL_FOOTER_STYLES = {
    default: 'bg-background text-foreground',
    muted: 'bg-muted/40 text-foreground',
    transparent: 'bg-transparent text-foreground',
    accent: 'bg-background text-foreground',
    clean: 'bg-background text-foreground',
    elevated: 'bg-background text-foreground shadow-[0_-4px_16px_rgba(0,0,0,0.035)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.18)]',
    glass: 'bg-background/70 text-foreground backdrop-blur-xl supports-[backdrop-filter]:bg-background/55',
    bordered: 'bg-background text-foreground',
    danger: 'bg-red-500/[0.035] text-foreground',
    flat: 'bg-background text-foreground shadow-none',
    '3d': 'bg-background text-foreground shadow-[inset_0_3px_0_color-mix(in_srgb,var(--modal-accent-color)_16%,transparent)]',
    ghost: 'bg-transparent text-foreground shadow-none',
    none: 'bg-transparent text-foreground shadow-none',
    soft: 'bg-muted/20 text-foreground',
    outlined: 'bg-transparent text-foreground',
    filled: 'bg-background text-foreground',
    gradient: 'bg-background text-foreground',
    duotone: 'bg-background text-foreground',
    holographic: 'bg-background text-foreground',
};

// Standardized surface class resolver.
const fallback = (map, key, defaultKey) => map[key] ?? map[defaultKey] ?? '';

const isPaletteColor = color => Boolean(COLORS[color]);
const isKnownColor = color => isPaletteColor(color) || typeof color === 'string';

export function getModalVariantColorClass({ variant = 'clean', color = 'default' } = {}) {
    const safeColor = isPaletteColor(color) ? color : 'default';
    const accent = MODAL_COLOR_STYLES[safeColor] ?? MODAL_COLOR_STYLES.default;

    if (variant === '3d') {
        return cn(
            'bg-gradient-to-b',
            THREE_D[safeColor] ?? THREE_D.default,
            safeColor === 'white' ? 'text-slate-800' : 'text-white'
        );
    }

    if (variant === 'glass') return GLASS[safeColor] ?? GLASS.default;

    if (variant === 'gradient') return cn('bg-gradient-to-br', GRADIENTS[safeColor] ?? GRADIENTS.default, 'border-transparent text-white');

    if (variant === 'duotone') return cn('bg-gradient-to-br', DUOTONE[safeColor] ?? DUOTONE.default, 'border-white/20 text-white');

    if (variant === 'holographic') return cn('bg-gradient-to-r', HOLOGRAPHIC[safeColor] ?? HOLOGRAPHIC.default, 'border-white/30 text-white');

    if (variant === 'filled') return COLORS[safeColor].base;

    if (variant === 'outlined') return cn('bg-transparent border-current', accent.text);

    if (variant === 'ghost' || variant === 'none') return cn('bg-transparent shadow-none', safeColor === 'default' ? 'text-foreground' : accent.text);

    if (variant === 'soft') {
        return cn('bg-[color-mix(in_srgb,var(--modal-accent-color)_14%,var(--background))]', safeColor === 'default' ? 'text-foreground' : accent.text);
    }

    if (variant === 'danger' && safeColor === 'default') return 'bg-red-500/[0.06] dark:bg-red-500/[0.10]';

    if (safeColor === 'default') return variant === 'accent' ? 'bg-primary/[0.04]' : '';

    if (!isKnownColor(color)) return '';

    return 'bg-[color-mix(in_srgb,var(--modal-accent-color)_10%,var(--background))]';
}

// Resolves color accents such as ring, border, text, and tint.
export function getModalColorClass({ color = 'default', parts = ['ring'], className = '' } = {}) {
    const styles = MODAL_COLOR_STYLES[color] ?? MODAL_COLOR_STYLES.default;
    const activeParts = parts.filter(part => styles[part]).map(part => styles[part]);
    const ringClass = color !== 'default' && parts.includes('ring') ? 'ring-1' : '';

    return cn(ringClass, ...activeParts, className);
}

// Resolves custom border color, border width, and the accent CSS variable.
export function getModalSurfaceStyle({
    color = 'default',
    borderColor,
    borderWidth,
    borderAlpha = 0.35,
    ringAlpha = 0.18,
} = {}) {
    const resolvedBorderColor = borderColor ?? (color !== 'default' ? getColorRgba(color, borderAlpha) : undefined);
    const style = getBorderStyle({ borderColor: resolvedBorderColor, borderWidth, fallbackColor: color });

    style['--modal-accent-color'] = getStyleColorValue(color);
    if (color !== 'default') style['--tw-ring-color'] = getColorRgba(color, ringAlpha);

    return style;
}

export function getModalContentClass({
    size = 'lg',
    variant = 'clean',
    color = 'default',
    shape = 'default',
    placement = 'center',
    className = '',
} = {}) {
    return cn(
        'flex min-h-0 max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 text-sm outline-none sm:max-h-[calc(100dvh-2rem)] sm:w-full',
        fallback(MODAL_SIZES, size, 'lg'),
        fallback(MODAL_VARIANTS, variant, 'clean'),
        getModalVariantColorClass({ variant, color }),
        fallback(MODAL_SHAPES, shape, 'default'),
        fallback(MODAL_PLACEMENTS, placement, 'center'),
        placement === 'bottom' ? 'origin-bottom' : placement === 'top' ? 'origin-top' : 'origin-center',
        size === 'fullscreen' ? 'h-[100dvh] max-h-none w-screen max-w-none rounded-none sm:w-screen' : '',
        getModalColorClass({ color, parts: ['ring'] }),
        className
    );
}

export function getModalOverlayClass(overlay = 'default', className = '') {
    return cn(fallback(MODAL_OVERLAYS, overlay, 'default'), className);
}

export function getModalHeaderClass({
    variant = 'default',
    color = 'default',
    density = 'comfortable',
    divider = true,
    className = '',
} = {}) {
    return cn(
        'relative flex shrink-0 flex-col gap-3',
        fallback(MODAL_HEADER_STYLES, variant, 'default'),
        fallback(MODAL_DENSITIES, density, 'comfortable').header,
        getModalVariantColorClass({ variant, color }),
        getModalColorClass({ color, parts: ['ring'] }),
        divider ? '' : 'border-b-0',
        className
    );
}

export function getModalBodyClass({
    density = 'comfortable',
    layout = 'default',
    variant = 'default',
    color = 'default',
    scrollable = true,
    className = '',
} = {}) {
    return cn(
        'min-h-0 flex-1',
        fallback(MODAL_BODY_VARIANTS, variant, 'default'),
        getModalVariantColorClass({ variant, color }),
        scrollable ? 'overflow-y-auto overscroll-contain' : 'overflow-visible',
        fallback(MODAL_BODY_LAYOUTS, layout, 'default'),
        layout === 'flush' ? '' : fallback(MODAL_DENSITIES, density, 'comfortable').body,
        getModalColorClass({ color, parts: ['ring'] }),
        className
    );
}

export function getModalFooterClass({
    density = 'comfortable',
    align = 'end',
    sticky = true,
    divider = true,
    variant = 'default',
    color = 'default',
    className = '',
} = {}) {
    const alignments = {
        start: 'sm:justify-start',
        center: 'sm:justify-center',
        end: 'sm:justify-end',
        between: 'sm:justify-between',
    };

    return cn(
        'flex shrink-0 flex-col-reverse gap-2 sm:flex-row',
        fallback(alignments, align, 'end'),
        fallback(MODAL_DENSITIES, density, 'comfortable').footer,
        fallback(MODAL_FOOTER_STYLES, variant, 'default'),
        getModalVariantColorClass({ variant, color }),
        getModalColorClass({ color, parts: ['ring'] }),
        divider ? 'border-t border-border/70' : 'border-t-0',
        sticky ? 'relative' : '',
        '[&>button]:w-full sm:[&>button]:w-auto',
        className
    );
}

export function getModalSectionClass({ columns = 1, className = '' } = {}) {
    return cn('grid gap-x-4 gap-y-4', fallback(MODAL_SECTION_COLUMNS, columns, 1), className);
}

export function getModalIconClass({ color = 'default', size = 'md', className = '' } = {}) {
    const sizes = {
        sm: 'size-9 rounded-xl [&>svg]:size-4',
        md: 'size-11 rounded-2xl [&>svg]:size-5',
        lg: 'size-12 rounded-2xl [&>svg]:size-5',
    };

    return cn(
        'inline-flex shrink-0 items-center justify-center',
        fallback(MODAL_ICON_STYLES, color, 'default'),
        fallback(sizes, size, 'md'),
        className
    );
}

export function getModalPanelClass({ variant = 'default', color = 'default', className = '' } = {}) {
    return cn(
        fallback(MODAL_PANEL_VARIANTS, variant, 'default'),
        getModalVariantColorClass({ variant, color }),
        getModalColorClass({ color, parts: ['ring'] }),
        className
    );
}