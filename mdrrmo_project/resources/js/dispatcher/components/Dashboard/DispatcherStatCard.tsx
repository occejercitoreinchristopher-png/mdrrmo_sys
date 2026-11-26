import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { clsx } from 'clsx';

export interface DispatcherStatCardProps {
    title: string;
    value?: string | number | null;
    valueSuffix?: string;
    subtitle?: string;
    highlightName?: string;
    icon?: React.ComponentType<{ className?: string }> | any;
    trend?: number | null;
    trendLabel?: string;
    color?: 'crimson' | 'blue' | 'emerald' | string;
    href?: string;
    delayMs?: number;
    loading?: boolean;
}

function useCountUp(target: number | null, durationMs = 900, delayMs = 0): number | null {
    const [display, setDisplay] = useState<number | null>(target === null ? null : 0);

    useEffect(() => {
        if (target === null || isNaN(target)) {
            setDisplay(null);
            return;
        }
        if (target === 0) {
            setDisplay(0);
            return;
        }

        let rafId = 0;
        let startTime: number | null = null;
        const timeoutId = window.setTimeout(() => {
            const step = (ts: number) => {
                if (startTime === null) startTime = ts;
                const progress = Math.min(1, (ts - startTime) / durationMs);
                // Smooth ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                setDisplay(Math.round(target * eased));
                if (progress < 1) {
                    rafId = window.requestAnimationFrame(step);
                } else {
                    setDisplay(target);
                }
            };
            rafId = window.requestAnimationFrame(step);
        }, delayMs);

        return () => {
            window.clearTimeout(timeoutId);
            if (rafId) window.cancelAnimationFrame(rafId);
        };
    }, [target, durationMs, delayMs]);

    return display;
}

