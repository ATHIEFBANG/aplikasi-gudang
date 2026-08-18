"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"
import { ChevronRightIcon, CheckIcon, SearchIcon, X } from "lucide-react"

function DropdownMenu({
  ...props
}) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
  ...props
}) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}>
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-1 text-slate-800 dark:text-slate-200 shadow-xl ring-1 ring-black/5 dark:ring-white/5 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props} />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

// 👉 SEARCH INPUT DENGAN SPASI / PADDING YANG NYAMAN
function DropdownMenuSearchInput({
  className,
  value,
  onChange,
  placeholder = "Cari...",
  ...props
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10"
      onClick={(e) => e.stopPropagation()} // Mencegah dropdown tertutup saat search diklik
      onKeyDown={(e) => e.stopPropagation()} // Mencegah keyboard navigasi bentrok
    >
      <SearchIcon className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500 ml-0.5" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "flex h-6 w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none pl-1 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        autoFocus
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange?.({ target: { value: '' } });
          }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer transition-colors mr-0.5"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

function DropdownMenuGroup({
  ...props
}) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 data-inset:pl-7",
        className
      )}
      {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item relative flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs outline-hidden select-none transition-colors text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 not-data-[variant=destructive]:focus:**:text-slate-900 dark:not-data-[variant=destructive]:focus:**:text-slate-100 data-inset:pl-7 data-[variant=destructive]:text-rose-600 data-[variant=destructive]:focus:bg-rose-500/10 data-[variant=destructive]:focus:text-rose-600 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props} />
  );
}

function DropdownMenuSub({
  ...props
}) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs outline-hidden select-none transition-colors text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 data-inset:pl-7 data-popup-open:bg-slate-100 dark:data-popup-open:bg-slate-800 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}>
      {children}
      <ChevronRightIcon className="ml-auto size-3.5 text-slate-400" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "w-auto min-w-[120px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-1 text-slate-800 dark:text-slate-200 shadow-xl ring-1 ring-black/5 dark:ring-white/5 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props} />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  closeOnSelect = false,
  onSelect,
  ...props
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      closeOnSelect={closeOnSelect}
      onSelect={(e) => {
        if (!closeOnSelect) {
          e.preventDefault();
        }
        onSelect?.(e);
      }}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pr-8 pl-2.5 text-xs outline-hidden select-none transition-colors text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      checked={checked}
      {...props}>
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center text-red-600 dark:text-red-400"
        data-slot="dropdown-menu-checkbox-item-indicator">
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon className="size-3.5 stroke-[2.5]" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}) {
  return (<MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />);
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pr-8 pl-2.5 text-xs outline-hidden select-none transition-colors text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}>
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center text-red-600 dark:text-red-400"
        data-slot="dropdown-menu-radio-item-indicator">
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon className="size-3.5 stroke-[2.5]" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800", className)}
      {...props} />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-[10px] tracking-widest text-slate-400 dark:text-slate-500",
        className
      )}
      {...props} />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSearchInput,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};