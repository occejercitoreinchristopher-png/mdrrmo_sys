import { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ShieldAlert, PhoneCall, HeartPulse } from 'lucide-react';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import ThemeToggle from '@/shared/components/ThemeToggle';

interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children }: AuthLayoutProps) {
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-slate-100/80 dark:bg-[#0a0f1e] text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-300 relative selection:bg-rose-500 selection:text-white overflow-x-hidden">
                {/* Emergency atmospheric background lighting */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-rose-600/10 dark:bg-rose-700/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-1/4 -right-32 w-[480px] h-[480px] bg-orange-500/8 dark:bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 left-1/4 w-[520px] h-[520px] bg-blue-600/8 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Subtle dot grid pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.03]"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                            backgroundSize: '28px 28px',
                        }}
                    />
                </div>

                {/* Top Navigation Bar */}
                <header className="relative z-10 w-full px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-black/20 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                        {/* Branding / Home Link */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/25 border border-rose-400/30 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                                <ShieldAlert className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                                        MDRRMO OPOL
                                    </span>
                                    <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                        EMS
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px] sm:max-w-none">
                                    Emergency Medical Services Management
                                </p>
                            </div>
                        </Link>

                        {/* Right: Hotline & Theme Toggle */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-semibold shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                                <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
                                <span>24/7 Hotline: 911</span>
                            </div>

                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10 my-auto">
                    <div className="w-full flex justify-center">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 w-full px-4 py-4 border-t border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-sm text-center">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                            <span>Municipal Disaster Risk Reduction and Management Office • Municipality of Opol</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
                            <span>Misamis Oriental, Philippines</span>
                            <span>•</span>
                            <span className="font-mono font-medium text-slate-600 dark:text-slate-400">MDRRMO EMS v1.0</span>
                        </div>
                    </div>
                </footer>
            </div>
        </ThemeProvider>
    );
}
