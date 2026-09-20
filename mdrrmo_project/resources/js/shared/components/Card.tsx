import { clsx } from 'clsx';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
    padding?: boolean;
}

export default function Card({ children, className = '', hover = false, padding = true, ...props }: CardProps) {
    return (
        <div
            className={clsx(
                'bg-white/95 dark:bg-[#0c1222]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] dark:shadow-none transition-all duration-300',
                padding && 'p-6',
                hover &&
                    'hover:bg-white dark:hover:bg-[#10182c] hover:border-slate-300 dark:hover:border-white/20 hover:shadow-[0_12px_35px_-8px_rgba(0,0,0,0.08)] cursor-pointer',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
