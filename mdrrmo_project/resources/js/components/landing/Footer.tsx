import { Link } from '@inertiajs/react';
import {
    PhoneCall,
    MapPin,
    Mail,
    HeartPulse,
    Shield,
    ExternalLink,
    Clock,
    Building2,
} from 'lucide-react';
import { login } from '@/routes';

export default function Footer() {
    const loginUrl = login ? login() : '/login';

    return (
        <footer className="relative border-t border-slate-800 bg-[#050913] text-slate-400 text-xs">
            {/* Main Footer Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
                    {/* Brand & Municipal Identification (lg:col-span-4) */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                                <img
                                    src="/images/opol-logo.png"
                                    alt="MDRRMO Opol Seal"
                                    className="w-full h-full object-contain drop-shadow-md"
                                />
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                                <img
                                    src="/images/drrm_logo.png"
                                    alt="DRRM Logo"
                                    className="w-full h-full object-contain drop-shadow-md"
                                />
                            </div>
                            <div>
                                <span className="font-black text-base tracking-tight text-white block leading-tight">
                                    MDRRMO OPOL
                                </span>
                                <span className="text-[11px] text-blue-400 font-semibold tracking-wide block">
                                    Emergency Medical Services
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed font-normal">
                            Municipal Disaster Risk Reduction and Management Office (MDRRMO), Local Government Unit of Opol, Province of Misamis Oriental, Republic of the Philippines.
                        </p>

                        <div className="pt-2 space-y-2 text-xs">
                            <div className="flex items-start gap-2.5 text-slate-300">
                                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                <span>MDRRMO Operations Center, Municipal Hall Compound, Zone 2, Poblacion, Opol, Misamis Oriental, 9016</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-slate-300">
                                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <span>mdrrmo@opol.gov.ph</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-emerald-400 font-semibold">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>EOC Standby: 24 Hours / 7 Days a Week / 365 Days</span>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Hotlines Directory (lg:col-span-3) */}
                    <div className="lg:col-span-3 space-y-3">
                        <p className="font-extrabold text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                            <PhoneCall className="w-4 h-4 text-rose-400" />
                            <span>Emergency Hotlines</span>
                        </p>
                        <ul className="space-y-2.5 text-xs">
                            <li className="p-2.5 rounded-xl bg-[#111B2D] border border-slate-800">
                                <span className="text-[10px] text-slate-400 font-medium block">National Emergency</span>
                                <a href="tel:911" className="text-sm font-black text-rose-400 hover:underline">
                                    911 (Toll-Free)
                                </a>
                            </li>
                            <li className="p-2.5 rounded-xl bg-[#111B2D] border border-slate-800">
                                <span className="text-[10px] text-slate-400 font-medium block">MDRRMO Opol Command Center</span>
                                <a href="tel:09177076765" className="text-sm font-bold text-white hover:text-blue-400">
                                    0917-707-6765
                                </a>
                            </li>
                            <li className="p-2.5 rounded-xl bg-[#111B2D] border border-slate-800">
                                <span className="text-[10px] text-slate-400 font-medium block">PNP Opol Police Station</span>
                                <a href="tel:09358056370" className="text-xs font-semibold text-slate-300 hover:text-white">
                                    0935-805-6370
                                </a>
                            </li>
                            <li className="p-2.5 rounded-xl bg-[#111B2D] border border-slate-800">
                                <span className="text-[10px] text-slate-400 font-medium block">BFP Opol Fire Station</span>
                                <a href="tel:09758429491" className="text-xs font-semibold text-slate-300 hover:text-white">
                                    0975-842-9491
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Platform Navigation (lg:col-span-2) */}
                    <div className="lg:col-span-2 space-y-3">
                        <p className="font-extrabold text-white uppercase tracking-wider text-xs mb-3">
                            Platform Links
                        </p>
                        <ul className="space-y-2 text-xs">
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
                                <a href="#operations" className="hover:text-white transition-colors">
                                    Live Operations
                                </a>
                            </li>
                            <li>
                                <a href="#mobile-app" className="hover:text-white transition-colors">
                                    Resident App
                                </a>
                            </li>
                            <li>
                                <a href="#roles" className="hover:text-white transition-colors">
                                    System Roles
                                </a>
                            </li>
                            <li>
                                <a href="#community" className="hover:text-white transition-colors">
                                    14 Barangays
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Portals & Governance (lg:col-span-3) */}
                    <div className="lg:col-span-3 space-y-3">
                        <p className="font-extrabold text-white uppercase tracking-wider text-xs mb-3">
                            System Access
                        </p>
                        <ul className="space-y-2.5 text-xs">
                            <li>
                                <Link
                                    href={loginUrl}
                                    className="p-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-white font-bold block hover:border-blue-400 transition-colors"
                                >
                                    <span className="block text-blue-300">Access Command System</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Dispatcher & Admin login</span>
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="#mobile-app"
                                    className="p-3 rounded-xl bg-[#111B2D] border border-slate-800 text-slate-200 font-bold block hover:border-slate-700 transition-colors"
                                >
                                    <span className="block text-white">Resident Mobile App</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Direct reporting & tracking</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Legal, Disclaimer & Copyright */}
                <div className="mt-14 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                        <HeartPulse className="w-4 h-4 text-rose-500" />
                        <span>Dedicated to rapid emergency medical response, disaster resilience, and community safety.</span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-400">
                        <span>© 2026 MDRRMO Opol. Republic of the Philippines.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
