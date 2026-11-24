import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import FlashMessageListener from '@/shared/components/FlashMessageListener';

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
            <FlashMessageListener />
            <div className="flex h-screen print:h-auto print:block bg-[#fafbfc] dark:bg-[#070b14] print:bg-white text-slate-900 dark:text-slate-100 overflow-hidden print:overflow-visible font-sans transition-colors duration-300">
                {/* Architectural Background Grid & Diffused Lighting */}
                <div className="print:hidden absolute inset-0 pointer-events-none overflow-hidden select-none">
                    {/* Soft luxury ambient highlights */}
                    <div className="absolute -top-48 -right-48 w-[34rem] h-[34rem] bg-[#F61509]/[0.03] dark:bg-[#F61509]/[0.06] rounded-full blur-3xl" />
                    <div className="absolute top-1/3 -left-32 w-96 h-96 bg-orange-500/[0.02] dark:bg-orange-600/[0.04] rounded-full blur-3xl" />
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
                <div className="flex-1 flex flex-col min-w-0 relative print:block print:w-full">
                    {Navbar && <Navbar collapsed={collapsed} onToggle={toggleSidebar} />}

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto p-3 md:p-4 lg:p-5 print:p-0 print:overflow-visible relative scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 flex flex-col print:block print:w-full">
                        {children}
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}
