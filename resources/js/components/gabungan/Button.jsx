
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
    const wrapperRef = useRef(null);
    const [hitbox, setHitbox] = useState(null);

    useEffect(() => {
        if (layer !== 'behind' || typeof window === 'undefined') {
            setHitbox(null);
            return undefined;
        }

        const updateHitbox = () => {
            const element = wrapperRef.current;
            if (!element) return;
            const rect = element.getBoundingClientRect();
            setHitbox({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        };

        updateHitbox();
        window.addEventListener('resize', updateHitbox);
        window.addEventListener('scroll', updateHitbox, true);
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateHitbox) : null;
        if (observer && wrapperRef.current) observer.observe(wrapperRef.current);

        return () => {
            window.removeEventListener('resize', updateHitbox);
            window.removeEventListener('scroll', updateHitbox, true);
            observer?.disconnect();
        };
    }, [layer, children, className]);

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

    const buttonElement = (
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

    const wrappedButton = layer === 'behind'
        ? <span ref={wrapperRef} className="relative isolate z-[-1] inline-flex">{buttonElement}</span>
        : buttonElement;

    return (
        <>
            {wrappedButton}
            {layer === 'behind' && hitbox && !disabled && typeof document !== 'undefined' && createPortal(
                <button
                    type="button"
                    aria-label={typeof children === 'string' ? children : 'Button'}
                    onClick={onClick}
                    className="fixed z-[9998] cursor-pointer border-0 bg-transparent p-0"
                    style={{
                        top: hitbox.top,
                        left: hitbox.left,
                        width: hitbox.width,
                        height: hitbox.height,
                        pointerEvents: 'auto',
                    }}
                />,
                document.body
            )}
        </>
    );
}
