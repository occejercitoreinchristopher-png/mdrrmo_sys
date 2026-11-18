import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';

export interface FilterOptionItem {
    value: string;
    label: string;
}

interface MultiSelectFilterComboboxProps {
    values: string[];
    onChange: (values: string[]) => void;
    options: FilterOptionItem[];
    allLabel: string;
    searchable?: boolean;
    searchPlaceholder?: string;
}

export default function MultiSelectFilterCombobox({
    values,
    onChange,
    options,
    allLabel,
    searchable = true,
    searchPlaceholder = 'Type to search...',
}: MultiSelectFilterComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [dropdownRect, setDropdownRect] = useState<{
        top: number;
        left: number;
        width: number;
        openUpward: boolean;
    } | null>(null);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((opt) => opt.label.toLowerCase().includes(q));
    }, [options, query]);

    const labelByValue = useMemo(() => {
        const map: Record<string, string> = {};
        for (const opt of options) {
            map[opt.value] = opt.label;
        }
        return map;
    }, [options]);

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const estimatedHeight = searchable ? 330 : 260;
        const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

        setDropdownRect({
            top: openUpward ? rect.top - 6 : rect.bottom + 6,
            left: rect.left,
            width: Math.max(rect.width, searchable ? 260 : 210),
            openUpward,
        });
    };

    useEffect(() => {
        if (!open) return;

        updatePosition();

        const focusTimer = setTimeout(() => {
            if (searchable) {
                inputRef.current?.focus();
            }
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
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(focusTimer);
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, searchable]);

    const toggleValue = (val: string) => {
        if (values.includes(val)) {
            onChange(values.filter((v) => v !== val));
        } else {
            onChange([...values, val]);
        }
    };

    const allFilteredSelected =
        filteredOptions.length > 0 &&
        filteredOptions.every((opt) => values.includes(opt.value));

    const handleToggleSelectAllFiltered = () => {
        if (allFilteredSelected) {
            const filteredSet = new Set(filteredOptions.map((o) => o.value));
            onChange(values.filter((v) => !filteredSet.has(v)));
        } else {
            const next = new Set(values);
            for (const opt of filteredOptions) {
                next.add(opt.value);
            }
            onChange(Array.from(next));
        }
    };

    const renderHighlightedLabel = (text: string) => {
        const q = query.trim();
        if (!q) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
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

    const selectedCount = values.length;
    const firstSelectedLabel =
        selectedCount > 0 ? labelByValue[values[0]] || values[0] : allLabel;
    const fullTooltip =
        selectedCount > 0
            ? values.map((v) => labelByValue[v] || v).join(', ')
            : allLabel;

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
                    selectedCount > 0 ? 'pr-12' : 'pr-8'
                } rounded-xl bg-white dark:bg-slate-800/90 border ${
                    open || selectedCount > 0
                        ? 'border-rose-500/70 ring-1 ring-rose-500/30'
                        : 'border-slate-200 dark:border-white/10'
                } text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500 cursor-pointer shadow-2xs font-medium transition-all flex items-center gap-1.5`}
                title={fullTooltip}
            >
                <span className="truncate">{firstSelectedLabel}</span>
                {selectedCount > 1 && (
                    <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/25">
                        +{selectedCount - 1}
                    </span>
                )}
            </button>

            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {selectedCount > 0 && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange([]);
                        }}
                        className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title={`Reset to ${allLabel}`}
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
                        {/* Optional Search Input */}
                        {searchable && (
                            <div className="p-2 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/60">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={searchPlaceholder}
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
                            </div>
                        )}

                        {/* Quick Action Bar (Select All / Clear + Counter) */}
                        <div className="px-2.5 py-1.5 border-b border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-2 text-[11px]">
                            <button
                                type="button"
                                onClick={handleToggleSelectAllFiltered}
                                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                                {allFilteredSelected
                                    ? query.trim()
                                        ? 'Unselect Matches'
                                        : 'Unselect All'
                                    : query.trim()
                                      ? `Select Matches (${filteredOptions.length})`
                                      : `Select All (${options.length})`}
                            </button>

                            <div className="flex items-center gap-2">
                                {selectedCount > 0 ? (
                                    <>
                                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                            {selectedCount} selected
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onChange([])}
                                            className="font-semibold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-slate-400">
                                        {allLabel}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Checkbox Options List */}
                        <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                            {filteredOptions.length === 0 ? (
                                <div className="py-5 px-3 text-center text-xs text-slate-400">
                                    No match for "{query.trim()}"
                                </div>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const checked = values.includes(opt.value);
                                    return (
                                        <label
                                            key={opt.value}
                                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                                                checked
                                                    ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200 font-semibold'
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleValue(opt.value)}
                                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 accent-rose-600 cursor-pointer shrink-0"
                                            />
                                            <span className="truncate flex-1" title={opt.label}>
                                                {renderHighlightedLabel(opt.label)}
                                            </span>
                                        </label>
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
