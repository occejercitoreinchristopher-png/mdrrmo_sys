import { PhoneCall, ShieldCheck, Send, CheckCircle } from 'lucide-react';

const steps = [
    {
        number: '01',
        name: 'Report',
        description: 'Residents submit an emergency report with the necessary incident information and location.',
        icon: PhoneCall,
        accent: 'from-rose-500 to-orange-500',
    },
    {
        number: '02',
        name: 'Verify',
        description: 'Dispatchers review and validate the incoming emergency report.',
        icon: ShieldCheck,
        accent: 'from-blue-500 to-indigo-500',
    },
    {
        number: '03',
        name: 'Dispatch',
        description: 'Responders and ambulances are assigned to the emergency.',
        icon: Send,
        accent: 'from-indigo-500 to-purple-500',
    },
    {
        number: '04',
        name: 'Respond',
        description: 'Responders navigate to the incident location, provide emergency care, and complete the mission.',
        icon: CheckCircle,
        accent: 'from-emerald-500 to-teal-500',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="relative py-16 md:py-24 border-t border-white/5 bg-[#0a1022]/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">
                        Operational Workflow
                    </h2>
                    <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        How Emergency Response Works
                    </p>
                    <p className="mt-3 text-sm sm:text-base text-slate-400">
                        From the initial alert to on-scene medical triage, every second is optimized for fast and accountable dispatch.
                    </p>
                </div>

                {/* Steps Process Grid */}
                <div className="relative">
                    {/* Horizontal Connecting Line (Desktop) */}
                    <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-0.5 -translate-y-8 bg-gradient-to-r from-rose-500/30 via-blue-500/30 to-emerald-500/30 -z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                        {steps.map((step, idx) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.number}
                                    className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-[#080d1a]/80 border border-white/10 backdrop-blur-xl shadow-lg hover:border-white/20 transition-all duration-300"
                                >
                                    {/* Number / Icon Badge */}
                                    <div className="relative mb-5">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.accent} p-0.5 shadow-lg shadow-black/40`}>
                                            <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center text-white">
                                                <Icon className="w-7 h-7" />
                                            </div>
                                        </div>
                                        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-mono font-bold text-slate-200">
                                            {step.number}
                                        </span>
                                    </div>

                                    {/* Step Title */}
                                    <h3 className="text-lg font-bold text-white mb-2">
                                        {step.number} — {step.name}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
