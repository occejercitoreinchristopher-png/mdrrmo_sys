import { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { PhoneCall, HeartPulse } from 'lucide-react';
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
            <div className="min-h-screen bg-[#F4F6FA] dark:bg-[#080D1B] text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-500 relative selection:bg-[#FF6B35] selection:text-white overflow-x-hidden">
                {/* Emergency atmospheric background lighting */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-[#2455C5]/10 dark:bg-[#2455C5]/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] bg-[#FF6B35]/8 dark:bg-[#FF6B35]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 left-1/4 w-[520px] h-[520px] bg-[#3568DC]/8 dark:bg-[#3568DC]/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Subtle dot grid pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.04]"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                            backgroundSize: '24px 24px',
                        }}
                    />
                </div>

                {/* Top Navigation Bar */}
                <header className="relative z-10 w-full px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#0D1527]/70 backdrop-blur-md transition-colors duration-300">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                        {/* Branding / Home Link */}
                        <Link href="/" className="flex items-center gap-3 group select-none">
                            {/* Official Opol Rescue Shield Logo */}
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/30 dark:bg-black/30 border border-slate-300/60 dark:border-white/15 p-1 flex items-center justify-center shadow-md shadow-black/10 backdrop-blur-sm relative overflow-hidden group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                                <img
                                    src="/images/opol-rescue-logo.png"
                                    alt="MDRRMO Opol Rescue Logo"
                                    className="w-full h-full object-contain drop-shadow-sm rounded-lg"
                                />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                                        MDRRMO OPOL
                                    </span>
                                    <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/25">
                                        EMS
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-[#A9B8D0] font-medium truncate max-w-[200px] sm:max-w-none">
                                    Emergency Medical Services Management
                                </p>
                            </div>
                        </Link>

                        {/* Right: Hotline & Theme Toggle */}
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-semibold shadow-sm select-none">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E63946] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E63946]"></span>
                                </span>
                                <PhoneCall className="w-3.5 h-3.5 text-[#E63946]" />
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
                <footer className="relative z-10 w-full px-4 sm:px-8 py-4 border-t border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-[#0D1527]/50 backdrop-blur-sm text-center transition-colors duration-300">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#A9B8D0]">
                        <div className="flex items-center gap-1.5">
                            <HeartPulse className="w-3.5 h-3.5 text-[#E63946]" />
                            <span>Municipal Disaster Risk Reduction and Management Office – Municipality of Opol</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 text-slate-400 dark:text-slate-500">
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
