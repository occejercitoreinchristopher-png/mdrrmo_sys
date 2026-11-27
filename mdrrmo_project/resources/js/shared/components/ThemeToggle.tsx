import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '../contexts/ThemeContext';
import { clsx } from 'clsx';

export default function ThemeToggle({ className = '' }: { className?: string }) {
    const { theme, toggleTheme } = useAppearance();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // During SSR and initial client hydration, keep theme matching SSR ('dark')
    // to prevent React hydration mismatch warnings. Once mounted in the client browser,
    // display the user's active theme.
    const activeTheme = mounted ? theme : 'dark';

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
            suppressHydrationWarning
        >
            {/* Light Mode Button */}
            <button
                type="button"
                suppressHydrationWarning
                onClick={() => { if (activeTheme !== 'light') toggleTheme(); }}
                className={clsx(
                    'flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200',
                    activeTheme === 'light'
                        ? 'bg-white text-amber-500 shadow-sm shadow-slate-400/25 scale-100 font-semibold'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 scale-95',
                )}
                title="Switch to Light mode"
                aria-pressed={activeTheme === 'light'}
            >
                <Sun className={clsx('w-3.5 h-3.5 transition-transform duration-200', activeTheme === 'light' && 'rotate-12 scale-110')} />
            </button>

            {/* Dark Mode Button */}
            <button
                type="button"
                suppressHydrationWarning
                onClick={() => { if (activeTheme !== 'dark') toggleTheme(); }}
                className={clsx(
                    'flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200',
                    activeTheme === 'dark'
                        ? 'bg-slate-800 text-sky-400 shadow-sm shadow-black/40 scale-100 font-semibold border border-white/10'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 scale-95',
                )}
                title="Switch to Dark mode"
                aria-pressed={activeTheme === 'dark'}
            >
                <Moon className={clsx('w-3.5 h-3.5 transition-transform duration-200', activeTheme === 'dark' && '-rotate-12 scale-110')} />
            </button>
        </div>
    );
}
