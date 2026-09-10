import { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/shared/hooks/use-appearance';

type Theme = 'light' | 'dark' | 'system';

const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

export default function AppearanceTabs() {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div className="flex gap-2">
            {themes.map(({ value, label, icon: Icon }) => (
                <button
                    key={value}
                    onClick={() => updateAppearance(value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                        appearance === value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:bg-accent'
                    }`}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                </button>
            ))}
        </div>
    );
}
