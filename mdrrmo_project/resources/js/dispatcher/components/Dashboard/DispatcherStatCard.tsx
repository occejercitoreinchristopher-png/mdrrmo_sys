import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

export interface DispatcherStatCardProps {
    title: string;
    value?: string | number | null;
    icon?: React.ComponentType<{ className?: string }> | any;
    trend?: number | null;
    trendLabel?: string;
    color?: 'crimson' | 'orange' | 'emerald' | 'teal' | 'violet' | string;
    loading?: boolean;
}

// Dispatcher-themed stat card with emergency color palette
export default function DispatcherStatCard({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel,
    color = 'crimson',
    loading = false,
}: DispatcherStatCardProps) {
    const colorMap = {
        crimson: {
            bg: 'from-rose-600 to-red-700',
            glow: 'bg-rose-500/15 dark:bg-rose-600/20',
            ring: 'bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20',
            border: 'hover:border-rose-300 dark:hover:border-rose-500/30',
            number: 'text-rose-600 dark:text-rose-50',
        },
        orange: {
            bg: 'from-orange-500 to-amber-600',
            glow: 'bg-orange-500/15 dark:bg-orange-500/20',
            ring: 'bg-orange-50 text-orange-600 border border-orange-200/80 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/20',
            border: 'hover:border-orange-300 dark:hover:border-orange-500/30',
            number: 'text-orange-600 dark:text-orange-50',
        },
        emerald: {
            bg: 'from-emerald-500 to-teal-600',
            glow: 'bg-emerald-500/15',
            ring: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20',
            border: 'hover:border-emerald-300 dark:hover:border-emerald-500/25',
            number: 'text-emerald-600 dark:text-emerald-50',
        },
        teal: {
            bg: 'from-teal-500 to-cyan-600',
            glow: 'bg-teal-500/15',
            ring: 'bg-teal-50 text-teal-600 border border-teal-200/80 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/20',
            border: 'hover:border-teal-300 dark:hover:border-teal-500/25',
            number: 'text-teal-600 dark:text-teal-50',
        },
        violet: {
            bg: 'from-violet-500 to-purple-600',
            glow: 'bg-purple-500/15 dark:bg-violet-500/15',
            ring: 'bg-purple-50 text-purple-600 border border-purple-200/80 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/20',
            border: 'hover:border-purple-300 dark:hover:border-violet-500/25',
            number: 'text-purple-600 dark:text-violet-50',
        },
    };

    const c = colorMap[color] || colorMap.crimson;

    const TrendIcon = (trend ?? 0) > 0 ? TrendingUp : (trend ?? 0) < 0 ? TrendingDown : Minus;
    const trendColor =
        (trend ?? 0) > 0
            ? 'text-emerald-500 dark:text-emerald-400'
            : (trend ?? 0) < 0
              ? 'text-red-500 dark:text-red-400'
              : 'text-slate-400';

    return (
        <div
            className={clsx(
                'relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/3 backdrop-blur-xl shadow-sm dark:shadow-none',
                'transition-all duration-300',
                c.border,
                'group',
            )}
        >
            {/* Corner glow */}
            <div
                className={clsx(
                    'absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-20 dark:opacity-25 group-hover:opacity-35 dark:group-hover:opacity-40 transition-opacity duration-300',
                    c.glow,
                )}
            />

            {/* Top accent line */}
            <div className={clsx('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', c.bg, 'opacity-70 dark:opacity-40')} />

            <div className="p-5">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                        {loading ? (
                            <div className="h-8 w-20 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mt-2" />
                        ) : (
                            <p className={clsx('text-3xl font-bold mt-1.5 tabular-nums', c.number)}>
                                {value ?? '—'}
                            </p>
                        )}
                    </div>
                    {Icon && (
                        <div
                            className={clsx(
                                'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3',
                                c.ring,
                            )}
                        >
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                </div>

                {trendLabel !== undefined && (
                    <div className="flex items-center gap-1.5 mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5">
                        <TrendIcon className={clsx('w-3.5 h-3.5', trendColor)} />
                        <span className={clsx('text-xs font-semibold', trendColor)}>
                            {(trend ?? 0) > 0 ? '+' : ''}{trend}%
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-600">{trendLabel}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
