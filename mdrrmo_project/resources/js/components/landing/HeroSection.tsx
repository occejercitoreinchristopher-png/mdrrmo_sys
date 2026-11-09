import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Ambulance,
    Activity,
    Radio,
    MapPin,
    CheckCircle2,
    Shield,
    Smartphone,
    PhoneCall,
    Navigation,
    Clock,
    Zap,
    Compass,
    Wifi,
    ChevronRight,
} from 'lucide-react';
import { login } from '@/routes';

export default function HeroSection() {
    const loginUrl = login ? login() : '/login';

    // Simulated live Philippine Standard Time (PST UTC+8)
    const [currentTime, setCurrentTime] = useState<string>('');
    const [selectedUnit, setSelectedUnit] = useState<'amb01' | 'amb02' | 'eoc'>('amb01');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('en-US', {
                    hour12: true,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'Asia/Manila',
                }) + ' PST'
            );
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-[#070B14]">
            {/* Ambient Background Gradient Lighting */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none -z-10 overflow-hidden">
                <div className="absolute -top-20 left-1/4 w-[600px] h-[600px] bg-blue-600/[0.12] rounded-full blur-[150px]" />
                <div className="absolute top-24 right-10 w-[500px] h-[500px] bg-sky-500/[0.08] rounded-full blur-[140px]" />
                <div className="absolute top-80 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-indigo-600/[0.06] rounded-full blur-[130px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
                    {/* ============================================================== */}
                    {/* Left Column: Headline, Narrative & Primary Actions            */}
                    {/* ============================================================== */}
                    <div className="lg:col-span-6 space-y-7 text-center lg:text-left">
                        {/* Municipal Agency Badge with Live Clock */}
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                            </span>
                            <span>MDRRMO OPOL • EMS COMMAND</span>
                            {currentTime ? (
                                <span className="hidden sm:inline font-mono font-bold text-slate-400 pl-2 border-l border-blue-500/30">
                                    {currentTime}
                                </span>
                            ) : null}
                        </div>

                        {/* Strong Main Headline */}
                        <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
                            Every Second Matters.<br />
                            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                                Every Life Counts.
                            </span>
                        </h1>

                        {/* Supporting Narrative */}
                        <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
                            The official emergency response and ambulance dispatch platform for the Municipality of Opol. Coordinating 24/7 hotline triage, rapid ambulance deployment, and live GPS tracking for citizen safety.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-1">
                            <Link
                                href={loginUrl}
                                className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 border border-blue-400/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2.5"
                            >
                                <span>Access Emergency System</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <a
                                href="#mobile-app"
                                className="w-full sm:w-auto px-7 py-4 text-sm font-bold text-slate-200 hover:text-white bg-[#0F172A]/80 hover:bg-[#1E293B] border border-slate-700/80 hover:border-slate-600 rounded-2xl backdrop-blur-md transition-all text-center flex items-center justify-center gap-2.5 shadow-sm"
                            >
                                <Smartphone className="w-4 h-4 text-sky-400" />
                                <span>Explore Resident Mobile App</span>
                            </a>
                        </div>

                        {/* Key Municipal Trust Metrics */}
                        <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-3.5 text-left">
                            <div className="p-3.5 rounded-2xl bg-[#0D1424]/80 border border-slate-800/90 shadow-sm">
                                <p className="text-xs font-bold text-white">Real-Time GPS</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Live Fleet Tracking</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-[#0D1424]/80 border border-slate-800/90 shadow-sm">
                                <p className="text-xs font-bold text-white">Emergency Dispatch</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Under 90s Turnaround</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-[#0D1424]/80 border border-slate-800/90 shadow-sm">
                                <p className="text-xs font-bold text-white">Digital ePCR</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Clinical Handover</p>
                            </div>
                        </div>

                        {/* Emergency Hotline Banner */}
                        <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-400 pt-1">
                            <PhoneCall className="w-4 h-4 text-rose-400" />
                            <span>Municipal Emergency Hotlines:</span>
                            <a href="tel:911" className="font-extrabold text-rose-400 hover:underline">911</a>
                            <span className="text-slate-600">•</span>
                            <a href="tel:09177076765" className="font-bold text-slate-300 hover:underline">0917-707-6765</a>
                        </div>
                    </div>

                    {/* ============================================================== */}
                    {/* Right Column: High-Tech Interactive Command Dashboard Mockup  */}
                    {/* ============================================================== */}
                    <div className="lg:col-span-6 relative flex justify-center">
                        <div className="relative w-full max-w-xl rounded-3xl bg-[#0D1424]/95 border border-slate-800 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col">
                            {/* Window Chrome Header */}
                            <div className="h-11 bg-[#090E1A] border-b border-slate-800/90 px-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-mono font-medium pl-3 border-l border-slate-800">
                                        mdrrmo-opol.gov.ph/eoc-command
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>EOC ACTIVE</span>
                                </div>
                            </div>

                            {/* Top Stats Strip */}
                            <div className="grid grid-cols-3 gap-2 p-3.5 bg-[#0B101D] border-b border-slate-800/80 text-center">
                                <div className="p-2 rounded-xl bg-[#111B2D]/60 border border-slate-800">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Active Incidents</p>
                                    <p className="text-lg font-black text-white mt-0.5 flex items-center justify-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                        <span>3</span>
                                    </p>
                                </div>
                                <div className="p-2 rounded-xl bg-[#111B2D]/60 border border-slate-800">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Fleet Ready</p>
                                    <p className="text-lg font-black text-emerald-400 mt-0.5">
                                        4 <span className="text-xs text-slate-500 font-normal">/ 6 Units</span>
                                    </p>
                                </div>
                                <div className="p-2 rounded-xl bg-[#111B2D]/60 border border-slate-800">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Response Speed</p>
                                    <p className="text-lg font-black text-sky-400 mt-0.5">
                                        2.4m <span className="text-xs text-slate-500 font-normal">avg</span>
                                    </p>
                                </div>
                            </div>

                            {/* Tactical Radar / Incident Area */}
                            <div className="relative p-5 space-y-4 bg-gradient-to-b from-[#0D1424] to-[#0A0F1D]">
                                {/* Simulated Interactive Sector View */}
                                <div className="relative h-48 w-full rounded-2xl bg-[#070B14] border border-slate-800 p-3.5 overflow-hidden flex flex-col justify-between">
                                    {/* Grid background */}
                                    <div
                                        className="absolute inset-0 opacity-20"
                                        style={{
                                            backgroundImage: 'radial-gradient(circle at 1px 1px, #38BDF8 1px, transparent 0)',
                                            backgroundSize: '20px 20px',
                                        }}
                                    />

                                    <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                                        <span className="font-bold text-white flex items-center gap-1.5">
                                            <Compass className="w-3.5 h-3.5 text-blue-400" />
                                            <span>MUNICIPAL SECTOR: OPOL_CENTRAL</span>
                                        </span>
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <Wifi className="w-3 h-3" />
                                            <span>GPS Online</span>
                                        </span>
                                    </div>

                                    {/* Tactical Beacons (Clickable to switch details below) */}
                                    <div className="relative z-10 my-auto flex items-center justify-around">
                                        {/* EOC Central Base */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedUnit('eoc')}
                                            className={`text-center p-1.5 rounded-xl transition-all ${
                                                selectedUnit === 'eoc' ? 'scale-110 ring-2 ring-blue-500/50 bg-blue-500/10' : 'hover:scale-105'
                                            }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20">
                                                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                                            </div>
                                            <p className="text-[10px] font-bold text-white mt-1">EOC Base</p>
                                            <p className="text-[9px] text-slate-500 font-mono">Poblacion</p>
                                        </button>

                                        {/* AMB-01 Beacon */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedUnit('amb01')}
                                            className={`text-center p-1.5 rounded-xl transition-all ${
                                                selectedUnit === 'amb01' ? 'scale-110 ring-2 ring-rose-500/50 bg-rose-500/10' : 'hover:scale-105'
                                            }`}
                                        >
                                            <div className="relative w-8 h-8 rounded-full bg-rose-600/30 border border-rose-400 flex items-center justify-center text-white mx-auto shadow-md shadow-rose-500/30">
                                                <span className="animate-ping absolute inset-0 rounded-full bg-rose-400 opacity-60" />
                                                <Ambulance className="w-3.5 h-3.5 text-rose-300 relative z-10" />
                                            </div>
                                            <p className="text-[10px] font-bold text-rose-400 mt-1">AMB-01</p>
                                            <p className="text-[9px] text-slate-400 font-mono">52 km/h • ETA 3m</p>
                                        </button>

                                        {/* AMB-02 Beacon */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedUnit('amb02')}
                                            className={`text-center p-1.5 rounded-xl transition-all ${
                                                selectedUnit === 'amb02' ? 'scale-110 ring-2 ring-amber-500/50 bg-amber-500/10' : 'hover:scale-105'
                                            }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-amber-600/30 border border-amber-400 flex items-center justify-center text-white mx-auto shadow-md shadow-amber-500/30">
                                                <Ambulance className="w-3.5 h-3.5 text-amber-300" />
                                            </div>
                                            <p className="text-[10px] font-bold text-amber-400 mt-1">AMB-02</p>
                                            <p className="text-[9px] text-slate-400 font-mono">On Scene • Igpit</p>
                                        </button>
                                    </div>

                                    <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-500">
                                        <span>COORDS: 8.5204° N, 124.5719° E</span>
                                        <span className="text-slate-400">Click unit to view telemetry</span>
                                    </div>
                                </div>

                                {/* Dynamic Selected Telemetry Card */}
                                <div className="transition-all duration-300">
                                    {selectedUnit === 'amb01' && (
                                        <div className="p-3.5 rounded-2xl bg-[#090E1A] border border-rose-500/30 flex items-start justify-between gap-3 shadow-md animate-in fade-in duration-200">
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Zap className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono font-bold text-slate-400">AMB-01 (Toyota HiAce EMS)</span>
                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                            PRIORITY 1 • EN ROUTE
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-bold text-white mt-1">
                                                        INC-2026-00084 • Respiratory Distress at Brgy. Poblacion
                                                    </p>
                                                    <p className="text-[11px] text-blue-400 font-medium mt-1 flex items-center gap-1">
                                                        <Navigation className="w-3 h-3" />
                                                        <span>Speed: 52 km/h • Crew: Paramedic J. Reyes & Driver M. Tan • ETA: 3.8m</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-500 font-semibold">Live GPS</span>
                                        </div>
                                    )}

                                    {selectedUnit === 'amb02' && (
                                        <div className="p-3.5 rounded-2xl bg-[#090E1A] border border-amber-500/30 flex items-start justify-between gap-3 shadow-md animate-in fade-in duration-200">
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Activity className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono font-bold text-slate-400">AMB-02 (Nissan NV350 Rescue)</span>
                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                            ON SCENE • PATIENT CARE
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-bold text-white mt-1">
                                                        INC-2026-00083 • Motorcycle Incident at Highway Crossing, Brgy. Igpit
                                                    </p>
                                                    <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>On Scene 8 mins • Patient vitals stable • ePCR digital sync active</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-500 font-semibold">Live GPS</span>
                                        </div>
                                    )}

                                    {selectedUnit === 'eoc' && (
                                        <div className="p-3.5 rounded-2xl bg-[#090E1A] border border-blue-500/30 flex items-start justify-between gap-3 shadow-md animate-in fade-in duration-200">
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Shield className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono font-bold text-slate-400">MDRRMO Central Base</span>
                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                            EOC HEADQUARTERS
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-bold text-white mt-1">
                                                        Municipal Hall Complex, Zone 2, Poblacion, Opol
                                                    </p>
                                                    <p className="text-[11px] text-sky-400 font-medium mt-1 flex items-center gap-1">
                                                        <Radio className="w-3 h-3" />
                                                        <span>18 Personnel on duty • 4 Ambulances in ready reserve • 24/7 Hotline Online</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono text-emerald-400 font-semibold">Online</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Window Footer */}
                            <div className="px-4 py-2.5 bg-[#090E1A] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                                    <span>MDRRMO Municipal Command Center • 24/7 Standby</span>
                                </span>
                                <span className="font-mono text-slate-500 text-[10px]">14 BARANGAYS MONITORED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
