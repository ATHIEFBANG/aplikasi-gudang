
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
    getModalLayoutDividerClass,
} from './ModalLogic';

const ModalStyleContext = React.createContext({
    variant: 'clean',
    color: 'default',
    density: 'comfortable',
    layoutDivider: 'visible',
});

// Memperbesar radius sudut sesuai pembesaran Card.
function expandBorderRadius(borderRadius, offset) {
    if (!borderRadius || offset <= 0) return borderRadius;

    const values = borderRadius.trim().split(/\s+/);
    const corners = values.length === 1
        ? [values[0], values[0], values[0], values[0]]
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
    layoutDivider = 'visible',
    overlay = 'default',
    overlayClassName = '',
    className = '',
    style,
    stack = false,
    stackShape = shape,
    stackDepth = 1,
    stackOffset = 5,
    stackRotate = 0,
    stackTranslateX = 0,
    stackTranslateY = 0,
    stackColor = '#111827',
    stackBorderColor = '#64748B',
    stackBorderWidth = 2,
    stackFlipHorizontal,
    stackFlipVertical,
    effect = 'none',
    effectColor,
    effectOpacity,
    effectOffsetX,
    effectOffsetY,
    effectBlur,
    effectSpread,
    ...props
}) {
    const safeDensity = MODAL_DENSITIES[density] ? density : 'comfortable';
    const contentClassName = getModalContentClass({ size, placement, className });
    const surfaceClassName = getModalContentSurfaceClass({ variant, color });
    const surfaceStyle = getModalSurfaceStyle({ color, borderColor, borderWidth, borderAlpha, ringAlpha });
    const shapeStyle = getShapeStyle(shape, flipHorizontal, flipVertical);
    const contentShapeStyle = shapeStyle.borderRadius ? { borderRadius: shapeStyle.borderRadius } : {};
    const offset = Math.max(0, Number(stackOffset) || 0);
    const depth = stack ? Math.min(5, Math.max(1, Math.floor(Number(stackDepth) || 1))) : 0;
    const safeBorderWidth = Math.max(0, Number(stackBorderWidth) || 0);
    const getNumericValue = value => Number.isFinite(Number(value)) ? Number(value) : 0;
    const safeStackRotate = getNumericValue(stackRotate);
    const safeStackTranslateX = getNumericValue(stackTranslateX);
    const safeStackTranslateY = getNumericValue(stackTranslateY);
    const stackTransform = safeStackRotate !== 0 || safeStackTranslateX !== 0 || safeStackTranslateY !== 0
        ? `translate(${safeStackTranslateX}px, ${safeStackTranslateY}px) rotate(${safeStackRotate}deg)`
        : undefined;
    const stackBaseShapeStyle = getShapeStyle(
        stackShape,
        stackFlipHorizontal ?? flipHorizontal,
        stackFlipVertical ?? flipVertical
    );
    const shadowEffectStyle = getShadowEffectStyle({ effect, effectColor, effectOpacity, effectOffsetX, effectOffsetY, effectBlur, effectSpread });

    const getStackShapeStyle = distance => ({
        ...stackBaseShapeStyle,
        ...(stackBaseShapeStyle.borderRadius ? {
            borderRadius: expandBorderRadius(stackBaseShapeStyle.borderRadius, distance),
        } : {}),
    });

    return (
        <DialogContent
            data-slot="modal-content"
            className={cn(contentClassName, 'relative')}
            overlayClassName={getModalOverlayClass(overlay, overlayClassName)}
            {...props}
            showCloseButton={false}
        >
            <ModalStyleContext.Provider value={{ variant, color, density: safeDensity, layoutDivider }}>
                {depth > 0 && Array.from({ length: depth }, (_, index) => {
                    const distance = (depth - index) * offset;

                    return (
                        <div
                            key={`modal-stack-${index}`}
                            data-slot="modal-stack"
                            aria-hidden="true"
                            className="pointer-events-none absolute border"
                            style={{
                                ...getStackShapeStyle(distance),
                                top: -distance,
                                right: -distance,
                                bottom: -distance,
                                left: -distance,
                                transform: stackTransform,
                                transformOrigin: stackTransform ? 'center' : undefined,
                                backgroundColor: stackColor,
                                borderColor: stackBorderColor,
                                borderWidth: `${safeBorderWidth}px`,
                                borderStyle: safeBorderWidth > 0 ? 'solid' : 'none',
                                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
                                zIndex: 1,
                            }}
                        />
                    );
                })}

                {Object.keys(shadowEffectStyle).length > 0 && (
                    <div
                        data-slot="modal-shadow-effect"
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-[4] bg-transparent"
                        style={{ ...shapeStyle, ...shadowEffectStyle }}
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
    const effectiveDivider = divider && context.layoutDivider !== 'hidden';
    // Only control the Header's own separator. Do not alter Body, Sidebar,
    // Main, or Footer styling when layoutDivider is hidden.
    const dividerStyle = context.layoutDivider === 'hidden'
        ? { borderBottomWidth: 0, borderBottomStyle: 'none', boxShadow: 'none' }
        : context.layoutDivider === 'subtle'
            ? { borderBottomColor: 'rgb(148 163 184 / 0.25)' }
            : {};
    const headerClassName = cn(
        getModalHeaderClass({ variant: effectiveVariant, color: effectiveColor, density: effectiveDensity, divider: effectiveDivider, layoutDivider: context.layoutDivider, className }),
        context.layoutDivider === 'hidden' && '!border-b-0 !shadow-none !ring-0'
    );

    return (
        <header
            data-slot="modal-header"
            className={headerClassName}
            style={{ ...surfaceStyle, ...dividerStyle, ...style, ...(context.layoutDivider === 'hidden' ? { borderBottomWidth: 0, borderBottomStyle: 'none', boxShadow: 'none' } : {}) }}
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
            className={getModalBodyClass({ density: effectiveDensity, layout, variant, color: effectiveColor, scrollable, layoutDivider: context.layoutDivider, className })}
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
    const effectiveDivider = divider && context.layoutDivider !== 'hidden';
    const dividerStyle = context.layoutDivider === 'hidden'
        ? { borderTopWidth: 0 }
        : context.layoutDivider === 'subtle'
            ? { borderTopColor: 'rgb(148 163 184 / 0.25)' }
            : {};

    return (
        <footer
            data-slot="modal-footer"
            className={getModalFooterClass({ density: effectiveDensity, align, sticky, divider: effectiveDivider, variant, color: effectiveColor, layoutDivider: context.layoutDivider, className })}
            style={{ ...surfaceStyle, ...dividerStyle, ...style }}
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
            className={cn('min-w-0 p-4 sm:p-5', getModalPanelClass({ variant, color: effectiveColor, layoutDivider: context.layoutDivider, className }))}
            style={{ ...surfaceStyle, ...style }}
            {...props}
        >
            {children}
        </div>
    );
}

function ModalDivider({ className = '', variant, orientation = 'horizontal', ...props }) {
    const context = React.useContext(ModalStyleContext);
    const effectiveVariant = variant ?? context.layoutDivider ?? 'visible';

    if (effectiveVariant === 'hidden') return null;

    return (
        <div
            data-slot="modal-divider"
            data-variant={effectiveVariant}
            data-orientation={orientation}
            role="separator"
            aria-orientation={orientation}
            className={getModalLayoutDividerClass({ variant: effectiveVariant, orientation, className })}
            {...props}
        />
    );
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
    ModalDivider as ModalLayoutDivider,
};

export default Modal;
