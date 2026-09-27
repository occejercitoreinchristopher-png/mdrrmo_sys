import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ShieldAlert, Menu, X, ArrowRight, PhoneCall, Smartphone } from 'lucide-react';
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
        { label: 'Roles', href: '#roles' },
        { label: 'Resident App', href: '#mobile-app' },
        { label: 'Community', href: '#community' },
    ];

    const loginUrl = login ? login() : '/login';

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${
                scrolled
                    ? 'bg-[#080d1a]/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
                    : 'bg-[#080d1a]/60 backdrop-blur-md border-b border-white/5'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-18">
                    {/* Brand */}
                    <a href="#hero" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                            <img src="/images/opol-logo.png" alt="MDRRMO Opol" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                                    MDRRMO OPOL
                                </span>
                                <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/25">
                                    EMS
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">
                                Emergency Medical Services
                            </p>
                        </div>
                    </a>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="px-3 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Right Desktop Actions */}
                    <div className="hidden sm:flex items-center gap-3">
                        {/* 24/7 Hotline Badge */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                            <span>Hotline: 911</span>
                        </div>

                        {/* Resident Mobile App Link */}
                        <a
                            href="#mobile-app"
                            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl transition-all inline-flex items-center gap-1.5"
                        >
                            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                            <span>Resident App</span>
                        </a>

                        <Link
                            href={loginUrl}
                            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 border border-blue-400/20 transition-all inline-flex items-center gap-1.5"
                        >
                            <span>Sign In</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex sm:hidden items-center gap-2">
                        <Link
                            href={loginUrl}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg"
                        >
                            Sign In
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle navigation menu"
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
                <div className="sm:hidden border-b border-white/10 bg-[#080d1a]/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-3">
                    <nav className="flex flex-col space-y-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                    <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                        <a
                            href="#mobile-app"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full py-2.5 text-center text-xs font-semibold text-slate-200 bg-white/[0.05] border border-white/10 rounded-xl flex items-center justify-center gap-2"
                        >
                            <Smartphone className="w-4 h-4 text-sky-400" />
                            <span>Download Resident Mobile App</span>
                        </a>
                        <div className="flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-rose-400">
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Emergency Hotline: 911 / (088) 555-OPOL</span>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
