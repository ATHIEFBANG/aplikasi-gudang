
import React from 'react';
import { cn } from '@/lib/utils';
import { CARD_WIDTHS, getCardLogic } from './CardLogic';

export default function CustomCard({
    children,
    variant = 'default',
    effect = 'none',
    effectColor,
    decoration = 'none',
    decorationColor = '#FFFFFF',
    color = 'default',
    gradientDirection = 'b',
    shape = 'default',
    flipHorizontal = false,
    flipVertical = false,
    width = 'full',
    layer = 'normal',
    stack = false,
    stackDepth = 3,
    stackOffset = 8,
    stackOpacity = 0.75,
    padding = 'p-5',
    gap = 'gap-3',
    className = '',
    contentClassName = '',
    surfaceClassName: surfaceClassNameOverride = '',
    stackClassName = '',
    style,
    as: Component = 'div',
    ...props
}) {
    const {
        surfaceClassName,
        contentColorClassName,
        shapeStyle,
        decorationStyle,
        effectStyle,
        layerClassName,
    } = getCardLogic({
        variant,
        color,
        gradientDirection,
        shape,
        flipHorizontal,
        flipVertical,
        effect,
        effectColor,
        decoration,
        decorationColor,
        layer,
    });

    const widthClass = CARD_WIDTHS[width] || CARD_WIDTHS.full;
    const depth = stack ? Math.min(5, Math.max(1, Math.floor(Number(stackDepth) || 1))) : 0;
    const offset = Math.max(0, Number(stackOffset) || 0);

    return (
        <Component
            {...props}
            data-slot="custom-card"
            data-variant={variant}
            data-color={color}
            data-stacked={stack ? 'true' : 'false'}
            className={cn(
                'relative isolate flex min-w-0 flex-col',
                widthClass,
                padding,
                contentColorClassName,
                layerClassName,
                className
            )}
            style={style}
        >
            {depth > 0 && Array.from({ length: depth }, (_, index) => {
                const distance = (depth - index) * offset;
                const opacity = Math.max(0.2, Math.min(1, Number(stackOpacity) - index * 0.12));

                return (
                    <div
                        key={`card-layer-${index}`}
                        aria-hidden="true"
                        className={cn(
                            'pointer-events-none absolute inset-0 border shadow-none',
                            surfaceClassName,
                            stackClassName
                        )}
                        style={{
                            ...shapeStyle,
                            transform: `translate(${distance}px, ${distance}px)`,
                            opacity,
                        }}
                    />
                );
            })}

            <div
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute inset-0 z-[1]',
                    surfaceClassName,
                    surfaceClassNameOverride
                )}
                style={shapeStyle}
            />

            {decoration !== 'none' && decorationStyle && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-[2]"
                    style={{
                        ...shapeStyle,
                        backgroundImage: decorationStyle,
                        opacity: 0.35,
                    }}
                />
            )}

            <div className={cn('relative z-10 flex min-w-0 flex-col', gap, contentClassName)}>
                {children}
            </div>

            {effect !== 'none' && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20"
                    style={{
                        ...shapeStyle,
                        ...effectStyle,
                    }}
                />
            )}
        </Component>
    );
}
