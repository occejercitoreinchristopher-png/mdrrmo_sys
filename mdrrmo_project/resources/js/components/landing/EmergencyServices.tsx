import {
    HeartPulse,
    Ambulance,
    ShieldAlert,
    LifeBuoy,
    Users,
    FileText,
    ArrowUpRight,
    CheckCircle2,
    Zap,
    Radio,
    Clock,
} from 'lucide-react';

const services = [
    {
        title: 'Emergency Medical Response',
        tag: 'Pre-Hospital Trauma Care',
        description: 'Certified emergency medical technicians and paramedics deploy to administer immediate life-saving care, airway support, and acute trauma stabilization on scene.',
        icon: HeartPulse,
        iconGradient: 'from-rose-500 to-red-600',
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        capabilities: ['Immediate On-Scene Triage', 'Advanced Airway Management', 'Vital Signs Monitoring'],
    },
    {
        title: '24/7 Ambulance Fleet Dispatch',
        tag: 'Rapid Patient Transport',
        description: 'Fully equipped municipal ambulances with automated route telemetry, oxygen delivery, and real-time medical communication direct to regional hospital ERs.',
        icon: Ambulance,
        iconGradient: 'from-blue-500 to-indigo-600',
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        capabilities: ['Type 1 & 2 Medical Vehicles', 'Real-Time GPS Telemetry', 'Hospital Handover Protocol'],
    },
    {
        title: 'Disaster Risk Reduction (DRRM)',
        tag: 'Municipal Preparedness',
        description: 'Hydrological storm surge monitoring, flood warning systems along coastal & riverine sectors, and coordinated community evacuation staging across Opol.',
        icon: ShieldAlert,
        iconGradient: 'from-amber-500 to-orange-600',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
        capabilities: ['Hydrological Flood Gauging', 'Pre-Emptive Evacuation Staging', 'MDRRMC Multi-Agency Link'],
    },
    {
        title: 'Technical Rescue & Extrication',
        tag: 'Specialized Operations',
        description: 'Specialized rescue teams equipped with hydraulic cutters, water rescue gear, and extrication tools for vehicular incidents along the national highway corridor.',
        icon: LifeBuoy,
        iconGradient: 'from-emerald-500 to-teal-600',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        capabilities: ['Highway Vehicular Extrication', 'Swift Water Flash Flood SAR', 'Structural Rescue & Recovery'],
    },
    {
        title: 'Community Emergency Assistance',
        tag: '14 Barangays Integrated',
        description: 'Direct operational link with all 14 Barangay Disaster Risk Reduction committees (BDRRMC) to provide localized first aid, supplies, and disaster relief.',
        icon: Users,
        iconGradient: 'from-sky-500 to-blue-600',
        badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
        capabilities: ['BDRRMC Grassroots Response', 'Barangay Health Center Link', 'Disaster Relief Coordination'],
    },
    {
        title: 'Digital Patient Care Records (ePCR)',
        tag: 'Clinical Telemetry',
        description: 'Electronic Patient Care Records generated in the field to track medical interventions, vital signs histories, and doctor handovers with zero administrative latency.',
        icon: FileText,
        iconGradient: 'from-indigo-500 to-purple-600',
        badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
        capabilities: ['Paperless Clinical Logging', 'Encrypted Health Data Store', 'Direct Receiving Facility Sync'],
    },
];

export default function EmergencyServices() {
    return (
        <section id="services" className="relative py-20 md:py-28 border-t border-slate-800/80 bg-[#070B14]">
            {/* Ambient Background Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/[0.04] rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Core Municipal Capabilities</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                        Professional Emergency Services
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                        MDRRMO Opol delivers integrated, 24/7 pre-hospital emergency medical response and disaster management for every citizen and visitor in the municipality.
                    </p>
                </div>

                {/* 6 Services Grid (3 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => {
                        const Icon = service.icon;
                        return (
                            <div
                                key={service.title}
                                className="group relative rounded-3xl bg-[#0D1424]/90 hover:bg-[#0F172A] border border-slate-800 hover:border-blue-500/40 p-7 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                            >
                                <div>
                                    {/* Icon & Category Badge Row */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${service.iconGradient} p-0.5 shadow-lg group-hover:scale-105 transition-transform`}>
                                            <div className="w-full h-full bg-[#090E1A] rounded-[14px] flex items-center justify-center text-white">
                                                <Icon className="w-6 h-6" />
                                            </div>
                                        </div>

                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${service.badgeColor}`}>
                                            {service.tag}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-white mb-2.5 tracking-tight group-hover:text-blue-300 transition-colors">
                                        {service.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm text-slate-400 leading-relaxed font-normal mb-5">
                                        {service.description}
                                    </p>

                                    {/* Key Capabilities Checklist */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 mb-6">
                                        {service.capabilities.map((cap) => (
                                            <div key={cap} className="flex items-center gap-2 text-xs text-slate-300">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                                <span>{cap}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Status Indicator */}
                                <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-400">
                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>24/7 Municipal Standby</span>
                                    </span>
                                    <span className="text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        <span>Learn more</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
