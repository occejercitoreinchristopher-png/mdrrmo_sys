import { clsx } from 'clsx';
import { ComponentProps, ElementType } from 'react';

interface InputProps extends Omit<ComponentProps<'input'>, 'type'> {
    label?: string;
    id?: string;
    type?: string;
    error?: string;
    className?: string;
    required?: boolean;
    icon?: ElementType;
}

export default function Input({
    label,
    id,
    type = 'text',
    error,
    className = '',
    required = false,
    icon: Icon,
    ...props
}: InputProps) {
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
            <div className="relative">
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                )}
                <input
                    id={id}
                    type={type}
                    className={clsx(
                        'w-full bg-white dark:bg-[#0f172a] border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 outline-none shadow-sm dark:shadow-none [color-scheme:light] dark:[color-scheme:dark]',
                        'focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-500/20 focus:border-blue-500/60 dark:focus:border-blue-500/50',
                        error
                            ? 'border-red-500/50 focus:ring-red-500/30'
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20',
                        Icon && 'pl-10',
                        className,
                    )}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium">{error}</p>}
        </div>
    );
}
