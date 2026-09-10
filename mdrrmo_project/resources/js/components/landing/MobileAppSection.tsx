import { Smartphone, BellRing, MapPin, Ambulance, ShieldCheck, Download, QrCode } from 'lucide-react';

export default function MobileAppSection() {
    const features = [
        {
            title: 'One-Tap Emergency Reporting',
            desc: 'Submit incidents with precise GPS coordinates, incident photos, and landmark details in seconds.',
            icon: BellRing,
            color: 'text-rose-400 bg-rose-500/15',
        },
        {
            title: 'Live Ambulance & Responder Tracking',
            desc: 'Track assigned emergency medical units in real-time as they navigate directly to your location.',
            icon: Ambulance,
            color: 'text-blue-400 bg-blue-500/15',
        },
        {
            title: 'Direct Dispatcher Communication',
            desc: 'Connect immediately with Opol MDRRMO operators for live triage and first-aid instructions.',
            icon: MapPin,
            color: 'text-indigo-400 bg-indigo-500/15',
        },
        {
            title: 'Dedicated Resident Profile',
            desc: 'Register once on your mobile phone to save your home address, barangay, and emergency contacts.',
            icon: ShieldCheck,
            color: 'text-emerald-400 bg-emerald-500/15',
        },
    ];

    return (
        <section id="mobile-app" className="relative py-16 md:py-24 border-t border-white/5 bg-[#060a14] overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-0" />
            <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-rose-600/8 rounded-full blur-3xl pointer-events-none -z-0" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Column: Mobile App Feature Highlights */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Resident Mobile Application</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                            Emergency Assistance in the Palm of Your Hand
                        </h2>

                        <p className="text-base text-slate-400 leading-relaxed max-w-xl">
                            Resident account creation and emergency reporting are streamlined directly through the official <span className="font-semibold text-slate-200">MDRRMO Mobile App</span>. Register on your mobile device for instant access to real-time dispatch and responder tracking.
                        </p>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {features.map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.title}
                                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-200"
                                    >
                                        <div className={`w-9 h-9 rounded-xl ${f.color} flex items-center justify-center mb-3 border border-white/10`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-bold text-white mb-1">
                                            {f.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            {f.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Sleek Interactive Phone Visual Container */}
                    <div className="lg:col-span-5 flex justify-center">
                        <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 p-6 backdrop-blur-2xl shadow-2xl overflow-hidden">
                            {/* Inner Simulated Phone Screen */}
                            <div className="rounded-2xl bg-[#0a1022] border border-white/10 p-5 space-y-4">
                                {/* Simulated App Header */}
                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-600 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                                            M
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white leading-none">MDRRMO Resident</p>
                                            <p className="text-[10px] text-emerald-400 font-mono">● Connected to Opol EOC</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">v1.0 Mobile</span>
                                </div>

                                {/* Simulated Active Incident Card */}
                                <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-500/15 to-orange-500/10 border border-rose-500/25">
                                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                                        <span className="font-bold text-white flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                            Active Medical Emergency
                                        </span>
                                        <span className="text-rose-400 font-mono text-[10px]">#INC-842</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 mb-2">
                                        Ambulance dispatched to Barangay Igpit.
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 bg-black/40 rounded-lg p-2 border border-white/5">
                                        <span>Unit: AMB-01</span>
                                        <span className="text-emerald-400 font-bold">ETA: 3 MINS</span>
                                    </div>
                                </div>

                                {/* Resident Registration Info Banner */}
                                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-center space-y-2">
                                    <p className="text-xs font-bold text-white">
                                        Resident Registration
                                    </p>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Create your resident profile directly in the mobile app to ensure immediate caller identification during emergencies.
                                    </p>
                                    <div className="pt-1 flex items-center justify-center gap-2 text-xs font-semibold text-blue-400">
                                        <Smartphone className="w-3.5 h-3.5" />
                                        <span>Available on Android & iOS</span>
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
