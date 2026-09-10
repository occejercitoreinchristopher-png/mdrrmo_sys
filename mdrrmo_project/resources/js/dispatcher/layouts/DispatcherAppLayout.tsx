import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';

export default function DispatcherAppLayout({ children, title = 'Dispatcher', Sidebar, Navbar }) {
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem('dispatcher_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const toggleSidebar = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('dispatcher_sidebar_collapsed', String(next));
            } catch {}
            return next;
        });
    };

    return (
        <ThemeProvider>
            <Head title={title} />
            <div className="flex h-screen bg-slate-100/80 dark:bg-[#0a0f1e] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
                {/* Decorative background — subtle emergency aura in light, deep navy glow in dark */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-40 -left-20 w-[500px] h-[500px] bg-rose-500/5 dark:bg-rose-700/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 right-0 w-80 h-80 bg-orange-500/5 dark:bg-orange-600/8 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-rose-500/4 dark:bg-rose-500/6 rounded-full blur-3xl" />
                    {/* Subtle grid overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                            backgroundSize: '28px 28px',
                        }}
                    />
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
