// Style.jsx
// Shared visual tokens and helpers for Button, Card, Modal, and other components.

export const COLORS = {
    default: { base: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200', hover: 'hover:bg-slate-50 dark:hover:bg-slate-800', active: 'active:bg-slate-100 dark:active:bg-slate-700', hex: '#94A3B8' },
    blue: { base: 'bg-blue-500 border-blue-500 text-white', hover: 'hover:bg-blue-600 hover:border-blue-600', active: 'active:bg-blue-700 active:border-blue-700', hex: '#3B82F6' },
    red: { base: 'bg-red-500 border-red-500 text-white', hover: 'hover:bg-red-600 hover:border-red-600', active: 'active:bg-red-700 active:border-red-700', hex: '#EF4444' },
    green: { base: 'bg-emerald-500 border-emerald-500 text-white', hover: 'hover:bg-emerald-600 hover:border-emerald-600', active: 'active:bg-emerald-700 active:border-emerald-700', hex: '#10B981' },
    amber: { base: 'bg-amber-500 border-amber-500 text-white', hover: 'hover:bg-amber-600 hover:border-amber-600', active: 'active:bg-amber-700 active:border-amber-700', hex: '#F59E0B' },
    purple: { base: 'bg-purple-500 border-purple-500 text-white', hover: 'hover:bg-purple-600 hover:border-purple-600', active: 'active:bg-purple-700 active:border-purple-700', hex: '#A855F7' },
    orange: { base: 'bg-orange-500 border-orange-500 text-white', hover: 'hover:bg-orange-600 hover:border-orange-600', active: 'active:bg-orange-700 active:border-orange-700', hex: '#F97316' },
    cyan: { base: 'bg-cyan-500 border-cyan-500 text-white', hover: 'hover:bg-cyan-600 hover:border-cyan-600', active: 'active:bg-cyan-700 active:border-cyan-700', hex: '#06B6D4' },
    pink: { base: 'bg-pink-500 border-pink-500 text-white', hover: 'hover:bg-pink-600 hover:border-pink-600', active: 'active:bg-pink-700 active:border-pink-700', hex: '#EC4899' },
    indigo: { base: 'bg-indigo-500 border-indigo-500 text-white', hover: 'hover:bg-indigo-600 hover:border-indigo-600', active: 'active:bg-indigo-700 active:border-indigo-700', hex: '#6366F1' },
    slate: { base: 'bg-slate-600 border-slate-600 text-white', hover: 'hover:bg-slate-700 hover:border-slate-700', active: 'active:bg-slate-800 active:border-slate-800', hex: '#64748B' },
    gray: { base: 'bg-gray-500 border-gray-500 text-white', hover: 'hover:bg-gray-600 hover:border-gray-600', active: 'active:bg-gray-700 active:border-gray-700', hex: '#6B7280' },
    white: { base: 'bg-white border-slate-200 text-slate-700', hover: 'hover:bg-slate-50', active: 'active:bg-slate-100', hex: '#FFFFFF' },
    black: { base: 'bg-black border-black text-white', hover: 'hover:bg-slate-900', active: 'active:bg-slate-800', hex: '#000000' },
};

// Modal color accents. These define accents, not the surface background.
export const MODAL_COLOR_STYLES = {
    default: { border: 'border-slate-400/30', ring: 'ring-slate-400/10', shadow: 'shadow-slate-500/10', text: 'text-slate-600 dark:text-slate-300', tint: 'bg-slate-500/5' },
    blue: { border: 'border-blue-500/30', ring: 'ring-blue-500/15', shadow: 'shadow-blue-500/10', text: 'text-blue-600 dark:text-blue-400', tint: 'bg-blue-500/5' },
    red: { border: 'border-red-500/30', ring: 'ring-red-500/15', shadow: 'shadow-red-500/10', text: 'text-red-600 dark:text-red-400', tint: 'bg-red-500/5' },
    green: { border: 'border-emerald-500/30', ring: 'ring-emerald-500/15', shadow: 'shadow-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', tint: 'bg-emerald-500/5' },
    amber: { border: 'border-amber-500/30', ring: 'ring-amber-500/15', shadow: 'shadow-amber-500/10', text: 'text-amber-600 dark:text-amber-400', tint: 'bg-amber-500/5' },
    purple: { border: 'border-purple-500/30', ring: 'ring-purple-500/15', shadow: 'shadow-purple-500/10', text: 'text-purple-600 dark:text-purple-400', tint: 'bg-purple-500/5' },
    orange: { border: 'border-orange-500/30', ring: 'ring-orange-500/15', shadow: 'shadow-orange-500/10', text: 'text-orange-600 dark:text-orange-400', tint: 'bg-orange-500/5' },
    cyan: { border: 'border-cyan-500/30', ring: 'ring-cyan-500/15', shadow: 'shadow-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', tint: 'bg-cyan-500/5' },
    pink: { border: 'border-pink-500/30', ring: 'ring-pink-500/15', shadow: 'shadow-pink-500/10', text: 'text-pink-600 dark:text-pink-400', tint: 'bg-pink-500/5' },
    indigo: { border: 'border-indigo-500/30', ring: 'ring-indigo-500/15', shadow: 'shadow-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', tint: 'bg-indigo-500/5' },
    slate: { border: 'border-slate-500/30', ring: 'ring-slate-500/15', shadow: 'shadow-slate-500/10', text: 'text-slate-600 dark:text-slate-300', tint: 'bg-slate-500/5' },
    gray: { border: 'border-gray-500/30', ring: 'ring-gray-500/15', shadow: 'shadow-gray-500/10', text: 'text-gray-600 dark:text-gray-300', tint: 'bg-gray-500/5' },
    white: { border: 'border-white/50', ring: 'ring-white/15', shadow: 'shadow-white/10', text: 'text-white', tint: 'bg-white/5' },
    black: { border: 'border-black/20 dark:border-white/15', ring: 'ring-black/10 dark:ring-white/10', shadow: 'shadow-black/10', text: 'text-black dark:text-white', tint: 'bg-black/5 dark:bg-white/5' },
};

export const SEMANTIC_COLORS = {
    primary: 'var(--primary)',
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    border: 'var(--border)',
    muted: 'var(--muted)',
    destructive: 'var(--destructive)',
    transparent: 'transparent',
    current: 'currentColor',
};

// Returns a CSS color from a palette name, HEX, or supported CSS value.
export function getStyleColorValue(color, fallback = 'default') {
    const fallbackValue = COLORS[fallback]?.hex ?? COLORS.default.hex;

    if (typeof color !== 'string' || !color.trim()) return fallbackValue;

    const value = color.trim();

    if (COLORS[value]?.hex) return COLORS[value].hex;
    if (Object.prototype.hasOwnProperty.call(SEMANTIC_COLORS, value)) return SEMANTIC_COLORS[value];
    if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) return value;

    if (/^(?:rgb|rgba|hsl|hsla|hwb|oklch|oklab|lab|lch)\(/i.test(value) || /^var\(--[\w-]+(?:,\s*.+)?\)$/.test(value)) {
        return value;
    }

    return fallbackValue;
}

// Creates inline styles for a custom border color and width.
export function getBorderStyle({ borderColor, borderWidth, fallbackColor = 'default' } = {}) {
    const style = {};

    if (borderColor !== undefined && borderColor !== null && borderColor !== '') {
        style.borderColor = getStyleColorValue(borderColor, fallbackColor);
    }

    if (borderWidth !== undefined && borderWidth !== null && borderWidth !== '') {
        const isNumeric = typeof borderWidth === 'number' || (typeof borderWidth === 'string' && /^\d+(\.\d+)?$/.test(borderWidth));

        if (isNumeric) {
            const width = Number(borderWidth);

            if (Number.isFinite(width) && width >= 0) {
                style.borderWidth = `${width}px`;
                style.borderStyle = width === 0 ? 'none' : 'solid';
            }
        } else if (typeof borderWidth === 'string' && /^\d*\.?\d+(?:px|rem|em|%)$/.test(borderWidth.trim())) {
            style.borderWidth = borderWidth.trim();
            style.borderStyle = borderWidth.trim() === '0px' ? 'none' : 'solid';
        }
    }

    return style;
}

export const GRADIENTS = {
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

export const THREE_D = {
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

export const GLASS = {
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

export const DUOTONE = {
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

export const HOLOGRAPHIC = {
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

export const DECORATIONS = {
    none: '',
    geometric: 'geometric',
    stripes: 'stripes',
    highlight: 'highlight',
    corner: 'corner',
    diagonal: 'diagonal',
    glossy: 'glossy',
};

export const SIZES = { none: 'p-0', xs: 'p-2', sm: 'p-3', md: 'p-4', lg: 'p-5', xl: 'p-6' };
export const WIDTHS = { auto: 'w-auto', full: 'w-full', fit: 'w-fit' };

export const GRADIENT_DIRECTIONS = {
    r: 'bg-gradient-to-r',
    l: 'bg-gradient-to-l',
    t: 'bg-gradient-to-t',
    b: 'bg-gradient-to-b',
    tr: 'bg-gradient-to-tr',
    tl: 'bg-gradient-to-tl',
    br: 'bg-gradient-to-br',
    bl: 'bg-gradient-to-bl',
};

export const LAYER_STYLES = { behind: 'z-[-10]', below: 'z-0', normal: 'z-10', above: 'z-30', front: 'z-50' };

export const SHAPES = {
    default: { borderRadius: '1rem' },
    kapsul: { borderRadius: '9999px' },
    'bawah-membulat': { borderRadius: '0 0 9999px 9999px' },
    'kiri-bawah-kanan-kapsul': { borderRadius: '0 9999px 9999px 9999px' },
    'kiri-atas-kanan-bawah': { borderRadius: '9999px 0 9999px 0' },
    'kiri-atas-kanan-kapsul': { borderRadius: '9999px 9999px 9999px 0' },
    'takik-kiri': { clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%, 7% 50%)' },
    'pita-cekung': { clipPath: 'polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%, 7% 50%)' },
    'persegi-membulat': { borderRadius: '8px' },
    'kiri-siku-kanan-kapsul': { borderRadius: '0 9999px 9999px 0' },
    'jajar-genjang': { clipPath: 'polygon(6% 0, 100% 0, 94% 100%, 0 100%)' },
};

function flipBorderRadius(value, flipHorizontal, flipVertical) {
    const corners = value.split(/\s+/);
    const normalized = corners.length === 1 ? Array(4).fill(corners[0]) : corners.length === 2 ? [corners[0], corners[1], corners[0], corners[1]] : corners.length === 3 ? [corners[0], corners[1], corners[2], corners[1]] : corners;

    let [topLeft, topRight, bottomRight, bottomLeft] = normalized;

    if (flipHorizontal) {
        [topLeft, topRight] = [topRight, topLeft];
        [bottomLeft, bottomRight] = [bottomRight, bottomLeft];
    }

    if (flipVertical) {
        [topLeft, bottomLeft] = [bottomLeft, topLeft];
        [topRight, bottomRight] = [bottomRight, topRight];
    }

    return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`;
}

function flipClipPath(value, flipHorizontal, flipVertical) {
    if (!value?.startsWith('polygon(') || (!flipHorizontal && !flipVertical)) return value;

    const points = value.match(/-?\d*\.?\d+%?\s+-?\d*\.?\d+%?/g);
    if (!points) return value;

    const flippedPoints = points.map(point => {
        let [x, y] = point.trim().split(/\s+/);
        if (flipHorizontal) x = `${100 - parseFloat(x)}%`;
        if (flipVertical) y = `${100 - parseFloat(y)}%`;
        return `${x} ${y}`;
    });

    return `polygon(${flippedPoints.join(', ')})`;
}

export function getShapeStyle(shape, flipHorizontal, flipVertical) {
    const style = { ...(SHAPES[shape] || SHAPES.default) };

    if (style.borderRadius && (flipHorizontal || flipVertical)) {
        style.borderRadius = flipBorderRadius(style.borderRadius, flipHorizontal, flipVertical);
    }

    if (style.clipPath) style.clipPath = flipClipPath(style.clipPath, flipHorizontal, flipVertical);

    return style;
}

export function hexToRgba(hex, alpha = 1) {
    if (typeof hex !== 'string') return `rgba(148, 163, 184, ${alpha})`;

    let value = hex.replace('#', '').trim();
    if (/^[0-9a-fA-F]{3}$/.test(value)) value = value.split('').map(char => char + char).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(value)) return `rgba(148, 163, 184, ${alpha})`;

    const number = parseInt(value, 16);
    const red = (number >> 16) & 255;
    const green = (number >> 8) & 255;
    const blue = number & 255;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getColorHex(color = 'default') {
    if (COLORS[color]?.hex) return COLORS[color].hex;
    if (typeof color === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim())) return color.trim();
    return COLORS.default.hex;
}

export function getColorRgba(color = 'default', alpha = 1) {
    return hexToRgba(getColorHex(color), alpha);
}

export function getDecorationStyle(decoration, color) {
    const gradients = {
        geometric: `linear-gradient(135deg, transparent 44%, ${color} 45%, ${color} 48%, transparent 49%), linear-gradient(135deg, transparent 68%, ${color} 69%, ${color} 72%, transparent 73%)`,
        stripes: `repeating-linear-gradient(125deg, transparent 0px, transparent 9px, ${color} 10px, ${color} 12px)`,
        highlight: `linear-gradient(115deg, ${color}, transparent 42%, transparent)`,
        corner: `linear-gradient(225deg, ${color} 0px, ${color} 14px, transparent 15px)`,
        diagonal: `linear-gradient(125deg, transparent 0%, transparent 74%, ${color} 74.3%, ${color} 74.7%, transparent 75%)`,
        glossy: `linear-gradient(180deg, ${hexToRgba(color, 0.35)} 0%, transparent 48%, ${hexToRgba(color, 0.12)} 100%)`,
    };

    return gradients[decoration] || '';
}