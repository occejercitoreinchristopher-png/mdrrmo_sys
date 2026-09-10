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
            ring: 'bg-blue-500/10 text-blue-400',
        },
        green: {
            bg: 'from-emerald-500 to-teal-600',
            glow: 'shadow-emerald-500/20',
            ring: 'bg-emerald-500/10 text-emerald-400',
        },
        amber: {
            bg: 'from-amber-500 to-orange-600',
            glow: 'shadow-amber-500/20',
            ring: 'bg-amber-500/10 text-amber-400',
        },
        red: {
            bg: 'from-red-500 to-rose-600',
            glow: 'shadow-red-500/20',
            ring: 'bg-red-500/10 text-red-400',
        },
        purple: {
            bg: 'from-purple-500 to-violet-600',
            glow: 'shadow-purple-500/20',
            ring: 'bg-purple-500/10 text-purple-400',
        },
    };

    const c = colorMap[color] || colorMap.blue;

    const TrendIcon =
        trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
    const trendColor =
        trend > 0
            ? 'text-emerald-400'
            : trend < 0
              ? 'text-red-400'
              : 'text-slate-400';

    return (
        <Card
            className="relative overflow-hidden group hover:border-white/20 transition-all duration-300"
            padding={false}
        >
            {/* Background glow */}
            <div
                className={clsx(
                    'absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity duration-300 group-hover:opacity-30',
                    `bg-gradient-to-br ${c.bg}`,
                )}
            />

            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-slate-400">{title}</p>
                        {loading ? (
                            <div className="h-8 w-20 bg-white/10 rounded-lg animate-pulse mt-1" />
                        ) : (
                            <p className="text-3xl font-bold text-white mt-1 tabular-nums">
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
                    <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-white/5">
                        <TrendIcon className={clsx('w-3.5 h-3.5', trendColor)} />
                        <span className={clsx('text-xs', trendColor)}>
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
