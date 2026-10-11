// ButtonLogic.jsx
import {
    COLORS,
    GRADIENTS,
    THREE_D,
    GLASS,
    DUOTONE,
    HOLOGRAPHIC,
    DECORATIONS,
    SIZES,
    WIDTHS,
    GRADIENT_DIRECTIONS,
    LAYER_STYLES,
    getShapeStyle,
    hexToRgba,
    getDecorationStyle,
} from './Style';

const BASE = 'inline-flex items-center justify-center whitespace-nowrap select-none';

export const VARIANTS = {
    default: `${BASE} border shadow-sm`,
    soft: `${BASE} border shadow-sm`,
    outlined: `${BASE} border bg-transparent`,
    filled: `${BASE} border`,
    flat: `${BASE} border-transparent`,
    glass: `${BASE} relative border backdrop-blur-xl`,
    '3d': `${BASE} relative border`,
    duotone: `${BASE} relative border`,
    gradient: `${BASE} border-transparent`,
    game: `${BASE} border text-white`,
    pill: `${BASE} border shadow-sm`,
    filter: `${BASE} border shadow-sm`,
    ghost: `${BASE} border-transparent bg-transparent`,
    inset: `${BASE} border shadow-inner`,
    holographic: `${BASE} relative border`,
};

export const EFFECTS = {
    none: '',
    neon: 'relative isolate before:content-[""] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border-2 before:z-10',
    glow: 'relative isolate before:content-[""] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:z-10',
    shine: 'relative isolate before:content-[""] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-white/60 before:shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] before:z-10',
    'glass-edge': 'relative isolate before:content-[""] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-white/50 before:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] before:z-10',
};

export const EFFECT_COLORS = {
    default: {
        neon: 'before:border-slate-400 before:shadow-[0_0_12px_rgba(148,163,184,0.65)]',
        glow: 'before:border-slate-400/70 before:shadow-[0_0_16px_rgba(148,163,184,0.55)]',
    },
    blue: {
        neon: 'before:border-blue-400 before:shadow-[0_0_12px_rgba(59,130,246,0.75)]',
        glow: 'before:border-blue-400/70 before:shadow-[0_0_16px_rgba(59,130,246,0.6)]',
    },
    red: {
        neon: 'before:border-red-400 before:shadow-[0_0_12px_rgba(239,68,68,0.75)]',
        glow: 'before:border-red-400/70 before:shadow-[0_0_16px_rgba(239,68,68,0.6)]',
    },
    green: {
        neon: 'before:border-emerald-400 before:shadow-[0_0_12px_rgba(16,185,129,0.75)]',
        glow: 'before:border-emerald-400/70 before:shadow-[0_0_16px_rgba(16,185,129,0.6)]',
    },
    amber: {
        neon: 'before:border-amber-400 before:shadow-[0_0_12px_rgba(245,158,11,0.75)]',
        glow: 'before:border-amber-400/70 before:shadow-[0_0_16px_rgba(245,158,11,0.6)]',
    },
    purple: {
        neon: 'before:border-purple-400 before:shadow-[0_0_12px_rgba(168,85,247,0.75)]',
        glow: 'before:border-purple-400/70 before:shadow-[0_0_16px_rgba(168,85,247,0.6)]',
    },
    orange: {
        neon: 'before:border-orange-400 before:shadow-[0_0_12px_rgba(249,115,22,0.75)]',
        glow: 'before:border-orange-400/70 before:shadow-[0_0_16px_rgba(249,115,22,0.6)]',
    },
    cyan: {
        neon: 'before:border-cyan-400 before:shadow-[0_0_12px_rgba(6,182,212,0.75)]',
        glow: 'before:border-cyan-400/70 before:shadow-[0_0_16px_rgba(6,182,212,0.6)]',
    },
    pink: {
        neon: 'before:border-pink-400 before:shadow-[0_0_12px_rgba(236,72,153,0.75)]',
        glow: 'before:border-pink-400/70 before:shadow-[0_0_16px_rgba(236,72,153,0.6)]',
    },
    indigo: {
        neon: 'before:border-indigo-400 before:shadow-[0_0_12px_rgba(99,102,241,0.75)]',
        glow: 'before:border-indigo-400/70 before:shadow-[0_0_16px_rgba(99,102,241,0.6)]',
    },
    slate: {
        neon: 'before:border-slate-400 before:shadow-[0_0_12px_rgba(100,116,139,0.65)]',
        glow: 'before:border-slate-400/70 before:shadow-[0_0_16px_rgba(100,116,139,0.55)]',
    },
    gray: {
        neon: 'before:border-gray-400 before:shadow-[0_0_12px_rgba(156,163,175,0.65)]',
        glow: 'before:border-gray-400/70 before:shadow-[0_0_16px_rgba(156,163,175,0.55)]',
    },
    white: {
        neon: 'before:border-white before:shadow-[0_0_12px_rgba(255,255,255,0.75)]',
        glow: 'before:border-white/70 before:shadow-[0_0_16px_rgba(255,255,255,0.55)]',
    },
    black: {
        neon: 'before:border-slate-700 before:shadow-[0_0_12px_rgba(15,23,42,0.65)]',
        glow: 'before:border-slate-700/70 before:shadow-[0_0_16px_rgba(15,23,42,0.55)]',
    },
};

