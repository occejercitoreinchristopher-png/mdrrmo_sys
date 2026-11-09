import { useState } from 'react';
import {
    Smartphone,
    BellRing,
    MapPin,
    Ambulance,
    ShieldCheck,
    PhoneCall,
    CheckCircle2,
    Download,
    ArrowRight,
    Radio,
    ShieldAlert,
    Clock,
    AlertTriangle,
    Navigation,
    Shield,
    Phone,
    HeartPulse,
    Flame,
} from 'lucide-react';

export default function MobileAppSection() {
    const [mockupScreen, setMockupScreen] = useState<'home' | 'track' | 'directory'>('home');

    const features = [
        {
            title: 'One-Tap Emergency Reporting',
            desc: 'Submit incident reports with automated GPS coordinates, triage category, and photo evidence in seconds.',
            icon: BellRing,
            color: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
        },
        {
            title: 'Automatic Location Sharing',
            desc: 'Transmits your pinpoint coordinates and nearest landmarks directly to arriving ambulance drivers.',
            icon: MapPin,
            color: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
        },
        {
            title: 'Live Ambulance Route Tracking',
            desc: 'Watch assigned emergency medical units approach your location live on an interactive municipal map.',
            icon: Ambulance,
            color: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
        },
        {
            title: 'Direct Dispatcher Communication',
            desc: 'Immediate connection to MDRRMO Opol Command Center operators for pre-arrival triage and instructions.',
            icon: PhoneCall,
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
        },
    ];

    return (
        <section id="mobile-app" className="relative py-20 md:py-28 border-t border-slate-800/80 bg-[#060B15] overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-1/2 right-1/4 w-[600px] h-[500px] bg-blue-600/[0.08] rounded-full blur-[140px] pointer-events-none -z-0" />
            <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] bg-rose-600/[0.06] rounded-full blur-[130px] pointer-events-none -z-0" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
                    {/* Left Column: Mobile App Narrative & Features */}
                    <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Citizen Emergency Portal</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            Emergency Protection in the Palm of Every Opolan
                        </h2>

                        <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto lg:mx-0">
                            The <strong className="text-white font-bold">Opol RESQ Citizen Portal</strong> mobile application connects residents directly with municipal dispatchers, ambulances, and life-saving rescue teams.
                        </p>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-left">
                            {features.map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.title}
                                        className="p-5 rounded-2xl bg-[#0D1424]/90 hover:bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition-all duration-200 shadow-lg flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className={`w-10 h-10 rounded-xl ${f.color} border flex items-center justify-center mb-3.5 shadow-sm`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-sm font-bold text-white mb-1.5">
                                                {f.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 leading-relaxed font-normal">
                                                {f.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action CTA */}
                        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <a
                                href="/download/app"
                                className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 border border-blue-400/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2.5"
                            >
                                <Download className="w-4 h-4" />
                                <span>Explore Resident Mobile App</span>
                            </a>

                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Optimized for Android & Mobile Web</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: High-Quality Interactive Smartphone Mockup */}
                    <div className="lg:col-span-5 flex flex-col items-center">
                        {/* Interactive Screen Preview Tabs */}
                        <div className="flex items-center gap-1.5 bg-[#0D1424] border border-slate-800 p-1 rounded-xl mb-4 text-xs font-bold shadow-md">
                            <button
                                type="button"
                                onClick={() => setMockupScreen('home')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    mockupScreen === 'home'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Portal Home
                            </button>
                            <button
                                type="button"
                                onClick={() => setMockupScreen('track')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    mockupScreen === 'track'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Live Tracking
                            </button>
                            <button
                                type="button"
                                onClick={() => setMockupScreen('directory')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    mockupScreen === 'directory'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Hotlines
                            </button>
                        </div>

                        <div className="relative w-full max-w-[330px] rounded-[48px] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 p-3 shadow-2xl border-4 border-slate-700/80">
                            {/* Inner Screen */}
                            <div className="rounded-[40px] bg-[#0A1022] overflow-hidden border border-slate-700/60 shadow-inner flex flex-col min-h-[500px]">
                                {/* Status Bar */}
                                <div className="h-7 bg-[#1E88E5] px-6 flex items-center justify-between text-[11px] text-white font-semibold">
                                    <span>9:41</span>
                                    <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto" />
                                    <div className="flex items-center gap-1 text-[10px]">
                                        <span>5G</span>
                                        <span>100%</span>
                                    </div>
                                </div>

                                {/* SCREEN 1: PORTAL HOME */}
                                {mockupScreen === 'home' && (
                                    <div className="flex-1 flex flex-col animate-in fade-in duration-200">
                                        <div className="bg-[#1E88E5] px-5 pt-3 pb-6 text-white relative">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold tracking-widest text-blue-100 uppercase">
                                                        OPOL RESQ • CITIZEN PORTAL
                                                    </p>
                                                    <h4 className="text-xl font-extrabold mt-0.5">
                                                        Hi, Citizen 👋
                                                    </h4>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                                                    <ShieldAlert className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-3 bg-[#F5F9FC] flex-1">
                                            {/* Red Priority Emergency Report Card */}
                                            <div className="rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 p-4 text-white shadow-lg shadow-red-600/25">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-white/20 border border-white/30">
                                                        24/7 PRIORITY HOTLINE
                                                    </span>
                                                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                                </div>
                                                <h5 className="text-base font-black tracking-tight uppercase">
                                                    REPORT EMERGENCY
                                                </h5>
                                                <p className="text-[11px] text-red-100 mt-1 leading-snug">
                                                    Tap for instant dispatch & municipal medical rescue.
                                                </p>
                                            </div>

                                            {/* 4 Quick Actions Row */}
                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                                                    <div className="w-7 h-7 mx-auto rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-1">
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-800 block">Report</span>
                                                </div>
                                                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                                                    <div className="w-7 h-7 mx-auto rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-800 block">History</span>
                                                </div>
                                                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                                                    <div className="w-7 h-7 mx-auto rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-1">
                                                        <Navigation className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-800 block">Track</span>
                                                </div>
                                                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                                                    <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                                                        <PhoneCall className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-800 block">Hotline</span>
                                                </div>
                                            </div>

                                            {/* Sector Status Card */}
                                            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-900">
                                                        Sector All Clear • 14 Barangays
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    MDRRMO rescue teams and Alpha units on active standby across Opol.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SCREEN 2: LIVE GPS TRACK */}
                                {mockupScreen === 'track' && (
                                    <div className="flex-1 flex flex-col animate-in fade-in duration-200">
                                        <div className="bg-[#1E88E5] px-5 pt-3 pb-5 text-white">
                                            <p className="text-[10px] font-bold tracking-widest text-blue-100 uppercase">
                                                LIVE MISSION TRACKING
                                            </p>
                                            <h4 className="text-lg font-extrabold mt-0.5">
                                                AMB-01 En Route
                                            </h4>
                                            <p className="text-[11px] text-blue-100">ETA: 3.8 Mins • Speed: 52 km/h</p>
                                        </div>

                                        <div className="p-4 space-y-3 bg-[#F5F9FC] flex-1">
                                            {/* Simulated Map Route */}
                                            <div className="h-40 rounded-2xl bg-slate-200 border border-slate-300 relative overflow-hidden flex items-center justify-center">
                                                <div className="absolute inset-0 bg-[#E2E8F0] opacity-80" />
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <div className="w-10 h-10 rounded-full bg-[#1E88E5] text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                                                        <Ambulance className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-900 mt-1 bg-white px-2 py-0.5 rounded shadow-xs">
                                                        AMB-01 • Poblacion Route
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Responder Card */}
                                            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                                                <p className="text-[10px] font-bold uppercase text-slate-400">Assigned Rescue Team</p>
                                                <p className="text-xs font-bold text-slate-900 mt-0.5">EMT J. Reyes • Driver M. Tan</p>
                                                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                                    <span className="text-emerald-600 font-bold">● Turn-by-Turn GPS Active</span>
                                                    <span className="text-blue-600 font-bold">Call Team</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SCREEN 3: HOTLINES DIRECTORY */}
                                {mockupScreen === 'directory' && (
                                    <div className="flex-1 flex flex-col animate-in fade-in duration-200">
                                        <div className="bg-[#1E88E5] px-5 pt-3 pb-5 text-white">
                                            <p className="text-[10px] font-bold tracking-widest text-blue-100 uppercase">
                                                OPOL RESQ DIRECTORY
                                            </p>
                                            <h4 className="text-lg font-extrabold mt-0.5">
                                                Emergency Hotlines
                                            </h4>
                                        </div>

                                        <div className="p-4 space-y-2 bg-[#F5F9FC] flex-1 text-left">
                                            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">National Emergency</p>
                                                    <p className="text-[11px] text-rose-600 font-bold">911 (Toll-Free)</p>
                                                </div>
                                                <Phone className="w-4 h-4 text-rose-500" />
                                            </div>

                                            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">MDRRMO Command Base</p>
                                                    <p className="text-[11px] text-blue-600 font-bold">0917-707-6765</p>
                                                </div>
                                                <Phone className="w-4 h-4 text-blue-500" />
                                            </div>

                                            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">Police Station (PNP)</p>
                                                    <p className="text-[11px] text-slate-600 font-bold">0935-805-6370</p>
                                                </div>
                                                <Shield className="w-4 h-4 text-slate-500" />
                                            </div>

                                            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">Fire Protection (BFP)</p>
                                                    <p className="text-[11px] text-slate-600 font-bold">0975-842-9491</p>
                                                </div>
                                                <Flame className="w-4 h-4 text-orange-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Bottom Navigation Bar */}
                                <div className="h-12 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-slate-400">
                                    <span className="text-blue-600 text-[10px] font-bold flex flex-col items-center">
                                        ● Home
                                    </span>
                                    <span className="text-[10px] font-medium flex flex-col items-center">
                                        Report
                                    </span>
                                    <span className="text-[10px] font-medium flex flex-col items-center">
                                        Track
                                    </span>
                                    <span className="text-[10px] font-medium flex flex-col items-center">
                                        Profile
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
