import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '../contexts/ThemeContext';
import { clsx } from 'clsx';

export default function ThemeToggle({ className = '' }: { className?: string }) {
    const { theme, toggleTheme } = useAppearance();

    return (
        <div
            className={clsx(
                'inline-flex items-center p-0.5 rounded-full',
                'bg-slate-200/80 dark:bg-white/10 border border-slate-300/80 dark:border-white/10',
                'transition-all duration-300 select-none shadow-inner',
                className,
            )}
            role="group"
            aria-label="Theme toggle"
        >
            {/* Light Mode Button */}
            <button
                type="button"
                onClick={() => { if (theme !== 'light') toggleTheme(); }}
                className={clsx(
                    'flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200',
                    theme === 'light'
                        ? 'bg-white text-amber-500 shadow-sm shadow-slate-400/25 scale-100 font-semibold'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 scale-95',
                )}
                title="Switch to Light mode"
                aria-pressed={theme === 'light'}
            >
                <Sun className={clsx('w-3.5 h-3.5 transition-transform duration-200', theme === 'light' && 'rotate-12 scale-110')} />
            </button>

            {/* Dark Mode Button */}
            <button
                type="button"
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                className={clsx(
                    'flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200',
                    theme === 'dark'
                        ? 'bg-slate-800 text-sky-400 shadow-sm shadow-black/40 scale-100 font-semibold border border-white/10'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 scale-95',
                )}
                title="Switch to Dark mode"
                aria-pressed={theme === 'dark'}
            >
                <Moon className={clsx('w-3.5 h-3.5 transition-transform duration-200', theme === 'dark' && '-rotate-12 scale-110')} />
            </button>
        </div>
    );
}
