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
                'bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-none',
                padding && 'p-6',
                hover &&
                    'hover:bg-white/80 dark:hover:bg-white/8 hover:border-black/10 dark:hover:border-white/20 transition-all duration-300 cursor-pointer',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
