import { User, Radio, HeartPulse, ShieldAlert } from 'lucide-react';

const roles = [
    {
        name: 'Resident Citizen',
        badge: 'Community Portal',
        description: 'Report emergencies in under 30 seconds with automated GPS location, track assigned ambulances live, and review incident progress history.',
        icon: User,
        color: 'from-emerald-500/20 to-teal-500/5',
        borderColor: 'border-slate-800 hover:border-emerald-500/40',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        iconBg: 'bg-emerald-500/15 text-emerald-400',
    },
    {
        name: 'Command Dispatcher',
        badge: 'EOC Command Center',
        description: 'Verify incoming reports, triage urgency, coordinate multi-agency deployment, assign ambulance units, and monitor active response telemetry.',
        icon: Radio,
        color: 'from-blue-500/20 to-indigo-500/5',
        borderColor: 'border-slate-800 hover:border-blue-500/40',
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        iconBg: 'bg-blue-500/15 text-blue-400',
    },
    {
        name: 'Field Responder / EMT',
        badge: 'Mobile Field Unit',
        description: 'Receive real-time mission dispatch alerts, navigate turn-by-turn to emergency scenes, update tactical statuses, and log digital ePCRs.',
        icon: HeartPulse,
        color: 'from-rose-500/20 to-orange-500/5',
        borderColor: 'border-slate-800 hover:border-rose-500/40',
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        iconBg: 'bg-rose-500/15 text-rose-400',
    },
    {
        name: 'MDRRMO Administrator',
        badge: 'Executive Governance',
        description: 'Manage ambulance fleets, personnel rosters, municipal barangay boundaries, audit trails, response analytics, and DRRMC compliance reports.',
        icon: ShieldAlert,
        color: 'from-indigo-500/20 to-purple-500/5',
        borderColor: 'border-slate-800 hover:border-indigo-500/40',
        badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        iconBg: 'bg-indigo-500/15 text-indigo-400',
    },
];

export default function SystemRoles() {
    return (
        <section id="roles" className="relative py-20 md:py-28 border-t border-slate-800/80 bg-[#060B15]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                        <span>Role-Based Collaboration</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                        One Platform. Four Integrated Roles.
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
                        Purpose-built interfaces ensure rapid, coordinated communication from reporting citizens to field emergency medical teams and municipal directors.
                    </p>
                </div>

                {/* 4 Roles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                            <div
                                key={role.name}
                                className={`rounded-3xl bg-[#111B2D]/85 p-6 border ${role.borderColor} backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className={`w-12 h-12 rounded-2xl ${role.iconBg} border border-white/10 flex items-center justify-center`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${role.badgeColor}`}>
                                            {role.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2.5 tracking-tight">
                                        {role.name}
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed font-normal">
                                        {role.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
