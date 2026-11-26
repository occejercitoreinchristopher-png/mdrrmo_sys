import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'dark';
    try {
        const stored = (localStorage.getItem('theme') || localStorage.getItem('appearance')) as Theme;
        if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
    if (typeof document !== 'undefined') {
        if (!document.documentElement.classList.contains('dark')) return 'light';
    }
    return 'dark';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        const syncTheme = () => {
            const current = getInitialTheme();
            setTheme(current);
            if (current === 'light') {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
            } else {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
            }
        };

        syncTheme();

        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains('dark');
            const targetTheme: Theme = isDark ? 'dark' : 'light';
            setTheme((prev) => (prev !== targetTheme ? targetTheme : prev));
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        try {
            localStorage.setItem('theme', newTheme);
            localStorage.setItem('appearance', newTheme);
        } catch {}
        if (newTheme === 'light') {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppearance() {
    const context = useContext(ThemeContext);
    const isDocDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;
    const effectiveTheme: Theme = typeof document !== 'undefined'
        ? (isDocDark ? 'dark' : 'light')
        : (context?.theme || 'dark');

    if (context === undefined) {
        return {
            theme: effectiveTheme,
            toggleTheme: () => {}
        };
    }
    return {
        ...context,
        theme: effectiveTheme,
    };
}
