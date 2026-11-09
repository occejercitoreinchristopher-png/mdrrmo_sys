import {
    PhoneCall,
    ShieldCheck,
    Send,
    Navigation,
    HeartHandshake,
    ArrowRight,
    CheckCircle2,
    Clock,
    Activity,
} from 'lucide-react';

const steps = [
    {
        number: '01',
        name: 'Emergency Request',
        tag: 'Instant Alert',
        description: 'Resident triggers an incident alert with automatic GPS coordinates and photo evidence via the mobile app, or calls the 24/7 hotline 911.',
        icon: PhoneCall,
        timeframe: '< 30 Seconds',
        accent: 'from-rose-500 to-red-600',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    },
    {
        number: '02',
        name: 'Verification & Triage',
        tag: 'Command Center',
        description: 'MDRRMO dispatchers validate incident severity (Priority 1–3), confirm the exact location, and queue resources in the dispatch console.',
        icon: ShieldCheck,
        timeframe: '< 60 Seconds',
        accent: 'from-blue-500 to-indigo-600',
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    },
    {
        number: '03',
        name: 'Ambulance Dispatch',
        tag: 'Fleet Deployment',
        description: 'The nearest available ambulance and EMT response team receive automated digital dispatch orders with incident briefing on mobile.',
        icon: Send,
        timeframe: '< 90 Seconds',
        accent: 'from-sky-500 to-blue-600',
        badge: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
    },
    {
        number: '04',
        name: 'Rapid Response',
        tag: 'Turn-by-Turn GPS',
        description: 'Responders navigate directly to the incident scene with optimized municipal routing while the resident monitors ambulance arrival live.',
        icon: Navigation,
        timeframe: 'Avg 4.2 Mins',
        accent: 'from-amber-500 to-orange-600',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    },
    {
        number: '05',
        name: 'Patient Care & ePCR',
        tag: 'Clinical Handover',
        description: 'Responders deliver pre-hospital life support, document digital Patient Care Records (ePCR), and safely transfer the patient to the hospital.',
        icon: HeartHandshake,
        timeframe: 'Full Care Protocol',
        accent: 'from-emerald-500 to-teal-600',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="relative py-20 md:py-28 border-t border-slate-800/80 bg-[#060B15]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Standard Operating Protocol</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                        How Emergency Response Works
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                        From the initial citizen alert to on-scene medical triage, every step in the MDRRMO protocol is optimized for speed, precision, and saving lives.
                    </p>
                </div>

                {/* 5-Step Process Timeline Grid */}
                <div className="relative">
                    {/* Connecting Top Gradient Line for Desktop */}
                    <div className="hidden xl:block absolute top-14 left-16 right-16 h-1 bg-gradient-to-r from-rose-500 via-blue-500 via-sky-400 to-emerald-500 opacity-20 rounded-full -z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 relative z-10">
                        {steps.map((step) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.number}
                                    className="group rounded-3xl bg-[#0D1424]/90 hover:bg-[#0F172A] border border-slate-800 hover:border-slate-700 p-6 backdrop-blur-xl shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Step Number & Icon Header */}
                                        <div className="flex items-center justify-between mb-5">
                                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.accent} p-0.5 shadow-md group-hover:scale-105 transition-transform`}>
                                                <div className="w-full h-full bg-[#080D19] rounded-[14px] flex items-center justify-center text-white">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                            </div>

                                            <span className="font-mono text-xl font-black text-slate-600 group-hover:text-blue-400 transition-colors">
                                                {step.number}
                                            </span>
                                        </div>

                                        {/* Step Tag */}
                                        <div className="mb-2.5">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${step.badge}`}>
                                                {step.tag}
                                            </span>
                                        </div>

                                        {/* Step Title */}
                                        <h3 className="text-base font-bold text-white mb-2 tracking-tight group-hover:text-blue-300 transition-colors">
                                            {step.name}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-xs text-slate-400 leading-relaxed font-normal">
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Timing Metric Footer */}
                                    <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                                        <span className="flex items-center gap-1.5 text-slate-400">
                                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                                            <span>Speed Standard</span>
                                        </span>
                                        <span className="font-mono text-emerald-400 font-bold">
                                            {step.timeframe}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
