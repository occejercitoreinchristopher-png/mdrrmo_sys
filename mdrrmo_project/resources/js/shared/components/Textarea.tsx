import { clsx } from 'clsx';
import { ComponentProps } from 'react';

interface TextareaProps extends ComponentProps<'textarea'> {
    label?: string;
    id?: string;
    error?: string;
    className?: string;
    required?: boolean;
    rows?: number;
}

export default function Textarea({
    label,
    id,
    error,
    className = '',
    required = false,
    rows = 4,
    ...props
}: TextareaProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label
                    htmlFor={id}
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                    {label}
                    {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
                </label>
            )}
            <textarea
                id={id}
                rows={rows}
                className={clsx(
                    'w-full bg-white dark:bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none resize-none shadow-sm dark:shadow-none',
                    'focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
                    error
                        ? 'border-red-500/50 focus:ring-red-500/30'
                        : 'border-slate-300 dark:border-white/10',
                    className,
                )}
                {...props}
            />
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
    );
}
