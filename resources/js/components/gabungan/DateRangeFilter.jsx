import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DateRangeFilter({
    startDate,
    endDate,
    onApply,
    onReset,
    isProcessing = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const popoverRef = useRef(null);
    const [popoverStyle, setPopoverStyle] = useState({});

    // State Internal Rentang Tanggal
    const [tempStart, setTempStart] = useState(startDate ? new Date(startDate) : null);
    const [tempEnd, setTempEnd] = useState(endDate ? new Date(endDate) : null);
    const [hoverDate, setHoverDate] = useState(null);
    const [activePreset, setActivePreset] = useState('custom');

    const [viewDate, setViewDate] = useState(() => {
        return startDate ? new Date(startDate) : new Date();
    });

    // Helper: Cek apakah tanggal termasuk tanggal masa depan (besok dst)
    const isFutureDate = (date) => {
        if (!date) return false;
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d > today;
    };

    useEffect(() => {
        setTempStart(startDate ? new Date(startDate) : null);
        setTempEnd(endDate ? new Date(endDate) : null);
    }, [startDate, endDate]);

    // Hitung Posisi Popover secara Dinamis di Layar (Portal)
    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const popoverWidth = 620;

        let style = {
            position: 'fixed',
            top: `${rect.bottom + 6}px`,
            zIndex: 9999,
        };

        if (window.innerWidth - rect.left < popoverWidth && rect.right >= popoverWidth) {
            style.right = `${window.innerWidth - rect.right}px`;
        } else {
            style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - popoverWidth - 12))}px`;
        }

        setPopoverStyle(style);
    }, []);

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, updatePosition]);

    // Tutup saat klik di luar popover
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                buttonRef.current && !buttonRef.current.contains(e.target) &&
                popoverRef.current && !popoverRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const formatDateToISO = (date) => {
        if (!date) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const formatDateDisplay = (date) => {
        if (!date) return 'dd/mm/yyyy';
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    // Helper Presets (Maksimal s.d. Hari Ini)
    const applyPreset = (type) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        let start = new Date(now);
        let end = new Date(now);

        switch (type) {
            case 'today':
                break;
            case 'yesterday':
                start.setDate(now.getDate() - 1);
                end.setDate(now.getDate() - 1);
                break;
            case 'last7':
                start.setDate(now.getDate() - 6);
                break;
            case 'last30':
                start.setDate(now.getDate() - 29);
                break;
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                // Jika tanggal akhir bulan melebihi hari ini, batasi sampai hari ini
                end = lastDayOfMonth > now ? new Date(now) : lastDayOfMonth;
                break;
            case 'lastMonth':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            default:
                break;
        }

        setTempStart(start);
        setTempEnd(end);
        setActivePreset(type);
        setViewDate(start);
    };

    const generateMonthDays = (monthOffset) => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth() + monthOffset;
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startingDayOfWeek = firstDayOfMonth.getDay();
        const daysInMonth = lastDayOfMonth.getDate();

        const days = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                date: new Date(year, month, day),
                isCurrentMonth: true
            });
        }

        const totalCells = days.length > 35 ? 42 : 35;
        const remainingCells = totalCells - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        return {
            monthName: firstDayOfMonth.toLocaleString('id-ID', { month: 'short', year: 'numeric' }),
            days
        };
    };

    const handleDateClick = (date) => {
        // Blokir jika pengguna mengeklik tanggal masa depan
        if (isFutureDate(date)) return;

        setActivePreset('custom');
        if (!tempStart || (tempStart && tempEnd)) {
            setTempStart(date);
            setTempEnd(null);
        } else if (tempStart && !tempEnd) {
            if (date < tempStart) {
                setTempStart(date);
                setTempEnd(null);
            } else {
                setTempEnd(date);
            }
        }
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const isInRange = (date) => {
        if (!tempStart) return false;
        const endTarget = tempEnd || hoverDate;
        if (!endTarget) return false;
        return date > tempStart && date < endTarget;
    };

    const handleApply = () => {
        if (tempStart && tempEnd) {
            onApply(formatDateToISO(tempStart), formatDateToISO(tempEnd));
            setIsOpen(false);
        }
    };

    const handleResetAll = () => {
        setTempStart(null);
        setTempEnd(null);
        setActivePreset('custom');
        onReset();
        setIsOpen(false);
    };

    const leftMonth = generateMonthDays(0);
    const rightMonth = generateMonthDays(1);
    const hasActiveFilter = Boolean(startDate && endDate);

    return (
        <div className="inline-block text-left">
            {/* TOMBOL TRIGGER (PILL CAPSULE OUTLINE) */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`h-8 px-3.5 rounded-full text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer ${
                    hasActiveFilter
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-transparent text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400'
                }`}
            >
                <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                <span>
                    {hasActiveFilter
                        ? `${formatDateDisplay(new Date(startDate))} - ${formatDateDisplay(new Date(endDate))}`
                        : 'Rentang Tanggal'}
                </span>
                {hasActiveFilter && (
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            handleResetAll();
                        }}
                        className="hover:text-rose-200 cursor-pointer p-0.5 rounded-full ml-1"
                    >
                        <X className="w-3 h-3" />
                    </span>
                )}
            </button>

            {/* POPOVER TERHUBUNG DENGAN PORTAL KE BODY */}
            {isOpen && createPortal(
                <div
                    ref={popoverRef}
                    style={popoverStyle}
                    className="w-[620px] max-w-[95vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150"
                >
                    <div className="flex flex-col sm:flex-row">
                        {/* SIDEBAR PRESETS */}
                        <div className="w-full sm:w-40 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 p-2 space-y-1 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
                            {[
                                { id: 'today', label: 'Hari Ini' },
                                { id: 'yesterday', label: 'Kemarin' },
                                { id: 'last7', label: '7 Hari Terakhir' },
                                { id: 'last30', label: '30 Hari Terakhir' },
                                { id: 'thisMonth', label: 'Bulan Ini' },
                                { id: 'lastMonth', label: 'Bulan Lalu' },
                                { id: 'custom', label: 'Kustom' },
                            ].map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => applyPreset(preset.id)}
                                    className={`w-full text-left px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                        activePreset === preset.id
                                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* KALENDER BERDAMPINGAN */}
                        <div className="flex-1 p-3.5 sm:p-4">
                            {/* HEADER NAVIGASI */}
                            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="flex justify-between w-full px-6 text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">
                                    <span>{leftMonth.monthName}</span>
                                    <span>{rightMonth.monthName}</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* GRID TANGGAL */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                {[leftMonth, rightMonth].map((m, mIdx) => (
                                    <div key={mIdx}>
                                        <div className="grid grid-cols-7 mb-1 text-center">
                                            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((dayName, dIdx) => (
                                                <span key={dIdx} className="text-[10px] font-bold text-slate-400 uppercase">
                                                    {dayName}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-y-1">
                                            {m.days.map((item, dIdx) => {
                                                const isStart = isSameDay(item.date, tempStart);
                                                const isEnd = isSameDay(item.date, tempEnd);
                                                const inRange = isInRange(item.date);
                                                const isFuture = isFutureDate(item.date);

                                                return (
                                                    <button
                                                        key={dIdx}
                                                        type="button"
                                                        disabled={isFuture}
                                                        onClick={() => handleDateClick(item.date)}
                                                        onMouseEnter={() => tempStart && !tempEnd && !isFuture && setHoverDate(item.date)}
                                                        className={`h-7 w-full text-xs font-medium rounded-md transition-all flex items-center justify-center ${
                                                            isFuture
                                                                ? 'text-slate-300 dark:text-slate-700/60 cursor-not-allowed opacity-90 select-none'
                                                                : !item.isCurrentMonth
                                                                ? 'text-slate-300 dark:text-slate-700 cursor-pointer'
                                                                : isStart || isEnd
                                                                ? 'bg-blue-600 text-white font-bold shadow-xs cursor-pointer'
                                                                : inRange
                                                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-none cursor-pointer'
                                                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer'
                                                        }`}
                                                    >
                                                        {item.date.getDate()}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ACTION BAR BAWAH */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800">
                        <div className="text-xs text-slate-500 font-mono">
                            {tempStart && tempEnd ? (
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {formatDateDisplay(tempStart)} - {formatDateDisplay(tempEnd)}
                                </span>
                            ) : (
                                <span className="italic text-slate-400">Pilih rentang tanggal...</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="h-7 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={isProcessing || !tempStart || !tempEnd}
                                onClick={handleApply}
                                className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 rounded-lg shadow-sm cursor-pointer"
                            >
                                Terapkan
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}