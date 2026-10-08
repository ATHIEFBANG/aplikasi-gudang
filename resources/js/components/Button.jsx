import React from 'react';

const BASE = 'inline-flex items-center justify-center whitespace-nowrap select-none';

const VARIANTS = {
    default: `${BASE} border shadow-sm`,
    soft: `${BASE} border shadow-sm`,
    outlined: `${BASE} border bg-transparent`,
    filled: `${BASE} border`,
    flat: `${BASE} border-transparent`,
    glass: `${BASE} border backdrop-blur-xl`,
    '3d': `${BASE} relative border`,
    neon: `${BASE} relative border`,
    duotone: `${BASE} relative border overflow-hidden`,
    gradient: `${BASE} border-transparent`,
    game: `${BASE} border text-white`,
    pill: `${BASE} border shadow-sm`,
    filter: `${BASE} border shadow-sm`,
    ghost: `${BASE} border-transparent bg-transparent`,
    inset: `${BASE} border shadow-inner`,
    holographic: `${BASE} relative border overflow-hidden`,
};

const COLORS = {
    default: {
        base: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200',
        hover: 'hover:bg-slate-50 dark:hover:bg-slate-800',
        active: 'active:bg-slate-100 dark:active:bg-slate-700',
    },
    blue: {
        base: 'bg-blue-500 border-blue-500 text-white',
        hover: 'hover:bg-blue-600 hover:border-blue-600',
        active: 'active:bg-blue-700 active:border-blue-700',
    },
    red: {
        base: 'bg-red-500 border-red-500 text-white',
        hover: 'hover:bg-red-600 hover:border-red-600',
        active: 'active:bg-red-700 active:border-red-700',
    },
    green: {
        base: 'bg-emerald-500 border-emerald-500 text-white',
        hover: 'hover:bg-emerald-600 hover:border-emerald-600',
        active: 'active:bg-emerald-700 active:border-emerald-700',
    },
    amber: {
        base: 'bg-amber-500 border-amber-500 text-white',
        hover: 'hover:bg-amber-600 hover:border-amber-600',
        active: 'active:bg-amber-700 active:border-amber-700',
    },
    purple: {
        base: 'bg-purple-500 border-purple-500 text-white',
        hover: 'hover:bg-purple-600 hover:border-purple-600',
        active: 'active:bg-purple-700 active:border-purple-700',
    },
    orange: {
        base: 'bg-orange-500 border-orange-500 text-white',
        hover: 'hover:bg-orange-600 hover:border-orange-600',
        active: 'active:bg-orange-700 active:border-orange-700',
    },
    cyan: {
        base: 'bg-cyan-500 border-cyan-500 text-white',
        hover: 'hover:bg-cyan-600 hover:border-cyan-600',
        active: 'active:bg-cyan-700 active:border-cyan-700',
    },
    pink: {
        base: 'bg-pink-500 border-pink-500 text-white',
        hover: 'hover:bg-pink-600 hover:border-pink-600',
        active: 'active:bg-pink-700 active:border-pink-700',
    },
    indigo: {
        base: 'bg-indigo-500 border-indigo-500 text-white',
        hover: 'hover:bg-indigo-600 hover:border-indigo-600',
        active: 'active:bg-indigo-700 active:border-indigo-700',
    },
    slate: {
        base: 'bg-slate-600 border-slate-600 text-white',
        hover: 'hover:bg-slate-700 hover:border-slate-700',
        active: 'active:bg-slate-800 active:border-slate-800',
    },
    gray: {
        base: 'bg-gray-500 border-gray-500 text-white',
        hover: 'hover:bg-gray-600 hover:border-gray-600',
        active: 'active:bg-gray-700 active:border-gray-700',
    },
    white: {
        base: 'bg-white border-slate-200 text-slate-700',
        hover: 'hover:bg-slate-50',
        active: 'active:bg-slate-100',
    },
    black: {
        base: 'bg-black border-black text-white',
        hover: 'hover:bg-slate-900',
        active: 'active:bg-slate-800',
    },
};

const GRADIENTS = {
    default: 'from-slate-500 to-slate-800',
    blue: 'from-blue-400 to-blue-700',
    red: 'from-red-400 to-red-700',
    green: 'from-emerald-400 to-emerald-700',
    amber: 'from-amber-400 to-amber-700',
    purple: 'from-purple-400 to-purple-700',
    orange: 'from-orange-400 to-orange-700',
    cyan: 'from-cyan-400 to-cyan-700',
    pink: 'from-pink-400 to-pink-700',
    indigo: 'from-indigo-400 to-indigo-700',
    slate: 'from-slate-500 to-slate-800',
    gray: 'from-gray-400 to-gray-700',
    white: 'from-white to-slate-200',
    black: 'from-slate-700 to-black',
};

