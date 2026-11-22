import { clsx } from 'clsx';

export default function PageTitle({ children, className = '' }) {
    return (
        <h1
            className={clsx(
                'text-2xl font-semibold tracking-tight text-slate-900 dark:text-white',
                className,
            )}
        >
            {children}
        </h1>
    );
}
