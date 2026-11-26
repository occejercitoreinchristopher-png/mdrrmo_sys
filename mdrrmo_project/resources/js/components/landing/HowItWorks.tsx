import {
    PhoneCall,
    ShieldCheck,
    Send,
    Navigation,
    HeartPulse,
} from 'lucide-react';

const steps = [
    {
        number: 'STEP 01',
        tag: 'INSTANT ALERT',
        title: 'Emergency Request',
        description: 'Resident triggers an incident alert with automatic GPS coordinates and photo evidence via the mobile app, or calls the 24/7 hotline 0967-061-0573.',
        speedStandard: '< 30 Seconds',
        icon: PhoneCall,
        color: '#F43F5E', // rose
        nodeBorder: 'border-rose-500',
        nodeGlow: 'rgba(244, 63, 94, 0.4)',
        cardTopBorder: 'border-t-2 border-t-rose-500',
        stemColor: 'bg-rose-500',
        tagBadge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    },
    {
        number: 'STEP 02',
        tag: 'COMMAND CENTER',
        title: 'Verification & Triage',
        description: 'MDRRMO dispatchers validate incident severity (Priority 1–3), confirm the exact location, and queue resources in the dispatch console.',
        speedStandard: '< 60 Seconds',
        icon: ShieldCheck,
        color: '#3B82F6', // blue
        nodeBorder: 'border-blue-500',
        nodeGlow: 'rgba(59, 130, 246, 0.4)',
        cardTopBorder: 'border-t-2 border-t-blue-500',
        stemColor: 'bg-blue-500',
        tagBadge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    },
    {
        number: 'STEP 03',
        tag: 'FLEET DEPLOYMENT',
        title: 'Ambulance Dispatch',
        description: 'The nearest available ambulance and EMT response team receive automated digital dispatch orders with incident briefing on mobile.',
        speedStandard: '< 90 Seconds',
        icon: Send,
        color: '#0EA5E9', // sky
        nodeBorder: 'border-sky-500',
        nodeGlow: 'rgba(14, 165, 233, 0.4)',
        cardTopBorder: 'border-t-2 border-t-sky-500',
        stemColor: 'bg-sky-500',
        tagBadge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    },
    {
        number: 'STEP 04',
        tag: 'TURN-BY-TURN GPS',
        title: 'Rapid Response',
        description: 'Responders navigate directly to the incident scene with optimized municipal routing while the resident monitors ambulance arrival live.',
        speedStandard: 'Avg 4.2 Mins',
        icon: Navigation,
        color: '#F97316', // orange
        nodeBorder: 'border-orange-500',
        nodeGlow: 'rgba(249, 115, 22, 0.4)',
        cardTopBorder: 'border-t-2 border-t-orange-500',
        stemColor: 'bg-orange-500',
        tagBadge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    },
    {
        number: 'STEP 05',
        tag: 'CLINICAL HANDOVER',
        title: 'Patient Care & ePCR',
        description: 'Responders deliver pre-hospital life support, document digital Patient Care Records (ePCR), and safely transfer the patient to the hospital.',
        speedStandard: 'Full Care Protocol',
        icon: HeartPulse,
        color: '#10B981', // emerald
        nodeBorder: 'border-emerald-500',
        nodeGlow: 'rgba(16, 185, 129, 0.4)',
        cardTopBorder: 'border-t-2 border-t-emerald-500',
        stemColor: 'bg-emerald-500',
        tagBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="relative py-20 md:py-28 border-t border-slate-800/80 bg-[#060B15]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider mb-4">
                        <span>Standard Operating Protocol</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                        How Emergency Response Works
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
                        From the initial citizen alert to on-scene medical triage, every step in the MDRRMO protocol is optimized for speed, precision, and saving lives.
                    </p>
                </div>

                {/* 5-Step Process Timeline Pipeline */}
                <div className="relative">
                    {/* Horizontal Connecting Pipeline with 5 Glowing Circular Nodes (Desktop) */}
                    <div className="hidden lg:grid grid-cols-5 gap-4 relative mb-2">
                        {/* Continuous Connecting Line passing through center of all 5 nodes */}
                        <div className="absolute top-7 left-[10%] right-[10%] h-[2px] z-0 pointer-events-none">
                            <div className="w-full h-full bg-gradient-to-r from-rose-500 via-blue-500 via-sky-400 via-orange-500 to-emerald-500 opacity-80" />
                        </div>

                        {steps.map((step) => {
                            const Icon = step.icon;
                            return (
                                <div key={step.number} className="flex flex-col items-center relative z-10 group">
                                    {/* Glowing Circular Node */}
                                    <div
                                        className={`w-14 h-14 rounded-full bg-[#080D19] border-2 ${step.nodeBorder} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}
                                        style={{ boxShadow: `0 0 20px -2px ${step.nodeGlow}` }}
                                    >
                                        <Icon className="w-6 h-6" style={{ color: step.color }} />
                                    </div>

                                    {/* Vertical Connector Stem leading down to the top of the card */}
                                    <div className={`w-[2px] h-6 ${step.stemColor}`} />
                                </div>
                            );
                        })}
                    </div>

                    {/* The 5 Step Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
                        {steps.map((step) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.number}
                                    className={`rounded-2xl bg-[#0B101D] border border-slate-800/90 ${step.cardTopBorder} p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between hover:bg-[#0D1424] hover:border-slate-700 transition-all duration-300 group`}
                                >
                                    {/* Mobile Node Header (shown only on small viewports where top pipeline is hidden) */}
                                    <div className="lg:hidden flex items-center gap-3 mb-4">
                                        <div
                                            className={`w-11 h-11 rounded-full bg-[#080D19] border-2 ${step.nodeBorder} flex items-center justify-center shadow-md`}
                                            style={{ boxShadow: `0 0 15px -2px ${step.nodeGlow}` }}
                                        >
                                            <Icon className="w-5 h-5" style={{ color: step.color }} />
                                        </div>
                                        <span className="font-mono text-xs font-bold text-slate-400 tracking-wider">
                                            {step.number}
                                        </span>
                                    </div>

                                    <div>
                                        {/* Desktop Step Label */}
                                        <div className="hidden lg:block mb-2">
                                            <span className="font-mono text-[11px] font-bold text-slate-400 tracking-wider">
                                                {step.number}
                                            </span>
                                        </div>

                                        {/* Tag Badge */}
                                        <div className="mb-3">
                                            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider border ${step.tagBadge}`}>
                                                {step.tag}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-base font-bold text-white mb-3 tracking-tight group-hover:text-blue-200 transition-colors">
                                            {step.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-xs text-slate-400 leading-relaxed font-normal">
                                            {step.description}
                                        </p>
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
