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
            <div className="flex h-screen bg-[#0a0f1e] dark:bg-[#0a0f1e] text-slate-100 overflow-hidden font-sans">
                {/* Decorative background — deep navy with crimson emergency glow */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-40 -left-20 w-[500px] h-[500px] bg-rose-700/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 right-0 w-80 h-80 bg-orange-600/8 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-rose-500/6 rounded-full blur-3xl" />
                    {/* Subtle grid overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '32px 32px',
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
