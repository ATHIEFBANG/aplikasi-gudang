import React from 'react';

const VARIANTS = {
    default: 'border shadow-sm',
    soft: 'border shadow-sm',
    outlined: 'border',
    filled: 'border',
    glass: 'border backdrop-blur-xl shadow-lg',
    blue: 'border',
    dark: 'border text-white',
    pill: 'border shadow-sm',
    filter: 'border shadow-sm',
    game: 'border text-white',
    'oval-3d': 'relative inline-flex items-center justify-center border text-white',
    image: 'relative overflow-hidden border shadow-sm',
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

const OVAL_3D_COLORS = {
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

export default function Button({
    children,
    variant = 'default',
    color = 'default',
    gradient = false,
    gradientDirection = 'b',
    size = 'md',
    radius = 'xl',
    width = 'full',
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
    const gradientDirectionClass = GRADIENT_DIRECTIONS[gradientDirection] || GRADIENT_DIRECTIONS.b;
    const oval3DColor = OVAL_3D_COLORS[color] || OVAL_3D_COLORS.default;
    const sizeClass = SIZES[size] || SIZES.md;
    const radiusClass = RADIUS[radius] || RADIUS.xl;
    const widthClass = WIDTHS[width] || WIDTHS.full;
    const isOval3D = variant === 'oval-3d';

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

    if (isOval3D) {
        colorClass = `
            bg-gradient-to-b
            ${oval3DColor}
            shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-2px_4px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.35)]
        `;
    } else if (gradient) {
        colorClass = `${gradientDirectionClass} ${gradientColor} text-white border-transparent`;
    } else {
        colorClass = `${colorConfig.base} ${colorConfig.hover} ${colorConfig.active}`;
    }

    return (
        <Component
            type={Component === 'button' ? type : undefined}
            onClick={onClick}
            disabled={Component === 'button' ? disabled : undefined}
            aria-disabled={disabled || undefined}
            className={`${widthClass} ${variantClass} ${colorClass} ${sizeClass} ${radiusClass} ${interactiveClass} ${selectedClass} ${disabledClass} ${cursorClass} ${className}`}
            {...props}
        >
            {children}
        </Component>
    );
}