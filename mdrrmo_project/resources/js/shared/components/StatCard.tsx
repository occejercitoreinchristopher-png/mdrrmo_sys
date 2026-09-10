import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from './Card';
import { clsx } from 'clsx';

export default function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel,
    color = 'blue',
    loading = false,
}) {
    const colorMap = {
        blue: {
            bg: 'from-blue-600 to-indigo-600',
            glow: 'shadow-blue-500/20',
            ring: 'bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-500/10 dark:text-blue-400 dark:border-transparent',
        },
        green: {
            bg: 'from-emerald-500 to-teal-600',
            glow: 'shadow-emerald-500/20',
            ring: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent',
        },
        amber: {
            bg: 'from-amber-500 to-orange-600',
            glow: 'shadow-amber-500/20',
            ring: 'bg-amber-50 text-amber-600 border border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:border-transparent',
        },
        red: {
            bg: 'from-red-500 to-rose-600',
            glow: 'shadow-red-500/20',
            ring: 'bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-red-500/10 dark:text-red-400 dark:border-transparent',
        },
        purple: {
            bg: 'from-purple-500 to-violet-600',
            glow: 'shadow-purple-500/20',
            ring: 'bg-purple-50 text-purple-600 border border-purple-200/80 dark:bg-purple-500/10 dark:text-purple-400 dark:border-transparent',
        },
    };

    const c = colorMap[color] || colorMap.blue;

    const TrendIcon =
        trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
    const trendColor =
        trend > 0
            ? 'text-emerald-500 dark:text-emerald-400'
            : trend < 0
              ? 'text-red-500 dark:text-red-400'
              : 'text-slate-400';

    return (
        <Card
            className="relative overflow-hidden group hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300"
            padding={false}
        >
            {/* Background glow */}
            <div
                className={clsx(
                    'absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-15 dark:opacity-20 transition-opacity duration-300 group-hover:opacity-25 dark:group-hover:opacity-30',
                    `bg-gradient-to-br ${c.bg}`,
                )}
            />

            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
                        {loading ? (
                            <div className="h-8 w-20 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mt-1" />
                        ) : (
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                                {value ?? '—'}
                            </p>
                        )}
                    </div>
                    {Icon && (
                        <div
                            className={clsx(
                                'w-12 h-12 rounded-xl flex items-center justify-center',
                                c.ring,
                            )}
                        >
                            <Icon className="w-6 h-6" />
                        </div>
                    )}
                </div>

                {trendLabel !== undefined && (
                    <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                        <TrendIcon className={clsx('w-3.5 h-3.5', trendColor)} />
                        <span className={clsx('text-xs font-semibold', trendColor)}>
                            {trend > 0 ? '+' : ''}
                            {trend}%
                        </span>
                        <span className="text-xs text-slate-500">
                            {trendLabel}
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
}
