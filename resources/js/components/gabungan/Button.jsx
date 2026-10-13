
import React from 'react';
import { getButtonLogic } from './ButtonLogic';
import { getShadowEffectStyle } from './Style';

export default function Button({
    children,
    variant = 'default',
    effect = 'none',
    effectColor,
    effectOpacity,
    effectOffsetX,
    effectOffsetY,
    effectBlur,
    effectSpread,
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
    const logic = getButtonLogic({
        variant,
        effect,
        effectColor,
        decoration,
        decorationColor,
        color,
        gradient,
        gradientDirection,
        size,
        shape,
        flipHorizontal,
        flipVertical,
        width,
        layer,
        attached,
        hover,
        selected,
        disabled,
        onClick,
    });

    const shadowEffectStyle = getShadowEffectStyle({
        effect,
        effectColor,
        effectOpacity,
        effectOffsetX,
        effectOffsetY,
        effectBlur,
        effectSpread,
    });
    
    const {
        widthClass,
        variantClass,
        effectClass,
        colorClass,
        effectColorClass,
        customEffectClass,
        sizeClass,
        attachedClass,
        layerClass,
        interactiveClass,
        selectedClass,
        disabledClass,
        cursorClass,
        contentClass,
        shapeStyle,
        customEffectStyle,
        decorationStyle,
        hasDecoration,
        variantColorStyle,
    } = logic;

    const hasShadowEffect = Boolean(shadowEffectStyle.boxShadow);
    const buttonClassName = [
        hasShadowEffect && 'relative isolate',
        widthClass,
        variantClass,
        effectClass,
        colorClass,
        effectColorClass,
        customEffectClass,
        sizeClass,
        attachedClass,
        layerClass,
        interactiveClass,
        selectedClass,
        disabledClass,
        cursorClass,
        contentClass,
        className,
    ].filter(Boolean).join(' ');

    return (
        <Component
            type={Component === 'button' ? type : undefined}
            onClick={disabled ? undefined : onClick}
            disabled={Component === 'button' ? disabled : undefined}
            aria-disabled={disabled || undefined}
            style={{
                ...shapeStyle,
                ...customEffectStyle,
                ...variantColorStyle,
            }}
            className={buttonClassName}
            {...props}
        >
            {hasShadowEffect && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-10 bg-transparent"
                    style={{ ...shapeStyle, ...shadowEffectStyle }}
                />
            )}

            {hasDecoration && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{
                        backgroundImage: decorationStyle,
                        borderRadius: 'inherit',
                    }}
                />
            )}

            <span className="relative z-20 inline-flex items-center justify-center gap-2">
                {children}
            </span>
        </Component>
    );
}
