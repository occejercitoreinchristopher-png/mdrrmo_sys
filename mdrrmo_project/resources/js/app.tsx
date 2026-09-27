import './echo';
import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/shared/components/ui/sonner';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { initializeTheme } from '@/shared/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Suppress Chrome DevTools 152+ internal Live Metrics / web-vitals bug
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        if (
            event?.message?.includes("reading 'startTime'") ||
            event?.error?.message?.includes("reading 'startTime'")
        ) {
            event.stopImmediatePropagation();
            event.preventDefault();
        }
    });
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes cache
            refetchOnWindowFocus: false,
        },
    },
});

createInertiaApp({
    title: (title) => title || 'MDRRMO',
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name === 'profile':
                return null; // Dynamically wraps with AdminLayout or DispatcherLayout
            case name.startsWith('admin/'):
                return null; // Admin pages use AdminLayout explicitly
            case name.startsWith('dispatcher/'):
                return null; // Dispatcher pages use DispatcherLayout explicitly
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <QueryClientProvider client={queryClient}>
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </QueryClientProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
