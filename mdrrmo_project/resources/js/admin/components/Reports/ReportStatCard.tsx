import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

export interface ReportStatCardProps {
    title: string;
    value: number | string;
    valuePrefix?: string;
    valueSuffix?: string;
    icon: React.ComponentType<{ className?: string }>;
    color?: 'blue' | 'amber' | 'emerald' | 'crimson' | 'cyan' | 'violet';
    badgeText?: string;
    badgeType?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
    subtitle?: string;
    progress?: number;
    delayMs?: number;
}

function useCountUp(target: number | null, durationMs = 850, delayMs = 0): number | null {
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

export default function ReportStatCard({
    title,
    value,
    valuePrefix = '',
    valueSuffix = '',
    icon: Icon,
    color = 'blue',
    badgeText,
    badgeType = 'neutral',
    subtitle,
    progress,
    delayMs = 0,
}: ReportStatCardProps) {
    const numericTarget = typeof value === 'number' ? value : null;
    const animatedNum = useCountUp(numericTarget, 850, delayMs);
    const displayValue = numericTarget !== null ? animatedNum : value;

    const colorConfig = {
        blue: {
            iconBg: 'bg-blue-500/10 text-blue-500 border-blue-500/20 group-hover:border-blue-500/40 group-hover:bg-blue-500/20',
            glow: 'group-hover:shadow-[0_0_25px_rgba(59,130,246,0.18)]',
            accentBar: 'bg-blue-500',
            borderHover: 'hover:border-blue-500/40',
        },
        amber: {
            iconBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:border-amber-500/40 group-hover:bg-amber-500/20',
            glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.18)]',
            accentBar: 'bg-amber-500',
            borderHover: 'hover:border-amber-500/40',
        },
        emerald: {
            iconBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/20',
            glow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.18)]',
            accentBar: 'bg-emerald-500',
            borderHover: 'hover:border-emerald-500/40',
        },
        crimson: {
            iconBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20 group-hover:border-rose-500/40 group-hover:bg-rose-500/20',
            glow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.18)]',
            accentBar: 'bg-rose-500',
            borderHover: 'hover:border-rose-500/40',
        },
        cyan: {
            iconBg: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/20',
            glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.18)]',
            accentBar: 'bg-cyan-500',
            borderHover: 'hover:border-cyan-500/40',
        },
        violet: {
            iconBg: 'bg-violet-500/10 text-violet-500 border-violet-500/20 group-hover:border-violet-500/40 group-hover:bg-violet-500/20',
            glow: 'group-hover:shadow-[0_0_25px_rgba(139,92,246,0.18)]',
            accentBar: 'bg-violet-500',
            borderHover: 'hover:border-violet-500/40',
        },
    }[color] || {
        iconBg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        glow: '',
        accentBar: 'bg-slate-400',
        borderHover: 'hover:border-slate-500/40',
    };

    const badgeStyles = {
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
        danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
        info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
        neutral: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-white/10',
    }[badgeType];

    return (
        <div
            className={clsx(
                'group relative rounded-2xl p-5 transition-all duration-300',
                'bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md',
                'border border-slate-200/80 dark:border-white/10',
                'shadow-sm hover:shadow-md hover:-translate-y-0.5',
                colorConfig.borderHover,
                colorConfig.glow
            )}
        >
            {/* Top row: Label and Icon */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {title}
                </span>
                <div
                    className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 shrink-0',
                        colorConfig.iconBg
                    )}
                >
                    <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                </div>
            </div>

            {/* Main Value */}
            <div className="flex items-baseline gap-1.5 mb-2">
                {valuePrefix && (
                    <span className="text-xl font-bold text-slate-400 dark:text-slate-500">
                        {valuePrefix}
                    </span>
                )}
                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                    {displayValue}
                </span>
                {valueSuffix && (
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {valueSuffix}
                    </span>
                )}
            </div>

            {/* Footer row: Badge & Subtitle */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                {subtitle && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {subtitle}
                    </span>
                )}
                {badgeText && (
                    <span
                        className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ml-auto',
                            badgeStyles
                        )}
                    >
                        {badgeText}
                    </span>
                )}
            </div>

            {/* Optional mini progress bar */}
            {typeof progress === 'number' && (
                <div className="mt-2.5 w-full bg-slate-100 dark:bg-white/5 h-1 rounded-full overflow-hidden">
                    <div
                        className={clsx('h-full rounded-full transition-all duration-700 ease-out', colorConfig.accentBar)}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
            )}
        </div>
    );
}
