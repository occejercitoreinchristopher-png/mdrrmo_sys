import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

// Dispatcher-themed stat card with emergency color palette
export default function DispatcherStatCard({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel,
    color = 'crimson',
    loading = false,
}) {
    const colorMap = {
        crimson: {
            bg: 'from-rose-600 to-red-700',
            glow: 'bg-rose-600/20',
            ring: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
            border: 'hover:border-rose-500/30',
            number: 'text-rose-50',
        },
        orange: {
            bg: 'from-orange-500 to-amber-600',
            glow: 'bg-orange-500/20',
            ring: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
            border: 'hover:border-orange-500/30',
            number: 'text-orange-50',
        },
        emerald: {
            bg: 'from-emerald-500 to-teal-600',
            glow: 'bg-emerald-500/15',
            ring: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
            border: 'hover:border-emerald-500/25',
            number: 'text-emerald-50',
        },
        teal: {
            bg: 'from-teal-500 to-cyan-600',
            glow: 'bg-teal-500/15',
            ring: 'bg-teal-500/15 text-teal-400 border border-teal-500/20',
            border: 'hover:border-teal-500/25',
            number: 'text-teal-50',
        },
        violet: {
            bg: 'from-violet-500 to-purple-600',
            glow: 'bg-violet-500/15',
            ring: 'bg-violet-500/15 text-violet-400 border border-violet-500/20',
            border: 'hover:border-violet-500/25',
            number: 'text-violet-50',
        },
    };

    const c = colorMap[color] || colorMap.crimson;

    const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
    const trendColor =
        trend > 0
            ? 'text-emerald-400'
            : trend < 0
              ? 'text-red-400'
              : 'text-slate-400';

    return (
        <div
            className={clsx(
                'relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl',
                'transition-all duration-300',
                c.border,
                'group',
            )}
        >
            {/* Corner glow */}
            <div
                className={clsx(
                    'absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-300',
                    c.glow,
                )}
            />

            {/* Top accent line */}
            <div className={clsx('absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r', c.bg, 'opacity-40')} />

            <div className="p-5">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                        {loading ? (
                            <div className="h-8 w-20 bg-white/10 rounded-lg animate-pulse mt-2" />
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
                    <div className="flex items-center gap-1.5 mt-4 pt-3.5 border-t border-white/5">
                        <TrendIcon className={clsx('w-3.5 h-3.5', trendColor)} />
                        <span className={clsx('text-xs font-medium', trendColor)}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                        <span className="text-xs text-slate-600">{trendLabel}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