const THREE_D = {
    default: 'from-slate-700 via-slate-800 to-slate-950 border-slate-500/80',
    blue: 'from-blue-500 via-blue-600 to-blue-800 border-blue-300/60',
    red: 'from-red-500 via-red-600 to-red-800 border-red-300/60',
    green: 'from-emerald-500 via-emerald-600 to-emerald-800 border-emerald-300/60',
    amber: 'from-amber-500 via-amber-600 to-amber-800 border-amber-300/60',
    purple: 'from-purple-500 via-purple-600 to-purple-800 border-purple-300/60',
    orange: 'from-orange-500 via-orange-600 to-orange-800 border-orange-300/60',
    cyan: 'from-cyan-500 via-cyan-600 to-cyan-800 border-cyan-300/60',
    pink: 'from-pink-500 via-pink-600 to-pink-800 border-pink-300/60',
    indigo: 'from-indigo-500 via-indigo-600 to-indigo-800 border-indigo-300/60',
    slate: 'from-slate-600 via-slate-700 to-slate-900 border-slate-400/70',
    gray: 'from-gray-500 via-gray-600 to-gray-800 border-gray-300/60',
    white: 'from-white via-slate-100 to-slate-300 border-slate-300 text-slate-700',
    black: 'from-slate-700 via-slate-800 to-black border-slate-600',
};

const GLASS = {
    default: 'bg-white/70 dark:bg-slate-900/70 border-white/30 dark:border-white/10 text-slate-700 dark:text-slate-100',
    blue: 'bg-blue-500/10 border-blue-300/30 text-blue-700 dark:text-blue-200',
    red: 'bg-red-500/10 border-red-300/30 text-red-700 dark:text-red-200',
    green: 'bg-emerald-500/10 border-emerald-300/30 text-emerald-700 dark:text-emerald-200',
    amber: 'bg-amber-500/10 border-amber-300/30 text-amber-700 dark:text-amber-200',
    purple: 'bg-purple-500/10 border-purple-300/30 text-purple-700 dark:text-purple-200',
    orange: 'bg-orange-500/10 border-orange-300/30 text-orange-700 dark:text-orange-200',
    cyan: 'bg-cyan-500/10 border-cyan-300/30 text-cyan-700 dark:text-cyan-200',
    pink: 'bg-pink-500/10 border-pink-300/30 text-pink-700 dark:text-pink-200',
    indigo: 'bg-indigo-500/10 border-indigo-300/30 text-indigo-700 dark:text-indigo-200',
    slate: 'bg-slate-500/10 border-slate-300/30 text-slate-700 dark:text-slate-200',
};

const NEON = {
    default: 'bg-slate-950 border-slate-400 text-white shadow-[0_0_12px_rgba(148,163,184,0.45),inset_0_0_10px_rgba(148,163,184,0.08)]',
    blue: 'bg-blue-950/80 border-blue-400 text-blue-100 shadow-[0_0_12px_rgba(59,130,246,0.65),inset_0_0_10px_rgba(59,130,246,0.12)]',
    red: 'bg-red-950/80 border-red-400 text-red-100 shadow-[0_0_12px_rgba(239,68,68,0.65),inset_0_0_10px_rgba(239,68,68,0.12)]',
    green: 'bg-emerald-950/80 border-emerald-400 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.65),inset_0_0_10px_rgba(16,185,129,0.12)]',
    amber: 'bg-amber-950/80 border-amber-400 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.65),inset_0_0_10px_rgba(245,158,11,0.12)]',
    purple: 'bg-purple-950/80 border-purple-400 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.65),inset_0_0_10px_rgba(168,85,247,0.12)]',
    orange: 'bg-orange-950/80 border-orange-400 text-orange-100 shadow-[0_0_12px_rgba(249,115,22,0.65),inset_0_0_10px_rgba(249,115,22,0.12)]',
    cyan: 'bg-cyan-950/80 border-cyan-400 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.65),inset_0_0_10px_rgba(6,182,212,0.12)]',
    pink: 'bg-pink-950/80 border-pink-400 text-pink-100 shadow-[0_0_12px_rgba(236,72,153,0.65),inset_0_0_10px_rgba(236,72,153,0.12)]',
    indigo: 'bg-indigo-950/80 border-indigo-400 text-indigo-100 shadow-[0_0_12px_rgba(99,102,241,0.65),inset_0_0_10px_rgba(99,102,241,0.12)]',
    slate: 'bg-slate-950 border-slate-400 text-slate-100 shadow-[0_0_12px_rgba(100,116,139,0.55)]',
};

