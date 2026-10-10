// Button.jsx

import React from 'react';
import { getButtonLogic } from './ButtonLogic';

export default function Button({
    children,
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
        edge,
        edgeOffset,
        layer,
        attached,
        hover,
        selected,
        disabled,
        onClick,
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
    } = logic;

    const buttonClassName = [
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
                ...edgeStyle,
                ...customEffectStyle,
            }}
            className={buttonClassName}
            {...props}
        >
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