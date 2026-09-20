import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import FlashMessageListener from '@/shared/components/FlashMessageListener';

export default function AdminAppLayout({ children, title = 'Admin Portal', Sidebar, Navbar }) {
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem('admin_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const toggleSidebar = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('admin_sidebar_collapsed', String(next));
            } catch {}
            return next;
        });
    };

    return (
        <ThemeProvider>
            <Head title={title} />
            <FlashMessageListener />
            <div className="flex h-screen bg-[#fafbfc] dark:bg-[#070b14] text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
                {/* Expensive White Architectural Background Grid & Diffused Lighting */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                    {/* Soft luxury ambient highlights */}
                    <div className="absolute -top-48 -right-48 w-[34rem] h-[34rem] bg-blue-500/[0.03] dark:bg-blue-600/[0.07] rounded-full blur-3xl" />
                    <div className="absolute top-1/3 -left-32 w-96 h-96 bg-indigo-500/[0.02] dark:bg-indigo-600/[0.05] rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-slate-400/[0.02] dark:bg-slate-500/[0.03] rounded-full blur-3xl" />

                    {/* Subtle architectural luxury micro-dot pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.025]"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                            backgroundSize: '24px 24px',
                        }}
                    />
                </div>

                {/* Sidebar */}
                {Sidebar && <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {Navbar && <Navbar collapsed={collapsed} onToggle={toggleSidebar} />}

                    <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 z-10 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                        <div className="max-w-7xl mx-auto space-y-6">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}
