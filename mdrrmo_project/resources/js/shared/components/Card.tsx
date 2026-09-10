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
                'bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-none',
                padding && 'p-6',
                hover &&
                    'hover:bg-slate-50/90 dark:hover:bg-white/8 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 cursor-pointer',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
