import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '../contexts/ThemeContext';

export default function ThemeToggle({ className = '' }: { className?: string }) {
    const { theme, toggleTheme } = useAppearance();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-200 
                ${theme === 'dark' 
                    ? 'bg-white/10 text-white hover:bg-white/20 hover:text-amber-300' 
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-blue-600'
                } 
                ${className}`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
            ) : (
                <Moon className="w-5 h-5" />
            )}
        </button>
    );
}
