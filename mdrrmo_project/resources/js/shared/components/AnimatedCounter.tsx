import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    formatter?: (val: number) => string;
    className?: string;
}

/**
 * Custom hook to smoothly animate a number from its current/initial value to target.
 * Uses requestAnimationFrame and easeOutCubic for high-performance 60-120fps motion.
 */
export function useAnimatedCounter(
    targetValue: number,
    duration = 1000,
    decimals = 0
): number {
    const [currentValue, setCurrentValue] = useState(0);
    const startValueRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        // Easing function: easeOutCubic
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const startVal = startValueRef.current;
        const endVal = targetValue;
        const delta = endVal - startVal;

        if (delta === 0) {
            setCurrentValue(endVal);
            return;
        }

        startTimeRef.current = null;

        const step = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);

            const val = startVal + delta * easedProgress;
            const factor = Math.pow(10, decimals);
            const rounded = Math.round(val * factor) / factor;

            setCurrentValue(rounded);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                startValueRef.current = endVal;
                setCurrentValue(endVal);
            }
        };

        rafRef.current = requestAnimationFrame(step);

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [targetValue, duration, decimals]);

    return currentValue;
}

/**
 * AnimatedCounter component for smooth count-up animations on dashboard KPI numbers.
 */
export default function AnimatedCounter({
    value,
    duration = 1000,
    decimals = 0,
    prefix = '',
    suffix = '',
    formatter,
    className,
}: AnimatedCounterProps) {
    const animatedValue = useAnimatedCounter(value, duration, decimals);

    const formatted = formatter
        ? formatter(animatedValue)
        : decimals > 0
          ? animatedValue.toFixed(decimals)
          : animatedValue.toLocaleString();

    return (
        <span className={className}>
            {prefix}
            {formatted}
            {suffix}
        </span>
    );
}
