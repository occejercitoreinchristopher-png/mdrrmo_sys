import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import FlashMessageListener from '@/shared/components/FlashMessageListener';

export default function AppLayout({ children, title = 'App', Sidebar, Navbar }) {
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem('sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const toggleSidebar = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('sidebar_collapsed', String(next));
            } catch {}
            return next;
        });
    };

    return (
        <ThemeProvider>
            <Head title={title} />
            <FlashMessageListener />
            <div className="flex h-screen bg-slate-100/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
                {/* Decorative background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/5 dark:bg-blue-600/8 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-40 w-72 h-72 bg-indigo-500/5 dark:bg-indigo-600/6 rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 right-1/3 w-64 h-64 bg-blue-500/3 dark:bg-blue-500/5 rounded-full blur-3xl" />
                </div>

                {/* Sidebar */}
                {Sidebar && <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />}

                {/* Main */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {Navbar && <Navbar collapsed={collapsed} onToggle={toggleSidebar} />}

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto p-4 md:p-6 z-10">
                        {children}
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}
