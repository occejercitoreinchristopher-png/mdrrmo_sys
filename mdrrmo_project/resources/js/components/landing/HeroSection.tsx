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
                            Precision Emergency<br />
                            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                                Command & Control.
                            </span><br />
                        </h1>

                        {/* Supporting Narrative */}
                        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal mt-2">
                            A unified, intelligent platform engineered to accelerate emergency response, streamline dispatch coordination, and digitize patient care records for the Municipality of Opol.
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

                    {/* Right Column: Professional Dashboard UI Mockup */}
                    <div className="lg:col-span-5 relative flex justify-center">
                        <div className="relative w-full max-w-lg rounded-2xl bg-slate-900/40 border border-slate-700/50 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
                            {/* Browser/Window Header */}
                            <div className="h-10 bg-slate-800/80 border-b border-slate-700/50 flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                </div>
                                <div className="ml-4 flex-1 h-5 bg-slate-900/50 rounded-md flex items-center justify-center">
                                    <span className="text-[10px] text-slate-500 font-medium font-mono">mdrrmo-opol.tech/dispatch</span>
                                </div>
                            </div>
                            
                            {/* Dashboard Content */}
                            <div className="p-5 space-y-4">
                                {/* Top Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity className="w-4 h-4 text-rose-400" />
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Incidents</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">4</div>
                                        <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                                            <ArrowRight className="w-3 h-3 -rotate-45" />
                                            <span>Normal capacity</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Ambulance className="w-4 h-4 text-blue-400" />
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Available Units</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">2 <span className="text-sm text-slate-500 font-normal">/ 5</span></div>
                                        <div className="text-[10px] text-blue-400 mt-1 flex items-center gap-1">
                                            <span>3 Units Dispatched</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Map / Incident List Simulation */}
                                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-semibold text-slate-300">Live Dispatch Feed</span>
                                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            Live
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {/* Incident 1 */}
                                        <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                                            <div className="mt-0.5 p-1.5 rounded bg-rose-500/20 text-rose-400">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-200">Medical Emergency</span>
                                                    <span className="text-[9px] text-slate-500 font-mono">1m ago</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">Barangay Poblacion</div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/20 font-medium">AMB-02 Dispatched</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Incident 2 */}
                                        <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                                            <div className="mt-0.5 p-1.5 rounded bg-amber-500/10 text-amber-500/70">
                                                <MapPin className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-400">Vehicular Accident</span>
                                                    <span className="text-[9px] text-slate-600 font-mono">12m ago</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">Barangay Igpit</div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500/70 border border-emerald-500/20 font-medium">Resolved</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
