
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getShapeStyle, getShadowEffectStyle } from './Style';
import {
    Dialog,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    MODAL_DENSITIES,
    getModalContentClass,
    getModalContentSurfaceClass,
    getModalOverlayClass,
    getModalHeaderClass,
    getModalBodyClass,
    getModalFooterClass,
    getModalSectionClass,
    getModalIconClass,
    getModalPanelClass,
    getModalSurfaceStyle,
} from './ModalLogic';

const ModalStyleContext = React.createContext({
    variant: 'clean',
    color: 'default',
    density: 'comfortable',
});

function expandBorderRadius(borderRadius, offset) {
    if (!borderRadius || offset <= 0) return borderRadius;

    const values = borderRadius.trim().split(/\s+/);
    const corners = values.length === 1
        ? Array(4).fill(values[0])
        : values.length === 2
            ? [values[0], values[1], values[0], values[1]]
            : values.length === 3
                ? [values[0], values[1], values[2], values[1]]
                : values.slice(0, 4);

    return corners.map(radius => {
        if (/^0(?:\.0+)?(?:px|rem|em|%)?$/.test(radius)) return '0';

        const match = radius.match(/^(-?\d*\.?\d+)(px|rem|em|%)$/);
        if (!match) return radius;

        const [, value, unit] = match;
        return unit === 'px'
            ? `${Number(value) + offset}px`
            : `calc(${value}${unit} + ${offset}px)`;
    }).join(' ');
}

function Modal(props) {
    return <Dialog data-slot="modal-root" {...props} />;
}

function ModalTrigger(props) {
    return <DialogTrigger data-slot="modal-trigger" {...props} />;
}

function ModalClose(props) {
    return <DialogClose data-slot="modal-close" {...props} />;
}

function ModalContent({
    children,
    size = 'lg',
    variant = 'clean',
    color = 'default',
    borderColor,
    borderWidth,
    borderAlpha,
    ringAlpha,
    shape = 'default',
    flipHorizontal = false,
    flipVertical = false,
    placement = 'center',
    density = 'comfortable',
    overlay = 'default',
    overlayClassName = '',
    className = '',
    style,
    effect = 'none',
    effectColor,
    effectOpacity,
    effectOffsetX,
    effectOffsetY,
    effectBlur,
    effectSpread,
    stack = false,
    stackOffset = 5,
    stackColor = '#111827',
    stackBorderColor = '#64748B',
    stackBorderWidth = 2,
    ...props
}) {
    const safeDensity = MODAL_DENSITIES[density] ? density : 'comfortable';
    const contentClassName = getModalContentClass({ size, placement, className });
    const surfaceClassName = getModalContentSurfaceClass({ variant, color });
    const surfaceStyle = getModalSurfaceStyle({ color, borderColor, borderWidth, borderAlpha, ringAlpha });
    const shapeStyle = getShapeStyle(shape, flipHorizontal, flipVertical);
    const contentShapeStyle = shapeStyle.borderRadius ? { borderRadius: shapeStyle.borderRadius } : {};
    const shadowEffectStyle = getShadowEffectStyle({ effect, effectColor, effectOpacity, effectOffsetX, effectOffsetY, effectBlur, effectSpread });
    const offset = Math.max(0, Number(stackOffset) || 0);
    const safeBorderWidth = Math.max(0, Number(stackBorderWidth) || 0);

    const stackShapeStyle = {
        ...shapeStyle,
        ...(shapeStyle.borderRadius ? {
            borderRadius: expandBorderRadius(shapeStyle.borderRadius, offset),
        } : {}),
    };

    return (
        <DialogContent
            data-slot="modal-content"
            className={cn(contentClassName, 'relative')}
            overlayClassName={getModalOverlayClass(overlay, overlayClassName)}
            {...props}
            showCloseButton={false}
        >
            <ModalStyleContext.Provider value={{ variant, color, density: safeDensity }}>
                {stack && (
                    <div
                        data-slot="modal-stack"
                        aria-hidden="true"
                        className="pointer-events-none absolute border"
                        style={{
                            ...stackShapeStyle,
                            top: -offset,
                            right: -offset,
                            bottom: -offset,
                            left: -offset,
                            backgroundColor: stackColor,
                            borderColor: stackBorderColor,
                            borderWidth: `${safeBorderWidth}px`,
                            borderStyle: safeBorderWidth > 0 ? 'solid' : 'none',
                            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
                            zIndex: 1,
                        }}
                    />
                )}

                {Object.keys(shadowEffectStyle).length > 0 && (
                    <div
                        data-slot="modal-shadow-effect"
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-[4] bg-transparent"
                        style={{
                            ...shapeStyle,
                            ...shadowEffectStyle,
                        }}
                    />
                )}

                <div
                    data-slot="modal-surface"
                    aria-hidden="true"
                    className={cn('pointer-events-none absolute inset-0 z-[5]', surfaceClassName)}
                    style={{ ...surfaceStyle, ...style, ...shapeStyle }}
                />

                <div className="relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col" style={contentShapeStyle}>
                    {children}
                </div>
            </ModalStyleContext.Provider>
        </DialogContent>
    );
}

