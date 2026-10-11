import React from 'react';
import { Check, Filter, RotateCcw, X } from 'lucide-react';

import Button from '@/components/gabungan/Button';
import Card from '@/components/gabungan/CustomCard';
import FilterPanelMenu from '@/components/gabungan/FilterPanelMenu';

import Modal, {
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@/components/gabungan/Modal';

import {
    getModalIconClass,
    getModalPanelClass,
    getModalSurfaceStyle,
} from '@/components/gabungan/ModalLogic';

import { DialogTitle } from '@/components/ui/dialog';

// =========================================================
// 1. VARIANT DAN WARNA FILTER PANEL
// =========================================================

const FILTER_PANEL_STYLE = {
    content: {
        variant: '3d',
        color: 'blue',
        borderColor: '#FFFFFF',
        borderWidth: 3,
        shape: 'rounded',
    },

    header: {
        variant: '3d',
        color: 'blue',
        borderColor: '#60A5FA',
        borderWidth: 2,
    },

    body: {
        variant: '3d',
        color: 'red',
    },

    sidebar: {
        variant: 'muted',
        color: 'slate',
        borderColor: '#64748B',
    },

    main: {
        variant: 'clean',
        color: 'blue',
    },

    footer: {
        variant: 'clean',
        color: 'slate',
        borderColor: '#64748B',
    },

    icon: {
        color: 'blue',
    },
};

// =========================================================
// 2. CARD JUDUL FILTER DATA
// =========================================================

// Atur desain, ukuran, dan posisi Card di sini.
const FILTER_TITLE_CARD = {
    variant: 'duotone',
    color: 'amber',
    shape: 'kiri-atas-kanan-kapsul',
    flipHorizontal: true,
    flipVertical: false,
    effect: 'glow',
    effectColor: "#22D3EE",
    decoration: 'none',
    size: 'none',
    width: 'fit',
    edge: 'none',
    edgeOffset: 0,
    layer: 'front',
    className: '!h-10 !w-fit !max-w-full  translate-x-2 -translate-y-7 !px-7 !py-0',
    contentClassName: '!h-full !w-fit !flex-row !items-center !justify-center !gap-2 !p-0',
};

// =========================================================
// 3. LAYOUT DAN UKURAN MODAL
// =========================================================

const FILTER_PANEL_LAYOUT = {
    content: 'h-[590px] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] !max-w-[920px] !overflow-visible sm:max-h-[calc(100dvh-2rem)] sm:!max-w-[920px]',
    header: 'relative z-0 flex h-12 shrink-0 items-center justify-center !rounded-t-[inherit] !px-6 !py-0',
    body: 'flex min-h-0 flex-1 !overflow-hidden !p-0',
    sidebar: 'shrink-0 overflow-x-auto border-b p-2 sm:w-[190px] sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3',
    main: 'min-h-0 min-w-0 flex-1 overflow-hidden p-3 sm:p-4',
    footer: '!flex-row items-center rounded-b-[inherit]',
};

// =========================================================
// 4. FILTER PANEL
// =========================================================

export default function FilterPanelLayout({
    open,
    onOpenChange,
    isProcessing = false,
    title = 'Filter Data',
    menuItems = [],
    activeItem,
    onMenuChange,
    resetLabel = 'Reset',
    applyLabel = 'Terapkan',
    onReset,
    onCancel,
    onApply,
    children,
}) {
    const handleOpenChange = nextOpen => {
        if (!nextOpen && isProcessing) return;
        onOpenChange?.(nextOpen);
    };

    const contentStyle = FILTER_PANEL_STYLE.content;
    const headerStyle = FILTER_PANEL_STYLE.header;
    const bodyStyle = FILTER_PANEL_STYLE.body;
    const sidebarStyle = FILTER_PANEL_STYLE.sidebar;
    const mainStyle = FILTER_PANEL_STYLE.main;
    const footerStyle = FILTER_PANEL_STYLE.footer;

    return (
        <Modal open={open} onOpenChange={handleOpenChange}>
            {/* CONTENT */}
            <ModalContent
                {...contentStyle}
                size="4xl"
                placement="center"
                density="compact"
                overlay="blur"
                showCloseButton={!isProcessing}
                closeButtonLabel="Tutup filter"
                className={FILTER_PANEL_LAYOUT.content}
            >
                {/* HEADER */}
                <ModalHeader
                    {...headerStyle}
                    density="compact"
                    className={FILTER_PANEL_LAYOUT.header}
                >
                    <Card {...FILTER_TITLE_CARD}>
                        <span
                            className={getModalIconClass({
                                color: FILTER_PANEL_STYLE.icon.color,
                                size: 'sm',
                                className: '!size-7',
                            })}
                        >
                            <Filter className="size-4" strokeWidth={2.5} />
                        </span>

                        <DialogTitle className="m-0 shrink-0 whitespace-nowrap text-sm font-black tracking-tight !text-white sm:text-base">
                            {title}
                        </DialogTitle>
                    </Card>
                </ModalHeader>

                {/* BODY */}
                <ModalBody
                    {...bodyStyle}
                    layout="flush"
                    scrollable={false}
                    density="compact"
                    className={FILTER_PANEL_LAYOUT.body}
                >
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col sm:flex-row">
                        {/* SIDEBAR */}
                        <aside
                            className={getModalPanelClass({
                                variant: sidebarStyle.variant,
                                color: sidebarStyle.color,
                                className: FILTER_PANEL_LAYOUT.sidebar,
                            })}
                            style={getModalSurfaceStyle(sidebarStyle)}
                        >
                            <FilterPanelMenu
                                items={menuItems}
                                activeItem={activeItem}
                                onChange={onMenuChange}
                                positionX={0}
                                positionY={0}
                                positionClassName=""
                                orientation="horizontal"
                                className="sm:!w-full sm:!min-w-0 sm:!flex-col"
                            />
                        </aside>

                        {/* MAIN */}
                        <main
                            className={getModalPanelClass({
                                variant: mainStyle.variant,
                                color: mainStyle.color,
                                className: FILTER_PANEL_LAYOUT.main,
                            })}
                            style={getModalSurfaceStyle(mainStyle)}
                        >
                            {children}
                        </main>
                    </div>
                </ModalBody>

                {/* FOOTER */}
                <ModalFooter
                    {...footerStyle}
                    density="compact"
                    sticky
                    divider
                    align="between"
                    className={FILTER_PANEL_LAYOUT.footer}
                >
                    <div className="flex w-full items-center justify-between gap-3">
                        {/* RESET */}
                        <Button
                            type="button"
                            variant="3d"
                            color="slate"
                            size="none"
                            width="fit"
                            onClick={onReset}
                            disabled={isProcessing}
                            className="h-9 gap-2 px-3 sm:px-5"
                        >
                            <RotateCcw className="size-4 shrink-0" strokeWidth={2.5} />
                            <span className="text-sm font-bold text-white">
                                {resetLabel}
                            </span>
                        </Button>

                        <div className="flex items-center gap-2">
                            {/* BATAL */}
                            <Button
                                type="button"
                                variant="3d"
                                color="red"
                                size="none"
                                width="fit"
                                onClick={onCancel}
                                disabled={isProcessing}
                                className="h-9 gap-2 px-3 sm:px-5"
                            >
                                <X className="size-4 shrink-0" strokeWidth={2.5} />
                                <span className="text-sm font-bold text-white">
                                    Batal
                                </span>
                            </Button>

                            {/* TERAPKAN */}
                            <Button
                                type="button"
                                variant="3d"
                                color="default"
                                size="none"
                                width="fit"
                                onClick={onApply}
                                disabled={isProcessing}
                                className="h-9 gap-2 px-4 sm:px-6"
                            >
                                <Check className="size-4 shrink-0" strokeWidth={2.5} />
                                <span className="text-sm font-bold text-white">
                                    {isProcessing ? 'Memproses...' : applyLabel}
                                </span>
                            </Button>
                        </div>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}