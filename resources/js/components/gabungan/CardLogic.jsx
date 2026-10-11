// CardLogic.jsx
import {
    COLORS,
    GRADIENTS,
    THREE_D,
    GLASS,
    DUOTONE,
    HOLOGRAPHIC,
    GRADIENT_DIRECTIONS,
    LAYER_STYLES,
    WIDTHS,
    getShapeStyle,
    getDecorationStyle,
    hexToRgba,
} from './Style';

export const CARD_VARIANTS = [
    'default', 'soft', 'outlined', 'filled', 'flat', 'glass', '3d',
    'duotone', 'gradient', 'inset', 'holographic',
];

export const CARD_WIDTHS = WIDTHS;

const CARD_TEXT_COLORS = {
    default: 'text-slate-800 dark:text-slate-100',
    blue: 'text-blue-700 dark:text-blue-200',
    red: 'text-red-700 dark:text-red-200',
    green: 'text-emerald-700 dark:text-emerald-200',
    amber: 'text-amber-700 dark:text-amber-200',
    purple: 'text-purple-700 dark:text-purple-200',
    orange: 'text-orange-700 dark:text-orange-200',
    cyan: 'text-cyan-700 dark:text-cyan-200',
    pink: 'text-pink-700 dark:text-pink-200',
    indigo: 'text-indigo-700 dark:text-indigo-200',
    slate: 'text-slate-700 dark:text-slate-200',
    gray: 'text-gray-700 dark:text-gray-200',
    white: 'text-slate-800',
    black: 'text-slate-100',
};

const SOLID_TEXT_COLORS = {
    default: 'text-slate-700 dark:text-slate-200',
    blue: 'text-white',
    red: 'text-white',
    green: 'text-white',
    amber: 'text-white',
    purple: 'text-white',
    orange: 'text-white',
    cyan: 'text-white',
    pink: 'text-white',
    indigo: 'text-white',
    slate: 'text-white',
    gray: 'text-white',
    white: 'text-slate-800',
    black: 'text-white',
};

const OUTLINE_COLORS = {
    default: 'border-slate-300 dark:border-slate-700',
    blue: 'border-blue-400 dark:border-blue-500',
    red: 'border-red-400 dark:border-red-500',
    green: 'border-emerald-400 dark:border-emerald-500',
    amber: 'border-amber-400 dark:border-amber-500',
    purple: 'border-purple-400 dark:border-purple-500',
    orange: 'border-orange-400 dark:border-orange-500',
    cyan: 'border-cyan-400 dark:border-cyan-500',
    pink: 'border-pink-400 dark:border-pink-500',
    indigo: 'border-indigo-400 dark:border-indigo-500',
    slate: 'border-slate-400 dark:border-slate-500',
    gray: 'border-gray-400 dark:border-gray-500',
    white: 'border-white',
    black: 'border-slate-700 dark:border-slate-300',
};

const getEffectStyle = (effect, effectColor) => {
    if (effect === 'none') return {};

    const color = effectColor || '#22D3EE';

    switch (effect) {
        case 'neon':
            return {
                border: `2px solid ${color}`,
                boxShadow: `0 0 12px ${hexToRgba(color, 0.7)}, inset 0 0 8px ${hexToRgba(color, 0.12)}`,
            };
        case 'glow':
            return {
                border: `1px solid ${hexToRgba(color, 0.75)}`,
                boxShadow: `0 0 20px ${hexToRgba(color, 0.4)}`,
            };
        case 'shine':
            return {
                border: '1px solid rgba(255,255,255,0.65)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
            };
        case 'glass-edge':
            return {
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.12)',
            };
        default:
            return {};
    }
};

export function getCardLogic({
    variant = 'default',
    color = 'default',
    gradientDirection = 'b',
    shape = 'default',
    flipHorizontal = false,
    flipVertical = false,
    effect = 'none',
    effectColor,
    decoration = 'none',
    decorationColor = '#FFFFFF',
    layer = 'normal',
}) {
    const safeVariant = CARD_VARIANTS.includes(variant) ? variant : 'default';
    const colorConfig = COLORS[color] || COLORS.default;
    const colorText = CARD_TEXT_COLORS[color] || CARD_TEXT_COLORS.default;
    const solidText = SOLID_TEXT_COLORS[color] || SOLID_TEXT_COLORS.default;
    const gradientColor = GRADIENTS[color] || GRADIENTS.default;
    const threeDColor = THREE_D[color] || THREE_D.default;
    const glassColor = GLASS[color] || GLASS.default;
    const duotoneColor = DUOTONE[color] || DUOTONE.default;
    const holographicColor = HOLOGRAPHIC[color] || HOLOGRAPHIC.default;
    const gradientDirectionClass = GRADIENT_DIRECTIONS[gradientDirection] || GRADIENT_DIRECTIONS.b;

    let surfaceClassName = '';
    let contentColorClassName = colorText;

    switch (safeVariant) {
        case 'soft':
            surfaceClassName = `${glassColor} shadow-none`;
            break;
        case 'outlined':
            surfaceClassName = `bg-transparent border-2 ${OUTLINE_COLORS[color] || OUTLINE_COLORS.default}`;
            break;
        case 'filled':
            surfaceClassName = `${colorConfig.base} shadow-sm`;
            contentColorClassName = solidText;
            break;
        case 'flat':
            surfaceClassName = 'bg-transparent border border-transparent';
            break;
        case 'glass':
            surfaceClassName = `${glassColor} backdrop-blur-xl shadow-lg`;
            break;
        case '3d':
            surfaceClassName = `bg-gradient-to-b ${threeDColor} shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-2px_4px_rgba(0,0,0,0.25),0_6px_14px_rgba(0,0,0,0.2)]`;
            contentColorClassName = solidText;
            break;
        case 'duotone':
            surfaceClassName = `bg-gradient-to-br ${duotoneColor} border border-white/20 shadow-lg`;
            contentColorClassName = color === 'white' ? 'text-slate-800' : 'text-white';
            break;
        case 'gradient':
            surfaceClassName = `${gradientDirectionClass} ${gradientColor} border border-transparent shadow-md`;
            contentColorClassName = color === 'white' ? 'text-slate-800' : 'text-white';
            break;
        case 'inset':
            surfaceClassName = `${colorConfig.base} shadow-[inset_0_2px_8px_rgba(0,0,0,0.18),inset_0_-1px_2px_rgba(255,255,255,0.12)]`;
            contentColorClassName = solidText;
            break;
        case 'holographic':
            surfaceClassName = `bg-gradient-to-r ${holographicColor} border border-white/30 shadow-lg`;
            contentColorClassName = color === 'white' || color === 'default' ? 'text-slate-800' : 'text-white';
            break;
        case 'default':
        default:
            surfaceClassName = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm';
            contentColorClassName = 'text-slate-800 dark:text-slate-100';
            break;
    }

    return {
        surfaceClassName,
        contentColorClassName,
        shapeStyle: getShapeStyle(shape, flipHorizontal, flipVertical),
        decorationStyle: getDecorationStyle(decoration, decorationColor),
        effectStyle: getEffectStyle(effect, effectColor || colorConfig.hex),
        layerClassName: LAYER_STYLES[layer] || LAYER_STYLES.normal,
    };
}