export default function DispatcherStatCard({
    title,
    value,
    valueSuffix,
    subtitle,
    highlightName,
    icon: Icon,
    trend,
    trendLabel,
    color = 'crimson',
    href,
    delayMs = 0,
    loading = false,
}: DispatcherStatCardProps) {
    const numericTarget = typeof value === 'number' ? value : null;
    const animatedNum = useCountUp(numericTarget, 900, delayMs);

    // Strict 2-3 color palette: Crimson (#F61509), Electric Blue (#3B82F6), Emerald (#10B981)
    const colorMap: Record<
        string,
        {
            bg: string;
            glow: string;
            ring: string;
            border: string;
            number: string;
            pill: string;
        }
    > = {
        crimson: {
            bg: 'from-[#F61509] via-red-500 to-rose-600',
            glow: 'bg-rose-500/20 dark:bg-rose-600/25',
            ring: 'bg-rose-50 text-[#F61509] border border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25',
            border: 'hover:border-rose-300 dark:hover:border-rose-500/40',
            number: 'text-[#F61509] dark:text-white',
            pill: 'bg-rose-500/10 text-[#F61509] dark:text-rose-300',
        },
        blue: {
            bg: 'from-blue-600 via-blue-500 to-sky-500',
            glow: 'bg-blue-500/20 dark:bg-blue-500/25',
            ring: 'bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25',
            border: 'hover:border-blue-300 dark:hover:border-blue-500/40',
            number: 'text-blue-600 dark:text-white',
            pill: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
        },
        emerald: {
            bg: 'from-emerald-600 via-emerald-500 to-teal-500',
            glow: 'bg-emerald-500/20 dark:bg-emerald-500/25',
            ring: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25',
            border: 'hover:border-emerald-300 dark:hover:border-emerald-500/40',
            number: 'text-emerald-600 dark:text-white',
            pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        },
        // Graceful mappings to preserve 3-color uniformity
        rose: {
            bg: 'from-[#F61509] via-red-500 to-rose-600',
            glow: 'bg-rose-500/20 dark:bg-rose-600/25',
            ring: 'bg-rose-50 text-[#F61509] border border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25',
            border: 'hover:border-rose-300 dark:hover:border-rose-500/40',
            number: 'text-[#F61509] dark:text-white',
            pill: 'bg-rose-500/10 text-[#F61509] dark:text-rose-300',
        },
        teal: {
            bg: 'from-emerald-600 via-emerald-500 to-teal-500',
            glow: 'bg-emerald-500/20 dark:bg-emerald-500/25',
            ring: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25',
            border: 'hover:border-emerald-300 dark:hover:border-emerald-500/40',
            number: 'text-emerald-600 dark:text-white',
            pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        },
        orange: {
            bg: 'from-[#F61509] via-red-500 to-rose-600',
            glow: 'bg-rose-500/20 dark:bg-rose-600/25',
            ring: 'bg-rose-50 text-[#F61509] border border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25',
            border: 'hover:border-rose-300 dark:hover:border-rose-500/40',
            number: 'text-[#F61509] dark:text-white',
            pill: 'bg-rose-500/10 text-[#F61509] dark:text-rose-300',
        },
        amber: {
            bg: 'from-[#F61509] via-red-500 to-rose-600',
            glow: 'bg-rose-500/20 dark:bg-rose-600/25',
            ring: 'bg-rose-50 text-[#F61509] border border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25',
            border: 'hover:border-rose-300 dark:hover:border-rose-500/40',
            number: 'text-[#F61509] dark:text-white',
            pill: 'bg-rose-500/10 text-[#F61509] dark:text-rose-300',
        },
        violet: {
            bg: 'from-blue-600 via-blue-500 to-sky-500',
            glow: 'bg-blue-500/20 dark:bg-blue-500/25',
            ring: 'bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25',
            border: 'hover:border-blue-300 dark:hover:border-blue-500/40',
            number: 'text-blue-600 dark:text-white',
            pill: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
        },
    };

    const c = colorMap[color] || colorMap.crimson;
    const TrendIcon = (trend ?? 0) > 0 ? TrendingUp : (trend ?? 0) < 0 ? TrendingDown : Minus;
    const trendColor =
        (trend ?? 0) > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : (trend ?? 0) < 0
              ? 'text-[#F61509] dark:text-rose-400'
              : 'text-slate-400';

    const displayValue =
        numericTarget !== null
            ? (animatedNum ?? 0).toLocaleString()
            : (value ?? '—');

    const cardBody = (
        <div
            style={{ animationDelay: `${delayMs}ms` }}
            className={clsx(
                'relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b1120]/90 backdrop-blur-xl shadow-xs hover:shadow-lg dark:hover:shadow-black/30',
                'transition-all duration-300 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-3 fill-mode-both',
                c.border,
                href && 'cursor-pointer',
                'group h-full flex flex-col justify-between'
            )}
        >
            {/* Corner Ambient Glow */}
            <div
                className={clsx(
                    'absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-25 dark:opacity-30 group-hover:opacity-45 dark:group-hover:opacity-50 group-hover:scale-110 transition-all duration-500 pointer-events-none',
                    c.glow
                )}
            />

            {/* Top Gradient Accent Bar */}
            <div
                className={clsx(
                    'absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r opacity-85 dark:opacity-75',
                    c.bg
                )}
            />

            <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="min-h-[2.25rem] flex items-center">
                            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-tight break-words">
                                {title}
                            </p>
                        </div>
                        {loading ? (
                            <div className="h-8 w-20 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mt-2" />
                        ) : (
                            <div className="flex items-baseline gap-1.5 mt-1">
                                <p className={clsx('text-2xl sm:text-3xl font-bold tabular-nums tracking-tight', c.number)}>
                                    {displayValue}
                                </p>
                                {valueSuffix && (
                                    <span className="text-xs font-medium text-slate-400 dark:text-slate-400 whitespace-nowrap">
                                        {valueSuffix}
                                    </span>
                                )}
                            </div>
                        )}
                        {highlightName && (
                            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate mt-1 capitalize">
                                {highlightName}
                            </p>
                        )}
                    </div>

                    {Icon && (
                        <div
                            className={clsx(
                                'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300',
                                c.ring
                            )}
                        >
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    )}
                </div>

                {(subtitle || (trendLabel !== undefined && trend !== null && trend !== undefined)) && (
                    <div className="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                        {subtitle ? (
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 truncate">
                                {subtitle}
                            </span>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <TrendIcon className={clsx('w-3.5 h-3.5', trendColor)} />
                                <span className={clsx('text-xs font-bold', trendColor)}>
                                    {(trend ?? 0) > 0 ? '+' : ''}
                                    {trend}%
                                </span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                    {trendLabel}
                                </span>
                            </div>
                        )}

                        {subtitle && trend !== null && trend !== undefined ? (
                            <span
                                className={clsx(
                                    'inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0',
                                    c.pill
                                )}
                            >
                                <TrendIcon className="w-3 h-3" />
                                {trend > 0 ? `+${trend}%` : `${trend}%`}
                            </span>
                        ) : href ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block h-full">
                {cardBody}
            </Link>
        );
    }

    return cardBody;
}
