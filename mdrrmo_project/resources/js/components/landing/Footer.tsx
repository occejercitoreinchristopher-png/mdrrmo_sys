import { Link } from '@inertiajs/react';
import { ShieldAlert, HeartPulse, PhoneCall } from 'lucide-react';
import { login } from '@/routes';

export default function Footer() {
    const loginUrl = login ? login() : '/login';

    return (
        <footer className="relative border-t border-white/10 bg-[#060a14] text-slate-400 text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-between">
                    {/* Brand & Mission */}
                    <div className="md:col-span-6 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                                <img src="/images/opol-logo.png" alt="MDRRMO Opol" className="w-full h-full object-contain drop-shadow-md" />
                            </div>
                            <div>
                                <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                                    MDRRMO Opol
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                    Emergency Medical Services Management System
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                            Municipal Disaster Risk Reduction and Management Office, Municipality of Opol, Misamis Oriental, Republic of the Philippines.
                        </p>
                        <div className="flex items-center gap-2 text-rose-400 font-semibold pt-1">
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>24/7 Hotline: 911 / (088) 555-OPOL</span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="md:col-span-6 flex flex-col sm:flex-row sm:justify-end gap-8 md:gap-12">
                        <div>
                            <p className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
                                Platform Navigation
                            </p>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#hero" className="hover:text-white transition-colors">
                                        Home
                                    </a>
                                </li>
                                <li>
                                    <a href="#services" className="hover:text-white transition-colors">
                                        Emergency Services
                                    </a>
                                </li>
                                <li>
                                    <a href="#how-it-works" className="hover:text-white transition-colors">
                                        How It Works
                                    </a>
                                </li>
                                <li>
                                    <a href="#roles" className="hover:text-white transition-colors">
                                        System Roles
                                    </a>
                                </li>
                                <li>
                                    <a href="#community" className="hover:text-white transition-colors">
                                        Community of Opol
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <p className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
                                Portal Access
                            </p>
                            <ul className="space-y-2">
                                <li>
                                    <Link href={loginUrl} className="hover:text-white transition-colors">
                                        Login to System
                                    </Link>
                                </li>
                                <li>
                                    <a href="#mobile-app" className="hover:text-white transition-colors">
                                        Resident Mobile App
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Legal / Copyright */}
                <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                        <span>Dedicated to rapid emergency medical response and community safety.</span>
                    </div>
                    <p>© 2026 MDRRMO Opol. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
