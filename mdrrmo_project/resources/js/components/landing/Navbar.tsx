import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X, ArrowRight, PhoneCall, Smartphone } from 'lucide-react';
import { login } from '@/routes';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Home', href: '#hero' },
        { label: 'Services', href: '#services' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Live Operations', href: '#operations' },
        { label: 'Resident App', href: '#mobile-app' },
        { label: 'Coverage', href: '#community' },
    ];

    const loginUrl = login ? login() : '/login';

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${
                scrolled
                    ? 'bg-[#080D19]/95 backdrop-blur-xl border-b border-slate-800 shadow-xl shadow-black/40'
                    : 'bg-[#080D19]/80 backdrop-blur-md border-b border-slate-800/60'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Brand */}
                    <a href="#hero" className="flex items-center gap-3.5 group">
                        <div className="flex items-center gap-2 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <img
                                    src="/images/opol-logo.png"
                                    alt="MDRRMO Opol Seal"
                                    className="w-full h-full object-contain drop-shadow-md"
                                />
                            </div>
                            <div className="w-9 h-9 hidden xs:flex items-center justify-center">
                                <img
                                    src="/images/opol-seal.png"
                                    alt="Municipality of Opol Official Seal"
                                    className="w-full h-full object-contain drop-shadow-md opacity-90"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-base sm:text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
                                    MDRRMO OPOL
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                    EMS
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                                Emergency Medical Services • Opol, MisOr
                            </p>
                        </div>
                    </a>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-1 bg-[#111B2D]/80 border border-slate-800 rounded-full px-4 py-1.5 backdrop-blur-md shadow-inner">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all duration-150"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Right Desktop Actions */}
                    <div className="hidden sm:flex items-center gap-3">
                        {/* 24/7 Hotline Badge */}
                        <a
                            href="tel:911"
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold hover:bg-rose-500/15 transition-colors"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                            <span>Hotline: 911</span>
                        </a>

                        {/* Resident Mobile App Link */}
                        <a
                            href="#mobile-app"
                            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all"
                        >
                            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                            <span>Resident App</span>
                        </a>

                        {/* Sign In CTA */}
                        <Link
                            href={loginUrl}
                            className="px-4.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 border border-blue-400/25 transition-all inline-flex items-center gap-1.5 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span>Sign In</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="lg:hidden flex items-center gap-2">
                        <a
                            href="tel:911"
                            className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-bold"
                        >
                            <PhoneCall className="w-3 h-3 text-rose-400" />
                            <span>911</span>
                        </a>

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                            aria-label="Toggle Navigation Menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Slide-down Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden bg-[#080D19]/98 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 backdrop-blur-2xl">
                    <div className="space-y-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-2.5">
                        <a
                            href="tel:911"
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold"
                        >
                            <PhoneCall className="w-4 h-4 text-rose-400" />
                            <span>Emergency Hotline: 911 / 0917-707-6765</span>
                        </a>

                        <a
                            href="#mobile-app"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold"
                        >
                            <Smartphone className="w-4 h-4 text-sky-400" />
                            <span>Explore Resident Mobile App</span>
                        </a>

                        <Link
                            href={loginUrl}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-500/25"
                        >
                            <span>Access System Portal</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
