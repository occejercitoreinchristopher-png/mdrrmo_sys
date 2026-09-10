import { Link } from '@inertiajs/react';
import { ShieldAlert, ArrowRight, Ambulance, Activity, Radio, MapPin, CheckCircle2, Siren, Smartphone } from 'lucide-react';
import { login, register } from '@/routes';

export default function HeroSection() {
    const loginUrl = login ? login() : '/login';
    const registerUrl = register ? register() : '/register';

    return (
        <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10">
                <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute top-20 right-10 w-[450px] h-[450px] bg-rose-600/10 rounded-full blur-3xl" />
                <div className="absolute top-60 left-1/3 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    {/* Left Column: Headline & Action */}
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                        {/* Emergency Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span>OPOL EMERGENCY MEDICAL SERVICES</span>
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                            Fast Response.<br />
                            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                                Better Coordination.
                            </span><br />
                            <span className="text-slate-100">
                                Safer Communities.
                            </span>
                        </h1>

                        {/* Supporting Narrative */}
                        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                            MDRRMO Opol Emergency Medical Services Management System is a centralized platform for receiving emergency reports, coordinating dispatch operations, monitoring responders, and managing emergency medical records.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                            <Link
                                href={loginUrl}
                                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border border-blue-400/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2"
                            >
                                <span>Login to System</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="#mobile-app"
                                className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-slate-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-xl backdrop-blur-md transition-all text-center flex items-center justify-center gap-2"
                            >
                                <Smartphone className="w-4 h-4 text-sky-400" />
                                <span>Resident Mobile App</span>
                            </a>
                        </div>

                        {/* Quick Trust Highlights */}
                        <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Real-Time GPS Tracking</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Direct Dispatch Verification</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Digital Patient Care Records</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Abstract Emergency Operations Visualization */}
                    <div className="lg:col-span-5 relative flex justify-center">
                        {/* Main Glass Simulation Container */}
                        <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/15 p-6 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col justify-between">
                            {/* Abstract Map Grid Lines & Radar Rings */}
                            <div className="absolute inset-0 pointer-events-none opacity-20">
                                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-300" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)" />
                                    {/* Dispatch Route Line */}
                                    <path
                                        d="M 50 240 Q 150 140, 240 180 T 380 90"
                                        fill="none"
                                        stroke="url(#routeGradient)"
                                        strokeWidth="3"
                                        strokeDasharray="6 4"
                                    />
                                    <defs>
                                        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#f43f5e" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>

                            {/* Top Mock Header Inside Visual */}
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                                    <span className="font-mono text-xs font-bold text-slate-300 tracking-wider">
                                        LIVE OPS FEED • OPOL
                                    </span>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-blue-300 bg-blue-500/10 border border-blue-500/20">
                                    GRID: 8.523° N, 124.571° E
                                </span>
                            </div>

                            {/* Animated Visual Elements (Map Nodes) */}
                            <div className="relative z-10 my-auto py-6">
                                {/* Incident Node (Poblacion) */}
                                <div className="absolute top-2 left-6 flex items-center gap-2.5 bg-slate-900/80 border border-rose-500/30 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-lg shadow-rose-950/40">
                                    <div className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-white leading-none">INCIDENT #2026-084</p>
                                        <p className="text-[9px] text-rose-400 font-mono">Poblacion • Priority High</p>
                                    </div>
                                </div>

                                {/* Ambulance Node (En Route) */}
                                <div className="absolute bottom-4 right-6 flex items-center gap-2.5 bg-slate-900/80 border border-blue-500/30 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-lg shadow-blue-950/40">
                                    <div className="w-6 h-6 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400">
                                        <Ambulance className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-white leading-none">AMB-02 OPOL</p>
                                        <p className="text-[9px] text-emerald-400 font-mono">En Route • ETA 4 mins</p>
                                    </div>
                                </div>

                                {/* Responder Unit Node */}
                                <div className="absolute top-1/2 left-1/3 -translate-y-1/2 flex items-center gap-2 bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 backdrop-blur-sm">
                                    <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                                    <span>Medic Unit Alpha active</span>
                                </div>
                            </div>

                            {/* Floating Glass Status Card (Required Feature) */}
                            <div className="relative z-10 w-full rounded-2xl bg-[#080d1a]/85 border border-white/15 p-4 backdrop-blur-xl shadow-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        EMERGENCY RESPONSE SYSTEM
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>SYSTEM OPERATIONAL</span>
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                                    <span className="font-medium text-slate-300">24/7 Emergency Coordination</span>
                                    <span>Opol, Misamis Oriental</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
