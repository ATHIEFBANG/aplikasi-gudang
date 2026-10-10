
import React from 'react';
import Button from '@/components/gabungan/Button';

const DEFAULT_BUTTON_PROPS = {
    shape: 'kiri-atas-kanan-bawah',
    flipHorizontal: false,
    flipVertical: false,
    size: 'none',
    width: 'full',
    edge: 'none',
    edgeOffset: 0,
    layer: 'normal',
    decoration: 'none',
    decorationColor: '#FFFFFF',
};

export default function FilterPanelMenu({
    items = [],
    activeItem,
    onChange,
    className = '',
    buttonProps = {},
}) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {items.map(item => {
                const isActive = activeItem === item.value;
                const props = { ...DEFAULT_BUTTON_PROPS, ...buttonProps, ...item.buttonProps };

                return (
                    <Button
                        key={item.value}
                        type="button"
                        {...props}
                        id={item.id}
                        variant={isActive ? '3d' : 'ghost'}
                        color={isActive ? 'blue' : 'default'}
                        effect={isActive ? 'neon' : 'none'}
                        effectColor={isActive ? '#22D3EE' : undefined}
                        selected={isActive}
                        disabled={item.disabled ?? props.disabled ?? false}
                        onClick={() => onChange?.(item.value)}
                        className={`!flex !h-12 !w-full !items-center !justify-center !gap-2 !px-3 text-center text-sm font-bold transition-all ${isActive ? '!text-white' : '!text-slate-600 dark:!text-slate-300'} ${item.className || ''} ${props.className || ''}`}
                    >
                        <span className="flex w-full items-center justify-center text-center leading-none">
                            {item.label}
                        </span>

                        {item.count > 0 && (
                            <span className={`absolute right-3 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                                {item.count}
                            </span>
                        )}
                    </Button>
                );
            })}
        </div>
    );
}