const DUOTONE = {
    default: 'from-slate-700 via-slate-500 to-slate-900',
    blue: 'from-blue-400 via-indigo-500 to-blue-800',
    red: 'from-red-400 via-orange-500 to-red-800',
    green: 'from-emerald-400 via-teal-500 to-emerald-800',
    amber: 'from-amber-300 via-orange-500 to-amber-800',
    purple: 'from-purple-400 via-fuchsia-500 to-indigo-800',
    orange: 'from-orange-400 via-red-500 to-orange-800',
    cyan: 'from-cyan-300 via-blue-500 to-cyan-800',
    pink: 'from-pink-300 via-purple-500 to-pink-800',
    indigo: 'from-indigo-400 via-blue-500 to-indigo-900',
    slate: 'from-slate-400 via-slate-600 to-slate-900',
    gray: 'from-gray-300 via-gray-500 to-gray-800',
    white: 'from-white via-slate-100 to-slate-300',
    black: 'from-slate-700 via-slate-900 to-black',
};

const HOLOGRAPHIC = {
    default: 'from-slate-300 via-white to-slate-400',
    blue: 'from-cyan-300 via-blue-500 to-purple-500',
    red: 'from-orange-300 via-red-500 to-pink-500',
    green: 'from-emerald-300 via-cyan-400 to-blue-500',
    purple: 'from-pink-300 via-purple-500 to-cyan-400',
    cyan: 'from-cyan-300 via-blue-400 to-purple-400',
    pink: 'from-pink-300 via-purple-400 to-blue-400',
    indigo: 'from-indigo-300 via-purple-500 to-pink-400',
    orange: 'from-yellow-300 via-orange-500 to-pink-500',
    amber: 'from-yellow-300 via-amber-500 to-orange-500',
    slate: 'from-slate-300 via-blue-300 to-purple-300',
};

const SIZES = {
    none: 'p-0',
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
    xl: 'p-6',
};

const RADIUS = {
    none: 'rounded-none',
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-3xl',
    full: 'rounded-full',
};

const WIDTHS = {
    auto: 'w-auto',
    full: 'w-full',
    fit: 'w-fit',
};

const GRADIENT_DIRECTIONS = {
    r: 'bg-gradient-to-r',
    l: 'bg-gradient-to-l',
    t: 'bg-gradient-to-t',
    b: 'bg-gradient-to-b',
    tr: 'bg-gradient-to-tr',
    tl: 'bg-gradient-to-tl',
    br: 'bg-gradient-to-br',
    bl: 'bg-gradient-to-bl',
};

const EDGE_STYLES = {
    top: 'absolute top-0 left-1/2 -translate-x-1/2',
    right: 'absolute top-1/2 right-0 -translate-y-1/2',
    bottom: 'absolute bottom-0 left-1/2 -translate-x-1/2',
    left: 'absolute top-1/2 left-0 -translate-y-1/2',
    'top-right': 'absolute top-0 right-0',
    'top-left': 'absolute top-0 left-0',
    'bottom-right': 'absolute bottom-0 right-0',
    'bottom-left': 'absolute bottom-0 left-0',
};

const ATTACHED_STYLES = {
    none: '',
    left: 'relative rounded-r-none z-10',
    middle: 'relative -ml-px rounded-none z-10',
    right: 'relative -ml-px rounded-l-none z-10',
};

const LAYER_STYLES = {
    behind: 'z-[-10]',
    below: 'z-0',
    normal: 'z-10',
    above: 'z-30',
    front: 'z-50',
};

