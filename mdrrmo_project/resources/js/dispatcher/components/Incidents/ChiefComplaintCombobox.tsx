import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';

interface ChiefComplaintComboboxProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    allLabel?: string;
}

export default function ChiefComplaintCombobox({
    value,
    onChange,
    options,
    placeholder = 'Type to search chief complaint...',
    allLabel = 'All Chief Complaints',
}: ChiefComplaintComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [dropdownRect, setDropdownRect] = useState<{
        top: number;
        left: number;
        width: number;
        openUpward: boolean;
    } | null>(null);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((opt) => opt.toLowerCase().includes(q));
    }, [options, query]);

    // Combined navigable items: 'all' (only when no query or query matches "all") + filtered options
    const navigableItems = useMemo(() => {
        const items: { value: string; label: string }[] = [];
        const q = query.trim().toLowerCase();
        if (!q || allLabel.toLowerCase().includes(q)) {
            items.push({ value: 'all', label: allLabel });
        }
        for (const opt of filteredOptions) {
            items.push({ value: opt, label: opt });
        }
        return items;
    }, [filteredOptions, query, allLabel]);

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const estimatedHeight = 320;
        const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

        setDropdownRect({
            top: openUpward ? rect.top - 6 : rect.bottom + 6,
            left: rect.left,
            width: Math.max(rect.width, 260),
            openUpward,
        });
    };

    useEffect(() => {
        if (!open) return;

        updatePosition();
        setHighlightedIndex(0);

        const focusTimer = setTimeout(() => {
            inputRef.current?.focus();
        }, 10);

        const handleReposition = () => updatePosition();
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current?.contains(target) ||
                popoverRef.current?.contains(target)
            ) {
                return;
            }
            setOpen(false);
        };

        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            clearTimeout(focusTimer);
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    useEffect(() => {
        setHighlightedIndex(0);
    }, [query]);

    // Keep highlighted item scrolled into view during keyboard navigation
    useEffect(() => {
        if (!open || !listRef.current) return;
        const el = listRef.current.querySelector<HTMLElement>(
            `[data-option-index="${highlightedIndex}"]`,
        );
        el?.scrollIntoView({ block: 'nearest' });
    }, [highlightedIndex, open]);

    const handleSelect = (val: string) => {
        onChange(val);
        setOpen(false);
        setQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                navigableItems.length > 0 ? (prev + 1) % navigableItems.length : 0,
            );
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                navigableItems.length > 0
                    ? (prev - 1 + navigableItems.length) % navigableItems.length
                    : 0,
            );
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            const chosen = navigableItems[highlightedIndex];
            if (chosen) {
                handleSelect(chosen.value);
            }
        }
    };

    const renderHighlightedLabel = (text: string) => {
        const q = query.trim();
        if (!q) return text;
        const lowerText = text.toLowerCase();
        const lowerQ = q.toLowerCase();
        const idx = lowerText.indexOf(lowerQ);
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark className="bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded px-0.5 font-bold">
                    {text.slice(idx, idx + q.length)}
                </mark>
                {text.slice(idx + q.length)}
            </>
        );
    };

    const isFiltered = value !== 'all';

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => {
                    if (!open) setQuery('');
                    setOpen((prev) => !prev);
                }}
                className={`w-full text-left text-xs py-2 pl-3 ${
                    isFiltered ? 'pr-12' : 'pr-8'
                } rounded-xl bg-white dark:bg-slate-800/90 border ${
                    open || isFiltered
                        ? 'border-rose-500/70 ring-1 ring-rose-500/30'
                        : 'border-slate-200 dark:border-white/10'
                } text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500 cursor-pointer shadow-2xs truncate font-medium transition-all`}
                title={isFiltered ? value : allLabel}
            >
                <span className="block truncate">
                    {isFiltered ? value : allLabel}
                </span>
            </button>

            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isFiltered && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('all');
                        }}
                        className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Clear Chief Complaint filter"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
                <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 pointer-events-none transition-transform duration-150 ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </div>

            {open &&
                dropdownRect &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={popoverRef}
                        style={{
                            position: 'fixed',
                            top: dropdownRect.top,
                            left: Math.min(
                                dropdownRect.left,
                                window.innerWidth - dropdownRect.width - 12,
                            ),
                            width: dropdownRect.width,
                            transform: dropdownRect.openUpward
                                ? 'translateY(-100%)'
                                : undefined,
                            zIndex: 9999,
                        }}
                        className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/60">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={placeholder}
                                    className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery('');
                                            inputRef.current?.focus();
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                        title="Clear search"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="mt-1 px-1 flex items-center justify-between text-[10px] text-slate-400">
                                <span>
                                    {query.trim()
                                        ? `${filteredOptions.length} match${filteredOptions.length === 1 ? '' : 'es'} of ${options.length}`
                                        : `${options.length} chief complaints`}
                                </span>
                                <span>↑↓ navigate • Enter select</span>
                            </div>
                        </div>

                        {/* Scrollable Options List */}
                        <div
                            ref={listRef}
                            className="max-h-64 overflow-y-auto p-1.5 space-y-0.5"
                        >
                            {navigableItems.length === 0 ? (
                                <div className="py-6 px-3 text-center text-xs text-slate-400">
                                    No chief complaint matches "{query.trim()}"
                                </div>
                            ) : (
                                navigableItems.map((item, idx) => {
                                    const isSelected = value === item.value;
                                    const isHighlighted = idx === highlightedIndex;
                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            data-option-index={idx}
                                            onMouseEnter={() => setHighlightedIndex(idx)}
                                            onClick={() => handleSelect(item.value)}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                                isSelected
                                                    ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold'
                                                    : isHighlighted
                                                      ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-medium'
                                                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                                            }`}
                                        >
                                            <span className="truncate">
                                                {item.value === 'all'
                                                    ? item.label
                                                    : renderHighlightedLabel(item.label)}
                                            </span>
                                            {isSelected && (
                                                <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