function ModalHeader({
    title,
    description,
    eyebrow,
    icon,
    iconColor = 'default',
    iconSize = 'md',
    badge,
    actions,
    variant,
    color,
    borderColor,
    borderWidth,
    borderAlpha,
    ringAlpha,
    density,
    divider = true,
    className = '',
    titleClassName = '',
    descriptionClassName = '',
    style,
    children,
    ...props
}) {
    const context = React.useContext(ModalStyleContext);
    const effectiveDensity = MODAL_DENSITIES[density] ? density : context.density;
    const effectiveColor = color ?? context.color;
    const effectiveVariant = variant ?? (
        context.variant === 'danger' ? 'danger' : context.variant === 'accent' ? 'accent' : 'default'
    );
    const surfaceStyle = getModalSurfaceStyle({ color: effectiveColor, borderColor, borderWidth, borderAlpha, ringAlpha });

    return (
        <header
            data-slot="modal-header"
            className={getModalHeaderClass({ variant: effectiveVariant, color: effectiveColor, density: effectiveDensity, divider, className })}
            style={{ ...surfaceStyle, ...style }}
            {...props}
        >
            {(eyebrow || icon || title || description || badge || actions) && (
                <div className="flex min-w-0 items-start gap-3 pr-7 sm:pr-8">
                    {icon && (
                        <span aria-hidden="true" className={getModalIconClass({ color: iconColor, size: iconSize })}>
                            {icon}
                        </span>
                    )}

                    <div className="min-w-0 flex-1 space-y-1.5">
                        {eyebrow && (
                            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                {eyebrow}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            {title && (
                                <DialogTitle className={cn('text-base font-semibold leading-tight tracking-tight sm:text-lg', titleClassName)}>
                                    {title}
                                </DialogTitle>
                            )}

                            {badge && (
                                <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {badge}
                                </span>
                            )}
                        </div>

                        {description && (
                            <DialogDescription className={cn('max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm', descriptionClassName)}>
                                {description}
                            </DialogDescription>
                        )}
                    </div>

                    {actions && (
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>
            )}

            {children}
        </header>
    );
}

function ModalBody({
    children,
    density,
    layout = 'default',
    variant = 'default',
    color,
    borderColor,
    borderWidth,
    borderAlpha,
    ringAlpha,
    scrollable = true,
    className = '',
    style,
    ...props
}) {
    const context = React.useContext(ModalStyleContext);
    const effectiveDensity = MODAL_DENSITIES[density] ? density : context.density;
    const effectiveColor = color ?? context.color;
    const surfaceStyle = getModalSurfaceStyle({ color: effectiveColor, borderColor, borderWidth, borderAlpha, ringAlpha });

    return (
        <div
            data-slot="modal-body"
            data-variant={variant}
            className={getModalBodyClass({ density: effectiveDensity, layout, variant, color: effectiveColor, scrollable, className })}
            style={{ ...surfaceStyle, ...style }}
            {...props}
        >
            {children}
        </div>
    );
}

function ModalFooter({
    children,
    density,
    align = 'end',
    sticky = true,
    divider = true,
    variant = 'default',
    color,
    borderColor,
    borderWidth,
    borderAlpha,
    ringAlpha,
    className = '',
    style,
    ...props
}) {
    const context = React.useContext(ModalStyleContext);
    const effectiveDensity = MODAL_DENSITIES[density] ? density : context.density;
    const effectiveColor = color ?? context.color;
    const surfaceStyle = getModalSurfaceStyle({ color: effectiveColor, borderColor, borderWidth, borderAlpha, ringAlpha });

    return (
        <footer
            data-slot="modal-footer"
            className={getModalFooterClass({ density: effectiveDensity, align, sticky, divider, variant, color: effectiveColor, className })}
            style={{ ...surfaceStyle, ...style }}
            {...props}
        >
            {children}
        </footer>
    );
}

function ModalSection({
    title,
    description,
    actions,
    columns = 1,
    children,
    className = '',
    contentClassName = '',
    ...props
}) {
    const hasHeading = Boolean(title || description || actions);

    return (
        <section data-slot="modal-section" className={cn('min-w-0 space-y-3', className)} {...props}>
            {hasHeading && (
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                        {title && (
                            <h3 className="text-sm font-semibold tracking-tight text-foreground">
                                {title}
                            </h3>
                        )}

                        {description && (
                            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                {description}
                            </p>
                        )}
                    </div>

                    {actions && <div className="shrink-0">{actions}</div>}
                </div>
            )}

            <div className={getModalSectionClass({ columns, className: contentClassName })}>
                {children}
            </div>
        </section>
    );
}

function ModalPanel({
    children,
    variant = 'default',
    color,
    borderColor,
    borderWidth,
    borderAlpha,
    ringAlpha,
    className = '',
    style,
    ...props
}) {
    const context = React.useContext(ModalStyleContext);
    const effectiveColor = color ?? context.color;
    const surfaceStyle = getModalSurfaceStyle({ color: effectiveColor, borderColor, borderWidth, borderAlpha, ringAlpha });

    return (
        <div
            data-slot="modal-panel"
            className={cn('min-w-0 p-4 sm:p-5', getModalPanelClass({ variant, color: effectiveColor, className }))}
            style={{ ...surfaceStyle, ...style }}
            {...props}
        >
            {children}
        </div>
    );
}

function ModalDivider({ className = '', ...props }) {
    return <div data-slot="modal-divider" role="separator" className={cn('h-px w-full bg-border/70', className)} {...props} />;
}

export {
    Modal,
    ModalTrigger,
    ModalClose,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalSection,
    ModalPanel,
    ModalDivider,
};

export default Modal;