export default function Button({
    children,
    variant = 'default',
    color = 'default',
    gradient = false,
    gradientDirection = 'b',
    size = 'md',
    radius = 'xl',
    width = 'full',
    edge = 'none',
    edgeOffset = 0,
    layer = 'normal',
    attached = 'none',
    hover = false,
    selected = false,
    disabled = false,
    className = '',
    onClick,
    type = 'button',
    as: Component = 'button',
    ...props
}) {
    const variantClass = VARIANTS[variant] || VARIANTS.default;
    const colorConfig = COLORS[color] || COLORS.default;
    const gradientColor = GRADIENTS[color] || GRADIENTS.default;
    const threeDColor = THREE_D[color] || THREE_D.default;
    const glassColor = GLASS[color] || GLASS.default;
    const neonColor = NEON[color] || NEON.default;
    const duotoneColor = DUOTONE[color] || DUOTONE.default;
    const holographicColor = HOLOGRAPHIC[color] || HOLOGRAPHIC.default;
    const gradientDirectionClass = GRADIENT_DIRECTIONS[gradientDirection] || GRADIENT_DIRECTIONS.b;
    const sizeClass = SIZES[size] || SIZES.md;
    const radiusClass = RADIUS[radius] || RADIUS.xl;
    const widthClass = WIDTHS[width] || WIDTHS.full;
    const attachedClass = ATTACHED_STYLES[attached] || '';
    const layerClass = LAYER_STYLES[layer] || LAYER_STYLES.normal;
    const edgeClass = edge !== 'none' ? EDGE_STYLES[edge] || '' : '';

    const interactiveClass = hover || onClick
        ? 'transition-all duration-200 hover:brightness-110 active:translate-y-[1px]'
        : '';

    const selectedClass = selected
        ? 'ring-2 ring-blue-500/30 brightness-105'
        : '';

    const disabledClass = disabled
        ? 'opacity-50 pointer-events-none'
        : '';

    const cursorClass = disabled
        ? ''
        : 'cursor-pointer';

    let colorClass = '';
    let contentClass = '';

    if (variant === '3d') {
        colorClass = `bg-gradient-to-b ${threeDColor} shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-2px_4px_rgba(0,0,0,0.25),0_3px_5px_rgba(0,0,0,0.35)]`;
    } else if (variant === 'glass') {
        colorClass = `${glassColor} shadow-[0_8px_24px_rgba(0,0,0,0.12)]`;
    } else if (variant === 'neon') {
        colorClass = neonColor;
    } else if (variant === 'duotone') {
        colorClass = `bg-gradient-to-br ${duotoneColor} border-white/20 text-white shadow-md`;
    } else if (variant === 'gradient' || gradient) {
        colorClass = `${gradientDirectionClass} ${gradientColor} text-white border-transparent shadow-md`;
    } else if (variant === 'holographic') {
        colorClass = `bg-gradient-to-r ${holographicColor} text-white border-white/30 shadow-lg`;
    } else if (variant === 'outlined') {
        colorClass = 'bg-transparent text-current border-current';
    } else if (variant === 'soft') {
        colorClass = `${colorConfig.base} bg-opacity-10 dark:bg-opacity-10`;
    } else if (variant === 'flat') {
        colorClass = `${colorConfig.base} border-transparent shadow-none`;
    } else if (variant === 'ghost') {
        colorClass = 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
    } else if (variant === 'inset') {
        colorClass = `${colorConfig.base} shadow-[inset_0_2px_5px_rgba(0,0,0,0.18),inset_0_-1px_2px_rgba(255,255,255,0.12)]`;
    } else if (variant === 'game') {
        colorClass = `${colorConfig.base} shadow-[0_3px_0_rgba(0,0,0,0.35)]`;
        contentClass = 'font-black tracking-wide';
    } else {
        colorClass = `${colorConfig.base} ${colorConfig.hover} ${colorConfig.active}`;
    }

    const edgeStyle = edge !== 'none'
        ? {
            top: edge.includes('top') ? edgeOffset : undefined,
            bottom: edge.includes('bottom') ? edgeOffset : undefined,
            left: edge.includes('left')
                ? edgeOffset
                : edge.includes('right')
                    ? undefined
                    : edge === 'top' || edge === 'bottom'
                        ? '50%'
                        : undefined,
            right: edge.includes('right') ? edgeOffset : undefined,
        }
        : undefined;

    return (
        <Component
            type={Component === 'button' ? type : undefined}
            onClick={onClick}
            disabled={Component === 'button' ? disabled : undefined}
            aria-disabled={disabled || undefined}
            style={edgeStyle}
            className={`${widthClass} ${variantClass} ${colorClass} ${sizeClass} ${radiusClass} ${attachedClass} ${layerClass} ${edgeClass} ${interactiveClass} ${selectedClass} ${disabledClass} ${cursorClass} ${contentClass} ${className}`}
            {...props}
        >
            {children}
        </Component>
    );
}