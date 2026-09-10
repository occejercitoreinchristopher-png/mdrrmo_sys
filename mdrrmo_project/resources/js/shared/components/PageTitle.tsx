import { clsx } from 'clsx';

export default function PageTitle({ children, className = '' }) {
    return (
        <h1
            className={clsx(
                'text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400',
                className,
            )}
        >
            {children}
        </h1>
    );
}