export const EDGE_STYLES = {
    top: 'absolute top-0 left-1/2 -translate-x-1/2',
    right: 'absolute top-1/2 right-0 -translate-y-1/2',
    bottom: 'absolute bottom-0 left-1/2 -translate-x-1/2',
    left: 'absolute top-1/2 left-0 -translate-y-1/2',
    'top-right': 'absolute top-0 right-0',
    'top-left': 'absolute top-0 left-0',
    'bottom-right': 'absolute bottom-0 right-0',
    'bottom-left': 'absolute bottom-0 left-0',
};

export const ATTACHED_STYLES = {
    none: '',
    left: 'relative rounded-r-none z-10',
    middle: 'relative -ml-px rounded-none z-10',
    right: 'relative -ml-px rounded-l-none z-10',
};

export function getButtonLogic({
    variant = 'default',
    effect = 'none',
    effectColor,
    decoration = 'none',
    decorationColor = '#FFFFFF',
    color = 'default',
    gradient = false,
    gradientDirection = 'b',
    size = 'md',
    shape = 'default',
    flipHorizontal = false,
    flipVertical = false,
    width = 'full',
    edge = 'none',
    edgeOffset = 0,
    layer = 'normal',
    attached = 'none',
    hover = false,
    selected = false,
    disabled = false,
    onClick,
}) {
    const variantClass = VARIANTS[variant] || VARIANTS.default;
    const colorConfig = COLORS[color] || COLORS.default;
    const gradientColor = GRADIENTS[color] || GRADIENTS.default;
    const threeDColor = THREE_D[color] || THREE_D.default;
    const glassColor = GLASS[color] || GLASS.default;
    const duotoneColor = DUOTONE[color] || DUOTONE.default;
    const holographicColor = HOLOGRAPHIC[color] || HOLOGRAPHIC.default;

    const effectClass = EFFECTS[effect] || '';
    const effectColorClass = effectColor
        ? ''
        : EFFECT_COLORS[color]?.[effect] ||
          EFFECT_COLORS.default[effect] ||
          '';

    const gradientDirectionClass =
        GRADIENT_DIRECTIONS[gradientDirection] ||
        GRADIENT_DIRECTIONS.b;

    const sizeClass = SIZES[size] || SIZES.md;
    const widthClass = WIDTHS[width] || WIDTHS.full;
    const attachedClass = ATTACHED_STYLES[attached] || '';
    const layerClass = LAYER_STYLES[layer] || LAYER_STYLES.normal;
    const edgeClass = edge !== 'none' ? EDGE_STYLES[edge] || '' : '';

    const shapeStyle = getShapeStyle(
        shape,
        flipHorizontal,
        flipVertical
    );

    const interactiveClass = hover || onClick
        ? 'transition-all duration-200 hover:brightness-110 active:translate-y-[1px]'
        : '';

    const selectedClass = selected
        ? 'ring-2 ring-blue-500/30 brightness-105'
        : '';

    const disabledClass = disabled
        ? 'opacity-50 pointer-events-none'
        : '';

    const cursorClass = disabled ? '' : 'cursor-pointer';

    let colorClass = '';
    let contentClass = '';

    if (variant === '3d') {
        colorClass = `bg-gradient-to-b ${threeDColor} shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-2px_4px_rgba(0,0,0,0.25),0_3px_5px_rgba(0,0,0,0.35)]`;
    } else if (variant === 'glass') {
        colorClass = `${glassColor} shadow-[0_8px_24px_rgba(0,0,0,0.12)]`;
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

    const decorationStyle = getDecorationStyle(
        decoration,
        decorationColor
    );

    const hasDecoration = Boolean(
        DECORATIONS[decoration] && decorationStyle
    );

    const customEffectStyle = effectColor
        ? {
            '--button-effect-color': effectColor,
            '--button-effect-glow': hexToRgba(effectColor, 0.75),
            '--button-effect-soft-glow': hexToRgba(effectColor, 0.55),
        }
        : {};

    const customEffectClass = effectColor &&
        ['neon', 'glow'].includes(effect)
        ? 'before:border-[var(--button-effect-color)] before:shadow-[0_0_12px_var(--button-effect-glow)]'
        : effectColor &&
          ['shine', 'glass-edge'].includes(effect)
            ? 'before:border-[var(--button-effect-color)] before:shadow-[0_0_0_1px_var(--button-effect-soft-glow)]'
            : '';

    return {
        widthClass,
        variantClass,
        effectClass,
        colorClass,
        effectColorClass,
        customEffectClass,
        sizeClass,
        attachedClass,
        layerClass,
        edgeClass,
        interactiveClass,
        selectedClass,
        disabledClass,
        cursorClass,
        contentClass,
        shapeStyle,
        edgeStyle,
        customEffectStyle,
        decorationStyle,
        hasDecoration,
    };
}
