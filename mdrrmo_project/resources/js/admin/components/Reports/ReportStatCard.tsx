import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

export interface ReportStatCardProps {
    title: string;
    value: number | string;
    valuePrefix?: string;
    valueSuffix?: string;
    icon?: React.ComponentType<{ className?: string }>;
    color?: string;
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
    badgeText,
    subtitle,
    progress,
    delayMs = 0,
}: ReportStatCardProps) {
    const numericTarget = typeof value === 'number' ? value : null;
    const animatedNum = useCountUp(numericTarget, 850, delayMs);
    const displayValue = numericTarget !== null ? animatedNum : value;

    return (
        <div
            className={clsx(
                'group relative rounded-2xl p-4 sm:p-5 transition-all duration-200 overflow-hidden flex flex-col justify-between',
                'bg-white/95 dark:bg-[#0c1220]/90 backdrop-blur-md',
                'border border-slate-200/90 dark:border-white/10',
                'shadow-sm hover:shadow-md hover:-translate-y-0.5',
                'hover:border-red-500/40 dark:hover:border-red-500/40 hover:shadow-[0_4px_20px_rgba(246,21,9,0.08)]',
                'print:bg-white print:border-slate-300 print:shadow-none print:p-3.5 print:rounded-xl print:break-inside-avoid'
            )}
        >
            <div>
                {/* Unified System Accent Indicator (MDRRMO Brand Crimson Red) */}
                <div className="h-1 w-full rounded-full mb-3 bg-[#F61509] dark:bg-[#F61509]/90 shadow-xs" />

                {/* Label and Badge row - wrapping permitted so words are never cut off */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 print:text-slate-600 leading-snug">
                        {title}
                    </span>
                    {badgeText && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25 print:bg-slate-50 print:border-slate-300 print:text-slate-800">
                            {badgeText}
                        </span>
                    )}
                </div>

                {/* Main Value */}
                <div className="flex items-baseline gap-1.5 mb-2.5">
                    {valuePrefix && (
                        <span className="text-xl font-bold text-slate-400 dark:text-slate-500 print:text-slate-600">
                            {valuePrefix}
                        </span>
                    )}
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white print:text-slate-950 font-mono">
                        {displayValue}
                    </span>
                    {valueSuffix && (
                        <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 print:text-slate-600">
                            {valueSuffix}
                        </span>
                    )}
                </div>
            </div>

            <div>
                {/* Subtitle - no truncate so all words are 100% visible */}
                {subtitle && (
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 print:border-slate-200">
                        <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 leading-relaxed">
                            {subtitle}
                        </p>
                    </div>
                )}

                {/* Progress bar in Unified System Brand Color */}
                {typeof progress === 'number' && (
                    <div className="mt-2 w-full bg-slate-100 dark:bg-white/5 h-1 rounded-full overflow-hidden print:hidden">
                        <div
                            className="h-full rounded-full bg-[#F61509] transition-all duration-700 ease-out"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
