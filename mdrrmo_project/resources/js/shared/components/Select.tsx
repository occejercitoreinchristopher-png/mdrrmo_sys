import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { ComponentProps } from 'react';

interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

interface SelectProps extends Omit<ComponentProps<'select'>, 'value' | 'onChange'> {
    label?: string;
    id: string;
    value?: string | number;
    onChange?: (value: string) => void;
    options?: SelectOption[];
    error?: string;
    required?: boolean;
    placeholder?: string;
    className?: string;
}

export default function Select({
    label,
    id,
    value,
    onChange,
    options = [],
    error,
    required = false,
    placeholder = 'Select an option',
    className = '',
    ...props
}: SelectProps) {
    const handleChange = (e) => {
        onChange?.(e.target.value);
    };

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                    {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={handleChange}
                    className={clsx(
                        'w-full appearance-none bg-white dark:bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white transition-all duration-200 outline-none cursor-pointer shadow-sm dark:shadow-none',
                        'focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
                        error ? 'border-red-500/50' : 'border-slate-300 dark:border-white/10',
                        className,
                    )}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option
                            key={opt.value}
                            value={opt.value}
                            className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            disabled={opt.disabled}
                        >
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
    );
}
